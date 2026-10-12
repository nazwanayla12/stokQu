import { randomBytes } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import type { PaymentMethod, Sale, SaleInput, SaleItem } from "@/types/sale";

type SaleRow = RowDataPacket & {
  id: number;
  receipt_number: string;
  cashier_name: string;
  cashier_email: string;
  payment_method: PaymentMethod;
  subtotal: number | string;
  amount_paid: number | string;
  change_due: number | string;
  created_at: Date | string;
};

type SaleItemRow = RowDataPacket & {
  id: number;
  product_id: string;
  product_name: string;
  product_brand: string;
  unit: string;
  quantity: number;
  unit_price: number | string;
  line_total: number | string;
};

type InventoryRow = RowDataPacket & {
  id: string;
  name: string;
  brand: string;
  unit: string;
  price: number | string;
  quantity: number;
};

function mapSale(row: SaleRow, items: SaleItem[]): Sale {
  return {
    id: row.id,
    receiptNumber: row.receipt_number,
    cashierName: row.cashier_name,
    cashierEmail: row.cashier_email,
    paymentMethod: row.payment_method,
    subtotal: Number(row.subtotal),
    amountPaid: Number(row.amount_paid),
    changeDue: Number(row.change_due),
    createdAt: new Date(row.created_at).toISOString(),
    items,
  };
}

function mapSaleItem(row: SaleItemRow): SaleItem {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    productBrand: row.product_brand,
    unit: row.unit,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    lineTotal: Number(row.line_total),
  };
}

export async function createSale(input: SaleInput, cashier: SessionUser): Promise<Sale | "insufficient" | "underpaid"> {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const productIds = [...new Set(input.items.map((item) => item.productId))].sort();
    const placeholders = productIds.map(() => "?").join(", ");
    const [productRows] = await connection.query<InventoryRow[]>(
      `SELECT id, name, brand, unit, price, quantity FROM products WHERE id IN (${placeholders}) ORDER BY id FOR UPDATE`,
      productIds,
    );
    const products = new Map(productRows.map((product) => [product.id, product]));

    let subtotal = 0;
    const items: Array<SaleItem & { remaining: number }> = [];
    for (const requested of input.items) {
      const product = products.get(requested.productId);
      if (!product || product.quantity < requested.quantity) {
        await connection.rollback();
        return "insufficient";
      }
      const unitPrice = Number(product.price);
      const lineTotal = Math.round(unitPrice * requested.quantity * 100) / 100;
      subtotal = Math.round((subtotal + lineTotal) * 100) / 100;
      items.push({
        id: 0,
        productId: product.id,
        productName: product.name,
        productBrand: product.brand,
        unit: product.unit,
        quantity: requested.quantity,
        unitPrice,
        lineTotal,
        remaining: product.quantity - requested.quantity,
      });
    }

    if (input.paymentMethod === "tunai" && input.amountPaid < subtotal) {
      await connection.rollback();
      return "underpaid";
    }
    if (input.paymentMethod !== "tunai" && input.amountPaid !== subtotal) {
      throw new Error("Jumlah pembayaran non-tunai harus sama dengan total transaksi.");
    }

    const receiptNumber = `SQ-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const changeDue = Math.round((input.amountPaid - subtotal) * 100) / 100;
    const [saleResult] = await connection.execute<ResultSetHeader>(
      "INSERT INTO sales (receipt_number, cashier_id, cashier_name, cashier_email, payment_method, subtotal, amount_paid, change_due) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [receiptNumber, cashier.id, cashier.name, cashier.email, input.paymentMethod, subtotal, input.amountPaid, changeDue],
    );

    for (const item of items) {
      await connection.execute<ResultSetHeader>(
        "INSERT INTO sale_items (sale_id, product_id, product_name, product_brand, unit, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [saleResult.insertId, item.productId, item.productName, item.productBrand, item.unit, item.quantity, item.unitPrice, item.lineTotal],
      );
      const [update] = await connection.execute<ResultSetHeader>(
        "UPDATE products SET quantity = quantity - ? WHERE id = ? AND quantity >= ?",
        [item.quantity, item.productId, item.quantity],
      );
      if (update.affectedRows !== 1) throw new Error("Stok berubah saat transaksi. Silakan ulangi transaksi.");
    }

    const [saleRows] = await connection.execute<SaleRow[]>(
      "SELECT id, receipt_number, cashier_name, cashier_email, payment_method, subtotal, amount_paid, change_due, created_at FROM sales WHERE id = ?",
      [saleResult.insertId],
    );
    const [savedItems] = await connection.execute<SaleItemRow[]>(
      "SELECT id, product_id, product_name, product_brand, unit, quantity, unit_price, line_total FROM sale_items WHERE sale_id = ? ORDER BY id",
      [saleResult.insertId],
    );
    if (!saleRows[0]) throw new Error("Transaksi tersimpan tetapi gagal dibaca kembali.");
    await connection.commit();
    return mapSale(saleRows[0], savedItems.map(mapSaleItem));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getSaleByReceipt(receiptNumber: string): Promise<Sale | null> {
  const [sales] = await db.execute<SaleRow[]>(
    "SELECT id, receipt_number, cashier_name, cashier_email, payment_method, subtotal, amount_paid, change_due, created_at FROM sales WHERE receipt_number = ? LIMIT 1",
    [receiptNumber],
  );
  if (!sales[0]) return null;
  const [items] = await db.execute<SaleItemRow[]>(
    "SELECT id, product_id, product_name, product_brand, unit, quantity, unit_price, line_total FROM sale_items WHERE sale_id = ? ORDER BY id",
    [sales[0].id],
  );
  return mapSale(sales[0], items.map(mapSaleItem));
}

export function validateSaleInput(value: unknown): SaleInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 100) return null;
  const items: SaleInput["items"] = [];
  const seen = new Set<string>();

  for (const item of input.items) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const row = item as Record<string, unknown>;
    if (
      typeof row.productId !== "string" ||
      row.productId.length < 1 ||
      row.productId.length > 32 ||
      seen.has(row.productId) ||
      typeof row.quantity !== "number" ||
      !Number.isSafeInteger(row.quantity) ||
      row.quantity < 1 ||
      row.quantity > 4294967295
    ) {
      return null;
    }
    seen.add(row.productId);
    items.push({ productId: row.productId, quantity: row.quantity });
  }

  if (
    (input.paymentMethod !== "tunai" && input.paymentMethod !== "transfer" && input.paymentMethod !== "qris") ||
    typeof input.amountPaid !== "number" ||
    !Number.isFinite(input.amountPaid) ||
    input.amountPaid < 0 ||
    input.amountPaid > 9999999999999.99
  ) {
    return null;
  }

  return {
    items,
    paymentMethod: input.paymentMethod,
    amountPaid: input.amountPaid,
  };
}
