"use client";

import { Alert, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import OrderTimeline from "@/components/orders/OrderTimeline";
import Layout from "@/components/layout/Layout";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const orderCode = searchParams.get("orderCode") || orderId;

  return (
    <Layout>
      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <Typography variant="h3">Order placed successfully 🎉</Typography>
            <Typography color="text.secondary">Status: Waiting for approval</Typography>
            <Typography color="text.secondary">
              Estimated next step: Admin will review and accept your order shortly.
            </Typography>
            {orderId ? (
              <Alert severity="success">Order ID: {orderCode}</Alert>
            ) : null}

            <OrderTimeline status="pending" />
            <Alert severity="info">Estimated delivery timeline: 3-5 working days after confirmation.</Alert>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button component={Link} href="/my-orders" variant="contained">
                Track My Order
              </Button>
              <a
                href={`https://wa.me/9198901501572?text=${encodeURIComponent(`New order placed. Order ID: ${orderCode || "N/A"}`)}`}
                target="_self"
                style={{
                  display: "inline-block",
                  padding: "12px 20px",
                  backgroundColor: "#0EA5E9",
                  color: "#fff",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                Notify Admin (Optional)
              </a>
              <a
                href="https://wa.me/9198901501572?text=I%20have%20placed%20an%20order%20and%20need%20help"
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
                Contact on WhatsApp (Optional)
              </a>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Layout>
  );
}
