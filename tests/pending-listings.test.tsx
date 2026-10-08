import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { AdminClient } from "@/lib/supabase/client";

const access = vi.hoisted(() => vi.fn());
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/guard", () => ({ staffAccess: access }));
vi.mock("@/lib/supabase/server", () => ({ requestClient: vi.fn() }));
vi.mock("@/components/auth-forms", () => ({ SessionControls: () => <button>Sign out of Admin</button> }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));

import { loadPendingQueue, pendingListingSchema, PENDING_SELECT } from "@/lib/listings/pending";
import { readListingPhoto } from "@/lib/listings/photo";
import { requestClient } from "@/lib/supabase/server";
import { PendingListings } from "@/components/pending-listings";
import { ListingPhoto } from "@/components/listing-photo";
import PendingListingsPage from "@/app/admin/listings/page";
import Loading from "@/app/admin/listings/loading";
import { GET } from "@/app/admin/listings/[listingId]/photos/[mediaId]/route";

const listingId = "11111111-1111-4111-8111-111111111111";
const mediaId = "22222222-2222-4222-8222-222222222222";
const sellerId = "33333333-3333-4333-8333-333333333333";
const otherId = "44444444-4444-4444-8444-444444444444";
const listing = {
  id: listingId, seller_id: sellerId, title: "Synthetic desk", description: "A desk for review.",
  condition: "good", price_type: "fixed", price_paise: 100050, revision: 3, status: "pending_review",
  submitted_at: "2026-10-07T08:00:00+00:00", created_at: "2026-10-06T08:00:00Z", updated_at: "2026-10-07T08:00:00Z",
  categories: { name: "Furniture" }, cities: [{ name: "Delhi" }], localities: null,
  listing_media: [{ id: mediaId, display_order: 0, processing_status: "ready" }],
};

function fixture() {
  const rows: Record<string, { data: unknown; error: unknown }> = {
    listings: { data: [listing], error: null },
    profiles: { data: [{ id: sellerId, display_name: "Synthetic Seller" }], error: null },
    listing_media: { data: { id: mediaId, listing_id: listingId, processing_status: "ready", medium_storage_path: "synthetic/medium.webp" }, error: null },
  };
  const chains = new Map<string, ReturnType<typeof chainFor>>();
  function chainFor(table: string) {
    const chain = {
      select: vi.fn(() => chain), eq: vi.fn(() => chain), order: vi.fn(() => chain),
      limit: vi.fn(async () => rows[table]), in: vi.fn(async () => rows[table]),
      maybeSingle: vi.fn(async () => rows[table]),
    };
    return chain;
  }
  const from = vi.fn((table: string) => { const chain = chainFor(table); chains.set(table, chain); return chain; });
  const download = vi.fn(async () => ({ data: new Blob([new Uint8Array([1, 2, 3])], { type: "image/webp" }) as Blob | null, error: null as unknown }));
  const storage = { from: vi.fn(() => ({ download })) };
  const client = { from, storage } as unknown as AdminClient;
  return { rows, chains, from, storage, download, client, factory: vi.fn(async () => client) };
}
let f: ReturnType<typeof fixture>;
beforeEach(() => {
  vi.clearAllMocks(); f = fixture();
  access.mockResolvedValue({ allowed: true, userId: sellerId, role: "moderator", aal: "aal2" });
  vi.mocked(requestClient).mockResolvedValue(f.client);
});

