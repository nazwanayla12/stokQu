import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import type { UserRole } from "@/lib/auth";

export async function requireUser(allowedRoles?: UserRole[]) {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 }),
    };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      user,
      response: NextResponse.json({ error: "Peran akun tidak memiliki izin untuk tindakan ini." }, { status: 403 }),
    };
  }

  return { user, response: null };
}
