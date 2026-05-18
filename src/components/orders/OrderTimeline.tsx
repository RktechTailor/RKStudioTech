"use client";

import { Box, Chip, Stack, Step, StepLabel, Stepper, Typography } from "@mui/material";
import {
  getOrderStatusMessage,
  ORDER_TIMELINE_STEPS,
  OrderStatus,
  normalizeOrderStatus,
} from "@/services/orderService";

const formatStatusLabel = (status: OrderStatus) => {
  const normalized = normalizeOrderStatus(status);
  if (normalized === "pending") return "Pending";
  if (normalized === "accepted") return "Accepted";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "stitching") return "Stitching";
  if (normalized === "ready") return "Ready";
  if (normalized === "delivered") return "Delivered";
  return normalized;
};

const getStatusColor = (status: OrderStatus) => {
  const normalized = normalizeOrderStatus(status);
  if (normalized === "pending") return "warning" as const;
  if (normalized === "accepted") return "success" as const;
  if (normalized === "rejected") return "error" as const;
  if (normalized === "stitching") return "info" as const;
  if (normalized === "ready") return "secondary" as const;
  if (normalized === "delivered") return "default" as const;
  return "default" as const;
};

type OrderTimelineProps = {
  status: OrderStatus;
};

export default function OrderTimeline({ status }: OrderTimelineProps) {
  const normalized = normalizeOrderStatus(status);
  const activeIndex = ORDER_TIMELINE_STEPS.findIndex((step) => step === normalized);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;

  return (
    <Stack spacing={1.2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" useFlexGap flexWrap="wrap">
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Order Timeline
        </Typography>
        <Chip size="small" label={formatStatusLabel(status)} color={getStatusColor(status)} />
      </Stack>

      <Typography variant="body2" color="text.secondary">{getOrderStatusMessage(status)}</Typography>

      {normalized === "rejected" ? (
        <Box>
          <Typography variant="body2" color="error.main">
            This order was rejected. Please contact support for help.
          </Typography>
        </Box>
      ) : (
        <Stepper activeStep={safeIndex} alternativeLabel>
          {ORDER_TIMELINE_STEPS.map((step) => (
            <Step key={step}>
              <StepLabel>{formatStatusLabel(step)}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}
    </Stack>
  );
}
