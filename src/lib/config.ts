import { z } from "zod";

export const TEST_PROJECT_REF = "wpppxlnbzqynvhpeuavd";
export const TEST_SUPABASE_URL = `https://${TEST_PROJECT_REF}.supabase.co`;

const optionalSetting = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const foundationSchema = z
  .object({
    deploymentEnvironment: optionalSetting(z.literal("test")),
    supabaseUrl: optionalSetting(z.literal(TEST_SUPABASE_URL)),
  })
  .strict();

export type FoundationConfig =
  | { status: "unconfigured" }
  | { status: "invalid" }
  | {
      status: "validated";
      deploymentEnvironment: "test";
      supabaseUrl: typeof TEST_SUPABASE_URL;
    };

/** Target validation only. No credentials, client, connectivity, or staff access. */
export function validateFoundationConfig(input: unknown): FoundationConfig {
  const result = foundationSchema.safeParse(input);
  if (!result.success) return { status: "invalid" };

  const { deploymentEnvironment, supabaseUrl } = result.data;
  if (!deploymentEnvironment || !supabaseUrl) return { status: "unconfigured" };

  return { status: "validated", deploymentEnvironment, supabaseUrl };
}
