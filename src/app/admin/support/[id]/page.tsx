import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { pageClient } from "@/lib/admin/server";
import { StaffSupportReplyForm } from "@/components/communication/StaffSupportReplyForm";
import { AlertCircle, ChevronLeft, Lock, Shield } from "lucide-react";
import type { Metadata } from "next";
import { z } from "zod";
import { loadSupportUser } from "@/lib/admin/support-user";
import {
  classifySupportSender,
  formatSupportTicketReference,
} from "@/lib/admin/support-ticket-display";

export const metadata: Metadata = {
  title: "Support Ticket Detail — FairSwap Admin",
  description: "View and respond to support inquiries.",
};

type TicketRow = {
  id: string;
  user_id: string | null;
  category: string;
  subject: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  ticket_id: string;
  sender_id: string | null;
  is_internal_note: boolean;
  content: string;
  created_at: string;
};

export default async function AdminSupportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: ticketId } = await params;
  if (!z.string().uuid().safeParse(ticketId).success) notFound();
  const supabase = await pageClient(["administrator","support_agent"]);

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    redirect(`/auth/sign-in?next=/admin/support/${ticketId}`);
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

  // Fetch ticket. `maybeSingle` makes "no such ticket" (null, no error) distinguishable from a failed
  // read, which pageClient surfaces as a thrown error. Only a genuinely missing ticket is a 404.
  let ticket: TicketRow | null = null;
  let ticketReadFailed = false;
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("id, user_id, category, subject, status, priority, assigned_to, created_at, updated_at")
      .eq("id", ticketId)
      .maybeSingle();
    if (error) ticketReadFailed = true;
    else ticket = (data as TicketRow | null) ?? null;
  } catch {
    ticketReadFailed = true;
  }

  if (!ticketReadFailed && !ticket) {
    notFound();
  }

  if (ticketReadFailed || !ticket) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link
          href="/admin/support"
          className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Support Queue
        </Link>
        <div role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-gray-800">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-400" />
          <p className="mt-3 font-semibold">This ticket could not be loaded</p>
          <p className="text-sm">
            This is a read failure, not a missing ticket. Refresh the page or contact the backend owner.
          </p>
        </div>
      </div>
    );
  }

  // Fetch ticket submitter profile
  const { profile: userObj, accountStatus } = await loadSupportUser(supabase, ticket.user_id);

  // Fetch all messages (staff can see internal notes!). Only canonical columns: there is no
  // staff-reply flag column, and sender_id references auth.users, so no profiles embed is possible.
  let messages: MessageRow[] | null = null;
  try {
    const { data, error } = await supabase
      .from("support_messages")
      .select("id, ticket_id, sender_id, is_internal_note, content, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    messages = error || !data ? null : (data as MessageRow[]);
  } catch {
    messages = null;
  }
  const messagesFailed = messages === null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href="/admin/support"
          className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Support Queue
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left 2 cols: Ticket Overview & Thread */}
        <div className="space-y-6 lg:col-span-2">
          {/* Header Card */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-emerald-700">
                  #{formatSupportTicketReference(ticket.id)}
                </span>
                <span className="rounded bg-gray-100 px-2.5 py-0.5 text-xs font-semibold uppercase text-gray-700">
                  {ticket.category.replace("_", " ")}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                Created {new Date(ticket.created_at).toLocaleString()}
              </span>
            </div>

            <h1 className="mt-3 text-xl font-bold text-gray-900">{ticket.subject}</h1>

            <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
              <div>
                User:{" "}
                <span className="font-semibold text-gray-900">
                  {ticket.user_id ? userObj?.display_name || "Customer unavailable" : "Deleted user"}
                </span>
              </div>
              <div>
                Account Status: <span className="font-semibold text-gray-900 uppercase">{accountStatus || "Unavailable"}</span>
              </div>
              <div>
                User ID: <span className="font-mono text-gray-500">{ticket.user_id ? `${ticket.user_id.slice(0, 8)}...` : "Deleted user"}</span>
              </div>
            </div>
          </div>

          {/* Conversation Thread */}
          <div className="space-y-4">
            {messagesFailed ? (
              <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-gray-800">
                <p className="font-semibold">The messages for this ticket could not be loaded</p>
                <p>This is a read failure, not an empty thread. Refresh the page or contact the backend owner.</p>
              </div>
            ) : messages && messages.length > 0 ? (
              messages.map((m) => {
                const sender = classifySupportSender(m, ticket.user_id);
                const isInternal = sender === "internal_note";
                const isStaff = sender === "staff";

                return (
                  <div
                    key={m.id}
                    className={`rounded-xl border p-5 shadow-xs transition-colors ${
                      isInternal
                        ? "border-amber-300 bg-amber-50/70"
                        : isStaff
                        ? "border-emerald-200 bg-emerald-50/30"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200/50 text-xs">
                      <div className="flex items-center gap-2">
                        {isInternal ? (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-200 px-2 py-0.5 font-bold text-amber-900 text-[11px] uppercase tracking-wider">
                            <Lock className="h-3 w-3" />
                            Internal Note (Staff Only)
                          </span>
                        ) : isStaff ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
                            <Shield className="h-3.5 w-3.5" />
                            Support team (Staff Reply)
                          </span>
                        ) : sender === "customer" ? (
                          <span className="font-semibold text-gray-800">
                            {userObj?.display_name || "Customer"} (Customer)
                          </span>
                        ) : (
                          <span className="font-semibold text-gray-600">Sender unavailable</span>
                        )}
                      </div>

                      <span className="text-gray-500">
                        {new Date(m.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-3 whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                      {m.content}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-sm text-gray-500">
                No messages recorded on this ticket.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 col: Reply & Status Management */}
        <div>
          {messagesFailed ? (
            <div role="status" className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-700 shadow-sm">
              Replying and status changes are unavailable until the conversation can be loaded, so no
              action is taken without the ticket&apos;s context.
            </div>
          ) : (
            <StaffSupportReplyForm
              ticketId={ticket.id}
              currentStatus={ticket.status}
              currentPriority={ticket.priority}
            />
          )}
        </div>
      </div>
    </div>
  );
}
