export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  quantity: number;
  unit: string;
  updatedAt: string;
};

export type ProductInput = Omit<Product, "id" | "updatedAt">;
