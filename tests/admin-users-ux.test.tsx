import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("server-only", () => ({}));

import UserStatusForm from "../src/app/admin/users/user-status-form";
import { reconcileListingCounts } from "../src/lib/admin/support-user";

vi.mock("react", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react")>();
  return {
    ...mod,
    useActionState: vi.fn(() => [{ error: null, success: null, message: null }, vi.fn(), false]),
  };
});

describe("User Management Phase 2A UX Tests", () => {
  describe("UserStatusForm", () => {
    it("renders a disabled/unsupported state when in production", () => {
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

  describe("Listing Count Reconciliation", () => {
    it("returns fully reconciled state when RLS visible count matches RPC total and sum is less than total", () => {
      const counts = { active: 2, pending_review: 1, sold: 1, rejected: 0 };
      const rlsVisibleTotal = 5;
      const rpcTotalCount = 5;

      const result = reconcileListingCounts(counts, rlsVisibleTotal, rpcTotalCount);
      expect(result.isFullyReconciled).toBe(true);
      expect(result.otherCount).toBe(1);
    });

    it("returns fully reconciled with 0 other when exact match", () => {
      const counts = { active: 2, pending_review: 1, sold: 1, rejected: 1 };
      const rlsVisibleTotal = 5;
      const rpcTotalCount = 5;

      const result = reconcileListingCounts(counts, rlsVisibleTotal, rpcTotalCount);
      expect(result.isFullyReconciled).toBe(true);
      expect(result.otherCount).toBe(0);
    });

    it("is not fully reconciled if RLS visible count mismatches RPC total", () => {
      const counts = { active: 2, pending_review: 1, sold: 1, rejected: 0 };
      const rlsVisibleTotal = 4;
      const rpcTotalCount = 5;

      const result = reconcileListingCounts(counts, rlsVisibleTotal, rpcTotalCount);
      expect(result.isFullyReconciled).toBe(false);
      expect(result.otherCount).toBe(null);
    });

    it("is not fully reconciled if any count is null", () => {
      const counts = { active: 2, pending_review: null, sold: 1, rejected: 0 };
      const rlsVisibleTotal = 5;
      const rpcTotalCount = 5;

      const result = reconcileListingCounts(counts, rlsVisibleTotal, rpcTotalCount);
      expect(result.isFullyReconciled).toBe(false);
      expect(result.otherCount).toBe(null);
    });

    it("is not fully reconciled if sum exceeds rls visible total", () => {
      const counts = { active: 3, pending_review: 1, sold: 1, rejected: 1 };
      const rlsVisibleTotal = 5;
      const rpcTotalCount = 5;

      const result = reconcileListingCounts(counts, rlsVisibleTotal, rpcTotalCount);
      expect(result.isFullyReconciled).toBe(false);
      expect(result.otherCount).toBe(null);
    });

    it("is not fully reconciled if rls visible total is null", () => {
      const counts = { active: 3, pending_review: 1, sold: 1, rejected: 1 };
      const rlsVisibleTotal = null;
      const rpcTotalCount = 5;

      const result = reconcileListingCounts(counts, rlsVisibleTotal, rpcTotalCount);
      expect(result.isFullyReconciled).toBe(false);
      expect(result.otherCount).toBe(null);
    });
  });
});
