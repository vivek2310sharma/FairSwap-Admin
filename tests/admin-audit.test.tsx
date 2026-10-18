import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import AdminAuditPage from "@/app/admin/audit/page";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/admin/server", () => {
  return {
    pageClient: vi.fn().mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            range: vi.fn().mockReturnValue({
              returns: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "1",
                    actor_id: "00000000-0000-0000-0000-000000000001",
                    action: "moderate_listing",
                    target_entity: "listings",
                    target_id: "listing-1",
                    details: { note: "Approved", secret_token: "12345" },
                    created_at: "2026-10-18T10:00:00Z",
                  },
                ],
                count: 1,
              }),
            }),
          }),
        }),
      }),
      rpc: vi.fn().mockResolvedValue({
        data: [{ display_name: "Admin User", email: "admin@example.com" }],
      }),
    }),
  };
});

describe("Audit Trail UX", () => {
  test("Renders audit trail page and redacts sensitive data", async () => {
    const Component = await AdminAuditPage({ searchParams: Promise.resolve({}) });
    render(Component);

    // Verify Title
    expect(screen.getByText("Security Audit Trail")).toBeDefined();

    // Verify actor name was resolved
    expect(await screen.findByText("Admin User")).toBeDefined();

    // Verify details are present and filtered by allowlist
    const jsonOutput = screen.getByText(/Sensitive details unavailable/);
    expect(jsonOutput).toBeDefined();
  });

  test("Rejects reversed date ranges", async () => {
      const Component = await AdminAuditPage({ searchParams: Promise.resolve({ from_date: "2026-10-20", to_date: "2026-10-18" }) });
      render(Component);

      expect(screen.getByText("From Date must be before or equal to To Date")).toBeDefined();
  });

  test("Rejects invalid date formats and non-existent dates", async () => {
      const Component1 = await AdminAuditPage({ searchParams: Promise.resolve({ from_date: "invalid-date" }) });
      render(Component1);
      expect(screen.getByText("Invalid from date format")).toBeDefined();

      const Component2 = await AdminAuditPage({ searchParams: Promise.resolve({ from_date: "2026-02-31" }) });
      render(Component2);
      expect(screen.getByText("Invalid calendar date")).toBeDefined();
  });
});
