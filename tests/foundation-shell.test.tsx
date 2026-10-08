import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FoundationShell } from "@/components/foundation-shell";
import { TEST_SUPABASE_URL, validateFoundationConfig } from "@/lib/config";

describe("historical foundation shell", () => {
  it.each([
    [undefined, undefined, "Deployment configuration is missing."],
    ["test", "https://synthetic-wrong-project.supabase.co", "Deployment configuration is invalid."],
    ["production", TEST_SUPABASE_URL, "Deployment configuration is invalid."],
    ["test", TEST_SUPABASE_URL, "Target configuration is validated."],
  ])("keeps staff workflows absent for env=%s", (environment, url, message) => {
    const config = validateFoundationConfig({
      deploymentEnvironment: environment,
      supabaseUrl: url,
    });
    render(<FoundationShell config={config} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(environment === "test" && url === TEST_SUPABASE_URL ? "FairSwap Admin — TEST" : "FairSwap Admin — DISABLED");
    expect(screen.getByText("Foundation only. Staff workflows are not implemented.")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(message);
    expect(screen.getByRole("status")).toHaveTextContent("Staff workflows remain disabled.");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});
