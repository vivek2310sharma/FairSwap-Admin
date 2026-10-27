import Link from "next/link";
import { loadRatingsQueue } from "@/lib/admin/ratings/server";
import { queueInputSchema } from "@/lib/admin/ratings/contract";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ratings moderation — FairSwap Admin" };

export default async function RatingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const parsed = queueInputSchema.safeParse({ kind: raw.kind, status: raw.status, before_at: raw.before_at, before_id: raw.before_id });
  const input = parsed.success ? parsed.data : null;
  const result = input ? await loadRatingsQueue(input) : { error: "Invalid queue filters or cursor. Return to the first page." };
  const kind = input?.kind ?? "review_report";
  const status = input?.status ?? "open";
  const page = result.queue;
  const next = page?.next_cursor;
  return <section className="space-y-6">
    <div><h1 className="text-2xl font-bold text-slate-900">Ratings moderation</h1>
      <p className="mt-2 text-sm text-slate-600">Investigate reported reviews and disputed trades. Queue navigation contains metadata only. Evidence requires a reason and is audited.</p></div>
    <nav aria-label="Ratings queues" className="flex flex-wrap gap-3">
      {([ ["review_report", "Reported Reviews"], ["dispute", "Trade Disputes"] ] as const).map(([value, label]) =>
        <Link key={value} prefetch={false} aria-current={kind === value ? "page" : undefined} className="rounded-lg border border-slate-300 bg-white p-3 font-medium aria-[current=page]:bg-emerald-100" href={`/admin/ratings?kind=${value}&status=${status}`}>{label}</Link>)}
    </nav>
    <nav aria-label="Case status" className="flex flex-wrap gap-3">
      {(["open", "resolved", "all"] as const).map(value => <Link prefetch={false} key={value} aria-current={status === value ? "page" : undefined} className="rounded-lg border border-slate-300 px-4 py-2 capitalize aria-[current=page]:bg-emerald-100" href={`/admin/ratings?kind=${kind}&status=${value}`}>{value}</Link>)}
    </nav>
    {result.error ? <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4"><p>{result.error}</p><Link className="underline" href="/admin/ratings" prefetch={false}>Return to first page</Link></div> : page && <>
      <p className="text-sm text-slate-600">{page.items.length} cases on this page{page.has_more ? "; more available" : ""}. Page size: 20. Total counts are unavailable from the Backend contract.</p>
      {page.items.length === 0 ? <p className="rounded-xl border bg-white p-6">No cases match this queue.</p> : <ul className="space-y-3">{page.items.map(item => <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 space-y-1 break-all">
          <Link prefetch={false} className="font-semibold text-emerald-800 underline" href={`/admin/ratings/${item.id}`}>Case {item.id}</Link>
          <p className="text-sm">{item.resolved_at ? "Resolved" : "Open"} · Created <time dateTime={item.created_at}>{item.created_at}</time></p>
          <p className="text-xs text-slate-600">Trade {item.trade_id}</p>
          {item.resolved_at && <p className="text-xs">Resolved {item.resolved_at}</p>}
        </div>{item.support_ticket_id && <Link prefetch={false} className="text-sm text-emerald-800 underline" href={`/admin/ratings/tickets/${item.support_ticket_id}`}>Linked ticket investigation</Link>}</div>
      </li>)}</ul>}
      <nav aria-label="Queue pagination" className="flex flex-wrap justify-between gap-3">
        <Link prefetch={false} className="rounded-lg border p-3" href={`/admin/ratings?kind=${kind}&status=${status}`}>First page</Link>
        {next && <Link prefetch={false} className="rounded-lg border p-3" href={`/admin/ratings?${new URLSearchParams({ kind, status, ...next }).toString()}`}>Next 20 cases</Link>}
      </nav>
    </>}
  </section>;
}
