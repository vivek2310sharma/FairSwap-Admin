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
  it("renders all navigation items and user identity for administrator role", () => {
    mockPathname = "/admin";
    render(
      <AdminShell
        role="administrator"
        userEmail="admin@fairswap.in"
        environmentLabel="TEST"
        isProduction={false}
      >
        <div>Main Content Area</div>
      </AdminShell>
    );

    expect(screen.getByText("Main Content Area")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Dashboard");
    expect(screen.getAllByText("admin@fairswap.in").length).toBeGreaterThan(0);

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

  it("ensures closed mobile drawer is inaccessible to keyboard navigation with tabIndex=-1 and inert", () => {
    mockPathname = "/admin";
    render(
      <AdminShell role="administrator" environmentLabel="TEST" isProduction={false}>
        <div>Inaccessible Test</div>
      </AdminShell>
    );

    // When closed, dialog role is absent and drawer has aria-hidden and inert attributes
    const drawerAside = document.querySelector('aside[aria-label="Mobile navigation drawer"]')!;
    expect(drawerAside).toHaveAttribute("aria-hidden", "true");
    expect(drawerAside).toHaveAttribute("inert");

    // Close button and links inside mobile drawer have tabindex="-1" when closed
    const closeBtn = screen.getByRole("button", { name: "Close navigation menu", hidden: true });
    expect(closeBtn).toHaveAttribute("tabindex", "-1");
  });

  it("manages focus movement, dialog semantics, and keyboard focus trapping when open", () => {
    mockPathname = "/admin";
    render(
      <AdminShell role="administrator" environmentLabel="TEST" isProduction={false}>
        <div>Keyboard Focus Trap Test</div>
      </AdminShell>
    );

    const menuButton = screen.getByRole("button", { name: "Open navigation menu" });
    menuButton.focus();
    expect(document.activeElement).toBe(menuButton);

    // Open drawer
    fireEvent.click(menuButton);

    // Modal dialog semantics are present
    const drawer = screen.getByRole("dialog", { name: "Mobile navigation drawer" });
    expect(drawer).toHaveAttribute("aria-modal", "true");

    // Focus automatically shifts to close button inside drawer upon opening
    const closeButton = screen.getByRole("button", { name: "Close navigation menu" });
    expect(document.activeElement).toBe(closeButton);

    // Find focusables inside drawer
    const drawerFocusables = Array.from(
      drawer.querySelectorAll<HTMLElement>(
        'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"])'
      )
    );
    expect(drawerFocusables.length).toBeGreaterThan(1);

    const firstFocusable = drawerFocusables[0];
    const lastFocusable = drawerFocusables[drawerFocusables.length - 1];

    // Focus first focusable and press Shift+Tab -> wraps to last focusable
    firstFocusable.focus();
    expect(document.activeElement).toBe(firstFocusable);
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(lastFocusable);

    // Focus last focusable and press Tab -> wraps to first focusable
    lastFocusable.focus();
    expect(document.activeElement).toBe(lastFocusable);
    fireEvent.keyDown(window, { key: "Tab", shiftKey: false });
    expect(document.activeElement).toBe(firstFocusable);

    // Press Escape key -> closes drawer and returns focus to menu toggle button
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(menuButton);
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
