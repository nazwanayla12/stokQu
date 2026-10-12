import { cookies } from "next/headers";
import { sessionCookieName, verifySessionToken } from "@/lib/auth";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  return token ? verifySessionToken(token) : null;
}
