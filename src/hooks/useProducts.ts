"use client";

import { useEffect, useState } from "react";
import {
  CatalogProduct,
  ProductCategory,
  subscribeToAllProducts,
  subscribeToProductsByCategory,
} from "@/services/productService";

type UseProductsParams = {
  category?: ProductCategory;
};

export const useProducts = ({ category }: UseProductsParams = {}) => {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    const unsubscribe = category
      ? subscribeToProductsByCategory(
          category,
          (nextProducts) => {
            setProducts(nextProducts);
            setLoading(false);
          },
          () => {
            setError("Could not load products.");
            setLoading(false);
          },
        )
      : subscribeToAllProducts(
          (nextProducts) => {
            setProducts(nextProducts);
            setLoading(false);
          },
          () => {
            setError("Could not load products.");
            setLoading(false);
          },
        );

    return () => unsubscribe();
  }, [category]);

  return { products, loading, error };
};
