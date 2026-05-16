import Grid from "@mui/material/Grid2";
import ProductCard from "@/components/common/ProductCard";
import { CatalogProduct } from "@/services/productService";

type FabricGridProps = {
  products: CatalogProduct[];
  onSelect: (product: CatalogProduct) => void;
};

export default function FabricGrid({ products, onSelect }: FabricGridProps) {
  return (
    <Grid container spacing={2.5}>
      {products.map((product) => (
        <Grid key={product.id} size={{ xs: 12, sm: 6, lg: 4 }}>
          <ProductCard product={product} onAddToCart={onSelect} actionLabel="Select Fabric" />
        </Grid>
      ))}
    </Grid>
  );
}
