"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { ratingsAction } from "@/app/admin/ratings/actions";
import { availableActions, reasonSchema, type RatingsAction, type RatingsEvidence, type RatingsResult } from "@/lib/admin/ratings/contract";

const labels: Record<RatingsAction, string> = {
  evidence: "View Evidence", hide: "Hide reported review", restore: "Restore reported review", resolve: "Resolve trade dispute",
  void: "Void trade permanently", exclude: "Exclude from reputation", clear_exclusion: "Clear reputation exclusion",
};
const consequences: Record<Exclude<RatingsAction, "evidence">, string> = {
  hide: "Hide the reported review from public display. This does not automatically resolve the case.",
  restore: "Restore the reported review, subject to Backend publication and eligibility rules.",
  resolve: "Resolve this dispute. The Backend derives the resulting trade state from prior buyer acknowledgement and deadline; this cannot create acknowledgement.",
  void: "Permanently void this trade and remove its publication and reputation eligibility. There is no undo in V1.",
  exclude: "Exclude this trade from counted reputation. Otherwise visible published content can remain visible.",
  clear_exclusion: "Clear this risk exclusion. All other Backend eligibility rules still apply.",
};

/** Deliberately no effect, evidence prefetch, storage, analytics or automatic retry. */
export function CaseWorkspace({ id, target }: { id: string; target: "case" | "ticket" }) {
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState<RatingsEvidence | null>(null);
  const [feedback, setFeedback] = useState<RatingsResult>({});
  const [pending, setPending] = useState(false);
  const [selected, setSelected] = useState<Exclude<RatingsAction, "evidence"> | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const inFlight = useRef(false);
  const reasonId = `ratings-reason-${target}-${id}`;
  async function run(action: RatingsAction) {
    if (inFlight.current) return;
    if (!reasonSchema.safeParse(reason).success) { setFeedback({ error: "Enter a valid reason of 3–500 characters, without control characters or angle brackets." }); return; }
    inFlight.current = true;
    setPending(true);
    setFeedback({});
    // Discard previous evidence before any request, including uncertain mutation outcomes.
    setEvidence(null);
    try {
      const result = await ratingsAction({ operation: "ratings", target, id, action, reason });
      setFeedback({ error: result.error, success: result.success, message: result.message });
      if (action === "evidence" && result.success && result.evidence) setEvidence(result.evidence);
    } catch { setFeedback({ error: "Operation not confirmed. Retrieve current evidence before deciding whether to try again." }); }
    finally { setReason(""); setPending(false); inFlight.current = false; }
  }
  function confirm(action: Exclude<RatingsAction, "evidence">) {
    if (!reasonSchema.safeParse(reason).success) { setFeedback({ error: "Enter a valid reason of 3–500 characters before selecting an action." }); return; }
    setSelected(action);
    dialog.current?.showModal();
  }
  return <div className="space-y-5">
    <p className="text-sm text-slate-600">Sensitive evidence stays hidden until you explicitly request it with a staff reason. Each read and moderation action is recorded in the immutable Backend audit trail. The contract does not expose an audit-history reader.</p>
    <form onSubmit={event => { event.preventDefault(); void run("evidence"); }} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <label htmlFor={reasonId} className="block font-semibold">Staff reason (required for every request)</label>
      <textarea id={reasonId} name="reason" value={reason} onChange={event => setReason(event.target.value)} required disabled={pending}
        aria-describedby={`${reasonId}-help`} rows={3} className="w-full rounded-lg border border-slate-400 p-3" />
      <p id={`${reasonId}-help`} className="text-sm text-slate-600">3–500 characters. Describe the purpose or decision; minimize personal information. Reasons are retained as audit evidence.</p>
      <button type="submit" disabled={pending} className="rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50">{pending ? "Request in progress…" : "View Evidence"}</button>
      {evidence && <button type="button" disabled={pending} onClick={() => setEvidence(null)} className="ml-3 rounded-lg border px-4 py-3">Clear displayed evidence</button>}
    </form>
    <div role={feedback.error ? "alert" : "status"} aria-live="polite" className="break-words text-sm">{feedback.error || feedback.message}</div>
    {evidence && <>
      <EvidenceDisplay evidence={evidence} />
      <section aria-label="Moderation controls" className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Moderation actions</h2>
        <p className="text-sm text-slate-600">Enter a new decision reason above. Negative ratings and fraud-related tags are signals for investigation, not proof of fraud or grounds for automatic punishment. Backend rules remain authoritative if another staff member acts concurrently.</p>
        <div className="flex flex-wrap gap-3">{availableActions(evidence).map(action => <button key={action} type="button" disabled={pending} onClick={() => confirm(action)} className="rounded-lg border border-slate-400 px-4 py-3 font-medium disabled:opacity-50">{labels[action]}</button>)}</div>
      </section>
    </>}
    <dialog ref={dialog} aria-labelledby="ratings-confirm-title" aria-describedby="ratings-confirm-description" className="m-auto max-h-[85vh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-xl border border-slate-300 bg-white p-6 shadow-xl backdrop:bg-black/50" onCancel={() => setSelected(null)}>
      <h2 id="ratings-confirm-title" className="text-lg font-bold">Confirm {selected ? labels[selected] : "moderation action"}</h2>
      <p id="ratings-confirm-description" className="mt-3">{selected && consequences[selected]}</p>
      <p className="mt-3 break-all text-sm">{target === "ticket" ? "Support ticket" : "Case"}: {id}</p>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm">Audit reason: {reason}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" autoFocus className="rounded-lg border px-4 py-3" onClick={() => { dialog.current?.close(); setSelected(null); }}>Cancel</button>
        <button type="button" disabled={pending || !selected} className="rounded-lg bg-emerald-700 px-4 py-3 text-white" onClick={() => {
          const action = selected;
          dialog.current?.close(); setSelected(null);
          if (action) void run(action);
        }}>Confirm action</button>
      </div>
    </dialog>
  </div>;
}

