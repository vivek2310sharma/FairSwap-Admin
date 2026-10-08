"use client";

import Image from "next/image";
import { useState } from "react";

export function ListingPhoto({ listingId, mediaId, number }: { listingId: string; mediaId: string; number: number }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  return <figure className="listing-photo">
    {status === "error" ? <p role="status">Photo {number} unavailable for this staff session.</p> : <>
      {status === "loading" && <p role="status">Loading photo {number}…</p>}
      <Image src={`/admin/listings/${listingId}/photos/${mediaId}`} alt={`Submitted photograph ${number}`}
        width={600} height={400} unoptimized loading="lazy"
        onLoad={() => setStatus("ready")} onError={() => setStatus("error")} />
    </>}
    <figcaption>Photo {number} · medium derivative</figcaption>
  </figure>;
}
