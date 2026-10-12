import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { adjustProductStock, deleteProduct, updateProduct, validateProductInput } from "@/lib/products";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireUser(["admin", "gudang"]);
  if (auth.response) return auth.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format JSON tidak valid." }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("operation" in body) ||
    !("quantity" in body) ||
    (body.operation !== "in" && body.operation !== "out") ||
    typeof body.quantity !== "number" ||
    !Number.isSafeInteger(body.quantity) ||
    body.quantity < 1 ||
    body.quantity > 4294967295
  ) {
    return NextResponse.json({ error: "Jumlah dan jenis pergerakan stok tidak valid." }, { status: 400 });
  }

  try {
    const { id } = await params;
    const product = await adjustProductStock(id, body.operation, body.quantity);
    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    }
    if (product === "insufficient") {
      return NextResponse.json({ error: "Stok keluar melebihi jumlah yang tersedia." }, { status: 409 });
    }
    return NextResponse.json({ product });
  } catch (error) {
    console.error("Gagal menyesuaikan stok:", error);
    return NextResponse.json({ error: "Stok gagal diperbarui." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
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
    const { id } = await params;
    const product = await updateProduct(id, input);
    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (error) {
    console.error("Gagal memperbarui produk:", error);
    return NextResponse.json({ error: "Produk gagal diperbarui." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await requireUser(["admin", "gudang"]);
  if (auth.response) return auth.response;
  try {
    const { id } = await params;
    if (!(await deleteProduct(id))) {
      return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Gagal menghapus produk:", error);
    return NextResponse.json({ error: "Produk gagal dihapus." }, { status: 500 });
  }
}