describe("pending queue application reads", () => {
  it("uses the authorized session, pending filter, stable oldest-first ordering and bounded explicit projection", async () => {
    const result = await loadPendingQueue(f.factory);
    expect(access).toHaveBeenCalledWith(f.client, true);
    expect(result).toMatchObject({ status: "ready", hasMore: false, profilesUnavailable: false, listings: [{ sellerName: "Synthetic Seller" }] });
    const chain = f.chains.get("listings")!;
    expect(chain.select).toHaveBeenCalledWith(PENDING_SELECT);
    expect(PENDING_SELECT).not.toMatch(/storage_path|original_filename|pin_code|landmark/);
    expect(chain.eq).toHaveBeenCalledWith("status", "pending_review");
    expect(chain.order.mock.calls).toEqual([["submitted_at", { ascending: true, nullsFirst: false }], ["id", { ascending: true }]]);
    expect(chain.limit).toHaveBeenCalledWith(101);
  });
  it.each(["sign-in", "mfa", "denied", "policy-required", "policy-error"])("denies %s before any queue/profile read", async (reason) => {
    access.mockResolvedValue({ allowed: false, reason });
    expect(await loadPendingQueue(f.factory)).toEqual({ status: "denied", reason });
    expect(f.from).not.toHaveBeenCalled();
  });
  it("denies missing configuration before accessing the backend", async () => {
    expect(await loadPendingQueue(async () => null)).toEqual({ status: "denied", reason: "configuration" });
    expect(access).not.toHaveBeenCalled(); expect(f.from).not.toHaveBeenCalled();
  });
  it("distinguishes a real empty result from a backend error", async () => {
    f.rows.listings.data = [];
    expect(await loadPendingQueue(f.factory)).toEqual({ status: "ready", listings: [], hasMore: false, profilesUnavailable: false });
    expect(f.from).toHaveBeenCalledTimes(1);
    f.rows.listings.error = { message: "RAW_ERROR_SENTINEL" };
    expect(await loadPendingQueue(f.factory)).toEqual({ status: "error" });
  });
  it.each([null, [{ ...listing, status: "active" }], [{ ...listing, price_paise: "1000" }]])("fails closed on malformed queue data", async (data) => {
    f.rows.listings.data = data;
    expect(await loadPendingQueue(f.factory)).toEqual({ status: "error" });
  });
  it("keeps listing details if seller profiles are denied", async () => {
    f.rows.profiles.error = { message: "RAW_ERROR_SENTINEL" };
    expect(await loadPendingQueue(f.factory)).toMatchObject({ status: "ready", profilesUnavailable: true, listings: [{ sellerName: null }] });
  });
  it("reports a capped result without claiming the cap is the total", async () => {
    f.rows.listings.data = Array.from({ length: 101 }, () => listing);
    const result = await loadPendingQueue(f.factory);
    expect(result.status).toBe("ready");
    if (result.status === "ready") { expect(result.listings).toHaveLength(100); expect(result.hasMore).toBe(true); }
  });
  it("contains thrown provider errors", async () => {
    f.factory.mockRejectedValueOnce(new Error("RAW_ERROR_SENTINEL"));
    expect(await loadPendingQueue(f.factory)).toEqual({ status: "error" });
  });
  it.each([["sign-in", "/auth/sign-in"], ["mfa", "/auth/mfa"], ["policy-required", "/admin"]])("protects the actual page on %s", async (reason, destination) => {
    access.mockResolvedValue({ allowed: false, reason });
    await expect(PendingListingsPage()).rejects.toThrow(`REDIRECT:${destination}`);
    expect(f.from).not.toHaveBeenCalled();
  });
});

