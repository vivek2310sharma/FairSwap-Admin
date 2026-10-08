import { z } from "zod";

export const TEST_PROJECT_REF = "wpppxlnbzqynvhpeuavd";
export const TEST_SUPABASE_URL = `https://${TEST_PROJECT_REF}.supabase.co`;
export const PRODUCTION_PROJECT_REF = "kriuhwppxgxsyyrbjsau";
export const PRODUCTION_SUPABASE_URL = `https://${PRODUCTION_PROJECT_REF}.supabase.co`;
export const ENVIRONMENTS = {
  test: { projectRef: TEST_PROJECT_REF, url: TEST_SUPABASE_URL, label: "TEST", mfaIssuer: "FairSwap Admin Test", marketplaceUrl: "https://fair-swap-git-staging-fairswap.vercel.app" },
  production: { projectRef: PRODUCTION_PROJECT_REF, url: PRODUCTION_SUPABASE_URL, label: "PRODUCTION", mfaIssuer: "FairSwap Admin Production", marketplaceUrl: "https://fairswap.in" },
} as const;
export type DeploymentEnvironment = keyof typeof ENVIRONMENTS;
const optionalSetting = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());
const foundationSchema = z.object({
  deploymentEnvironment: optionalSetting(z.enum(["test", "production"])),
  supabaseUrl: optionalSetting(z.enum([TEST_SUPABASE_URL, PRODUCTION_SUPABASE_URL])),
}).strict();
export type FoundationConfig = { status: "unconfigured" } | { status: "invalid" } |
  { status: "validated"; deploymentEnvironment: DeploymentEnvironment; supabaseUrl: string };
/** Exact target validation only; never selects a backend from request/token input. */
export function validateFoundationConfig(input: unknown): FoundationConfig {
  const result = foundationSchema.safeParse(input);
  if (!result.success) return { status: "invalid" };
  const { deploymentEnvironment, supabaseUrl } = result.data;
  if (!deploymentEnvironment || !supabaseUrl) return { status: "unconfigured" };
  if (ENVIRONMENTS[deploymentEnvironment].url !== supabaseUrl) return { status: "invalid" };
  return { status: "validated", deploymentEnvironment, supabaseUrl };
}