function Fields({ values }: { values: Record<string, string | boolean | number | null> }) {
  return <dl className="grid min-w-0 grid-cols-1 gap-3 text-sm sm:grid-cols-2">{Object.entries(values).map(([name, value]) => <div key={name} className="min-w-0">
    <dt className="font-semibold capitalize text-slate-600">{name.replaceAll("_", " ")}</dt>
    <dd className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{value === null ? "None" : typeof value === "boolean" ? value ? "Yes" : "No" : value}</dd>
  </div>)}</dl>;
}

export function EvidenceDisplay({ evidence }: { evidence: RatingsEvidence }) {
  return <section aria-label="Authorized Ratings evidence" className="space-y-4">
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"><h2 className="text-lg font-semibold">Case evidence</h2><Fields values={evidence.case} />
      {evidence.case.support_ticket_id && <div className="space-y-2 text-sm">
        <Link prefetch={false} className="block text-emerald-800 underline" href={`/admin/ratings/tickets/${evidence.case.support_ticket_id}`}>Investigate through linked ticket</Link>
        <Link prefetch={false} className="block text-emerald-800 underline" href={`/admin/support/${evidence.case.support_ticket_id}`}>Support thread (existing support permissions required)</Link>
        <p>Ratings actions affect the linked case. Replying to customers or updating ticket status uses the separately guarded Support workflow.</p>
      </div>}</div>
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"><h2 className="text-lg font-semibold">Trade and eligibility</h2><Fields values={evidence.trade} /></div>
    {evidence.reviews.length === 0 && <p>No reviews submitted for this trade.</p>}
    {evidence.reviews.map(review => <article key={review.id} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="font-semibold">{review.reviewer_role === "buyer" ? "Buyer’s review of seller" : "Seller’s review of buyer"}{review.id === evidence.case.review_id ? " · Reported review" : ""}</h3>
      <p className="text-sm font-medium">{review.published_at ? "Published" : "Sealed — private staff evidence"}{review.hidden ? " · Hidden" : ""}{review.redacted ? " · Redacted" : ""}</p>
      <Fields values={{ id: review.id, author_id: review.author_id, recipient_id: review.recipient_id, communication: review.communication,
        [review.reviewer_role === "buyer" ? "item_as_described" : "payment"]: review.payment_item, meetup: review.meetup, score: review.score,
        body: review.body, submitted_at: review.submitted_at, published_at: review.published_at }} />
      <p className="break-words text-sm">Tags (may include internal signals): {review.tags.join(", ") || "None"}</p>
      {evidence.replies.filter(reply => reply.review_id === review.id).map(reply => <div key={reply.review_id} className="rounded-lg bg-slate-50 p-3"><h4 className="mb-2 font-semibold">Recipient reply</h4><Fields values={reply} /></div>)}
    </article>)}
  </section>;
}
