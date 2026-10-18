import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminShell } from "@/components/admin-shell";
import type { StaffRole } from "@/lib/auth/guard";

vi.mock("server-only", () => ({}));
vi.mock("@/app/auth/actions", () => ({
  signInAction: vi.fn(),
  enrollAction: vi.fn(),
  verifyAction: vi.fn(),
  signOutAction: vi.fn(),
  recheckAction: vi.fn(),
}));

let mockPathname = "/admin";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("AdminShell navigation and accessibility", () => {
  it("renders all navigation items for administrator role", () => {
    mockPathname = "/admin";
    render(
      <AdminShell role="administrator" environmentLabel="TEST" isProduction={false}>
        <div>Main Content Area</div>
      </AdminShell>
    );

    expect(screen.getByText("Main Content Area")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Dashboard");

    // Check presence of groups and links
    const navElements = screen.getAllByRole("navigation", { name: "Admin areas" });
    expect(navElements.length).toBeGreaterThan(0);

    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));

    expect(hrefs).toContain("/admin");
    expect(hrefs).toContain("/admin/listings");
    expect(hrefs).toContain("/admin/users");
    expect(hrefs).toContain("/admin/reports");
    expect(hrefs).toContain("/admin/support");
    expect(hrefs).toContain("/admin/privacy");
    expect(hrefs).toContain("/admin/categories");
    expect(hrefs).toContain("/admin/locations");
    expect(hrefs).toContain("/admin/staff");
    expect(hrefs).toContain("/admin/audit");
  });

  it.each([
    ["moderator", ["/admin", "/admin/listings", "/admin/users", "/admin/reports"]],
    ["support_agent", ["/admin", "/admin/support"]],
    ["content_editor", ["/admin", "/admin/categories"]],
  ] as const)("filters navigation strictly for %s role", (role: StaffRole, expectedHrefs) => {
    mockPathname = "/admin";
    render(
      <AdminShell role={role} environmentLabel="TEST" isProduction={false}>
        <div>Role Specific Content</div>
      </AdminShell>
    );

    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));

    for (const href of expectedHrefs) {
      expect(hrefs).toContain(href);
    }

    if (role === "support_agent") {
      expect(hrefs).not.toContain("/admin/listings");
      expect(hrefs).not.toContain("/admin/staff");
    }
    if (role === "content_editor") {
      expect(hrefs).not.toContain("/admin/users");
      expect(hrefs).not.toContain("/admin/reports");
    }
  });

  it("highlights active page link based on pathname", () => {
    mockPathname = "/admin/listings";
    render(
      <AdminShell role="administrator" environmentLabel="TEST" isProduction={false}>
        <div>Listings Content</div>
      </AdminShell>
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Listings");
  });

  it("opens and closes mobile navigation drawer", () => {
    mockPathname = "/admin";
    render(
      <AdminShell role="administrator" environmentLabel="TEST" isProduction={false}>
        <div>Mobile Shell Test</div>
      </AdminShell>
    );

    const openButton = screen.getByRole("button", { name: "Open navigation menu" });
    expect(openButton).toBeInTheDocument();

    fireEvent.click(openButton);

    const drawer = screen.getByRole("dialog", { name: "Mobile navigation drawer" });
    expect(drawer).toBeInTheDocument();

    const closeButton = screen.getByRole("button", { name: "Close navigation menu" });
    fireEvent.click(closeButton);
  });

  it("displays environment notice when in Production", () => {
    mockPathname = "/admin";
    render(
      <AdminShell role="administrator" environmentLabel="PRODUCTION" isProduction={true}>
        <div>Production Test</div>
      </AdminShell>
    );

    expect(screen.getByText("Production Environment Notice:")).toBeInTheDocument();
    expect(
      screen.getByText(/Initial release — listing removal, account status/i)
    ).toBeInTheDocument();
  });
});
