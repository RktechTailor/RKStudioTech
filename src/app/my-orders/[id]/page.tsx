"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useParams } from "next/navigation";
import Layout from "@/components/layout/Layout";
import OrderTimeline from "@/components/orders/OrderTimeline";
import { useAuth } from "@/hooks/useAuth";
import { useOrders } from "@/hooks/useOrders";

const formatDate = (date?: { toDate?: () => Date } | null) => {
  if (!date || typeof date.toDate !== "function") {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date.toDate());
};

const getItemsText = (items?: string[], fallback?: string) => {
  if (Array.isArray(items) && items.length > 0) {
    return items.join(", ");
  }

  return fallback || "-";
};

export default function MyOrderDetailsPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const orderId = params?.id || "";
  const { orders, loading, error } = useOrders({ mode: "phone", phone: user?.phoneNumber || "" });

  const order = orders.find((item) => item.id === orderId);

  return (
    <Layout>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5}>
          <Typography variant="h4">Order Details</Typography>
          <Button component={Link} href="/my-orders" variant="outlined">
            Back to My Orders
          </Button>
        </Stack>

        {error ? <Alert severity="error">{error}</Alert> : null}

        {loading ? (
          <Stack alignItems="center" py={8}>
            <CircularProgress />
          </Stack>
        ) : null}

        {!loading && !order ? (
          <Alert severity="warning">Order not found.</Alert>
        ) : null}

        {!loading && order ? (
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">Order ID: {order.id}</Typography>
                <Typography color="text.secondary">Date: {formatDate(order.createdAt)}</Typography>

                <Divider />

                <Typography variant="subtitle1">Summary</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                  Service: {order.service}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Items: {getItemsText(order.items, String(order.orderDetails?.product_name || ""))}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total: INR {Number(order.total || order.finalPayable || order.finalPrice || order.totalPrice || 0)}
                </Typography>

                <Divider />

                <OrderTimeline status={order.status} />

                <Divider />

                <Typography variant="subtitle1">Full Breakdown</Typography>
                <Box sx={{ border: "1px solid #E2E8F0", borderRadius: 2, p: 2 }}>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit" }}>
                    {JSON.stringify(order.orderDetails || {}, null, 2)}
                  </pre>
                </Box>

                <a
                  href={`https://wa.me/9198901501572?text=${encodeURIComponent(`I need help with order ID ${order.id}`)}`}
                  target="_self"
                  style={{
                    display: "inline-block",
                    padding: "12px 20px",
                    backgroundColor: "#25D366",
                    color: "#fff",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: "bold",
                  }}
                >
                  Contact Tailor (Optional)
                </a>
              </Stack>
            </CardContent>
          </Card>
        ) : null}
      </Stack>
    </Layout>
  );
}
