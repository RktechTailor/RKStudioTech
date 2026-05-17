"use client";

import dynamic from "next/dynamic";
import { Alert, Box, Skeleton, Stack, Typography } from "@mui/material";
import Layout from "@/components/layout/Layout";
import { useProducts } from "@/hooks/useProducts";

const DupattaGrid = dynamic(
  () => import("@/features/dupatta/components/DupattaGrid"),
);

export default function DupattaPage() {
  const { products, loading, error } = useProducts({ category: "dupatta" });

  return (
    <Layout>
      <Stack spacing={3}>
        <Typography variant="h3">Dupatta</Typography>
        <Typography color="text.secondary">
          Ready designs for all occasions.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Koi dikkat ho to WhatsApp karein. Hum madad ke liye yahan hain.
        </Typography>

        <Box sx={{ p: { xs: 2.5, md: 3 }, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Delivery Charges:</Typography>
          <Stack spacing={1} sx={{ pl: 2 }}>
            <Typography variant="body2">• Home delivery: ₹99</Typography>
            <Typography variant="body2">• Pickup and delivery: ₹99</Typography>
            <Typography variant="body2">• Self pickup: Free</Typography>
          </Stack>
        </Box>

        {error ? <Alert severity="warning">{error}</Alert> : null}
        {loading ? (
          <Stack spacing={1.2} py={2}>
            <Skeleton variant="rounded" height={220} />
            <Skeleton variant="rounded" height={220} />
          </Stack>
        ) : (
          <DupattaGrid products={products} />
        )}
        {!loading && products.length === 0 ? (
          <Alert severity="info">Abhi dupatta available nahi hai. Thodi der baad check karein.</Alert>
        ) : null}
      </Stack>
    </Layout>
  );
}
