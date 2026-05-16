"use client";

import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useOrders } from "@/hooks/useOrders";
import { OrderHistoryItem, OrderStatus, UserOrder } from "@/services/orderService";

const formatOrderDate = (order: UserOrder) => {
  if (!order.createdAt) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(order.createdAt.toDate());
};

const formatStatus = (status: OrderStatus) => {
  return status;
};

const formatHistoryDate = (history: OrderHistoryItem) => {
  const maybeTimestamp = history.updatedAt as { toDate?: () => Date } | null;

  if (!maybeTimestamp || typeof maybeTimestamp.toDate !== "function") {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(maybeTimestamp.toDate());
};

export default function UserDashboard() {
  const { user } = useAuth();
  const { orders, loading, error } = useOrders({ mode: "user", userId: user?.uid });

  return (
    <Layout>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="h4">Dashboard</Typography>
            <Typography color="text.secondary">Welcome to RK Studio secure area. Your live orders are shown below.</Typography>
            <Typography>
              Logged in phone: <strong>{user?.phoneNumber || "-"}</strong>
            </Typography>
            <Typography color="text.secondary">Serving Narnaul (123001) | Home visit available</Typography>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">My Orders</Typography>

            {error ? <Alert severity="error">{error}</Alert> : null}

            {loading ? (
              <Stack alignItems="center" py={6}>
                <CircularProgress />
              </Stack>
            ) : null}

            {!loading && orders.length === 0 ? (
              <Alert severity="info">No orders yet. Place an order from Tailoring, Fabric, or Dupatta page.</Alert>
            ) : null}

            {!loading && orders.length > 0 ? (
              <Box sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Service</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status Timeline</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell sx={{ textTransform: "capitalize" }}>{order.service}</TableCell>
                        <TableCell>
                          <Chip label={formatStatus(order.status)} color={order.status === "done" ? "success" : "warning"} size="small" />
                        </TableCell>
                        <TableCell>{formatOrderDate(order)}</TableCell>
                        <TableCell>
                          <Stack spacing={0.8}>
                            {order.statusHistory.length > 0
                              ? order.statusHistory.map((history, index) => (
                                  <Typography key={`${order.id}-${index}`} variant="caption" color="text.secondary">
                                    {formatStatus(history.status)} - {formatHistoryDate(history)}
                                  </Typography>
                                ))
                              : <Typography variant="caption" color="text.secondary">No history</Typography>}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    </Layout>
  );
}