describe("derivative-only photo delivery", () => {
  beforeEach(() => { f.rows.listings.data = { id: listingId, status: "pending_review" }; });
  it("delivers only the matched medium derivative with private no-store headers", async () => {
    const result = await GET(new Request("http://localhost/admin/listings"), { params: Promise.resolve({ listingId, mediaId }) });
    expect(result.status).toBe(200);
    expect(result.headers.get("content-type")).toBe("image/webp");
    expect(result.headers.get("cache-control")).toContain("no-store");
    expect(result.headers.get("location")).toBeNull();
    expect(f.chains.get("listing_media")!.eq).toHaveBeenCalledWith("listing_id", listingId);
    expect(f.storage.from).toHaveBeenCalledWith("listing-derivatives");
    expect(f.download).toHaveBeenCalledWith("synthetic/medium.webp");
    expect(f.chains.get("listing_media")!.select).not.toHaveBeenCalledWith(expect.stringContaining("original"));
  });
  it("denies before row or Storage reads", async () => {
    access.mockResolvedValue({ allowed: false, reason: "mfa" });
    expect((await readListingPhoto({ listingId, mediaId }, f.factory)).status).toBe(403);
    expect(f.from).not.toHaveBeenCalled(); expect(f.download).not.toHaveBeenCalled();
  });
  it("rejects arbitrary identifiers and extra original-size requests", async () => {
    expect((await readListingPhoto({ listingId: "invalid", mediaId }, f.factory)).status).toBe(400);
    expect((await readListingPhoto({ listingId, mediaId, size: "original" }, f.factory)).status).toBe(400);
    expect(f.factory).not.toHaveBeenCalled();
  });
  it("rejects a cross-listing media response", async () => {
    f.rows.listing_media.data = { id: mediaId, listing_id: otherId, processing_status: "ready", medium_storage_path: "synthetic/medium.webp" };
    expect((await readListingPhoto({ listingId, mediaId }, f.factory)).status).toBe(404);
    expect(f.download).not.toHaveBeenCalled();
  });
  it("does not deliver images once the listing is no longer pending", async () => {
    f.rows.listings.data = { id: listingId, status: "active" };
    expect((await readListingPhoto({ listingId, mediaId }, f.factory)).status).toBe(404);
    expect(f.download).not.toHaveBeenCalled();
  });
  it("reports Storage denial without fallback or raw errors", async () => {
    f.download.mockResolvedValue({ data: null, error: new Error("RAW_ERROR_SENTINEL") });
    const result = await readListingPhoto({ listingId, mediaId }, f.factory);
    expect(result.status).toBe(503); expect(await result.text()).not.toContain("RAW_ERROR_SENTINEL");
    expect(f.storage.from).toHaveBeenCalledTimes(1);
  });
  it.each(["../original", "/absolute", "folder//file", "folder\\file", "file?token=SENTINEL"])("rejects unsafe record path %s", async (path) => {
    f.rows.listing_media.data = { id: mediaId, listing_id: listingId, processing_status: "ready", medium_storage_path: path };
    expect((await readListingPhoto({ listingId, mediaId }, f.factory)).status).toBe(404);
    expect(f.download).not.toHaveBeenCalled();
  });
  it("refuses active content", async () => {
    f.download.mockResolvedValue({ data: new Blob(["<svg>"], { type: "image/svg+xml" }), error: null });
    expect((await readListingPhoto({ listingId, mediaId }, f.factory)).status).toBe(503);
  });
});

describe("read-only review UI", () => {
  it("renders useful details without moderation actions or raw storage paths", () => {
    render(<PendingListings queue={{ status: "ready", listings: [{ ...pendingListingSchema.parse(listing), sellerName: "Synthetic Seller" }], hasMore: false, profilesUnavailable: false }} />);
    expect(screen.getByText("Synthetic desk")).toBeVisible();
    expect(screen.getByText("Furniture")).toBeVisible();
    expect(screen.getByText("₹1,000.50")).toBeVisible();
    expect(screen.getByText("View details and photos")).toBeVisible();
    expect(screen.queryByRole("button", { name: /approve|reject/i })).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/RAW_ERROR_SENTINEL|storage_path/);
  });
  it("renders distinct empty and error states", () => {
    const view = render(<PendingListings queue={{ status: "ready", listings: [], hasMore: false, profilesUnavailable: false }} />);
    expect(screen.getByText("Queue is clear")).toBeVisible();
    view.rerender(<PendingListings queue={{ status: "error" }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to load pending listings");
    expect(screen.queryByText("Queue is clear")).not.toBeInTheDocument();
  });
  it("renders loading feedback", () => {
    render(<Loading />); expect(screen.getByRole("status")).toHaveTextContent("loading pending submissions");
  });
  it("renders a truthful image error when access is unavailable", () => {
    render(<ListingPhoto listingId={listingId} mediaId={mediaId} number={1} />);
    fireEvent.error(screen.getByAltText("Submitted photograph 1"));
    expect(screen.getByRole("status")).toHaveTextContent("unavailable for this staff session");
  });
});
