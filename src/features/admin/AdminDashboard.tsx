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
  return status;
};

const formatDate = (createdAt: UserOrder["createdAt"] | AppUser["createdAt"]) => {
  if (!createdAt) {
    return "Just now";
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
      setError("Failed to load users.");
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
      setError("Could not update order status.");
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
                    <Typography variant="h4">Admin Dashboard</Typography>
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
                      RK Control Room
                    </Box>
                  </Stack>
                  <Typography color="text.secondary">Manage all users and orders with live data.</Typography>
                </Stack>
              </Stack>
              <Button component={Link} href="/admin/products" variant="outlined" sx={{ width: "fit-content" }}>
                Add Product
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h5">Orders</Typography>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  select
                  label="Service"
                  value={serviceFilter}
                  onChange={(event) => setServiceFilter(event.target.value as "all" | OrderServiceType)}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="all">All services</MenuItem>
                  <MenuItem value="tailoring">Tailoring</MenuItem>
                  <MenuItem value="fabric">Fabric</MenuItem>
                  <MenuItem value="dupatta">Dupatta</MenuItem>
                </TextField>

                <TextField
                  select
                  label="Status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as "all" | OrderStatus)}
                  sx={{ minWidth: 180 }}
                >
                  <MenuItem value="all">All statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in progress">In Progress</MenuItem>
                  <MenuItem value="done">Done</MenuItem>
                </TextField>
              </Stack>

              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Service</TableCell>
                      <TableCell>Payment</TableCell>
                      <TableCell>Details</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const linkedUser = usersById[order.userId];
                      const userName = linkedUser?.name || "Customer";
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
                                {order.paymentType ? `Type: ${order.paymentType}` : "Type: -"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {typeof order.amountPaid === "number" ? `Amount: INR ${order.amountPaid}` : "Amount: -"}
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
                                  Mark {formatStatusLabel(nextStatus)}
                                </Button>
                              ) : (
                                <Chip label="Completed" size="small" color="success" />
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
                                  <Button size="small" variant="text">Call</Button>
                                </MuiLink>
                              ) : null}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8}>No orders found for selected filters.</TableCell>
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
              <Typography variant="h5">Users</Typography>

              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Created At</TableCell>
                      <TableCell>Contact</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((appUser) => {
                      const fallbackDetails = "General support";
                      const whatsappUrl = buildWhatsAppUrl({
                        name: appUser.name || "Customer",
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
                                  <Button size="small">Call</Button>
                                </MuiLink>
                              ) : null}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4}>No users found.</TableCell>
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
