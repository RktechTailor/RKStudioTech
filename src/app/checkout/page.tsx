"use client";

import { Alert, Box, Button, Card, CardContent, CircularProgress, Divider, FormControl, FormControlLabel, Radio, RadioGroup, Stack, TextField, Typography } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout/Layout";
import { OrderDetails } from "@/services/orderService";
import { saveOrderToFirestore } from "@/services/orderService";
import { RK_STUDIO } from "@/utils/constants";
import { startRazorpayPayment, buildUpiPaymentLink } from "@/utils/payment";
import { clearPendingPaymentOrder, readPendingPaymentOrder } from "@/utils/paymentSession";
import { buildWhatsAppUrl } from "@/utils/whatsapp";

type PaymentMethod = "razorpay" | "upi";

const amountOptions = [100, 200, 300];

export default function CheckoutPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [selectedAdvanceAmount, setSelectedAdvanceAmount] = useState(RK_STUDIO.payment.tailoringAdvanceDefault);
  const [upiReference, setUpiReference] = useState("");
  const [upiStarted, setUpiStarted] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<ReturnType<typeof readPendingPaymentOrder>>(null);
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const razorpayEnabled = Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);

  useEffect(() => {
    if (!token) {
      setError("Payment session not found. Please start order again.");
      setLoading(false);
      return;
    }

    const pending = readPendingPaymentOrder(token);

    if (!pending) {
      setError("Payment session expired. Please start order again.");
      setLoading(false);
      return;
    }

    setPendingOrder(pending);
    if (pending.service === "tailoring") {
      const withinRange = Math.min(
        RK_STUDIO.payment.tailoringAdvanceMax,
        Math.max(RK_STUDIO.payment.tailoringAdvanceMin, pending.amount),
      );
      setSelectedAdvanceAmount(withinRange);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!razorpayEnabled) {
      setPaymentMethod("upi");
    }
  }, [razorpayEnabled]);

  const finalAmount = useMemo(() => {
    if (!pendingOrder) {
      return 0;
    }

    if (pendingOrder.service === "tailoring") {
      return selectedAdvanceAmount;
    }

    return pendingOrder.amount;
  }, [pendingOrder, selectedAdvanceAmount]);

  const paymentLabel = useMemo(() => {
    if (!pendingOrder) {
      return "";
    }

    return pendingOrder.paymentType === "advance" ? "Advance Paid" : "Full Paid";
  }, [pendingOrder]);

  const validateAmount = () => {
    if (!pendingOrder) {
      return "Payment session missing.";
    }

    if (pendingOrder.service === "tailoring") {
      if (
        selectedAdvanceAmount < RK_STUDIO.payment.tailoringAdvanceMin ||
        selectedAdvanceAmount > RK_STUDIO.payment.tailoringAdvanceMax
      ) {
        return `Advance amount must be between INR ${RK_STUDIO.payment.tailoringAdvanceMin} and INR ${RK_STUDIO.payment.tailoringAdvanceMax}.`;
      }
    }

    if (pendingOrder.service === "fabric" && finalAmount !== pendingOrder.amount) {
      return "Invalid amount for fabric order.";
    }

    return "";
  };

  const handleFinalizeOrder = async (paymentId: string) => {
    if (!pendingOrder || orderConfirmed) {
      return;
    }

    await saveOrderToFirestore({
      userId: pendingOrder.userId,
      service: pendingOrder.service,
      productId: pendingOrder.productId,
      orderDetails: pendingOrder.orderDetails as OrderDetails,
      paymentStatus: "paid",
      paymentType: pendingOrder.paymentType,
      amountPaid: finalAmount,
      paymentId,
    });

    const whatsappDetails = [...pendingOrder.whatsappDetails, `Payment: ${paymentLabel} (INR ${finalAmount})`];

    setSuccess("Payment successful. We will contact you on WhatsApp");
    setOrderConfirmed(true);
    clearPendingPaymentOrder(token);

    const url = buildWhatsAppUrl({
      name: pendingOrder.customerName,
      phone: pendingOrder.customerPhone,
      service: pendingOrder.service,
      details: whatsappDetails,
    });

    setWhatsappUrl(url);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handlePayAndConfirm = async () => {
    setError("");
    setSuccess("");

    const validationError = validateAmount();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!pendingOrder) {
      setError("Payment session missing.");
      return;
    }

    try {
      setSubmitting(true);

      if (paymentMethod === "razorpay") {
        const razorpayPayment = await startRazorpayPayment({
          amount: finalAmount,
          description: `${pendingOrder.service === "tailoring" ? "Tailoring advance" : "Fabric full payment"} - RK Studio`,
          customerName: pendingOrder.customerName,
          customerPhone: pendingOrder.customerPhone,
        });

        const verifyResponse = await fetch("/api/payments/razorpay/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            razorpay_order_id: razorpayPayment.razorpay_order_id,
            razorpay_payment_id: razorpayPayment.razorpay_payment_id,
            razorpay_signature: razorpayPayment.razorpay_signature,
          }),
        });

        const verifyPayload = (await verifyResponse.json()) as {
          verified?: boolean;
          error?: string;
        };

        if (!verifyResponse.ok || !verifyPayload.verified) {
          throw new Error(verifyPayload.error || "Payment verification failed. Please retry payment.");
        }

        await handleFinalizeOrder(razorpayPayment.razorpay_payment_id);
        return;
      }

      if (!upiStarted) {
        const upiLink = buildUpiPaymentLink({
          amount: finalAmount,
          note: `${pendingOrder.service} payment`,
        });
        window.location.href = upiLink;
        setUpiStarted(true);
        setError("After completing UPI payment, enter UTR/reference and click Pay & Confirm Order again.");
        return;
      }

      if (!upiReference.trim()) {
        setError("Enter UPI UTR/reference number to confirm payment.");
        return;
      }

      await handleFinalizeOrder(`upi-${upiReference.trim()}`);
    } catch (paymentError) {
      const message = paymentError instanceof Error ? paymentError.message : "Payment failed. Please retry.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderTitle = () => {
    if (!pendingOrder) {
      return "Payment";
    }

    if (pendingOrder.service === "tailoring") {
      return "₹100 advance required to confirm tailoring order";
    }

    return "Full payment required to confirm order";
  };

  if (loading) {
    return (
      <Layout>
        <Stack alignItems="center" py={10} spacing={1.5}>
          <CircularProgress />
          <Typography color="text.secondary">Preparing payment...</Typography>
        </Stack>
      </Layout>
    );
  }

  return (
    <Layout>
      <Stack spacing={3}>
        <Typography variant="h3">Payment</Typography>

        <Card>
          <CardContent>
            <Stack spacing={2.5}>
              <Typography variant="h5">{renderTitle()}</Typography>

              {pendingOrder?.service === "tailoring" ? (
                <FormControl>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Select advance amount (configurable):
                  </Typography>
                  <RadioGroup
                    value={selectedAdvanceAmount}
                    onChange={(event) => setSelectedAdvanceAmount(Number(event.target.value))}
                  >
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                      {amountOptions.map((amount) => (
                        <FormControlLabel
                          key={amount}
                          value={amount}
                          control={<Radio />}
                          label={`INR ${amount}`}
                        />
                      ))}
                    </Stack>
                  </RadioGroup>
                </FormControl>
              ) : null}

              <Divider />

              <Stack spacing={1}>
                <Typography variant="subtitle1">Order Summary</Typography>
                <Typography variant="body2" color="text.secondary">
                  Service: {pendingOrder?.service === "tailoring" ? "Tailoring" : "Fabric"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Payment Type: {pendingOrder?.paymentType === "advance" ? "Advance" : "Full"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Amount to Pay: INR {finalAmount}
                </Typography>
              </Stack>

              <Divider />

              <FormControl>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Payment Method
                </Typography>
                <RadioGroup
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                >
                  <FormControlLabel
                    value="razorpay"
                    control={<Radio />}
                    label="Razorpay (Recommended)"
                    disabled={!razorpayEnabled}
                  />
                  <FormControlLabel value="upi" control={<Radio />} label="UPI link" />
                </RadioGroup>
              </FormControl>

              {!razorpayEnabled ? (
                <Alert severity="info">
                  Razorpay key is not configured in local environment. UPI mode is enabled for now.
                </Alert>
              ) : null}

              {paymentMethod === "upi" ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    UPI ID: {RK_STUDIO.payment.upiId}
                  </Typography>
                  <TextField
                    fullWidth
                    label="UPI UTR / Reference"
                    value={upiReference}
                    onChange={(event) => setUpiReference(event.target.value)}
                  />
                </Box>
              ) : null}

              {success ? <Alert severity="success">{success}</Alert> : null}
              {error ? <Alert severity="error">{error}</Alert> : null}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button variant="outlined" onClick={() => router.back()} disabled={submitting}>
                  Back
                </Button>
                <Button variant="contained" onClick={handlePayAndConfirm} disabled={submitting || orderConfirmed}>
                  {submitting ? "Processing..." : "Pay & Confirm Order"}
                </Button>
                {success && whatsappUrl ? (
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={() => window.open(whatsappUrl, "_blank", "noopener,noreferrer")}
                  >
                    Retry WhatsApp
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Layout>
  );
}
