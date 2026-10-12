import { NextRequest, NextResponse } from "next/server";

const sessionCookieName = "stokqu_session";

async function hasValidSession(token: string | undefined) {
  if (!token) return false;
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) return false;

  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
    if (!encodedHeader || !encodedPayload || !encodedSignature) return false;
    const decode = (value: string) => {
      const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
      const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
      return Uint8Array.from(binary, (character) => character.charCodeAt(0));
    };
    const header = JSON.parse(new TextDecoder().decode(decode(encodedHeader))) as { alg?: string };
    const payload = JSON.parse(new TextDecoder().decode(decode(encodedPayload))) as {
      exp?: number;
      sub?: string;
      role?: string;
    };
    if (
      header.alg !== "HS256" ||
      !payload.sub ||
      !payload.exp ||
      payload.exp <= Math.floor(Date.now() / 1000) ||
      !["admin", "gudang", "kasir"].includes(payload.role ?? "")
    ) {
      return false;
    }
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    return crypto.subtle.verify("HMAC", key, decode(encodedSignature), new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`));
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const isAuthenticated = await hasValidSession(request.cookies.get(sessionCookieName)?.value);
  const isLogin = request.nextUrl.pathname === "/login";

  if (!isAuthenticated && !isLogin) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/kasir", "/struk/:path*"],
};
