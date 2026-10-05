import "server-only";
import { z } from "zod";
import { TEST_SUPABASE_URL, validateFoundationConfig } from "@/lib/config";

const publishableKey = z.string().regex(/^sb_publishable_[A-Za-z0-9_-]{20,}$/).max(256);

/** Evaluated for each request/client creation, never from a build-time label. */
export function readAuthConfig(env: NodeJS.ProcessEnv = process.env) {
  const target = validateFoundationConfig({
    deploymentEnvironment: env.FAIRSWAP_DEPLOYMENT_ENV,
    supabaseUrl: env.FAIRSWAP_SUPABASE_URL,
  });
  const key = publishableKey.safeParse(env.FAIRSWAP_SUPABASE_PUBLISHABLE_KEY);
  if (target.status !== "validated" || !key.success) return null;
  return { url: TEST_SUPABASE_URL, key: key.data };
}
