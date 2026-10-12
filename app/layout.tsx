import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "stokQu — Manajemen Stok Gudang",
  description: "Pantau dan kelola persediaan gudang dengan mudah bersama stokQu.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
