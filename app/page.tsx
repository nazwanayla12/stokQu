"use client";

import {
  Activity,
  ArrowDownToLine,
  ArrowDownUp,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Check,
  ChevronDown,
  CircleHelp,
  Filter,
  LayoutDashboard,
  Leaf,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { SessionUser } from "@/lib/auth";
import ProductPhoto from "@/app/components/product-photo";
import type { Product, ProductInput } from "@/types/product";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const initialForm: ProductInput = {
  name: "",
  brand: "",
  category: "Beras & Karbohidrat",
  price: 0,
  quantity: 0,
  unit: "pcs",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatToday() {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function ProductDialog({
  product,
  onClose,
  onSave,
  saving,
}: {
  product: Product | null;
  onClose: () => void;
  onSave: (input: ProductInput) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState<ProductInput>(
    product
      ? {
          name: product.name,
          brand: product.brand,
          category: product.category,
          price: product.price,
          quantity: product.quantity,
          unit: product.unit,
        }
      : initialForm,
  );
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await onSave(form);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Produk gagal disimpan.");
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="modal-heading">
          <div>
            <span className="eyebrow">KATALOG PRODUK</span>
            <h2 id="dialog-title">{product ? "Edit produk" : "Tambah produk baru"}</h2>
            <p>Lengkapi informasi barang di gudangmu.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Tutup">
            <X size={19} />
          </button>
        </div>
        <form onSubmit={submit}>
          <label className="form-field">
            <span>Nama barang</span>
            <input
              required
              maxLength={120}
              placeholder="Contoh: Beras premium 5 kg"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <label className="form-field">
            <span>Merek</span>
            <input
              required
              maxLength={100}
              placeholder="Contoh: Bimoli, Gulaku, atau merek lainnya"
              value={form.brand}
              onChange={(event) => setForm({ ...form, brand: event.target.value })}
            />
          </label>
          <div className="form-row">
            <label className="form-field">
              <span>Kategori</span>
              <select
                required
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              >
                <option>Beras &amp; Karbohidrat</option>
                <option>Minyak &amp; Bumbu</option>
                <option>Gula &amp; Tepung</option>
                <option>Protein</option>
                <option>Makanan Instan</option>
              </select>
            </label>
            <label className="form-field">
              <span>Satuan</span>
              <input
                required
                maxLength={20}
                placeholder="pcs"
                value={form.unit}
                onChange={(event) => setForm({ ...form, unit: event.target.value })}
              />
            </label>
          </div>
          <div className="form-row">
            <label className="form-field">
              <span>Harga satuan</span>
              <div className="input-prefix">
                <span>Rp</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={form.price}
                  onChange={(event) => setForm({ ...form, price: Number(event.target.value) })}
                />
              </div>
            </label>
            <label className="form-field">
              <span>Jumlah stok</span>
              <input
                required
                type="number"
                min="0"
                step="1"
                value={form.quantity}
                onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })}
              />
            </label>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="button button-muted" type="button" onClick={onClose}>Batal</button>
            <button className="button button-primary" type="submit" disabled={saving}>
              {saving ? "Menyimpan..." : <><Check size={16} /> {product ? "Simpan perubahan" : "Simpan produk"}</>}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function StockDialog({
  product,
  onClose,
  onAdjust,
  saving,
}: {
  product: Product;
  onClose: () => void;
  onAdjust: (operation: "in" | "out", quantity: number) => Promise<void>;
  saving: boolean;
}) {
  const [operation, setOperation] = useState<"in" | "out">("in");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await onAdjust(operation, quantity);
    } catch (adjustError) {
      setError(adjustError instanceof Error ? adjustError.message : "Stok gagal diperbarui.");
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="product-modal stock-modal" role="dialog" aria-modal="true" aria-labelledby="stock-dialog-title">
        <div className="modal-heading">
          <div>
            <span className="eyebrow">PERGERAKAN INVENTARIS</span>
            <h2 id="stock-dialog-title">Sesuaikan stok</h2>
            <p>{product.name} · stok saat ini <strong>{product.quantity} {product.unit}</strong></p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Tutup"><X size={19} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="movement-toggle" role="group" aria-label="Jenis pergerakan stok">
            <button type="button" className={operation === "in" ? "selected-in" : ""} onClick={() => setOperation("in")}><ArrowDownRight size={16} /> Stok masuk</button>
            <button type="button" className={operation === "out" ? "selected-out" : ""} onClick={() => setOperation("out")}><ArrowUpRight size={16} /> Stok keluar</button>
          </div>
          <label className="form-field">
            <span>Jumlah {operation === "in" ? "masuk" : "keluar"} ({product.unit})</span>
            <input autoFocus required type="number" min="1" max={operation === "out" ? product.quantity : 4294967295} step="1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
          </label>
          <div className="stock-preview">
            <span>Perkiraan stok setelah perubahan</span>
            <strong>{Math.max(0, product.quantity + (operation === "in" ? quantity : -quantity))} {product.unit}</strong>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="button button-muted" type="button" onClick={onClose}>Batal</button>
            <button className="button button-primary" type="submit" disabled={saving || quantity < 1}>
              {saving ? "Memproses..." : <><Check size={16} /> Simpan pergerakan</>}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua kategori");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "available">("all");
  const [sortOrder, setSortOrder] = useState("recent");
  const [dialogProduct, setDialogProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const today = useMemo(() => formatToday(), []);

  const loadProducts = useCallback(async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Data produk gagal dimuat.");
      setProducts(data.products);
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Data produk gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then(async (response) => {
        if (!response.ok) throw new Error("Sesi login tidak ditemukan.");
        return response.json();
      })
      .then((data: { user: SessionUser }) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        if (active) window.location.assign("/login");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInput.current?.focus();
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const categories = useMemo(
    () => ["Semua kategori", ...Array.from(new Set(products.map((product) => product.category)))],
    [products],
  );
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id");
    return products.filter((product) => {
      const matchesSearch = !query || `${product.name} ${product.brand} ${product.category} ${product.id}`.toLocaleLowerCase("id").includes(query);
      const matchesStock = stockFilter === "all" || (stockFilter === "low" ? product.quantity <= 10 : product.quantity > 10);
      return matchesSearch && matchesStock && (category === "Semua kategori" || product.category === category);
    }).sort((a, b) => {
      if (sortOrder === "name") return a.name.localeCompare(b.name, "id");
      if (sortOrder === "quantity-asc") return a.quantity - b.quantity;
      if (sortOrder === "quantity-desc") return b.quantity - a.quantity;
      if (sortOrder === "value") return b.price * b.quantity - a.price * a.quantity;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [category, products, search, sortOrder, stockFilter]);

  const totalUnits = products.reduce((total, product) => total + product.quantity, 0);
  const stockValue = products.reduce((total, product) => total + product.price * product.quantity, 0);
  const lowStock = products.filter((product) => product.quantity <= 10).length;
  const categorySummary = useMemo(() => {
    const totals = new Map<string, number>();
    products.forEach((product) => totals.set(product.category, (totals.get(product.category) ?? 0) + product.quantity));
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  }, [products]);
  const maxCategoryUnits = Math.max(1, ...categorySummary.map(([, units]) => units));
  const attentionProducts = [...products].filter((product) => product.quantity <= 10).sort((a, b) => a.quantity - b.quantity).slice(0, 4);

  async function saveProduct(input: ProductInput) {
    setSaving(true);
    try {
      const endpoint = dialogProduct ? `/api/products/${dialogProduct.id}` : "/api/products";
      const response = await fetch(endpoint, {
        method: dialogProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Produk gagal disimpan.");
      setDialogOpen(false);
      setDialogProduct(null);
      setToast(dialogProduct ? "Perubahan produk berhasil disimpan." : "Produk baru berhasil ditambahkan.");
      await loadProducts();
    } finally {
      setSaving(false);
    }
  }

  async function removeProduct(product: Product) {
    if (!window.confirm(`Hapus ${product.name} dari daftar produk?`)) return;
    try {
      const response = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Produk gagal dihapus.");
      }
      setToast("Produk berhasil dihapus.");
      await loadProducts();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Produk gagal dihapus.");
    }
  }

  async function adjustStock(operation: "in" | "out", quantity: number) {
    if (!stockProduct) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/products/${stockProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation, quantity }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Stok gagal diperbarui.");
      setStockProduct(null);
      setToast(`Stok ${stockProduct.name} berhasil diperbarui.`);
      await loadProducts();
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Gagal keluar dari akun.");
      window.location.assign("/login");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Gagal keluar dari akun.");
    }
  }

  function exportCsv() {
    const rows = [
      ["Nama barang", "Merek", "Kategori", "Harga satuan", "Stok", "Satuan"],
      ...filteredProducts.map((product) => [product.name, product.brand, product.category, String(product.price), String(product.quantity), product.unit]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "stokqu-daftar-stok.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" aria-label="stokQu beranda">
          <span className="brand-mark"><Boxes size={21} strokeWidth={2.3} /></span>
          <span>stok<span className="brand-accent">Qu</span><small>WAREHOUSE MANAGEMENT</small></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <button className="workspace-switch">
          <span className="workspace-avatar">G</span>
          <span className="workspace-copy"><strong>Gudang Utama</strong><small>Inventaris sembako</small></span>
          <ChevronDown size={15} className="workspace-chevron" />
        </button>
        <div className="nav-label">MENU UTAMA</div>
        <nav className="sidebar-nav" aria-label="Navigasi utama">
          <a className="nav-link active" href="#dashboard"><LayoutDashboard size={18} /><span>Dashboard</span></a>
          <a className="nav-link" href="#produk"><Package size={18} /><span>Daftar produk</span><span className="nav-count">{products.length}</span></a>
          <a className="nav-link" href="/kasir"><ShoppingBasket size={18} /><span>Kasir &amp; struk</span></a>
          <a className="nav-link" href="#analitik"><Activity size={18} /><span>Analitik stok</span></a>
        </nav>
        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <span className="upgrade-icon"><Sparkles size={16} /></span>
            <strong>Kelola stok lebih mudah</strong>
            <p>Semua kebutuhan gudang, dalam satu tempat.</p>
            <a href="#produk">Jelajahi stokQu <ArrowUpRight size={13} /></a>
          </div>
          <a className="nav-link bottom-link" href="mailto:bantuan@stokqu.id"><CircleHelp size={18} /><span>Pusat bantuan</span></a>
          <div className="user-profile">
            <div className="user-avatar">{user?.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() ?? "..."}</div>
            <div className="user-info"><strong>{user?.name ?? "Memuat akun..."}</strong><span>{user ? `${user.role} · ${user.email}` : "stokQu"}</span></div>
            <button className="user-logout" onClick={() => void logout()} title="Keluar" aria-label="Keluar"><MoreHorizontal size={18} /></button>
          </div>
        </div>
      </aside>

      <section className="main-panel" id="dashboard">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="breadcrumb-divider">/</span><strong>Dashboard</strong></div>
          <div className="topbar-right"><span className="status-indicator"><span /> Tersambung ke MySQL</span><span className="topbar-date">{today}</span></div>
        </header>
        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">GUDANG UTAMA <span className="sun-dot">✳</span> {today.toLocaleUpperCase("id-ID")}</div>
              <h1>Stok terkendali,<br className="hero-break" /> bisnis makin <span className="title-period">tumbuh.</span></h1>
              <p className="welcome-copy">Semua kebutuhan sembako, tercatat rapi dalam satu dashboard.</p>
            </div>
            {user?.role !== "kasir" && <button className="button button-primary add-button" onClick={() => { setDialogProduct(null); setDialogOpen(true); }}>
              <Plus size={17} /> Tambah produk
            </button>}
          </section>

          {loadError && <div className="error-banner" role="alert"><TriangleAlert size={17} /><span>{loadError}</span><button onClick={() => { setLoading(true); void loadProducts(); }}>Coba lagi</button></div>}

          <section className="stats-grid" id="ringkasan" aria-label="Ringkasan inventaris">
            <article className="stat-card">
              <div className="stat-top"><span>Total produk</span><span className="stat-icon icon-violet"><Package size={18} /></span></div>
              <div className="stat-value">{loading ? "—" : products.length.toLocaleString("id-ID")} <span>SKU</span></div>
              <div className="stat-foot"><span className="trend-pill"><Leaf size={13} /> Sembako</span><span>jenis barang aktif</span></div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span>Jumlah persediaan</span><span className="stat-icon icon-green"><Boxes size={18} /></span></div>
              <div className="stat-value">{loading ? "—" : totalUnits.toLocaleString("id-ID")} <span>unit</span></div>
              <div className="stat-foot"><span className="stat-foot-neutral">{categorySummary.length} kategori</span><span>total barang tersedia</span></div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span>Nilai inventaris</span><span className="stat-icon icon-blue"><ArrowDownUp size={18} /></span></div>
              <div className="stat-value stat-currency">{loading ? "—" : rupiah.format(stockValue)}</div>
              <div className="stat-foot"><span className="stat-foot-neutral">Harga × stok</span><span>estimasi nilai barang</span></div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span>Perlu restock</span><span className="stat-icon icon-amber"><TriangleAlert size={18} /></span></div>
              <div className="stat-value">{loading ? "—" : lowStock} <span>produk</span></div>
              <div className="stat-foot"><span className="restock-indicator"><span /> Perhatian</span><span>stok 10 unit atau kurang</span></div>
            </article>
          </section>

          {user?.role === "kasir" && <div className="readonly-notice"><ShieldCheck size={16} /><span>Akun kasir memiliki akses lihat saja. Hubungi admin atau petugas gudang untuk mengubah stok.</span></div>}

          <section className="insights-grid" id="analitik" aria-label="Analitik dan tindakan stok">
            <article className="insight-card category-insight">
              <div className="insight-heading"><div><span className="insight-icon insight-leaf"><Leaf size={17} /></span><div><h2>Komposisi kategori</h2><p>Distribusi unit sembako di gudang</p></div></div><span className="insight-kicker">{categorySummary.length} kategori</span></div>
              <div className="category-bars">
                {categorySummary.length === 0 ? <div className="insight-empty">Data kategori akan tampil setelah produk ditambahkan.</div> : categorySummary.map(([name, units], index) => <div className="category-bar-row" key={name}>
                  <div className="category-bar-label"><span className={`category-dot category-dot-${index % 5}`} />{name}<strong>{units.toLocaleString("id-ID")} <small>unit</small></strong></div>
                  <div className="category-track"><span className={`category-fill category-fill-${index % 5}`} style={{ width: `${Math.max(5, (units / maxCategoryUnits) * 100)}%` }} /></div>
                </div>)}
              </div>
            </article>
            <article className="insight-card restock-card">
              <div className="insight-heading"><div><span className="insight-icon insight-warning"><TriangleAlert size={17} /></span><div><h2>Perlu perhatian</h2><p>Segera cek stok yang menipis</p></div></div><button className="text-link" onClick={() => { setStockFilter("low"); document.getElementById("produk")?.scrollIntoView({ behavior: "smooth" }); }}>Lihat semua <ArrowUpRight size={14} /></button></div>
              {attentionProducts.length === 0 ? <div className="all-stock-good"><span><Check size={17} /></span><div><strong>Stok aman!</strong><p>Belum ada produk yang perlu di-restock.</p></div></div> : <div className="restock-list">{attentionProducts.map((product) => <div className="restock-item" key={product.id}>
                <span className="restock-product-icon"><Package size={16} /></span><div className="restock-product"><strong>{product.name}</strong><span>{product.category}</span></div><span className="restock-quantity">{product.quantity} <small>{product.unit}</small></span><button className="restock-add" title={`Tambah stok ${product.name}`} aria-label={`Tambah stok ${product.name}`} onClick={() => setStockProduct(product)}><Plus size={15} /></button>
              </div>)}</div>}
            </article>
          </section>

          <section className="inventory-card" id="produk">
            <div className="inventory-heading">
              <div><div className="table-title-row"><h2>Daftar produk</h2><span className="product-count">{filteredProducts.length}</span></div><p>Kelola dan pantau semua barang di gudangmu.</p></div>
              <button className="button button-outline export-button" onClick={exportCsv}><ArrowDownToLine size={16} /> Ekspor</button>
            </div>
            <div className="toolbar">
              <label className="search-box"><Search size={17} /><input ref={searchInput} aria-label="Cari produk" placeholder="Cari nama produk atau SKU..." value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>Ctrl K</kbd></label>
              <label className="category-select"><Settings2 size={16} /><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter kategori">{categories.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} /></label>
              <label className="category-select stock-select"><Filter size={15} /><select value={stockFilter} onChange={(event) => setStockFilter(event.target.value as "all" | "low" | "available")} aria-label="Filter kondisi stok"><option value="all">Semua stok</option><option value="low">Stok menipis</option><option value="available">Stok aman</option></select><ChevronDown size={14} /></label>
              <label className="category-select sort-select"><ArrowDownUp size={15} /><select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} aria-label="Urutkan produk"><option value="recent">Terbaru</option><option value="name">Nama A–Z</option><option value="quantity-asc">Stok terendah</option><option value="quantity-desc">Stok tertinggi</option><option value="value">Nilai inventaris</option></select><ChevronDown size={14} /></label>
            </div>
            <div className="table-scroll">
              <table className="product-table">
                <thead><tr><th><span className="sr-only">Pilih produk</span></th><th>NAMA BARANG</th><th>KATEGORI</th><th>HARGA SATUAN</th><th>STOK</th><th>STATUS</th><th>TERAKHIR DIPERBARUI</th><th><span className="sr-only">Aksi</span></th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={8} className="empty-state">Memuat data produk...</td></tr> : filteredProducts.length === 0 ? <tr><td colSpan={8} className="empty-state">{products.length === 0 ? "Belum ada produk. Tambahkan produk pertama untuk memulai." : "Produk tidak ditemukan. Coba kata kunci atau kategori lain."}</td></tr> : filteredProducts.map((product, index) => {
                    const isLow = product.quantity <= 10;
                    return <tr key={product.id}>
                      <td><span className="table-row-index">{String(index + 1).padStart(2, "0")}</span></td>
                      <td><div className="product-cell"><ProductPhoto name={product.name} category={product.category} className={`product-icon product-icon-${index % 5}`} /><span className="product-name-wrap"><strong>{product.name}</strong><small className="product-brand">{product.brand}</small><small>{product.id.toUpperCase()}</small></span></div></td>
                      <td><span className={`category-tag category-${index % 4}`}>{product.category}</span></td>
                      <td className="price-cell">{rupiah.format(product.price)}</td>
                      <td><strong className="quantity-value">{product.quantity}</strong><span className="quantity-unit"> {product.unit}</span></td>
                      <td><span className={`stock-status ${isLow ? "status-low" : "status-good"}`}><span />{isLow ? "Stok rendah" : "Tersedia"}</span></td>
                      <td className="date-cell">{formatDate(product.updatedAt)}</td>
                      <td>{user?.role === "kasir" ? <span className="readonly-label">Lihat saja</span> : <div className="row-actions"><button className="row-action stock-action" title="Catat stok masuk atau keluar" aria-label={`Sesuaikan stok ${product.name}`} onClick={() => setStockProduct(product)}><ArrowDownUp size={14} /></button><button className="row-action" title="Edit produk" aria-label={`Edit ${product.name}`} onClick={() => { setDialogProduct(product); setDialogOpen(true); }}>Edit</button><button className="row-action row-delete" title="Hapus produk" aria-label={`Hapus ${product.name}`} onClick={() => void removeProduct(product)}><X size={15} /></button></div>}</td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>Menampilkan <strong>{filteredProducts.length}</strong> dari <strong>{products.length}</strong> produk {stockFilter === "low" && "· stok menipis"}{search && ` · hasil “${search}”`}</span><span className="secure-note"><ShieldCheck size={14} /> Tersimpan di database MySQL</span></div>
          </section>
          <footer className="page-footer"><span>© 2026 stokQu. Dibuat untuk pengelolaan gudang yang lebih baik.</span><span>Butuh bantuan? <a href="mailto:bantuan@stokqu.id">Hubungi kami</a></span></footer>
        </div>
      </section>
      {dialogOpen && user?.role !== "kasir" && <ProductDialog product={dialogProduct} onClose={() => { setDialogOpen(false); setDialogProduct(null); }} onSave={saveProduct} saving={saving} />}
      {stockProduct && user?.role !== "kasir" && <StockDialog product={stockProduct} onClose={() => setStockProduct(null)} onAdjust={adjustStock} saving={saving} />}
      {toast && <div className="toast-message" role="status"><Check size={16} />{toast}</div>}
    </main>
  );
}
