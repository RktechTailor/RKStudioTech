"use client";

import { Chip, Snackbar, Stack } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useState } from "react";
import ProductCard from "@/components/common/ProductCard";
import { useGlobalLoading } from "@/context/LoadingContext";
import { useAuth } from "@/hooks/useAuth";
import { CatalogProduct } from "@/services/productService";
import { saveOrderToFirestore } from "@/services/orderService";
import { sendToWhatsApp } from "@/utils/whatsapp";

type DupattaGridProps = {
  products: CatalogProduct[];
};

export default function DupattaGrid({ products }: DupattaGridProps) {
  const { user } = useAuth();
  const { trackAsync } = useGlobalLoading();
  const [addedItem, setAddedItem] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [error, setError] = useState("");

  const handleAddToCart = async (product: CatalogProduct) => {
    setError("");

    const userId = user?.uid || "guest-user";
    const name = user?.displayName || "Customer";
    const phone = user?.phoneNumber || "Not provided";

    try {
      await trackAsync(
        saveOrderToFirestore({
          userId,
          service: "dupatta",
          orderDetails: {
            productId: product.id,
            productName: product.name,
            price: `${product.price}`,
            suggestion: product.suggestion || "-",
          },
        }),
      );

      sendToWhatsApp({
        name,
        phone,
        service: "dupatta",
        details: `${product.name} | INR ${product.price}`,
      });

      setAddedItem("We will contact you on WhatsApp.");
      setCartCount((prev) => prev + 1);
    } catch {
      setError("Order save failed. Please login and check Firebase setup.");
    }
  };

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" mb={2}>
        <Chip label={`Cart items: ${cartCount}`} color="secondary" />
      </Stack>

      {error ? (
        <Stack mb={2}>
          <Chip label={error} color="error" />
        </Stack>
      ) : null}

      <Grid container spacing={2.5}>
        {products.map((product) => (
          <Grid key={product.id} size={{ xs: 12, sm: 6, lg: 4 }}>
            <ProductCard
              product={product}
              showSuggestion
              onAddToCart={handleAddToCart}
              actionLabel="Add to cart"
            />
          </Grid>
        ))}
      </Grid>

      <Snackbar
        open={Boolean(addedItem)}
        autoHideDuration={2000}
        onClose={() => setAddedItem("")}
        message={addedItem}
      />
    </>
  );
}
