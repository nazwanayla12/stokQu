import { compare } from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { createSessionToken, sessionCookieName, sessionLifetimeSeconds, type SessionUser, type UserRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

type UserRow = RowDataPacket & {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format JSON tidak valid." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Email dan kata sandi wajib diisi." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const role = input.role;
  const remember = input.remember === true;
  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 1 ||
    password.length > 128 ||
    (role !== "admin" && role !== "gudang" && role !== "kasir")
  ) {
    return NextResponse.json({ error: "Email, kata sandi, atau peran tidak valid." }, { status: 400 });
  }

  try {
    const [users] = await db.execute<UserRow[]>(
      "SELECT id, name, email, password_hash, role FROM users WHERE email = ? LIMIT 1",
      [email],
    );
    const user = users[0];
    if (!user || user.role !== role || !(await compare(password, user.password_hash))) {
      return NextResponse.json({ error: "Email, kata sandi, atau peran tidak cocok." }, { status: 401 });
    }

    const sessionUser: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const token = await createSessionToken(sessionUser, remember);
    const response = NextResponse.json({ user: sessionUser });
    response.cookies.set(sessionCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: remember ? 60 * 60 * 24 * 30 : sessionLifetimeSeconds,
    });
    return response;
  } catch (error) {
    console.error("Gagal masuk ke stokQu:", error);
    return NextResponse.json({ error: "Login gagal. Periksa koneksi database dan konfigurasi AUTH_SECRET." }, { status: 500 });
  }
}
