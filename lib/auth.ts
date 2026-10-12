import { SignJWT, jwtVerify } from "jose";

export const sessionCookieName = "stokqu_session";
export const sessionLifetimeSeconds = 60 * 60 * 8;

export type UserRole = "admin" | "gudang" | "kasir";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

function signingKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET belum diatur atau terlalu pendek. Isi minimal 32 karakter di .env.local.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser, remember: boolean) {
  const expiresIn = remember ? "30d" : `${sessionLifetimeSeconds}s`;
  return new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(signingKey());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, signingKey(), { algorithms: ["HS256"] });
    if (
      !payload.sub ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string" ||
      (payload.role !== "admin" && payload.role !== "gudang" && payload.role !== "kasir")
    ) {
      return null;
    }

    return {
      id: Number(payload.sub),
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}
