import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import AdminAuditPage from "@/app/admin/audit/page";
import { pageClient } from "@/lib/admin/server";

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

  test("Redacts free text even if key is allowed", async () => {
     // Mocking an audit log with an allowed key containing a potentially unsafe string
     vi.mocked(pageClient).mockResolvedValueOnce({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            range: vi.fn().mockReturnValue({
              returns: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "2",
                    actor_id: "00000000-0000-0000-0000-000000000001",
                    action: "update_user_status",
                    target_entity: "users",
                    target_id: "user-1",
                    details: { new_status: "Free form upi@icici or secret text", role: "moderator" },
                    created_at: "2026-10-18T10:00:00Z",
                  },
                ],
                count: 1,
              }),
            }),
          }),
        }),
      }),
      rpc: vi.fn().mockResolvedValue({ data: [] }),
    } as unknown as ReturnType<typeof pageClient> extends Promise<infer U> ? U : never);

    const Component = await AdminAuditPage({ searchParams: Promise.resolve({}) });
    render(Component);

    // Assert that the 'moderator' safe enum string is kept
    expect(screen.getByText(/"moderator"/)).toBeDefined();

    // Assert the free form text is redacted completely despite being an 'allowed' key
    const jsonOutput = screen.getByText(/\*\*\*REDACTED\*\*\*/);
    expect(jsonOutput).toBeDefined();
    expect(jsonOutput.textContent).not.toContain("upi@icici");
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

  test("Maps valid IST dates precisely to UTC bounds", async () => {
      // Create fresh spies directly to inspect the actual generated query
      const gteSpy = vi.fn().mockReturnThis();
      const ltSpy = vi.fn().mockReturnThis();
      const returnsSpy = vi.fn().mockResolvedValue({ data: [], count: 0 });
      const rangeSpy = vi.fn().mockReturnValue({ returns: returnsSpy });
      const orderSpy = vi.fn().mockReturnValue({
          gte: gteSpy,
          lt: ltSpy,
          range: rangeSpy
      });
      const selectSpy = vi.fn().mockReturnValue({ order: orderSpy });
      const fromSpy = vi.fn().mockReturnValue({ select: selectSpy });

      vi.mocked(pageClient).mockResolvedValueOnce({
          from: fromSpy,
          rpc: vi.fn().mockResolvedValue({ data: [] }),
      } as unknown as ReturnType<typeof pageClient> extends Promise<infer U> ? U : never);

      // Use 2026-10-18.
      // Expected fromUTC: 2026-10-17T18:30:00.000Z
      // Expected toUTC: 2026-10-18T18:30:00.000Z
      const Component = await AdminAuditPage({ searchParams: Promise.resolve({ from_date: "2026-10-18", to_date: "2026-10-18" }) });
      render(Component);

      expect(gteSpy).toHaveBeenCalledWith("created_at", "2026-10-17T18:30:00.000Z");
      expect(ltSpy).toHaveBeenCalledWith("created_at", "2026-10-18T18:30:00.000Z");
  });
});
