# stokQu

Aplikasi manajemen stok sembako menggunakan Next.js, TypeScript, dan MySQL.

## Menyiapkan database MySQL

1. Jalankan MySQL lokal melalui XAMPP.
2. Buka phpMyAdmin, pilih database `stokqu`, lalu buka tab **Import** dan impor `database/schema.sql`. Berkas ini membuat tabel `products` dan mengisi contoh stok sembako.
3. Salin `.env.example` menjadi `.env.local`, lalu sesuaikan host, port, nama database, dan kredensial MySQL jika berbeda dari pengaturan lokal bawaan.
4. Ganti `AUTH_SECRET` di `.env.local` dengan rahasia acak minimal 32 karakter.
5. Jalankan `npm install`, kemudian `npm run dev`.

Secara bawaan aplikasi terhubung ke `127.0.0.1:3306`, database `stokqu`, dan pengguna MySQL `root` tanpa kata sandi. Sesuaikan `MYSQL_PASSWORD` dengan konfigurasi MySQL lokalmu jika diperlukan. Jangan unggah `.env.local` ke Git.

## Akun demo

Impor ulang `database/schema.sql` ke database `stokqu` untuk membuat tabel pengguna dan akun awal. Kredensial demo:

| Peran | Email | Kata sandi |
| --- | --- | --- |
| Admin | `admin@stokqu.id` | `Admin!2026` |
| Gudang | `gudang@stokqu.id` | `Gudang!2026` |
| Kasir | `kasir@stokqu.id` | `Kasir!2026` |

Kata sandi disimpan dalam bentuk hash bcrypt. Ganti kata sandi demo sebelum aplikasi digunakan di internet. Admin dan Gudang dapat mengelola inventaris; Kasir hanya dapat melihat stok. Sesi login memakai cookie `HttpOnly`.

## API

- `GET /api/products` — mengambil daftar stok sembako.
- `POST /api/products` — menambahkan produk.
- `PUT /api/products/:id` — memperbarui produk.
- `DELETE /api/products/:id` — menghapus produk.
- `POST /api/auth/login` — memeriksa email, kata sandi, dan peran lalu membuat sesi.
- `GET /api/auth/me` — mengambil pengguna yang sedang login.
- `POST /api/auth/logout` — mengakhiri sesi login.
- `POST /api/sales` — menyimpan penjualan dan mengurangi stok dalam satu transaksi database.
- `GET /api/sales/:receipt` — mengambil rincian struk penjualan.

Harga, merek, jumlah stok, satuan, dan kategori tersimpan di MySQL. Foto katalog sembako ditampilkan pada dashboard dan kasir; produk awal menggunakan foto bahan pangan dari Unsplash. Kategori produk dibatasi untuk kelompok bahan sembako.

Halaman kasir dapat dibuka melalui `/kasir`. Setelah transaksi disimpan, struk tersedia di `/struk/:nomor-transaksi` dan dapat dicetak atau disimpan sebagai PDF.
