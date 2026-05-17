"use client";

import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Link as MuiLink,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import RKStudioLogo from "@/components/common/RKStudioLogo";
import Layout from "@/components/layout/Layout";
import { useGlobalLoading } from "@/context/LoadingContext";
import { useAuth } from "@/hooks/useAuth";
import { useOrders } from "@/hooks/useOrders";
import {
  getNextOrderStatus,
  OrderDetails,
  OrderServiceType,
  OrderStatus,
  updateOrderStatus,
  UserOrder,
} from "@/services/orderService";
import { AppUser, subscribeToAllUsers } from "@/services/userService";
import { buildWhatsAppUrl, sendToWhatsApp } from "@/utils/whatsapp";

const formatStatusLabel = (status: OrderStatus) => {
  if (status === "pending") return "Pending";
  if (status === "in_progress") return "Kaam chal raha hai";
  if (status === "done") return "Poora";
  return status;
};

const formatDate = (createdAt: UserOrder["createdAt"] | AppUser["createdAt"]) => {
  if (!createdAt) {
    return "Abhi";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(createdAt.toDate());
};

const formatOrderDetailsLabel = (value: string) => {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const flattenOrderDetails = (details: OrderDetails, parentLabel?: string): string[] => {
  return Object.entries(details).flatMap(([key, value]) => {
    const label = parentLabel ? `${parentLabel} ${formatOrderDetailsLabel(key)}` : formatOrderDetailsLabel(key);

    if (value && typeof value === "object" && !Array.isArray(value)) {
      return flattenOrderDetails(value as OrderDetails, label);
    }

    return `${label}: ${value ?? "-"}`;
  });
};

const createOrderDetailsText = (order: UserOrder) => {
  return flattenOrderDetails(order.orderDetails)
    .join(" | ");
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { trackAsync } = useGlobalLoading();
  const { orders, error: ordersError } = useOrders({ mode: "all" });
  const [users, setUsers] = useState<AppUser[]>([]);
  const [serviceFilter, setServiceFilter] = useState<"all" | OrderServiceType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");

  useEffect(() => {
    const unsubscribeUsers = subscribeToAllUsers(setUsers, () => {
      setError("Users load nahi ho paaye.");
    });

    return () => {
      unsubscribeUsers();
    };
  }, []);

  useEffect(() => {
    if (ordersError) {
      setError(ordersError);
    }
  }, [ordersError]);

  const usersById = useMemo(() => {
    return users.reduce<Record<string, AppUser>>((acc, appUser) => {
      acc[appUser.id] = appUser;
      return acc;
    }, {});
  }, [users]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const byService = serviceFilter === "all" || order.service === serviceFilter;
      const byStatus =
        statusFilter === "all" ||
        order.status === statusFilter ||
        (statusFilter === "in progress" && order.status === ("in_progress" as OrderStatus));

      return byService && byStatus;
    });
  }, [orders, serviceFilter, statusFilter]);

  const handleAdvanceStatus = async (order: UserOrder) => {
    const nextStatus = getNextOrderStatus(order.status);

    if (!nextStatus) {
      return;
    }

    try {
      setUpdatingOrderId(order.id);
      await trackAsync(updateOrderStatus(order.id, nextStatus, user?.phoneNumber || "admin", "Updated by admin"));
    } catch {
      setError("Order status update nahi ho paaya.");
    } finally {
      setUpdatingOrderId("");
    }
  };

  return (
    <Layout>
      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Stack spacing={1.2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "flex-start", sm: "center" }}>
                <RKStudioLogo size={34} variant="full" />
                <Stack spacing={0.4}>
                  <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                    <Typography variant="h4">Admin Kendra</Typography>
                    <Box
                      sx={{
                        px: 1.2,
                        py: 0.5,
                        borderRadius: 999,
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "primary.main",
                        bgcolor: alpha("#DBEAFE", 0.95),
                        border: `1px solid ${alpha("#93C5FD", 0.48)}`,
                      }}
                    >
                      RK Prabandhan
                    </Box>
                  </Stack>
                  <Typography color="text.secondary">Yahaan se grahak aur orders sambhalein.</Typography>
                </Stack>
              </Stack>
              <Button component={Link} href="/admin/products" variant="outlined" sx={{ width: "fit-content" }}>
                Product jodein
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h5">Order</Typography>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  select
                  label="Seva"
                  value={serviceFilter}
                  onChange={(event) => setServiceFilter(event.target.value as "all" | OrderServiceType)}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="all">Sab service</MenuItem>
                  <MenuItem value="tailoring">Silai</MenuItem>
                  <MenuItem value="fabric">Kapda</MenuItem>
                  <MenuItem value="dupatta">Dupatta</MenuItem>
                </TextField>

                <TextField
                  select
                  label="Haalat"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as "all" | OrderStatus)}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="all">Sab status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in progress">Kaam chal raha hai</MenuItem>
                  <MenuItem value="done">Poora</MenuItem>
                </TextField>
              </Stack>

              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Grahak</TableCell>
                      <TableCell>Mobile</TableCell>
                      <TableCell>Seva</TableCell>
                      <TableCell>Payment</TableCell>
                      <TableCell>Jankari</TableCell>
                      <TableCell>Haalat</TableCell>
                      <TableCell>Tarikh</TableCell>
                      <TableCell>Karya</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const linkedUser = usersById[order.userId];
                      const userName = linkedUser?.name || "Grahak";
                      const userPhone = linkedUser?.phone || "";
                      const nextStatus = getNextOrderStatus(order.status);
                      const detailsText = createOrderDetailsText(order);

                      return (
                        <TableRow key={order.id}>
                          <TableCell>{userName}</TableCell>
                          <TableCell>{userPhone || "-"}</TableCell>
                          <TableCell sx={{ textTransform: "capitalize" }}>{order.service}</TableCell>
                          <TableCell>
                            <Stack spacing={0.6}>
                              <Chip
                                label={order.paymentStatus === "paid" ? "Paid" : "Pending"}
                                size="small"
                                color={order.paymentStatus === "paid" ? "success" : "warning"}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {order.paymentType ? `Prakar: ${order.paymentType}` : "Prakar: -"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {typeof order.amountPaid === "number" ? `Rakam: INR ${order.amountPaid}` : "Rakam: -"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {order.paymentId ? `Payment ID: ${order.paymentId}` : "Payment ID: -"}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 260 }}>{detailsText || "-"}</TableCell>
                          <TableCell>
                            <Chip label={formatStatusLabel(order.status)} size="small" color={order.status === "done" ? "success" : "warning"} />
                          </TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              {nextStatus ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleAdvanceStatus(order)}
                                  disabled={updatingOrderId === order.id}
                                >
                                  {formatStatusLabel(nextStatus)} karein
                                </Button>
                              ) : (
                                <Chip label="Poora" size="small" color="success" />
                              )}

                              {userPhone ? (
                                <Button
                                  size="small"
                                  variant="text"
                                  onClick={() =>
                                    sendToWhatsApp({
                                      name: userName,
                                      phone: userPhone,
                                      service: order.service,
                                      details: detailsText || order.service,
                                    })
                                  }
                                >
                                  WhatsApp
                                </Button>
                              ) : null}

                              {userPhone ? (
                                <MuiLink href={`tel:${userPhone}`} underline="none">
                                  <Button size="small" variant="text">Call karein</Button>
                                </MuiLink>
                              ) : null}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8}>Is filter me koi order nahi mila.</TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h5">Grahak</Typography>

              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Naam</TableCell>
                      <TableCell>Mobile</TableCell>
                      <TableCell>Banaya gaya</TableCell>
                      <TableCell>Contact</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((appUser) => {
                      const fallbackDetails = "Sadharan sahayata";
                      const whatsappUrl = buildWhatsAppUrl({
                        name: appUser.name || "Grahak",
                        phone: appUser.phone || "-",
                        service: "tailoring",
                        details: fallbackDetails,
                      });

                      return (
                        <TableRow key={appUser.id}>
                          <TableCell>{appUser.name || "-"}</TableCell>
                          <TableCell>{appUser.phone || "-"}</TableCell>
                          <TableCell>{formatDate(appUser.createdAt)}</TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              {appUser.phone ? (
                                <MuiLink href={whatsappUrl} target="_blank" rel="noopener noreferrer" underline="none">
                                  <Button size="small">WhatsApp</Button>
                                </MuiLink>
                              ) : null}
                              {appUser.phone ? (
                                <MuiLink href={`tel:${appUser.phone}`} underline="none">
                                  <Button size="small">Call karein</Button>
                                </MuiLink>
                              ) : null}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4}>Koi user nahi mila.</TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Layout>
  );
}
