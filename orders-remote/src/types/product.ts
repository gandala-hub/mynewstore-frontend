export type Product = {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  stockQuantity: number;
};