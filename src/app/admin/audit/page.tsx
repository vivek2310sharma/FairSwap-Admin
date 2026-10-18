import { pageClient } from "@/lib/admin/server";
import { z } from "zod";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AuditLogRecord {
  id: string;
  actor_id: string;
  action: string;
  target_entity: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

const auditParamsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  action: z.string().trim().optional(),
  target_entity: z.string().trim().optional(),
  actor_id: z.string().uuid().optional().or(z.literal('')),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid from date format").optional().or(z.literal('')),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid to date format").optional().or(z.literal('')),
}).refine(data => {
    if (data.from_date && data.to_date) {
        return new Date(data.from_date) <= new Date(data.to_date);
    }
    return true;
}, { message: "From Date must be before or equal to To Date", path: ["from_date"] });

const SENSITIVE_KEYS = ["token", "password", "upi", "api_key", "secret", "recovery", "session", "mfa"];

function redactDetails(details: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!details || typeof details !== "object") return {};
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive))) {
      redacted[key] = "***REDACTED***";
    } else if (typeof value === "object" && value !== null) {
      redacted[key] = redactDetails(value as Record<string, unknown>);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const supabase = await pageClient(["administrator"]);
  const parsedParams = auditParamsSchema.safeParse(await searchParams);

  const dateError = !parsedParams.success ? parsedParams.error.errors.find(e => e.path.includes("from_date") || e.path.includes("to_date"))?.message : null;
  const safeData = parsedParams.success ? parsedParams.data : {
      page: 1, action: "", target_entity: "", actor_id: "", from_date: "", to_date: ""
  };

  const { page, action, target_entity, actor_id, from_date, to_date } = safeData;
  const pageSize = 50;

  let query = supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (parsedParams.success) {
    if (action && action !== "all") {
      query = query.eq("action", action);
    }
    if (target_entity && target_entity !== "all") {
      query = query.eq("target_entity", target_entity);
    }
    if (actor_id) {
      query = query.eq("actor_id", actor_id);
    }
    if (from_date) {
      // Interpret as IST midnight
      const fromUTC = new Date(`${from_date}T00:00:00+05:30`).toISOString();
      query = query.gte("created_at", fromUTC);
    }
    if (to_date) {
      // Interpret as strictly before the *next* day's IST midnight
      const nextDay = new Date(new Date(`${to_date}T00:00:00+05:30`).getTime() + 24 * 60 * 60 * 1000);
      query = query.lt("created_at", nextDay.toISOString());
    }
  }

  const { data: auditLogs, error, count } = await query
    .range((page - 1) * pageSize, page * pageSize - 1)
    .returns<AuditLogRecord[]>();

  const totalRecords = count || 0;
  const hasNextPage = totalRecords > page * pageSize;

  // Attempt to resolve actor identities safely
  const resolvedLogs = await Promise.all(
    (auditLogs || []).map(async (log) => {
      try {
        const { data } = await supabase.rpc("admin_search_users", {
          p_query: log.actor_id,
          p_limit: 1,
          p_offset: 0,
        });
        const actorName = data && data.length > 0 ? data[0].display_name : null;
        return { ...log, actor_name: actorName };
      } catch {
        return { ...log, actor_name: null };
      }
    })
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Audit Trail</h1>
        <p className="mt-1 text-sm text-gray-600">
          Append-only immutable record of privileged operations and state mutations.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <form method="get" className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="actor_id" className="block text-xs font-semibold text-gray-700 mb-1">Actor UUID</label>
            <input
              id="actor_id"
              type="text"
              name="actor_id"
              defaultValue={actor_id}
              placeholder="00000000-0000-0000-0000-000000000000"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div className="w-full sm:w-48">
            <label htmlFor="action" className="block text-xs font-semibold text-gray-700 mb-1">Action Type</label>
            <select
              id="action"
              name="action"
              defaultValue={action || "all"}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Actions</option>
              <option value="moderate_listing">Moderate Listing</option>
              <option value="assign_role">Assign Role</option>
              <option value="revoke_role">Revoke Role</option>
              <option value="update_user_status">Update User Status</option>
              <option value="manage_category">Manage Category</option>
              <option value="manage_location">Manage Location</option>
            </select>
          </div>

          <div className="w-full sm:w-48">
             <label htmlFor="target_entity" className="block text-xs font-semibold text-gray-700 mb-1">Target Entity</label>
             <input
              id="target_entity"
              type="text"
              name="target_entity"
              defaultValue={target_entity || ""}
              placeholder="e.g. listings, users"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="w-full sm:w-40">
             <label htmlFor="from_date" className="block text-xs font-semibold text-gray-700 mb-1">From Date (IST)</label>
             <input
              id="from_date"
              type="date"
              name="from_date"
              defaultValue={from_date || ""}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="w-full sm:w-40">
             <label htmlFor="to_date" className="block text-xs font-semibold text-gray-700 mb-1">To Date (IST)</label>
             <input
              id="to_date"
              type="date"
              name="to_date"
              defaultValue={to_date || ""}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              Apply Filters
            </button>
            {(action || target_entity || actor_id || from_date || to_date) && (
              <Link
                href="/admin/audit"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center"
              >
                Clear Filters
              </Link>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {dateError ? (
            <div role="alert" className="m-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                {dateError}
            </div>
        ) : error ? (
          <div role="alert" className="m-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {"The backend could not complete this read."}
          </div>
        ) : (!parsedParams.success) ? (
            <div role="alert" className="m-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                Invalid search parameters.
            </div>
        ) : (!resolvedLogs || resolvedLogs.length === 0) ? (
          <p className="m-6 text-sm text-gray-500">No audit log entries found matching these criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50">
                <tr className="text-xs font-semibold uppercase text-gray-500">
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Actor</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Target</th>
                  <th className="px-6 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resolvedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">
                        {log.actor_name || "Unknown"}
                      </div>
                      <div className="font-mono text-[10px] text-gray-500 break-all w-32">
                        {log.actor_id}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex rounded bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-700">
                      <div className="font-semibold">{log.target_entity}</div>
                      {log.target_id && (
                        <div className="font-mono text-[10px] text-gray-500 break-all w-32">
                          {log.target_id}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">
                      <details>
                        <summary className="cursor-pointer text-emerald-600 hover:text-emerald-700 text-xs select-none">
                          View details
                        </summary>
                        <pre className="mt-2 max-w-xs overflow-x-auto bg-gray-50 p-2 rounded text-[10px] border border-gray-100">
                          {JSON.stringify(redactDetails(log.details), null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {parsedParams.success && !error && (
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3 bg-gray-50">
              <div className="text-sm text-gray-500">
                Page {page}
              </div>
              <div className="flex items-center space-x-2">
                {page > 1 ? (
                  <Link
                    href={`/admin/audit?page=${page - 1}&action=${encodeURIComponent(action || "all")}&target_entity=${encodeURIComponent(target_entity || "")}&actor_id=${encodeURIComponent(actor_id || "")}&from_date=${encodeURIComponent(from_date || "")}&to_date=${encodeURIComponent(to_date || "")}`}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-400 cursor-not-allowed">
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </span>
                )}

                {hasNextPage ? (
                  <Link
                    href={`/admin/audit?page=${page + 1}&action=${encodeURIComponent(action || "all")}&target_entity=${encodeURIComponent(target_entity || "")}&actor_id=${encodeURIComponent(actor_id || "")}&from_date=${encodeURIComponent(from_date || "")}&to_date=${encodeURIComponent(to_date || "")}`}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-400 cursor-not-allowed">
                    <ChevronLeft className="h-4 w-4" /> Next
                  </span>
                )}
              </div>
            </div>
        )}
      </div>
    </div>
  );
}
