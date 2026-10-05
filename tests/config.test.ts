import { describe, expect, it } from "vitest";
import { TEST_SUPABASE_URL, validateFoundationConfig } from "@/lib/config";

describe("foundation target validation (synthetic inputs only)", () => {
  it.each([
    {},
    { deploymentEnvironment: "", supabaseUrl: "" },
    { deploymentEnvironment: "test" },
    { supabaseUrl: TEST_SUPABASE_URL },
  ])("keeps absent or incomplete configuration safely unconfigured: %j", (input) => {
    expect(validateFoundationConfig(input)).toEqual({ status: "unconfigured" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("recognises only the intended Test target without connecting", () => {
    expect(
      validateFoundationConfig({
        deploymentEnvironment: "test",
        supabaseUrl: TEST_SUPABASE_URL,
      }),
    ).toEqual({
      status: "validated",
      deploymentEnvironment: "test",
      supabaseUrl: TEST_SUPABASE_URL,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    { deploymentEnvironment: "production", supabaseUrl: TEST_SUPABASE_URL },
    { deploymentEnvironment: "development", supabaseUrl: TEST_SUPABASE_URL },
    { deploymentEnvironment: "test", supabaseUrl: "https://synthetic-wrong-project.supabase.co" },
    { deploymentEnvironment: "test", supabaseUrl: "not-a-url" },
    { deploymentEnvironment: "test", supabaseUrl: TEST_SUPABASE_URL + ".example.invalid" },
    { deploymentEnvironment: "test", supabaseUrl: TEST_SUPABASE_URL + "/?token=synthetic" },
    { deploymentEnvironment: "test", supabaseUrl: TEST_SUPABASE_URL.replace("https:", "http:") },
    { deploymentEnvironment: "test", supabaseUrl: 42 },
    { deploymentEnvironment: "test", unexpected: true },
    { deploymentEnvironment: "production" },
    null,
    "test",
  ])("rejects malformed/wrong-target inputs without echoing values: %j", (input) => {
    expect(validateFoundationConfig(input)).toEqual({ status: "invalid" });
    expect(fetch).not.toHaveBeenCalled();
  });
});
