"use client";

import dynamic from "next/dynamic";
import { Alert, Skeleton, Stack, Typography } from "@mui/material";
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
        <Typography variant="h3">Dupatta Collection</Typography>
        <Typography color="text.secondary">
          Stylish dupatta choose karein aur kurti matching suggestion bhi dekhein.
        </Typography>
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
          <Alert severity="info">No dupatta products available right now.</Alert>
        ) : null}
      </Stack>
    </Layout>
  );
}
