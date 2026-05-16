"use client";

import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { Box, Button, Card, CardActions, CardContent, Chip, Stack, Typography } from "@mui/material";
import Image from "next/image";
import { memo } from "react";
import { CatalogProduct } from "@/services/productService";
import { formatINR } from "@/utils/currency";

type ProductCardProps = {
  product: CatalogProduct;
  onAddToCart?: (product: CatalogProduct) => void;
  showSuggestion?: boolean;
  actionLabel?: string;
};

function ProductCardComponent({
  product,
  onAddToCart,
  showSuggestion = false,
  actionLabel = "Add to cart",
}: ProductCardProps) {
  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        "&:hover img": {
          transform: "scale(1.04)",
        },
      }}
    >
      <Box sx={{ position: "relative", width: "100%", height: 220 }}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 900px) 100vw, 33vw"
          style={{ objectFit: "cover", transition: "transform 0.35s ease" }}
        />
      </Box>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="start" gap={1}>
          <Typography variant="h6">{product.name}</Typography>
          <Chip label={product.inStock === false ? "Out of stock" : "In stock"} color={product.inStock === false ? "default" : "success"} size="small" />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {product.description || `${product.tag || "Daily wear"} ${product.type} product.`}
        </Typography>
        <Typography variant="h6" sx={{ mt: 2, color: "primary.main" }}>
          {formatINR(product.price)}
        </Typography>

        {showSuggestion && product.suggestion ? (
          <Box sx={{ mt: 2, p: 1.2, borderRadius: 1.5, backgroundColor: "#FFF7ED" }}>
            <Typography variant="caption" sx={{ color: "secondary.main", fontWeight: 600 }}>
              Match with kurti: {product.suggestion}
            </Typography>
          </Box>
        ) : null}
      </CardContent>

      {onAddToCart ? (
        <CardActions sx={{ px: 2, pb: 2 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<ShoppingCartIcon />}
            disabled={product.inStock === false}
            onClick={() => onAddToCart(product)}
          >
            {actionLabel}
          </Button>
        </CardActions>
      ) : null}
    </Card>
  );
}

const ProductCard = memo(ProductCardComponent);

export default ProductCard;
