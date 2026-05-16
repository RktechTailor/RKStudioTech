"use client";

import dynamic from "next/dynamic";
import { Alert, Skeleton, Snackbar, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useMemo, useState } from "react";
import { useGlobalLoading } from "@/context/LoadingContext";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import Layout from "@/components/layout/Layout";
import { saveOrderToFirestore } from "@/services/orderService";
import { CatalogProduct } from "@/services/productService";
import { defaultFilters, ProductFilters } from "@/utils/filters";
import { applyProductFilters } from "@/utils/filters";
import { sendToWhatsApp } from "@/utils/whatsapp";

const FabricFilters = dynamic(
  () => import("@/features/fabric/components/FabricFilters"),
);

const FabricGrid = dynamic(
  () => import("@/features/fabric/components/FabricGrid"),
);

export default function FabricPage() {
  const { user } = useAuth();
  const { trackAsync } = useGlobalLoading();
  const { products, loading, error: productsError } = useProducts({ category: "fabric" });
  const [filters, setFilters] = useState<ProductFilters>(defaultFilters);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const filteredProducts = useMemo(() => applyProductFilters(products, filters), [filters, products]);

  const handleSelectFabric = async (product: CatalogProduct) => {
    setError("");

    const userId = user?.uid || "guest-user";
    const name = user?.displayName || "Customer";
    const phone = user?.phoneNumber || "Not provided";

    try {
      await trackAsync(
        saveOrderToFirestore({
          userId,
          service: "fabric",
          orderDetails: {
            productId: product.id,
            productName: product.name,
            price: `${product.price}`,
            type: product.type,
          },
        }),
      );

      sendToWhatsApp({
        name,
        phone,
        service: "fabric",
        details: `${product.name} | ${product.type} | INR ${product.price}`,
      });

      setNotice("We will contact you on WhatsApp.");
    } catch {
      setError("Order save failed. Please login and check Firebase setup.");
    }
  };

  return (
    <Layout>
      <Stack spacing={3}>
        <Typography variant="h3">Fabric Collection</Typography>
        <Typography color="text.secondary">
          Budget aur type ke hisab se kapda choose karein.
        </Typography>

        {productsError ? <Alert severity="warning">{productsError}</Alert> : null}

        {error ? <Alert severity="error">{error}</Alert> : null}

        {loading ? (
          <Stack spacing={1.2} py={2}>
            <Skeleton variant="rounded" height={74} />
            <Skeleton variant="rounded" height={220} />
            <Skeleton variant="rounded" height={220} />
          </Stack>
        ) : null}

        {!loading ? (
          <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FabricFilters filters={filters} onChange={setFilters} />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <FabricGrid products={filteredProducts} onSelect={handleSelectFabric} />
          </Grid>
          </Grid>
        ) : null}

        {!loading && filteredProducts.length === 0 ? (
          <Alert severity="info">No fabric items match your current filters.</Alert>
        ) : null}

        <Snackbar
          open={Boolean(notice)}
          autoHideDuration={2000}
          onClose={() => setNotice("")}
          message={notice}
        />
      </Stack>
    </Layout>
  );
}
