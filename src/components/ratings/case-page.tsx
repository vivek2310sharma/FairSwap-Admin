import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaffAccess } from "@/lib/auth/guard";
import { ratingsEnabled } from "@/lib/admin/ratings/feature";
import { RATINGS_UNAVAILABLE } from "@/lib/admin/ratings/server";
import { uuid } from "@/lib/admin/ratings/contract";
import { CaseWorkspace } from "./case-workspace";

export async function CasePage({ id, target }: { id: string; target: "case" | "ticket" }) {
  if (!uuid.safeParse(id).success) notFound();
  const access = await requireStaffAccess(["administrator", "moderator"]);
  return <section className="space-y-5">
    <Link prefetch={false} className="text-emerald-800 underline" href="/admin/ratings">Back to Ratings queues</Link>
    <h1 className="text-2xl font-bold">{target === "case" ? "Ratings case" : "Linked support-ticket investigation"}</h1>
    <p className="break-all text-sm">{id}</p>
    {!access.allowed ? <p role="status">An eligible administrator or moderator session, MFA and current policy acceptance are required.</p>
      : !ratingsEnabled() ? <p role="status">{RATINGS_UNAVAILABLE}</p> : <CaseWorkspace key={`${target}:${id}`} id={id} target={target} />}
  </section>;
}
