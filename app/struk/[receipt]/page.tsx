"use client";

import { ArrowLeft, Printer, ReceiptText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Sale } from "@/types/sale";

const money = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function ReceiptPage() {
  const params = useParams<{ receipt: string }>();
  const [sale, setSale] = useState<Sale | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/sales/${encodeURIComponent(params.receipt)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Struk gagal dimuat.");
        return data.sale as Sale;
      })
      .then((value) => {
        if (active) setSale(value);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Struk gagal dimuat.");
      });
    return () => {
      active = false;
    };
  }, [params.receipt]);

  if (error) {
    return <main className="receipt-state"><div><span className="receipt-state-icon">!</span><h1>Struk belum tersedia</h1><p>{error}</p><Link href="/kasir"><ArrowLeft size={15} /> Kembali ke kasir</Link></div></main>;
  }

  if (!sale) return <main className="receipt-state"><div><ReceiptText size={26} /><p>Memuat struk...</p></div></main>;

  const date = new Date(sale.createdAt);
  return (
    <main className="receipt-page">
      <div className="receipt-actions">
        <Link href="/kasir" className="receipt-back"><ArrowLeft size={15} /> Transaksi baru</Link>
        <button className="receipt-print-button" onClick={() => window.print()}><Printer size={16} /> Cetak struk</button>
      </div>
      <article className="receipt-paper">
        <header className="receipt-brand">
          <span className="receipt-logo"><ReceiptText size={19} /></span>
          <h1>stok<span>Qu</span></h1>
          <p>SEMBAKO &amp; KEBUTUHAN HARIAN</p>
          <small>Terima kasih sudah berbelanja</small>
        </header>
        <div className="receipt-divider receipt-divider-heavy" />
        <div className="receipt-meta">
          <div><span>No. transaksi</span><strong>{sale.receiptNumber}</strong></div>
          <div><span>Tanggal</span><strong>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date)}</strong></div>
          <div><span>Kasir</span><strong>{sale.cashierName}</strong></div>
        </div>
        <div className="receipt-divider" />
        <div className="receipt-item-heading"><span>BARANG</span><span>JUMLAH</span></div>
        <div className="receipt-items">
          {sale.items.map((item) => (
            <div className="receipt-item" key={item.id}>
              <div className="receipt-item-name"><strong>{item.productName}</strong><span>{item.productBrand} · {money.format(item.unitPrice)} × {item.quantity} {item.unit}</span></div>
              <strong className="receipt-item-total">{money.format(item.lineTotal)}</strong>
            </div>
          ))}
        </div>
        <div className="receipt-divider" />
        <div className="receipt-summary">
          <div><span>Subtotal</span><strong>{money.format(sale.subtotal)}</strong></div>
          <div><span>Metode pembayaran</span><strong>{sale.paymentMethod.toUpperCase()}</strong></div>
          <div><span>Uang diterima</span><strong>{money.format(sale.amountPaid)}</strong></div>
          {sale.paymentMethod === "tunai" && <div className="receipt-change"><span>Kembalian</span><strong>{money.format(sale.changeDue)}</strong></div>}
          <div className="receipt-total"><span>TOTAL</span><strong>{money.format(sale.subtotal)}</strong></div>
        </div>
        <div className="receipt-divider receipt-divider-heavy" />
        <footer className="receipt-thanks">
          <strong>Terima kasih!</strong>
          <p>Semoga hari Anda menyenangkan.</p>
          <span><ShieldCheck size={12} /> Transaksi tercatat aman di stokQu</span>
        </footer>
        <div className="receipt-barcode" aria-label={`Nomor struk ${sale.receiptNumber}`}><span>{sale.receiptNumber}</span></div>
      </article>
      <p className="receipt-hint">Gunakan tombol cetak untuk mencetak atau menyimpan struk sebagai PDF.</p>
    </main>
  );
}
