"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid2,
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
import PreLaunchFlow from "@/features/admin/PreLaunchFlow";

const formatStatusLabel = (status: OrderStatus) => {
  if (status === "pending") return "Pending";
  if (status === "in_progress" || status === "in progress") return "In Progress";
  if (status === "done") return "Done";
  return status;
};

const formatDate = (createdAt: UserOrder["createdAt"] | AppUser["createdAt"]) => {
  if (!createdAt) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(createdAt.toDate());
};

const formatShortDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date);
};

const formatINR = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
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

const escapeCsvValue = (value: string | number) => {
  const text = String(value ?? "");

  if (/[,"\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
};

const downloadCsv = (filename: string, headers: string[], rows: Array<Array<string | number>>) => {
  const content = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\n");

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const getOrderAmount = (order: UserOrder) => {
  if (typeof order.amountPaid === "number") {
    return order.amountPaid;
  }

  const totalPrice = order.orderDetails?.total_price;
  if (typeof totalPrice === "number") {
    return totalPrice;
  }

  const totalAmount = order.orderDetails?.totalAmount;
  if (typeof totalAmount === "number") {
    return totalAmount;
  }

  return 0;
};

type SalesPoint = {
  key: string;
  label: string;
  amount: number;
};

type SalesRange = 7 | 15 | 30;

const buildSalesByDays = (orders: UserOrder[], days: SalesRange): SalesPoint[] => {
  const now = new Date();
  const dayKeys: string[] = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(now.getDate() - i);
    dayKeys.push(date.toISOString().slice(0, 10));
  }

  const totals = dayKeys.reduce<Record<string, number>>((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});

  orders.forEach((order) => {
    if (!order.createdAt || order.paymentStatus !== "paid") {
      return;
    }

    const orderDate = order.createdAt.toDate();
    orderDate.setHours(0, 0, 0, 0);
    const key = orderDate.toISOString().slice(0, 10);

    if (!(key in totals)) {
      return;
    }

    totals[key] += getOrderAmount(order);
  });

  return dayKeys.map((key) => {
    const date = new Date(`${key}T00:00:00`);

    return {
      key,
      label: formatShortDate(date),
      amount: totals[key] || 0,
    };
  });
};

const SmallSalesChart = ({ data }: { data: SalesPoint[] }) => {
  const width = Math.max(340, data.length * 44);
  const height = 170;
  const left = 36;
  const right = 12;
  const top = 12;
  const bottom = 32;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maxValue = Math.max(...data.map((point) => point.amount), 0);
  const safeMax = maxValue > 0 ? maxValue : 1;

  const points = data.map((point, index) => {
    const x = left + (chartWidth * index) / Math.max(data.length - 1, 1);
    const y = top + chartHeight - (point.amount / safeMax) * chartHeight;
    return { ...point, x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");
  const labelInterval = data.length > 20 ? 4 : data.length > 12 ? 3 : data.length > 8 ? 2 : 1;

  return (
    <Box sx={{ width: "100%", overflowX: "auto" }}>
      <Box component="svg" viewBox={`0 0 ${width} ${height}`} sx={{ width: "100%", minWidth: `${width}px`, height: 190 }}>
        <line x1={left} y1={top} x2={left} y2={top + chartHeight} stroke="#CBD5E1" strokeWidth={1} />
        <line x1={left} y1={top + chartHeight} x2={left + chartWidth} y2={top + chartHeight} stroke="#CBD5E1" strokeWidth={1} />

        <text x={8} y={top + 6} fontSize="10" fill="#64748B">{formatINR(maxValue)}</text>
        <text x={8} y={top + chartHeight} fontSize="10" fill="#64748B">{formatINR(0)}</text>

        {linePath ? (
          <path d={linePath} fill="none" stroke="#0EA5E9" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        ) : null}

        {points.map((point) => (
          <circle key={point.key} cx={point.x} cy={point.y} r={3.2} fill="#0EA5E9" />
        ))}

        {points.map((point, index) => {
          const isLast = index === points.length - 1;
          const shouldRenderLabel = index % labelInterval === 0 || isLast;

          if (!shouldRenderLabel) {
            return null;
          }

          return (
            <text key={`${point.key}-label`} x={point.x} y={height - 10} textAnchor="middle" fontSize="10" fill="#475569">
              {point.label}
            </text>
          );
        })}
      </Box>
    </Box>
  );
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { trackAsync } = useGlobalLoading();
  const { orders, error: ordersError } = useOrders({ mode: "all" });
  const [users, setUsers] = useState<AppUser[]>([]);
  const [salesRange, setSalesRange] = useState<SalesRange>(7);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<"all" | OrderServiceType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [launchFlowOpen, setLaunchFlowOpen] = useState(false);

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

  const orderCountByUserId = useMemo(() => {
    return orders.reduce<Record<string, number>>((acc, order) => {
      acc[order.userId] = (acc[order.userId] || 0) + 1;
      return acc;
    }, {});
  }, [orders]);

  const salesData = useMemo(() => buildSalesByDays(orders, salesRange), [orders, salesRange]);

  const totalSalesInRange = useMemo(
    () => salesData.reduce((sum, point) => sum + point.amount, 0),
    [salesData],
  );

  const searchedUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return users;
    }

    return users.filter((appUser) => {
      return appUser.name.toLowerCase().includes(normalized)
        || appUser.phone.toLowerCase().includes(normalized);
    });
  }, [search, users]);

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

  const handleExportOrders = () => {
    const rows = orders.map((order) => {
      const linkedUser = usersById[order.userId];

      return [
        order.id,
        linkedUser?.name || "-",
        linkedUser?.phone || "-",
        order.service,
        order.status,
        order.paymentStatus,
        getOrderAmount(order),
        formatDate(order.createdAt),
        createOrderDetailsText(order) || "-",
      ];
    });

    downloadCsv(
      `orders-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Order ID", "User Name", "Phone", "Service", "Status", "Payment Status", "Amount", "Created At", "Order Details"],
      rows,
    );
  };

  const handleExportUsers = () => {
    const rows = users.map((appUser) => {
      return [
        appUser.id,
        appUser.name || "-",
        appUser.phone || "-",
        orderCountByUserId[appUser.id] || 0,
        formatDate(appUser.createdAt),
      ];
    });

    downloadCsv(
      `users-${new Date().toISOString().slice(0, 10)}.csv`,
      ["User ID", "Name", "Phone", "Total Orders", "Created At"],
      rows,
    );
  };

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
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "flex-start", sm: "center" }}>
                <RKStudioLogo size={34} variant="full" />
                <Stack spacing={0.4}>
                  <Typography variant="h4">Admin Dashboard</Typography>
                  <Typography color="text.secondary">Manage sales, users, and orders in one place.</Typography>
                </Stack>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <Button onClick={handleExportOrders} variant="contained">Export Orders</Button>
                <Button onClick={handleExportUsers} variant="outlined">Export Users</Button>
                <Button component={Link} href="/admin/products" variant="outlined">Manage Products</Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => setLaunchFlowOpen(true)}
                >
                  Launch App
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <PreLaunchFlow open={launchFlowOpen} onClose={() => setLaunchFlowOpen(false)} />

        <Grid2 container spacing={2}>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Sales (Last {salesRange} Days)</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatINR(totalSalesInRange)}</Typography>
              </CardContent>
            </Card>
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Total Orders</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{orders.length}</Typography>
              </CardContent>
            </Card>
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Total Users</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{users.length}</Typography>
              </CardContent>
            </Card>
          </Grid2>

          <Grid2 size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Stack spacing={1.2}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between">
                    <Typography variant="h6">Sales Trend</Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      {[7, 15, 30].map((range) => {
                        const isActive = salesRange === range;

                        return (
                          <Chip
                            key={range}
                            label={`${range}D`}
                            clickable
                            onClick={() => setSalesRange(range as SalesRange)}
                            color={isActive ? "primary" : "default"}
                            variant={isActive ? "filled" : "outlined"}
                            size="small"
                          />
                        );
                      })}
                    </Stack>
                  </Stack>
                  <SmallSalesChart data={salesData} />
                </Stack>
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>

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
                  <MenuItem value="all">All status</MenuItem>
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
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const linkedUser = usersById[order.userId];
                      const userName = linkedUser?.name || "User";
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
                                Amount: {formatINR(getOrderAmount(order))}
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
                                <Chip label="Done" size="small" color="success" />
                              )}
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
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between">
                <Typography variant="h5">Users</Typography>
                <TextField
                  label="Search users"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or phone"
                  size="small"
                  sx={{ width: { xs: "100%", sm: 280 } }}
                />
              </Stack>

              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Total Orders</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {searchedUsers.map((appUser) => {
                      return (
                        <TableRow key={appUser.id}>
                          <TableCell>{appUser.name || "-"}</TableCell>
                          <TableCell>{appUser.phone || "-"}</TableCell>
                          <TableCell>{orderCountByUserId[appUser.id] || 0}</TableCell>
                        </TableRow>
                      );
                    })}

                    {searchedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3}>No users found.</TableCell>
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
