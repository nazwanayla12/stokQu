import { randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "@/lib/db";
import type { Product, ProductInput } from "@/types/product";

type ProductRow = RowDataPacket & {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number | string;
  quantity: number;
  unit: string;
  updated_at: Date | string;
};

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    price: Number(row.price),
    quantity: Number(row.quantity),
    unit: row.unit,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function getProducts(): Promise<Product[]> {
  const [rows] = await db.query<ProductRow[]>(
    "SELECT id, name, brand, category, price, quantity, unit, updated_at FROM products ORDER BY updated_at DESC, name ASC",
  );
  return rows.map(mapProduct);
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const id = `stk-${randomUUID().replaceAll("-", "").slice(0, 20)}`;
  await db.execute<ResultSetHeader>(
    "INSERT INTO products (id, name, brand, category, price, quantity, unit) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, input.name, input.brand, input.category, input.price, input.quantity, input.unit],
  );
  const [rows] = await db.execute<ProductRow[]>(
    "SELECT id, name, brand, category, price, quantity, unit, updated_at FROM products WHERE id = ?",
    [id],
  );
  if (!rows[0]) throw new Error("Produk tersimpan tetapi gagal dibaca kembali.");
  return mapProduct(rows[0]);
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product | null> {
  const [result] = await db.execute<ResultSetHeader>(
    "UPDATE products SET name = ?, brand = ?, category = ?, price = ?, quantity = ?, unit = ? WHERE id = ?",
    [input.name, input.brand, input.category, input.price, input.quantity, input.unit, id],
  );
  if (result.affectedRows === 0) {
    const [rows] = await db.execute<ProductRow[]>("SELECT id FROM products WHERE id = ?", [id]);
    if (!rows[0]) return null;
  }

  const [rows] = await db.execute<ProductRow[]>(
    "SELECT id, name, brand, category, price, quantity, unit, updated_at FROM products WHERE id = ?",
    [id],
  );
  if (!rows[0]) return null;
  return mapProduct(rows[0]);
}

export async function deleteProduct(id: string): Promise<boolean> {
  const [result] = await db.execute<ResultSetHeader>("DELETE FROM products WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

export async function adjustProductStock(
  id: string,
  operation: "in" | "out",
  amount: number,
): Promise<Product | "insufficient" | null> {
  const condition = operation === "in" ? "quantity <= 4294967295 - ?" : "quantity >= ?";
  const adjustment = operation === "in" ? "quantity + ?" : "quantity - ?";
  const [result] = await db.execute<ResultSetHeader>(
    `UPDATE products SET quantity = ${adjustment} WHERE id = ? AND ${condition}`,
    [amount, id, amount],
  );

  if (result.affectedRows === 0) {
    const [rows] = await db.execute<ProductRow[]>("SELECT id, quantity FROM products WHERE id = ?", [id]);
    if (!rows[0]) return null;
    if (operation === "out" && rows[0].quantity < amount) return "insufficient";
    throw new Error("Stok gagal diperbarui.");
  }

  const [rows] = await db.execute<ProductRow[]>(
    "SELECT id, name, brand, category, price, quantity, unit, updated_at FROM products WHERE id = ?",
    [id],
  );
  if (!rows[0]) return null;
  return mapProduct(rows[0]);
}

const groceryCategories = new Set([
  "Beras & Karbohidrat",
  "Minyak & Bumbu",
  "Gula & Tepung",
  "Protein",
  "Makanan Instan",
]);

export function validateProductInput(value: unknown): ProductInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const brand = typeof input.brand === "string" ? input.brand.trim() : "";
  const category = typeof input.category === "string" ? input.category.trim() : "";
  const unit = typeof input.unit === "string" ? input.unit.trim() : "";
  const price = input.price;
  const quantity = input.quantity;

  if (
    !name ||
    name.length > 120 ||
    !brand ||
    brand.length > 100 ||
    !groceryCategories.has(category) ||
    !unit ||
    unit.length > 20 ||
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price < 0 ||
    price > 9999999999999.99 ||
    typeof quantity !== "number" ||
    !Number.isSafeInteger(quantity) ||
    quantity < 0 ||
    quantity > 4294967295
  ) {
    return null;
  }

  return { name, brand, category, price, quantity, unit };
}
