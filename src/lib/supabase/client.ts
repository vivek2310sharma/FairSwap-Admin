import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { readAuthConfig } from "@/lib/auth/runtime-config";
import { TEST_SUPABASE_URL } from "@/lib/config";

export const ADMIN_COOKIE_NAME = "fairswap-admin-test-auth";
export const PRIVATE_CACHE = "private, no-store, max-age=0, must-revalidate";
export type CookieWrite = { name: string; value: string; options: CookieOptions };
export type CookieAdapter = {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: CookieWrite[], headers: Record<string, string>) => void;
};

export function isAdminCookie(name: string) {
  return name === ADMIN_COOKIE_NAME ||
    new RegExp(`^${ADMIN_COOKIE_NAME}\\.\\d+$`).test(name) ||
    name === `${ADMIN_COOKIE_NAME}-code-verifier`;
}

export function adminCookieOptions(options: CookieOptions, secure: boolean): CookieOptions {
  const safe = { ...options, path: "/", httpOnly: true, sameSite: "lax" as const, secure };
  delete safe.domain;
  return safe;
}

/** Fixed destination even when a token contains an attacker-controlled issuer. */
export const testOnlyFetch: typeof fetch = (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (url.origin !== TEST_SUPABASE_URL || url.username || url.password) {
    throw new Error("Backend destination rejected.");
  }
  return fetch(input, { ...init, redirect: "error", cache: "no-store" });
};

/** No singleton: authenticated storage is isolated to this request. */
export function createAdminClient(adapter: CookieAdapter, secure: boolean) {
  const config = readAuthConfig();
  if (!config) return null;
  return createServerClient(config.url, config.key, {
    cookieOptions: { name: ADMIN_COOKIE_NAME, ...adminCookieOptions({}, secure) },
    global: { fetch: testOnlyFetch },
    cookies: {
      getAll: () => adapter.getAll().filter(({ name }) => isAdminCookie(name)),
      setAll: (updates, headers) => adapter.setAll(
        updates.filter(({ name }) => isAdminCookie(name)).map((cookie) => ({
          ...cookie, options: adminCookieOptions(cookie.options, secure),
        })), headers,
      ),
    },
  });
}

export type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;
