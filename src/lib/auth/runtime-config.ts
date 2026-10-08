import "server-only";
import { z } from "zod";
import { ENVIRONMENTS, validateFoundationConfig } from "@/lib/config";
const publishableKey = z.string().regex(/^sb_publishable_[A-Za-z0-9_-]{20,}$/).max(256);

/** Request-owned contract. Key syntax is not evidence of remote project identity. */
export function readAuthConfig(env: NodeJS.ProcessEnv = process.env) {
  const target = validateFoundationConfig({ deploymentEnvironment: env.FAIRSWAP_DEPLOYMENT_ENV, supabaseUrl: env.FAIRSWAP_SUPABASE_URL });
  const key = publishableKey.safeParse(env.FAIRSWAP_SUPABASE_PUBLISHABLE_KEY);
  if (target.status !== "validated" || !key.success) return null;
  const environment = target.deploymentEnvironment;
  // VERCEL_ENV is platform-owned; NODE_ENV is only a build/runtime mode.
  if (env.VERCEL_ENV && !["preview", "development", "production"].includes(env.VERCEL_ENV)) return null;
  if (env.VERCEL && !env.VERCEL_ENV) return null;
  if (env.VERCEL_ENV === "production" ? environment !== "production" : env.VERCEL_ENV && environment !== "test") return null;
  // First launch has an explicit disabled state; never roll back to a Test artifact.
  if (env.FAIRSWAP_ADMIN_RELEASE_STATE && !["active", "maintenance"].includes(env.FAIRSWAP_ADMIN_RELEASE_STATE)) return null;
  if (env.FAIRSWAP_ADMIN_RELEASE_STATE === "maintenance" || (environment === "production" && env.FAIRSWAP_ADMIN_RELEASE_STATE !== "active")) return null;
  const selected = ENVIRONMENTS[environment];
  return { ...selected, environment, key: key.data, issuer: `${selected.url}/auth/v1`,
    cookieName: `fairswap-admin-${environment}-auth`, policyReviewUrl: `${selected.marketplaceUrl}/account/policy-review` };
}
