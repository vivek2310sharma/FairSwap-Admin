import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(4096),
});
export const verificationSchema = z.object({
  factorId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/),
});

/** Only the current milestone's protected destination is accepted. */
export function safeAdminRedirect(value: unknown): "/admin" {
  return value === "/admin" ? value : "/admin";
}

export function sameOriginMutation(origin: string | null, host: string | null): boolean {
  if (!origin || !host) return false;
  try {
    const url = new URL(origin);
    const loopback = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
    return (url.protocol === "https:" || (url.protocol === "http:" && loopback)) &&
      url.host === host && url.origin === origin && !url.username && !url.password;
  } catch {
    return false;
  }
}

export type AuthState = {
  error?: string;
  redirectTo?: "/admin" | "/auth/mfa" | "/auth/sign-in";
  enrollment?: { factorId: string; secret: string };
};
