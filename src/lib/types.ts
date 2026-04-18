import type { Timestamp } from "firebase/firestore";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "in_preparation"
  | "ready"
  | "delivered"
  | "cancelled";

export type OrderSource = "web" | "manual";

export type IngredientUnit = "g" | "ml" | "un";

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
}

export interface ProductSize {
  name: string;
  price: number;
  recipe?: RecipeIngredient[];
}

export interface Ingredient {
  id: string;
  name: string;
  unit: IngredientUnit;
  pricePerUnit: number;
  packageSize?: number;
  packagePrice?: number;
  active: boolean;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  sizes: ProductSize[];
  active: boolean;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sizeName: string;
  unitPrice: number;
  qty: number;
  subtotal: number;
  unitCost?: number;
  subtotalCost?: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  notes?: string;
  status: OrderStatus;
  paid: boolean;
  paidAt?: Timestamp;
  source: OrderSource;
  totalCost?: number;
  profit?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Review {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  imageUrl?: string;
  active: boolean;
  order: number;
  createdAt: Timestamp;
}

export interface GalleryImage {
  id: string;
  imageUrl: string;
  caption?: string;
  order: number;
  createdAt: Timestamp;
}

export interface Settings {
  whatsappNumber: string;
  instagramHandle: string;
  businessName: string;
  tagline: string;
  heroMessage: string;
}
