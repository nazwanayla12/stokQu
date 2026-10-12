import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { getSaleByReceipt } from "@/lib/sales";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ receipt: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await requireUser(["admin", "gudang", "kasir"]);
  if (auth.response || !auth.user) return auth.response;

  try {
    const { receipt } = await params;
    const sale = await getSaleByReceipt(receipt);
    if (!sale) return NextResponse.json({ error: "Struk tidak ditemukan." }, { status: 404 });

    if (auth.user.role === "kasir" && sale.cashierEmail !== auth.user.email) {
      return NextResponse.json({ error: "Kamu hanya dapat membuka struk transaksi sendiri." }, { status: 403 });
    }

    return NextResponse.json({ sale });
  } catch (error) {
    console.error("Gagal membaca struk:", error);
    return NextResponse.json({ error: "Struk gagal dibaca." }, { status: 500 });
  }
}
