export type ProductCategory = "fabric" | "dupatta";

export type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  type: string;
  description?: string;
  category: ProductCategory;
  inStock?: boolean;
  tag?: string;
  suggestion?: string;
};

export type ServiceCategory = {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
};

export const serviceCategories: ServiceCategory[] = [
  {
    id: "tailoring",
    title: "Tailoring",
    description: "Ladies aur gents silai, fitting aur custom design.",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
    href: "/tailoring",
  },
  {
    id: "fabric",
    title: "Fabric",
    description: "Premium cotton, rayon, silk blend aur festive options.",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
    href: "/fabric",
  },
  {
    id: "dupatta",
    title: "Dupatta",
    description: "Daily wear se shaadi collection tak stylish dupatte.",
    image:
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80",
    href: "/dupatta",
  },
];

export const fabricProducts: Product[] = [
  {
    id: "fab-1",
    name: "Soft Cotton Floral",
    price: 950,
    image:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80",
    type: "cotton",
    description: "Lightweight cotton for daily wear suits.",
    category: "fabric",
    inStock: true,
    tag: "daily wear",
  },
  {
    id: "fab-2",
    name: "Rayon Printed Premium",
    price: 1350,
    image:
      "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=900&q=80",
    type: "rayon",
    description: "Flowy rayon fabric for kurti sets.",
    category: "fabric",
    inStock: true,
    tag: "popular",
  },
  {
    id: "fab-3",
    name: "Silk Blend Festive",
    price: 2890,
    image:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
    type: "silk",
    description: "Rich silk blend for festive and wedding wear.",
    category: "fabric",
    inStock: true,
    tag: "festive",
  },
  {
    id: "fab-4",
    name: "Linen Comfort",
    price: 1750,
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
    type: "linen",
    description: "Breathable linen for smart casual outfits.",
    category: "fabric",
    inStock: false,
    tag: "premium",
  },
  {
    id: "fab-5",
    name: "Cotton Handblock",
    price: 1220,
    image:
      "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=900&q=80",
    type: "cotton",
    description: "Handblock-inspired print for classic looks.",
    category: "fabric",
    inStock: true,
    tag: "handblock",
  },
  {
    id: "fab-6",
    name: "Rayon Party Texture",
    price: 2480,
    image:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
    type: "rayon",
    description: "Textured rayon for evening wear.",
    category: "fabric",
    inStock: true,
    tag: "party",
  },
];

export const dupattaProducts: Product[] = [
  {
    id: "dup-1",
    name: "Chiffon Ombre Dupatta",
    price: 790,
    image:
      "https://images.unsplash.com/photo-1594633313593-bab3825d0caf?auto=format&fit=crop&w=900&q=80",
    type: "chiffon",
    description: "Soft chiffon with ombre blend.",
    category: "dupatta",
    inStock: true,
    tag: "trending",
    suggestion: "Best with pastel straight kurti",
  },
  {
    id: "dup-2",
    name: "Bandhani Cotton Dupatta",
    price: 980,
    image:
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80",
    type: "cotton",
    description: "Everyday bandhani inspired style.",
    category: "dupatta",
    inStock: true,
    tag: "daily wear",
    suggestion: "Match with plain white kurti",
  },
  {
    id: "dup-3",
    name: "Silk Festive Dupatta",
    price: 1850,
    image:
      "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=900&q=80",
    type: "silk",
    description: "Premium silk with festive border.",
    category: "dupatta",
    inStock: true,
    tag: "festive",
    suggestion: "Great with gold-tone anarkali",
  },
  {
    id: "dup-4",
    name: "Georgette Mirror Work",
    price: 1490,
    image:
      "https://images.unsplash.com/photo-1520006403909-838d6b92c22e?auto=format&fit=crop&w=900&q=80",
    type: "georgette",
    description: "Elegant mirror-work touch for parties.",
    category: "dupatta",
    inStock: false,
    tag: "party",
    suggestion: "Pair with solid black kurti",
  },
];
