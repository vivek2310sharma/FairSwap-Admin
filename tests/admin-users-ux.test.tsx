import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("server-only", () => ({}));

import UserStatusForm from "../src/app/admin/users/user-status-form";

vi.mock("react", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react")>();
  return {
    ...mod,
    useActionState: vi.fn(() => [{ error: null, success: null, message: null }, vi.fn(), false]),
  };
});

describe("User Management Phase 2A UX Tests", () => {
  it("renders a disabled/unsupported state for UserStatusForm when in production", () => {
    render(
      <UserStatusForm
        targetUserId="test-id"
        currentStatus="active"
        isSelf={false}
        canModerate={true}
        isProduction={true}
      />
    );
    expect(screen.getByText(/User status mutation is not supported in the Production environment/i)).toBeDefined();
    expect(screen.queryByText(/Confirm Account Suspension/i)).toBeNull();
  });

  it("renders the action form correctly when not in production", () => {
    render(
      <UserStatusForm
        targetUserId="test-id"
        currentStatus="active"
        isSelf={false}
        canModerate={true}
        isProduction={false}
      />
    );
    expect(screen.queryByText(/User status mutation is not supported/i)).toBeNull();
    expect(screen.getByText(/Suspend Account/i)).toBeDefined();
  });
});
