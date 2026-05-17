"use client";

import dynamic from "next/dynamic";
import { Alert, Box, Skeleton, Snackbar, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useGlobalLoading } from "@/context/LoadingContext";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import Layout from "@/components/layout/Layout";
import { CatalogProduct } from "@/services/productService";
import { defaultFilters, ProductFilters } from "@/utils/filters";
import { applyProductFilters } from "@/utils/filters";
import { createPendingPaymentToken, savePendingPaymentOrder } from "@/utils/paymentSession";

const FabricFilters = dynamic(
  () => import("@/features/fabric/components/FabricFilters"),
);

const FabricGrid = dynamic(
  () => import("@/features/fabric/components/FabricGrid"),
);

export default function FabricPage() {
  const router = useRouter();
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
      const token = createPendingPaymentToken();

      await trackAsync(
        Promise.resolve(
          savePendingPaymentOrder(token, {
            service: "fabric",
            userId,
            customerName: name,
            customerPhone: phone,
            orderDetails: {
              productId: product.id,
              productName: product.name,
              price: `${product.price}`,
              type: product.type,
            },
            productId: product.id,
            amount: product.price,
            paymentType: "full",
            whatsappDetails: [
              `Product: ${product.name}`,
              `Type: ${product.type}`,
              `Price: INR ${product.price}`,
            ],
          }),
        ),
      );

      setNotice("Payment page khul rahi hai...");
      router.push(`/checkout?token=${encodeURIComponent(token)}`);
    } catch {
      setError("Payment page nahi khul payi. Dobara koshish karein.");
    }
  };

  return (
    <Layout>
      <Stack spacing={3}>
        <Typography variant="h3">Buy Cloth</Typography>
        <Typography color="text.secondary">
          Find quality cloth at fair prices.
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
          <Alert severity="info">Abhi filter ke hisab se kapda nahi mila.</Alert>
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
