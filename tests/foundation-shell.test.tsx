import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";
import { TEST_SUPABASE_URL } from "@/lib/config";

describe("foundation page", () => {
  it.each([
    [undefined, undefined, "Test configuration is missing."],
    ["test", "https://synthetic-wrong-project.supabase.co", "Test configuration is invalid."],
    ["production", TEST_SUPABASE_URL, "Test configuration is invalid."],
    ["test", TEST_SUPABASE_URL, "Test target configuration is validated."],
  ])("keeps staff workflows absent for env=%s", (environment, url, message) => {
    vi.stubEnv("FAIRSWAP_DEPLOYMENT_ENV", environment);
    vi.stubEnv("FAIRSWAP_SUPABASE_URL", url);
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("FairSwap Admin — TEST");
    expect(screen.getByText("Foundation only. Staff workflows are not implemented.")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(message);
    expect(screen.getByRole("status")).toHaveTextContent("Staff workflows remain disabled.");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});
