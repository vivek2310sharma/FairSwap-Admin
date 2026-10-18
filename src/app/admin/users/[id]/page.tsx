import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { pageClient } from "@/lib/admin/server";
import { ChevronLeft, Shield, User, Package, AlertTriangle, FileText, Calendar, Mail, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import UserStatusForm from "../user-status-form";
import type { AdminUserSearchResult } from "../page";
import type { Database } from "@/types/database";
import { z } from "zod";
import { readAuthConfig } from "@/lib/auth/runtime-config";
import { reconcileListingCounts } from "@/lib/admin/support-user";

export const metadata: Metadata = {
  title: "User Details & Moderation — FairSwap Admin",
  description: "Inspect user profile, listings, safety reports, and manage moderation status.",
};

interface AdminUserDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; listing_status?: string }>;
}

export default async function AdminUserDetailPage({ params, searchParams }: AdminUserDetailPageProps) {
  const { id: targetUserId } = await params;
  if (!z.string().uuid().safeParse(targetUserId).success) notFound();
  const { tab = "listings", listing_status } = await searchParams;
  const supabase = await pageClient(["administrator","moderator"]);

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    redirect(`/auth/sign-in?next=/admin/users/${targetUserId}`);
  }

  // Verify caller staff role
  const { data: callerStaff } = await supabase
    .from("staff_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .single();

  if (!callerStaff || !["administrator", "moderator"].includes(callerStaff.role)) {
    redirect("/admin");
  }

  const config = readAuthConfig();
  const isProduction = config?.environment === "production";

  // Fetch target user via search RPC (authoritative for safe email extraction)
  const { data: rawTargetUsers, error: searchError } = await supabase.rpc("admin_search_users", {
    p_query: targetUserId,
    p_limit: 1,
    p_offset: 0,
  });

  const targetUsers = (rawTargetUsers as unknown as AdminUserSearchResult[]) || [];

  if (searchError || targetUsers.length === 0 || targetUsers[0].user_id !== targetUserId) {
    notFound();
  }

  const targetUser = targetUsers[0];
  const isSelf = targetUserId === userData.user.id;
  const isTargetStaff = !!targetUser.role;
  const isCallerModerator = callerStaff.role === "moderator";
  const canModerate = !isSelf && !(isCallerModerator && isTargetStaff);
  const blockReason = isSelf
    ? "Staff members cannot alter their own account status."
    : isCallerModerator && isTargetStaff
    ? "Moderators cannot modify staff accounts."
    : undefined;

  type ListingStatus = Database["public"]["Enums"]["listing_status_enum"];
  const validListingStatuses: ListingStatus[] = ["active", "pending_review", "sold", "rejected"];
  const listingStatusFilter = validListingStatuses.includes(listing_status as ListingStatus) ? (listing_status as ListingStatus) : undefined;

  // Tab 1: Fetch user listings
  let listingsQuery = supabase
    .from("listings")
    .select("id, title, slug, status, price_paise, created_at")
    .eq("seller_id", targetUserId);

  if (listingStatusFilter) {
    listingsQuery = listingsQuery.eq("status", listingStatusFilter);
  }

  const { data: listings } = await listingsQuery
    .order("created_at", { ascending: false })
    .limit(30);

  // Listing Status Counts
  const counts: Record<string, number | null> = {
    active: null,
    pending_review: null,
    sold: null,
    rejected: null,
  };

  let rlsVisibleTotal: number | null = null;

  try {
    const { count } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", targetUserId);
    rlsVisibleTotal = count;
  } catch {
    rlsVisibleTotal = null;
  }

  await Promise.all(
    validListingStatuses.map(async (st) => {
      try {
        const { count } = await supabase
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", targetUserId)
          .eq("status", st);
        counts[st] = count;
      } catch {
        counts[st] = null;
      }
    })
  );

  const exactCountsAvailable = Object.values(counts).every((c) => c !== null);

  // Reconcile with total listings
  const rpcTotalCount = targetUser.listings_count;

  const { isFullyReconciled, otherCount } = reconcileListingCounts(counts, rlsVisibleTotal, rpcTotalCount);

  // Tab 2: Fetch reports against this user
  const { data: reports } = await supabase
    .from("reports")
    .select("id, target_type, target_id, reason, details, status, created_at")
    .eq("target_id", targetUserId)
    .order("created_at", { ascending: false })
    .limit(30);

  // Tab 3: Fetch audit history (Administrator only)
  let auditLogs: Array<{
    id: string;
    action: string;
    actor_id: string;
    details: Record<string, unknown> | null;
    created_at: string;
  }> | null = null;

  if (callerStaff.role === "administrator") {
    const { data: rawLogs } = await supabase
      .from("audit_logs")
      .select("id, action, actor_id, details, created_at")
      .eq("target_entity", "user_accounts")
      .eq("target_id", targetUserId)
      .order("created_at", { ascending: false })
      .limit(30);

    auditLogs = (rawLogs || []).map((l) => ({
      ...l,
      details: (typeof l.details === "object" && l.details !== null) ? (l.details as Record<string, unknown>) : null,
    }));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header / Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-500 mb-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to User Management
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between min-w-0">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 min-w-0">
              <User className="h-7 w-7 text-emerald-600 shrink-0" />
              <span className="truncate break-words">{targetUser.display_name || "User Profile"}</span>
            </h1>
            <p className="mt-1 text-xs text-gray-500 font-mono break-all">{targetUser.user_id}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                targetUser.account_status === "active"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : targetUser.account_status === "suspended"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              Status: {targetUser.account_status.toUpperCase()}
            </span>
            {targetUser.role && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-200">
                <Shield className="h-3 w-3" />
                {targetUser.role}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: User Profile & Moderation Form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
        {/* Left 2 Cols: User Details */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Account Information</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div className="sm:col-span-1 min-w-0">
                <dt className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> Email Address
                </dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900 break-all">{targetUser.email}</dd>
              </div>
              <div className="sm:col-span-1 min-w-0">
                <dt className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> Display Name
                </dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900 break-words">
                  {targetUser.display_name || "—"}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Member Since
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(targetUser.created_at).toLocaleString()}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" /> Total Listings
                </dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900">{targetUser.listings_count}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">Listing Status Breakdown</h3>
            {isFullyReconciled ? (
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5 bg-gray-50 p-3 rounded-md border border-gray-100">
                <div className="flex flex-col">
                  <dt className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Active</dt>
                  <dd className="text-sm font-bold text-emerald-700">{counts.active}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Pending</dt>
                  <dd className="text-sm font-bold text-amber-700">{counts.pending_review}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Sold</dt>
                  <dd className="text-sm font-bold text-blue-700">{counts.sold}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Rejected</dt>
                  <dd className="text-sm font-bold text-red-700">{counts.rejected}</dd>
                </div>
                <div className="flex flex-col border-t sm:border-t-0 sm:border-l border-gray-200 pt-2 sm:pt-0 sm:pl-3">
                  <dt className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Other</dt>
                  <dd className="text-sm font-bold text-gray-600">{otherCount}</dd>
                </div>
              </dl>
            ) : exactCountsAvailable ? (
              <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600 border border-gray-100">
                <p className="flex items-start gap-1.5 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Four selected RLS-visible status counts are available, but full history accuracy cannot be confirmed:</span>
                </p>
                <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4 pl-5">
                  <div className="flex items-center gap-1"><dt className="text-[10px] font-semibold">ACTIVE:</dt><dd>{counts.active}</dd></div>
                  <div className="flex items-center gap-1"><dt className="text-[10px] font-semibold">PENDING:</dt><dd>{counts.pending_review}</dd></div>
                  <div className="flex items-center gap-1"><dt className="text-[10px] font-semibold">SOLD:</dt><dd>{counts.sold}</dd></div>
                  <div className="flex items-center gap-1"><dt className="text-[10px] font-semibold">REJECTED:</dt><dd>{counts.rejected}</dd></div>
                </dl>
              </div>
            ) : (
              <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600 border border-gray-100">
                <p className="flex items-start gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Exact server-side counts by status are currently unavailable. The `admin_search_users` RPC provides total count, but accurate backend-owned grouping counts require RLS-compatible read functions.</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Moderation Actions */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-1.5">
            <Shield className="h-5 w-5 text-emerald-600" /> Moderation Action
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Suspend or reinstate this marketplace account. Requires verified AAL2.
          </p>
          <UserStatusForm
            targetUserId={targetUser.user_id}
            currentStatus={targetUser.account_status}
            isSelf={isSelf}
            canModerate={canModerate}
            blockReason={blockReason}
            isProduction={isProduction}
          />
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <nav className="flex space-x-8 whitespace-nowrap min-w-max px-1">
          <Link
            href={`/admin/users/${targetUserId}?tab=listings`}
            className={`pb-4 px-1 text-sm font-medium border-b-2 flex items-center gap-2 ${
              tab === "listings"
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Package className="h-4 w-4" />
            Recent Listings ({listings?.length || 0})
          </Link>

          <Link
            href={`/admin/users/${targetUserId}?tab=reports`}
            className={`pb-4 px-1 text-sm font-medium border-b-2 flex items-center gap-2 ${
              tab === "reports"
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            Recent Safety Reports ({reports?.length || 0})
          </Link>

          <Link
            href={`/admin/users/${targetUserId}?tab=audit`}
            className={`pb-4 px-1 text-sm font-medium border-b-2 flex items-center gap-2 ${
              tab === "audit"
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FileText className="h-4 w-4" />
            Audit History {callerStaff.role !== "administrator" && "(Admin Only)"}
          </Link>
        </nav>
      </div>

      {/* Tab Content */}
      {tab === "listings" && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recent listings — up to 30</h3>

            <form method="get" className="flex items-center gap-2">
              <input type="hidden" name="tab" value="listings" />
              <label htmlFor="listing_status" className="sr-only">Filter by status</label>
              <select
                id="listing_status"
                name="listing_status"
                defaultValue={listingStatusFilter || "all"}
                className="text-xs border-gray-300 rounded-md py-1.5 pl-3 pr-8 focus:border-emerald-500 focus:ring-emerald-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending_review">Pending Review</option>
                <option value="sold">Sold</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                Apply
              </button>
            </form>
          </div>

          {(!listings || listings.length === 0) ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No listings found for this user with the current filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th scope="col" className="px-6 py-3">Listing</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Price</th>
                  <th scope="col" className="px-6 py-3">Created</th>
                  <th scope="col" className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {listings.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 min-w-[200px]">
                      {l.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                        {l.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {l.price_paise !== null ? `₹${(l.price_paise / 100).toFixed(2)}` : "Free"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {new Date(l.created_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Link
                        href={`/admin/listings/${l.id}`}
                        className="text-emerald-600 hover:text-emerald-500 font-medium inline-flex items-center gap-1"
                      >
                        Inspect <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {tab === "reports" && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {(!reports || reports.length === 0) ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No reports have been filed against this user.
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th scope="col" className="px-6 py-3">Report ID</th>
                  <th scope="col" className="px-6 py-3 min-w-[200px]">Reason</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Created</th>
                  <th scope="col" className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">
                      {r.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{r.reason}</div>
                      {r.details && <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{r.details}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {new Date(r.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Link
                        href={`/admin/reports/${r.id}`}
                        className="text-emerald-600 hover:text-emerald-500 font-medium inline-flex items-center gap-1"
                      >
                        Review <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {tab === "audit" && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden p-6">
          {callerStaff.role !== "administrator" ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800" role="alert">
              <span className="font-semibold">Access Restricted:</span> Immutable security audit logs can only be inspected by users with the Administrator role.
            </div>
          ) : (!auditLogs || auditLogs.length === 0) ? (
            <div className="text-center text-sm text-gray-500 py-6">
              No audit log entries recorded for this user account.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                  <tr>
                    <th scope="col" className="px-4 py-2">Timestamp</th>
                    <th scope="col" className="px-4 py-2">Action</th>
                    <th scope="col" className="px-4 py-2">Actor ID</th>
                    <th scope="col" className="px-4 py-2">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-gray-600">
                        {log.actor_id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700">
                        <pre className="max-w-md overflow-x-auto bg-gray-50 p-2 rounded text-[11px] font-mono">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
