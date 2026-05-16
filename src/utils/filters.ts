export type ProductFilters = {
  maxPrice: number;
  type: string;
};

export const defaultFilters: ProductFilters = {
  maxPrice: 5000,
  type: "all",
};

export const applyProductFilters = <T extends { price: number; type: string }>(
  products: T[],
  filters: ProductFilters,
): T[] => {
  return products.filter((product) => {
    const byPrice = product.price <= filters.maxPrice;
    const byType = filters.type === "all" || product.type === filters.type;

    return byPrice && byType;
  });
};
