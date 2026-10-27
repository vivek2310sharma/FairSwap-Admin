import "server-only";
import { readAuthConfig } from "@/lib/auth/runtime-config";

/** Server-only; independently scoped to the already validated backend environment. */
export function ratingsEnabled(): boolean {
  const config = readAuthConfig();
  if (!config) return false;
  return config.environment === "test"
    ? process.env.FAIRSWAP_ADMIN_RATINGS_TEST_ENABLED === "true"
    : process.env.FAIRSWAP_ADMIN_RATINGS_PRODUCTION_ENABLED === "true";
}
