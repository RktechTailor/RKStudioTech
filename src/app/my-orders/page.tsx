"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import Layout from "@/components/layout/Layout";
import OrderTimeline from "@/components/orders/OrderTimeline";
import { useAuth } from "@/hooks/useAuth";
import { getOrderStatusMessage, OrderStatus, normalizeOrderStatus } from "@/services/orderService";
import { useOrders } from "@/hooks/useOrders";

const getStatusColor = (status: OrderStatus) => {
  if (status === "pending") return "warning" as const;
  if (status === "accepted") return "success" as const;
  if (status === "rejected") return "error" as const;
  if (status === "stitching" || status === "in progress" || status === "in_progress") return "info" as const;
  if (status === "ready") return "secondary" as const;
  if (status === "delivered" || status === "done") return "default" as const;
  return "default" as const;
};

const getStatusLabel = (status: OrderStatus) => {
  if (status === "in_progress" || status === "in progress") return "Stitching";
  if (status === "done") return "Delivered";
  if (status === "pending") return "Pending";
  if (status === "accepted") return "Accepted";
  if (status === "rejected") return "Rejected";
  if (status === "stitching") return "Stitching";
  if (status === "ready") return "Ready";
  if (status === "delivered") return "Delivered";
  return status;
};

const formatOrderDate = (date?: { toDate?: () => Date } | null) => {
  if (!date || typeof date.toDate !== "function") {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date.toDate());
};

export default function MyOrdersPage() {
  const { user } = useAuth();
  const { orders, loading, error } = useOrders({ mode: "phone", phone: user?.phoneNumber || "" });
  const latestOrder = orders[0];

  return (
    <Layout>
      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <Typography variant="h4">My Orders</Typography>
            <Typography color="text.secondary">Track your latest order status in real-time.</Typography>

            {latestOrder ? (
              <Alert severity="info">
                Latest update: {latestOrder.orderCode || latestOrder.id.slice(0, 8)} - {getOrderStatusMessage(latestOrder.status)}.
              </Alert>
            ) : null}

            {error ? <Alert severity="error">{error}</Alert> : null}

            {loading ? (
              <Stack alignItems="center" py={6}>
                <CircularProgress />
              </Stack>
            ) : null}

            {!loading && orders.length === 0 ? (
              <Alert severity="info">No orders yet — place your first order</Alert>
            ) : null}

            {!loading && orders.length > 0 ? (
              <Stack spacing={2.5}>
                {latestOrder ? <OrderTimeline status={latestOrder.status} /> : null}

                <Alert severity="success">Estimated delivery: 3-5 working days after order confirmation.</Alert>

                <Divider />

                <Box sx={{ overflowX: "auto" }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Order ID</TableCell>
                        <TableCell>Items</TableCell>
                        <TableCell>Total</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.map((order) => {
                        const productLabel = order.items?.[0]
                          || order.orderDetails?.product_name
                          || order.orderDetails?.productType
                          || order.service;
                        const total = order.total || order.finalPayable || order.finalPrice || order.totalPrice || 0;

                        return (
                          <TableRow key={order.id}>
                            <TableCell>{(order.orderCode || order.id).slice(0, 16)}</TableCell>
                            <TableCell sx={{ textTransform: "capitalize" }}>{String(productLabel || "-")}</TableCell>
                            <TableCell>INR {Number(total || 0)}</TableCell>
                            <TableCell>
                              <Chip label={getStatusLabel(order.status)} size="small" color={getStatusColor(order.status)} />
                            </TableCell>
                            <TableCell>{formatOrderDate(order.createdAt)}</TableCell>
                            <TableCell>
                              <Button component={Link} href={`/my-orders/${order.id}`} variant="outlined" size="small" fullWidth>
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              </Stack>
            ) : null}

            {!loading ? (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                {latestOrder && normalizeOrderStatus(latestOrder.status) === "ready" ? (
                  <Button
                    component="a"
                    href="https://wa.me/9198901501572?text=My%20order%20is%20ready.%20Please%20share%20delivery%20details"
                    target="_self"
                    variant="contained"
                    color="success"
                    fullWidth
                    sx={{ minHeight: 44 }}
                  >
                    Contact Tailor on WhatsApp
                  </Button>
                ) : null}
                <Button
                  component="a"
                  href="https://wa.me/9198901501572?text=I%20need%20help%20with%20my%20order"
                  target="_self"
                  variant="outlined"
                  color="success"
                  fullWidth
                  sx={{ minHeight: 44 }}
                >
                  Need Help?
                </Button>
              </Stack>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    </Layout>
  );
}
