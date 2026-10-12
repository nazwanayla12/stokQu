import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createSale, validateSaleInput } from "@/lib/sales";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireUser(["admin", "gudang", "kasir"]);
  if (auth.response || !auth.user) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format JSON tidak valid." }, { status: 400 });
  }

  const input = validateSaleInput(body);
  if (!input) {
    return NextResponse.json({ error: "Keranjang atau informasi pembayaran tidak valid." }, { status: 400 });
  }

  const total = input.items.reduce((sum, item) => sum + item.quantity, 0);
  if (total > 10000) {
    return NextResponse.json({ error: "Jumlah barang dalam transaksi melebihi batas." }, { status: 400 });
  }

  try {
    const sale = await createSale(input, auth.user);
    if (sale === "insufficient") {
      return NextResponse.json({ error: "Stok salah satu barang tidak mencukupi. Perbarui keranjang lalu coba lagi." }, { status: 409 });
    }
    if (sale === "underpaid") {
      return NextResponse.json({ error: "Uang diterima belum cukup untuk membayar total transaksi." }, { status: 400 });
    }
    return NextResponse.json({ sale }, { status: 201 });
  } catch (error) {
    console.error("Gagal membuat transaksi:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Transaksi gagal disimpan." }, { status: 500 });
  }
}
