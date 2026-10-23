import { redirect } from "next/navigation";
import Link from "next/link";
import { pageClient } from "@/lib/admin/server";
import { LifeBuoy, Clock, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import type { Metadata } from "next";
import {
  describeTicketCustomer,
  formatSupportTicketReference,
} from "@/lib/admin/support-ticket-display";

export const metadata: Metadata = {
  title: "Support Tickets — FairSwap Admin",
  description: "Customer service inquiries and appeals management queue.",
};

type TicketRow = {
  id: string;
  user_id: string | null;
  category: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
};

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: requestedStatus = "open" } = await searchParams;
  const status = (["open", "in_progress", "awaiting_user", "resolved", "closed", "all"] as const).find((value) => value === requestedStatus) ?? "open";
  const supabase = await pageClient(["administrator","support_agent"]);

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    redirect("/auth/sign-in?next=/admin/support");
  }

  // Verify staff role
  const { data: staffData } = await supabase
    .from("staff_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .single();

  if (!staffData || !["administrator", "support_agent"].includes(staffData.role)) {
    redirect("/admin");
  }

  // Only columns that exist on public.support_tickets. A failed read is shown as a failure, never
  // as an empty queue (pageClient throws on query errors; a returned error is handled as well).
  let tickets: TicketRow[] | null = null;
  try {
    let query = supabase
      .from("support_tickets")
      .select("id, user_id, category, subject, status, priority, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    tickets = error || !data ? null : (data as TicketRow[]);
  } catch {
    tickets = null;
  }
  const queueFailed = tickets === null;

  // Customer names are a convenience: if they cannot be read the queue still works.
  const profilesMap: Record<string, { display_name: string }> = {};
  const userIds = Array.from(
    new Set((tickets ?? []).map((t) => t.user_id).filter((id): id is string => id !== null))
  );
  if (userIds.length > 0) {
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);
      (profiles || []).forEach((p) => {
        profilesMap[p.id] = p;
      });
    } catch {
      // Falls back to "Customer unavailable" per row.
    }
  }

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "open":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
            <Clock className="h-3 w-3" />
            Open
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
            <Clock className="h-3 w-3" />
            In Progress
          </span>
        );
      case "awaiting_user":
      case "waiting_customer":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
            <AlertCircle className="h-3 w-3" />
            Waiting User
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-3 w-3" />
            Resolved
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (pr: string) => {
    switch (pr) {
      case "urgent":
        return (
          <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700 uppercase">
            Urgent
          </span>
        );
      case "high":
        return (
          <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 uppercase">
            High
          </span>
        );
      case "low":
        return (
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 uppercase">
            Low
          </span>
        );
      default:
        return (
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 uppercase">
            Normal
          </span>
        );
    }
  };

  const tabs = [
    { label: "Open", value: "open" },
    { label: "In Progress", value: "in_progress" },
    { label: "Waiting User", value: "awaiting_user" },
    { label: "Resolved", value: "resolved" },
    { label: "All", value: "all" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support & Appeals Queue</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage customer inquiries, disputes, and account moderation appeals.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={`/admin/support?status=${t.value}`}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              status === t.value
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {queueFailed ? (
          <div role="alert" className="p-12 text-center text-gray-700">
            <AlertCircle className="mx-auto h-12 w-12 text-rose-400" />
            <p className="mt-4 font-semibold text-gray-900">The support queue could not be loaded</p>
            <p className="text-sm">
              This is a read failure, not an empty queue. Refresh the page or contact the backend owner.
            </p>
          </div>
        ) : tickets && tickets.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-3">Reference</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Subject / Category</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Last Updated</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {tickets.map((t) => {
                const customer = describeTicketCustomer(
                  t.user_id,
                  t.user_id ? profilesMap[t.user_id]?.display_name : null
                );
                return (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs font-bold text-emerald-700">
                      #{formatSupportTicketReference(t.id)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-gray-600">
                      <div className="font-semibold text-gray-900">{customer}</div>
                      <div className="font-mono text-gray-400">{t.user_id ? `${t.user_id.slice(0, 8)}...` : "Deleted user"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 line-clamp-1">{t.subject}</div>
                      <span className="mt-0.5 inline-block text-xs uppercase font-medium text-gray-400">
                        {t.category.replace("_", " ")}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">{getPriorityBadge(t.priority)}</td>
                    <td className="whitespace-nowrap px-6 py-4">{getStatusBadge(t.status)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-gray-500">
                      {new Date(t.updated_at).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Link
                        href={`/admin/support/${t.id}`}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Handle &rarr;
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <LifeBuoy className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 font-medium text-gray-800">No {status} tickets found</p>
            <p className="text-sm">Inquiries matching this filter will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
