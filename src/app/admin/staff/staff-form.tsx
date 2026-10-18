"use client";

import { useActionState, useState } from "react";
import { assignStaffRoleAction, type AdminActionResult } from "../actions";
import { StaffSearch } from "./staff-search";
import type { Database } from "@/types/database";

type UserResult = Database["public"]["Functions"]["admin_search_users"]["Returns"][0];

export default function StaffForm({ isProduction = false }: { isProduction?: boolean }) {
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("moderator");

  const [state, formAction, isPending] = useActionState<AdminActionResult | null, FormData>(
    assignStaffRoleAction,
    null
  );

  return (
    <div className="mt-4 space-y-6">
      {!selectedUser ? (
        <StaffSearch onSelect={setSelectedUser} />
      ) : (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-emerald-900">Selected User</h3>
            <button
              onClick={() => setSelectedUser(null)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            >
              Change
            </button>
          </div>
          <div className="mt-2 text-sm text-emerald-800">
            <p className="font-medium">{selectedUser.display_name || "Unnamed User"}</p>
            <p className="text-xs opacity-80">{selectedUser.email}</p>
            <p className="text-xs font-mono mt-1 opacity-70">{selectedUser.user_id}</p>
            {selectedUser.role && (
              <p className="text-xs mt-1">
                Current Role: <span className="font-semibold">{selectedUser.role}</span>
              </p>
            )}
          </div>
        </div>
      )}

      <form
        action={formAction}
        onSubmit={(event) => {
          if (!selectedUser || isPending || !window.confirm(`Confirm assigning role ${selectedRole} to ${selectedUser.display_name || selectedUser.user_id}?`)) {
            event.preventDefault();
          }
        }}
        className="space-y-4"
      >
        {state?.error && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {state.error}
          </div>
        )}

        {state?.success && (
          <div role="alert" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {state.message}
          </div>
        )}

        <input type="hidden" name="targetUserId" value={selectedUser?.user_id || ""} />

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Staff Role
          </label>
          <select
            id="role"
            name="role"
            required
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            disabled={!selectedUser}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
          >
            <option value="moderator">Moderator</option>
            <option value="support_agent">Support Agent</option>
            <option value="content_editor">Content Editor</option>
            <option value="administrator">Administrator</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={!selectedUser || isPending || isProduction}
          className="w-full rounded-md bg-emerald-600 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Assigning..." : "Assign Staff Role"}
        </button>
      </form>

      {isProduction && (
          <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 mt-4">
            <strong>Note:</strong> Production staff role assignment and revocation are currently disabled by backend policy. This interface operates in Test environments only.
          </p>
      )}
    </div>
  );
}
