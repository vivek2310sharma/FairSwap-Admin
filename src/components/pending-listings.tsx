import { ListingPhoto } from "./listing-photo";
import Link from "next/link";
import type { PendingQueue } from "@/lib/listings/pending";
import { relationName } from "@/lib/listings/pending";

function date(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value)) : "Not recorded";
}

export function PendingListings({ queue }: { queue: Exclude<PendingQueue, { status: "denied" }> }) {
  if (queue.status === "error") return <section className="queue-message" role="alert">
    <h2>Unable to load pending listings</h2><p>The Test backend could not supply the queue. Refresh to try again.</p>
  </section>;
  if (!queue.listings.length) return <section className="queue-message"><h2>Queue is clear</h2><p>No pending listings are visible to your staff session.</p></section>;
  return <>
    <p className="queue-count">{queue.listings.length} pending {queue.listings.length === 1 ? "listing" : "listings"}{queue.hasMore ? " shown · more submissions await review" : ""}</p>
    {queue.profilesUnavailable && <p role="status">Seller display names are unavailable. Listing details remain visible.</p>}
    <div className="queue-list">{queue.listings.map((listing) => <article className="listing-card" key={listing.id}>
      <header><div><p className="listing-status">Pending review · revision {listing.revision}</p><h2>{listing.title}</h2></div>
        <strong className="listing-price">{listing.price_type === "free" ? "Free" : listing.price_paise !== null ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(listing.price_paise / 100) : "Price not recorded"}</strong>
      </header>
      <dl className="listing-summary">
        <div><dt>Category</dt><dd>{relationName(listing.categories) || "Not recorded"}</dd></div>
        <div><dt>Location</dt><dd>{[relationName(listing.cities), relationName(listing.localities)].filter(Boolean).join(" / ") || "Not recorded"}</dd></div>
        <div><dt>Seller</dt><dd>{listing.sellerName || "Display name unavailable"}</dd></div>
        <div><dt>Submitted (India time)</dt><dd>{date(listing.submitted_at)}</dd></div>
        <div><dt>Photos</dt><dd>{listing.listing_media.filter((photo) => photo.processing_status === "ready").length} ready / {listing.listing_media.length} submitted</dd></div>
      </dl>
      <p><Link href={`/admin/listings/${listing.id}`} prefetch={false}>Open full review and moderation →</Link></p>
      <details><summary>View details and photos</summary><div className="listing-details">
        <p className="listing-description">{listing.description || "No description provided."}</p>
        <dl className="listing-summary">
          <div><dt>Condition</dt><dd>{listing.condition?.replaceAll("_", " ") || "Not recorded"}</dd></div>
          <div><dt>Price type</dt><dd>{listing.price_type || "Not recorded"}</dd></div>
          <div><dt>Last updated (India time)</dt><dd>{date(listing.updated_at)}</dd></div>
          <div><dt>Listing reference</dt><dd>{listing.id}</dd></div>
        </dl>
        <div className="listing-photos">{listing.listing_media.map((photo, index) => photo.processing_status === "ready" ?
          <ListingPhoto key={photo.id} listingId={listing.id} mediaId={photo.id} number={index + 1} /> :
          <p key={photo.id}>Photo {index + 1}: {photo.processing_status}</p>)}</div>
        {!listing.listing_media.length && <p>No photos submitted.</p>}
        <p className="queue-note">Private photographs may be unavailable under current backend access rules.</p>
      </div></details>
    </article>)}</div>
  </>;
}
