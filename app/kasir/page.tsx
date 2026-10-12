"use client";

import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CirclePlus,
  Minus,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  ShoppingBasket,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Product } from "@/types/product";
import type { PaymentMethod } from "@/types/sale";
import ProductPhoto from "@/app/components/product-photo";

const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

type CartItem = { product: Product; quantity: number };

const payments: Array<{ id: PaymentMethod; label: string; icon: typeof Banknote }> = [
  { id: "tunai", label: "Tunai", icon: Banknote },
  { id: "qris", label: "QRIS", icon: QrCode },
  { id: "transfer", label: "Transfer", icon: WalletCards },
];

export default function CashierPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [query, setQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("tunai");
  const [amountInput, setAmountInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadProducts = useCallback(async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Daftar barang gagal dimuat.");
      setProducts(data.products);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Daftar barang gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("id");
    return products.filter((product) =>
      product.quantity > 0 &&
      (!normalized || `${product.name} ${product.brand} ${product.category} ${product.id}`.toLocaleLowerCase("id").includes(normalized)),
    );
  }, [products, query]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const amountPaid = paymentMethod === "tunai" ? Number(amountInput || 0) : total;
  const change = Math.max(0, amountPaid - total);
  const paymentValid = paymentMethod !== "tunai" || amountPaid >= total;

  function addProduct(product: Product) {
    setError("");
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          setError(`Stok ${product.name} hanya ${product.quantity} ${product.unit}.`);
          return current;
        }
        return current.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...current, { product, quantity: 1 }];
    });
  }

  function changeQuantity(productId: string, amount: number) {
    setCart((current) => current.flatMap((item) => {
      if (item.product.id !== productId) return [item];
      const quantity = item.quantity + amount;
      if (quantity < 1) return [];
      if (quantity > item.product.quantity) {
        setError(`Stok ${item.product.name} hanya ${item.product.quantity} ${item.product.unit}.`);
        return [item];
      }
      return [{ ...item, quantity }];
    }));
    setError("");
  }

  async function submitSale() {
    if (!cart.length || !paymentValid || saving) return;
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(({ product, quantity }) => ({ productId: product.id, quantity })),
          paymentMethod,
          amountPaid,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Transaksi gagal disimpan.");
      window.location.assign(`/struk/${encodeURIComponent(data.sale.receiptNumber)}`);
    } catch (saleError) {
      setError(saleError instanceof Error ? saleError.message : "Transaksi gagal disimpan.");
      await loadProducts();
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="pos-page">
      <header className="pos-topbar">
        <Link href="/" className="pos-back"><ArrowLeft size={16} /> Dashboard stok</Link>
        <div className="pos-brand"><span><ShoppingBasket size={19} /></span> stokQu <i>·</i> Kasir</div>
        <div className="pos-secure"><ShieldCheck size={15} /> Transaksi tersimpan aman</div>
      </header>
      <div className="pos-content">
        <div className="pos-page-title">
          <div><span className="pos-eyebrow">PENJUALAN</span><h1>Buat transaksi<span>.</span></h1><p>Pilih barang sembako dan masukkan ke keranjang.</p></div>
          <div className="pos-date">{new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}</div>
        </div>
        {error && <div className="pos-error" role="alert">{error}<button onClick={() => setError("")} aria-label="Tutup pesan">×</button></div>}
        <div className="pos-layout">
          <section className="pos-catalog">
            <div className="pos-section-head"><div><h2>Pilih barang</h2><p>{visibleProducts.length} produk tersedia</p></div><label className="pos-search"><Search size={16} /><input aria-label="Cari barang" placeholder="Cari nama sembako..." value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
            <div className="pos-product-grid">
              {loading ? <div className="pos-empty">Memuat daftar barang...</div> : visibleProducts.length === 0 ? <div className="pos-empty">Barang tidak ditemukan atau stok sedang kosong.</div> : visibleProducts.map((product, index) => {
                const cartItem = cart.find((item) => item.product.id === product.id);
                return <button className="pos-product-card" type="button" key={product.id} onClick={() => addProduct(product)}>
                  <span className={`pos-product-art pos-art-${index % 5}`}><ProductPhoto name={product.name} category={product.category} className="pos-product-photo" /><small>{product.category}</small></span>
                  <span className="pos-product-name">{product.name}</span>
                  <span className="pos-product-brand">{product.brand}</span>
                  <span className="pos-product-bottom"><strong>{money.format(product.price)}</strong><small>{product.quantity - (cartItem?.quantity ?? 0)} {product.unit} tersisa</small></span>
                  <span className="pos-add-mark"><Plus size={15} /></span>
                </button>;
              })}
            </div>
          </section>

          <aside className="pos-cart">
            <div className="pos-cart-header"><span className="pos-cart-icon"><ShoppingBasket size={18} /></span><div><h2>Keranjang</h2><p>{totalItems} barang dipilih</p></div><button className="pos-clear" onClick={() => { setCart([]); setAmountInput(""); }} disabled={!cart.length}>Kosongkan</button></div>
            <div className="pos-cart-items">
              {!cart.length ? <div className="pos-cart-empty"><span><CirclePlus size={25} /></span><strong>Keranjang masih kosong</strong><p>Pilih barang di sebelah kiri untuk memulai transaksi.</p></div> : cart.map(({ product, quantity }) => <div className="pos-cart-item" key={product.id}>
                <div className="pos-cart-item-copy"><strong>{product.name}</strong><span>{product.brand} · {money.format(product.price)} / {product.unit}</span></div>
                <div className="pos-quantity-control"><button onClick={() => changeQuantity(product.id, -1)} aria-label={`Kurangi ${product.name}`}><Minus size={12} /></button><span>{quantity}</span><button onClick={() => changeQuantity(product.id, 1)} aria-label={`Tambah ${product.name}`}><Plus size={12} /></button></div>
                <strong className="pos-line-total">{money.format(product.price * quantity)}</strong>
              </div>)}
            </div>
            <div className="pos-payment">
              <span className="pos-payment-label">METODE PEMBAYARAN</span>
              <div className="pos-payment-options">{payments.map(({ id, label, icon: Icon }) => <button type="button" key={id} className={paymentMethod === id ? "payment-selected" : ""} onClick={() => { setPaymentMethod(id); setError(""); }}><Icon size={15} />{label}</button>)}</div>
              {paymentMethod === "tunai" && <label className="cash-field"><span>Uang diterima</span><span><b>Rp</b><input type="number" min="0" step="1" placeholder="0" value={amountInput} onChange={(event) => setAmountInput(event.target.value)} /></span></label>}
              <div className="pos-totals"><div><span>Subtotal</span><strong>{money.format(total)}</strong></div><div className="pos-grand-total"><span>Total pembayaran</span><strong>{money.format(total)}</strong></div>{paymentMethod === "tunai" && <div className="pos-change"><span>Kembalian</span><strong>{money.format(change)}</strong></div>}</div>
              <button className="pos-checkout" onClick={() => void submitSale()} disabled={!cart.length || !paymentValid || saving}>{saving ? "Menyimpan transaksi..." : <>Selesaikan transaksi <ArrowRight size={17} /></>}</button>
              <p className="pos-stock-note"><Check size={13} /> Stok otomatis diperbarui setelah transaksi.</p>
            </div>
          </aside>
        </div>
        <footer className="pos-footer"><Link href="/">← Kembali ke dashboard</Link><span>stokQu · Kasir</span></footer>
      </div>
    </main>
  );
}
