import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createProduct, getProducts, validateProductInput } from "@/lib/products";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  try {
    return NextResponse.json({ products: await getProducts() });
  } catch (error) {
    console.error("Gagal membaca data produk:", error);
    return NextResponse.json({ error: "Data produk gagal dibaca." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireUser(["admin", "gudang"]);
  if (auth.response) return auth.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format JSON tidak valid." }, { status: 400 });
  }

  const input = validateProductInput(body);
  if (!input) {
    return NextResponse.json({ error: "Data produk tidak valid." }, { status: 400 });
  }

  try {
    return NextResponse.json({ product: await createProduct(input) }, { status: 201 });
  } catch (error) {
    console.error("Gagal menyimpan produk:", error);
    return NextResponse.json({ error: "Produk gagal disimpan." }, { status: 500 });
  }
}
