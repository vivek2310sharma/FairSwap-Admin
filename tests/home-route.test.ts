import { describe, expect, it, vi } from "vitest";
import Home, { dynamic } from "@/app/page";

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((destination: string): never => {
    throw new Error(`TEST_REDIRECT:${destination}`);
  }),
}));

vi.mock("next/navigation", () => ({ redirect }));

describe("Admin home entry", () => {
  it("redirects to the existing guarded Admin route instead of rendering the foundation shell", () => {
    redirect.mockClear();

    expect(() => Home()).toThrow("TEST_REDIRECT:/admin");
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/admin");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps the entry route dynamic", () => {
    expect(dynamic).toBe("force-dynamic");
  });
});
