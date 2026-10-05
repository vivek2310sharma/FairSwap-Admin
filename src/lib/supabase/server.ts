import "server-only";
import { cookies, headers } from "next/headers";
import { createAdminClient } from "./client";

export async function requestClient(writable = false) {
  const store = await cookies();
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "";
  // HTTP cookies are permitted only on loopback development hosts.
  const loopback = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  return createAdminClient({
    getAll: () => store.getAll(),
    setAll: (updates) => {
      // Proxy handles refreshed cookies before Server Component rendering.
      if (!writable) return;
      updates.forEach(({ name, value, options }) => store.set(name, value, options));
    },
  }, !loopback);
}
