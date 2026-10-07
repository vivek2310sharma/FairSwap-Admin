import Link from "next/link";
import { redirect } from "next/navigation";
import { SessionControls } from "@/components/auth-forms";
import { PendingListings } from "@/components/pending-listings";
import { RefreshQueue } from "@/components/refresh-queue";
import { loadPendingQueue } from "@/lib/listings/pending";

export const dynamic = "force-dynamic";
export default async function PendingListingsPage() {
  const queue = await loadPendingQueue();
  if (queue.status === "denied") {
    if (queue.reason === "sign-in") redirect("/auth/sign-in");
    if (queue.reason === "mfa") redirect("/auth/mfa");
    redirect("/admin");
  }
  return <main className="queue-shell">
    <header className="queue-header"><div><Link href="/admin">← Staff home</Link><p className="listing-status">FairSwap Admin · TEST</p><h1>Pending listings</h1>
      <p>Oldest submissions first. Read-only review; decisions are not available yet.</p></div>
      <RefreshQueue /></header>
    <PendingListings queue={queue} />
    <div className="queue-session"><SessionControls /></div>
  </main>;
}
