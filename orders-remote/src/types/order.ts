export type OrderRequest = {
  customerName: string;
  customerEmail: string;
  orderItems: Array<{
    productId: number;
    quantity: number;
  }>;
};