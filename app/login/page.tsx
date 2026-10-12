"use client";

import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Package,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

const roles = [
  { id: "admin", label: "Admin", description: "Kelola semua operasional", icon: ShieldCheck },
  { id: "gudang", label: "Gudang", description: "Atur stok & barang", icon: Warehouse },
  { id: "kasir", label: "Kasir", description: "Layani transaksi", icon: ShoppingBasket },
] as const;

export default function LoginPage() {
  const [role, setRole] = useState<(typeof roles)[number]["id"]>("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          role,
          remember,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login gagal.");
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.assign(next?.startsWith("/") && !next.startsWith("//") ? next : "/");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Login gagal. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-showcase" aria-label="Tentang stokQu">
        <div className="showcase-orb showcase-orb-one" />
        <div className="showcase-orb showcase-orb-two" />
        <Link href="/login" className="login-brand" aria-label="stokQu">
          <span className="login-brand-mark"><Boxes size={21} strokeWidth={2.3} /></span>
          <span>stok<span>Qu</span><small>INVENTARIS JADI PRAKTIS</small></span>
        </Link>

        <div className="showcase-content">
          <div className="showcase-pill"><Sparkles size={13} /> SATU DASHBOARD, SEMUA BERES</div>
          <h1>Stok rapi,<br />usaha <span>makin maju.</span></h1>
          <p>Semua kebutuhan sembako dan operasional toko, terpantau mudah dalam satu tempat.</p>

          <div className="showcase-visual" aria-hidden="true">
            <div className="visual-glow" />
            <div className="floating-chip chip-rice"><span>🌾</span><div><strong>Beras premium</strong><small>Stok aman · 35 karung</small></div><Check size={14} /></div>
            <div className="floating-chip chip-oil"><span>🫒</span><div><strong>Minyak goreng</strong><small>Stok menipis · 8 pouch</small></div><span className="chip-alert">!</span></div>
            <div className="shelf shelf-back" />
            <div className="shelf shelf-front" />
            <div className="crate crate-rice"><Package size={34} /><span>BERAS</span></div>
            <div className="crate crate-grocery"><ShoppingBasket size={31} /><span>SEMBAKO</span></div>
            <div className="crate crate-box"><Boxes size={32} /><span>STOKQU</span></div>
            <div className="visual-caption"><span /><span /><span /></div>
          </div>
        </div>

        <div className="showcase-footer"><span>© 2026 stokQu</span><span><ShieldCheck size={14} /> Data inventaris tersimpan aman</span></div>
      </section>

      <section className="login-panel" aria-labelledby="login-heading">
        <Link className="back-dashboard" href="/"><ArrowLeft size={15} /> Kembali ke dashboard</Link>
        <div className="login-form-wrap">
          <div className="mobile-brand"><span className="login-brand-mark"><Boxes size={20} /></span><span>stok<span>Qu</span></span></div>
          <div className="login-heading">
            <span className="login-eyebrow">SELAMAT DATANG KEMBALI</span>
            <h2 id="login-heading">Masuk ke stokQu<span>.</span></h2>
            <p>Pilih peran dan masukkan detail akunmu.</p>
          </div>

          <div className="role-label"><span>MASUK SEBAGAI</span><span className="role-secure"><ShieldCheck size={13} /> Akses terpilih</span></div>
          <div className="role-picker" role="group" aria-label="Pilih peran akun">
            {roles.map(({ id, label, description, icon: Icon }) => (
              <button
                className={`role-option ${role === id ? "role-selected" : ""}`}
                type="button"
                key={id}
                aria-pressed={role === id}
                onClick={() => { setRole(id); setNotice(""); }}
              >
                <span className="role-icon"><Icon size={18} /></span>
                <span className="role-copy"><strong>{label}</strong><small>{description}</small></span>
                <span className="role-check"><Check size={12} /></span>
              </button>
            ))}
          </div>

          <form className="login-form" onSubmit={submit}>
            <label className="login-field">
              <span>Email</span>
              <input type="email" name="email" autoComplete="username" placeholder="nama@tokomu.com" required />
            </label>
            <label className="login-field">
              <span>Kata sandi</span>
              <span className="password-wrap">
                <KeyRound size={16} />
                <input type={showPassword ? "text" : "password"} name="password" autoComplete="current-password" placeholder="Masukkan kata sandi" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>
            <div className="login-options">
              <label className="remember-option"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span className="custom-checkbox"><Check size={11} /></span>Ingat saya</label>
              <a href="mailto:bantuan@stokqu.id?subject=Bantuan%20reset%20kata%20sandi">Lupa kata sandi?</a>
            </div>
            <button className="login-submit" type="submit" disabled={submitting}>{submitting ? "Memeriksa akun..." : <>Masuk sebagai {roles.find((item) => item.id === role)?.label}<ArrowRight size={17} /></>}</button>
            {notice && <p className="login-notice" role="status">{notice}</p>}
          </form>

          <div className="login-help"><span>Belum punya akun?</span> <a href="mailto:bantuan@stokqu.id?subject=Bantuan%20akun%20stokQu">Hubungi administrator</a></div>
          <div className="login-security"><ShieldCheck size={15} /><span>Sesi login aman · Akses untuk Admin, Gudang, dan Kasir</span></div>
        </div>
        <footer className="login-panel-footer"><span>© 2026 stokQu</span><a href="mailto:bantuan@stokqu.id">Butuh bantuan?</a></footer>
      </section>
    </main>
  );
}
