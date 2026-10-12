export type PaymentMethod = "tunai" | "transfer" | "qris";

export type SaleItem = {
  id: number;
  productId: string;
  productName: string;
  productBrand: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Sale = {
  id: number;
  receiptNumber: string;
  cashierName: string;
  cashierEmail: string;
  paymentMethod: PaymentMethod;
  subtotal: number;
  amountPaid: number;
  changeDue: number;
  createdAt: string;
  items: SaleItem[];
};

export type SaleInput = {
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod: PaymentMethod;
  amountPaid: number;
};
