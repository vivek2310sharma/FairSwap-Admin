import "server-only";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requestClient } from "@/lib/supabase/server";
import { staffAccess } from "@/lib/auth/guard";
import {
  AnalyticsRangeSchema,
  ModerationAnalyticsPayloadSchema,
  type AnalyticsRange,
  type ModerationAnalyticsPayload,
} from "@/lib/admin/moderation-analytics";
import {
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  FileText,
  Image as ImageIcon,
} from "lucide-react";

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

const CHECK_DISPLAY_NAMES: Record<string, string> = {
  check_india_fraud_rules: "India Fraud Rules",
  check_openai_moderation: "OpenAI Moderation",
  check_vision_nsfw: "Vision NSFW",
  check_vision_category: "Vision Category",
  check_ocr_qr: "OCR & QR Scanner",
};

const RANGE_LABELS: Record<AnalyticsRange, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
};

function formatISTDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return isoString;
  }
}

export default async function AdminModerationAnalyticsPage({ searchParams }: PageProps) {
  const { range: rawRange } = await searchParams;
  const parsedRange = AnalyticsRangeSchema.safeParse(rawRange ?? "today");
  const selectedRange: AnalyticsRange = parsedRange.success ? parsedRange.data : "today";

  // Enforce administrator-only authorization with AAL2 via standard staffAccess
  const client = await requestClient();
  if (!client) throw new Error("Configuration unavailable.");

  const access = await staffAccess(client, true, ["administrator"]);
  if (!access.allowed) {
    if (access.reason === "sign-in") redirect("/auth/sign-in?next=/admin/moderation/analytics");
    if (access.reason === "mfa") redirect("/auth/mfa");
    if (access.reason === "denied") redirect("/admin?denied=1");
    redirect("/admin");
  }

  // Invoke RPC directly on the authenticated client without checkedQuery swallowing the specific missing-function code
  const { data: rpcResult, error: rpcError } = await (client.rpc as unknown as (
    fn: string,
    args?: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message?: string; code?: string } | null }>)(
    "get_admin_moderation_analytics",
    { filter_range: selectedRange }
  );

  let analytics: ModerationAnalyticsPayload | null = null;
  let backendUnmigrated = false;

  if (rpcError) {
    // Discriminate between missing migration (exact function-not-found codes PGRST202 or 42883) and real runtime failures
    const isMissingFunction = rpcError.code === "PGRST202" || rpcError.code === "42883";

    if (isMissingFunction) {
      backendUnmigrated = true;
    } else {
      throw new Error("Data unavailable. Refresh or contact the backend owner.");
    }
  } else {
    const parsedPayload = ModerationAnalyticsPayloadSchema.safeParse(rpcResult);
    if (!parsedPayload.success) {
      throw new Error("Data unavailable. Refresh or contact the backend owner.");
    }
    analytics = parsedPayload.data;
  }

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            Moderation Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative automated evaluation metrics & audit history (IST, Asia/Kolkata).
          </p>
        </div>

        {/* Range Filter */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {(["today", "yesterday", "7d", "30d"] as const).map((r) => {
            const active = selectedRange === r;
            return (
              <Link
                key={r}
                href={`/admin/moderation/analytics?range=${r}`}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  active
                    ? "bg-white text-emerald-700 shadow-xs border border-slate-200/60 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                {RANGE_LABELS[r]}
              </Link>
            );
          })}
        </div>
      </div>

      {backendUnmigrated ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900 space-y-2">
          <h3 className="font-semibold text-sm">RPC Function Pending Backend Migration</h3>
          <p className="text-xs leading-relaxed">
            The authoritative stored procedure <code>app_security.get_admin_moderation_analytics</code> has not yet been applied to this environment database. The unapplied forward migration is delivered in <code>supabase/migrations/20261102000000_admin_moderation_analytics_v1.sql</code>.
          </p>
        </div>
      ) : analytics ? (
        <>
          {/* Top Volume Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Listings Submitted
                </span>
                <FileText className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {analytics.metrics.listings_submitted}
              </p>
              <p className="text-2xs text-slate-400 mt-1">Initial listings submitted in window</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Images Uploaded
                </span>
                <ImageIcon className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {analytics.metrics.images_uploaded}
              </p>
              <p className="text-2xs text-slate-400 mt-1">
                {analytics.metrics.images_ready} ready · {analytics.metrics.images_failed} failed
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Evaluations Executed
                </span>
                <Layers className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {analytics.metrics.total_evaluations}
              </p>
              <p className="text-2xs text-slate-400 mt-1">
                Across {analytics.metrics.listings_evaluated} distinct listings
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Per-Image Scan Attempts
                </span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2 text-slate-400">
                Unavailable
              </p>
              <p className="text-2xs text-slate-400 mt-1">
                Awaiting per-image scan telemetry
              </p>
            </div>
          </div>

          {/* Decisions & 5-Check Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Decisions */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                System Decisions Breakdown
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                  <div className="text-xs font-medium text-emerald-800">Auto Approved</div>
                  <div className="text-xl font-bold text-emerald-950 mt-1">
                    {analytics.decisions.auto_approved}
                  </div>
                </div>
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                  <div className="text-xs font-medium text-blue-800">Routed to Admin</div>
                  <div className="text-xl font-bold text-blue-950 mt-1">
                    {analytics.decisions.routed_to_admin}
                  </div>
                </div>
                <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                  <div className="text-xs font-medium text-amber-800">Escalated to Admin</div>
                  <div className="text-xl font-bold text-amber-950 mt-1">
                    {analytics.decisions.escalated_to_admin}
                  </div>
                </div>
                <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                  <div className="text-xs font-medium text-red-800">Rejected Invalid</div>
                  <div className="text-xl font-bold text-red-950 mt-1">
                    {analytics.decisions.rejected_invalid}
                  </div>
                </div>
              </div>
            </div>

            {/* Five Moderation Checks */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Five Moderation Checks (India V1)
              </h3>
              <div className="space-y-2.5">
                {[
                  "check_india_fraud_rules",
                  "check_openai_moderation",
                  "check_vision_nsfw",
                  "check_vision_category",
                  "check_ocr_qr",
                ].map((checkKey) => {
                  const check = analytics.five_checks[checkKey] ?? {
                    passed: 0,
                    failed: 0,
                    total: 0,
                  };
                  return (
                    <div
                      key={checkKey}
                      className="flex items-center justify-between text-xs py-1.5 px-3 rounded-md bg-slate-50 border border-slate-100"
                    >
                      <span className="font-medium text-slate-700">
                        {CHECK_DISPLAY_NAMES[checkKey] ?? checkKey}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {check.passed} pass
                        </span>
                        <span className="inline-flex items-center gap-1 text-red-700 font-medium">
                          <XCircle className="w-3.5 h-3.5" />
                          {check.failed} fail
                        </span>
                        <span className="text-slate-400 font-mono text-2xs">
                          ({check.total} runs)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Provider Infrastructure & Billing Links */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Cloud Infrastructure & Billing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Azure */}
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-sm">
                      Microsoft Azure (Container Apps & Vision)
                    </span>
                    <span className="text-2xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      Cost: {analytics.costs.azure}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Runs offline India fraud rules, NSFWJS, MobileNet category classification, and PaddleOCR/QR containers.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <a
                    href="https://portal.azure.com/#blade/Microsoft_Azure_CostManagement/Menu/costanalysis"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Open Azure Cost Management
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* OpenAI */}
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-sm">
                      OpenAI (Omni-Moderation API)
                    </span>
                    <span className="text-2xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      Cost: {analytics.costs.openai}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Multi-modal text and image safety evaluations against hate, harassment, self-harm, and sexual policies.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <a
                    href="https://platform.openai.com/usage"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    Open OpenAI Platform Usage & Billing
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Processing History Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Compact Processing History
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {analytics.history.length} records in window
              </span>
            </div>
            {analytics.history.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No moderation records found for the selected {RANGE_LABELS[selectedRange]} window.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-2xs border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Timestamp (IST)</th>
                      <th className="px-4 py-3">Listing</th>
                      <th className="px-4 py-3">Ruleset & Scope</th>
                      <th className="px-4 py-3">Checks Passed / Failed</th>
                      <th className="px-4 py-3">Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {analytics.history.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap font-mono text-2xs">
                          {formatISTDate(item.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/listings/${item.listing_id}`}
                            className="font-medium text-slate-900 hover:text-emerald-600 hover:underline line-clamp-1"
                            title={item.listing_title ?? item.listing_id}
                          >
                            {item.listing_title || item.listing_id.slice(0, 8)}
                          </Link>
                          <span className="text-2xs text-slate-400 font-mono">
                            Rev {item.listing_revision}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-slate-800">{item.ruleset_version}</div>
                          <div className="text-2xs text-slate-400">{item.scope}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-emerald-700 font-medium">
                            {item.completed_rules.length} pass
                          </span>
                          {" / "}
                          <span
                            className={
                              item.failed_rules.length > 0
                                ? "text-red-700 font-medium"
                                : "text-slate-400"
                            }
                          >
                            {item.failed_rules.length} fail
                          </span>
                          {item.flags_count > 0 && (
                            <span className="ml-1 text-2xs text-amber-700 font-medium">
                              ({item.flags_count} flags)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold ${
                              item.decision === "auto_approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.decision === "routed_to_admin"
                                ? "bg-blue-100 text-blue-800"
                                : item.decision === "escalated_to_admin"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.decision}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
