import { AdminMutationForm } from "@/components/admin-mutation-form";
import { revokeStaffRoleAction } from "../actions";
import { pageClient } from "@/lib/admin/server";
import StaffForm from "./staff-form";

interface StaffRoleRecord {
  user_id: string;
  role: string;
  assigned_at: string;
  assigned_by: string | null;
}

export default async function AdminStaffPage() {
  const supabase = await pageClient(["administrator"]);

  const { data: staffList } = await supabase
    .from("staff_roles")
    .select("*")
    .order("assigned_at", { ascending: false })
    .returns<StaffRoleRecord[]>();

  // Resolve user details using admin_search_users for each staff member
  // Note: For a very large staff directory, this N+1 approach would need a backend batched lookup.
  // Since staff directories are typically small, we boundedly resolve what we can.
  const resolvedStaff = await Promise.all(
    (staffList || []).map(async (staff) => {
      try {
        const { data } = await supabase.rpc("admin_search_users", {
          p_query: staff.user_id,
          p_limit: 1,
          p_offset: 0,
        });
        const userDetails = data && data.length > 0 ? data[0] : null;
        return {
          ...staff,
          display_name: userDetails?.display_name as string | undefined,
          email: userDetails?.email as string | undefined,
        };
      } catch {
        return {
          ...staff,
          display_name: undefined,
          email: undefined,
        };
      }
    })
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Staff Role Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Assign, update, or revoke privileged staff roles. All actions require AAL2 MFA and are logged.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Assignment Form */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Assign / Update Role</h2>
          <StaffForm />
        </div>

        {/* Staff Table */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900">Current Staff Members</h2>
          {(!resolvedStaff || resolvedStaff.length === 0) ? (
            <p className="mt-4 text-sm text-gray-500">No staff members found.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead>
                  <tr className="text-xs font-semibold uppercase text-gray-500">
                    <th className="py-2">Staff Member</th>
                    <th className="py-2">Role & Access</th>
                    <th className="py-2">Assigned At</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resolvedStaff.map((staff) => (
                    <tr key={staff.user_id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-gray-900">
                          {staff.display_name || "Unnamed User"}
                        </div>
                        {staff.email && (
                          <div className="text-xs text-gray-500">{staff.email}</div>
                        )}
                        <div className="font-mono text-[10px] text-gray-400 mt-0.5 break-all">
                          {staff.user_id}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 capitalize">
                          {staff.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-xs text-gray-500">
                        {new Date(staff.assigned_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                      </td>
                      <td className="py-3 text-right">
                        <AdminMutationForm mutation={revokeStaffRoleAction} confirm="Revoke this staff role?">
                          <input type="hidden" name="targetUserId" value={staff.user_id} />
                          <button
                            type="submit"
                            className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            Revoke
                          </button>
                        </AdminMutationForm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
