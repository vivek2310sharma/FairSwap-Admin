import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { WEARABLE_CONTEXT_COLUMNS, WearableReviewEvidence } from "@/components/wearable-review-evidence";

const id = "11111111-1111-4111-8111-111111111111";
const base = { device_type: "smartwatch", brand_name: "Apple", model_name: "Apple Watch Series 9", other_model: false, pairing_status: "reset_ready", transfer_ready: true, catalogue_revision: "8dd5783ac9b7e12e",
  details: { condition: "good", case_size_mm: 44, connectivity: "bluetooth", battery_mode: "health_percent", battery_health_percent: 91, included: ["charger", "box"], purchase_month: "2024-05", serial_number: "SECRET-SERIAL", account_email: "x@y.in", heart_rate_history: [60, 61] } };
function client(ctx: { data: unknown; error: unknown }, flags: { data: unknown; error: unknown } = { data: [], error: null }) {
  const calls: { table: string; select: string; eq: [string, string] }[] = [];
  const from = vi.fn((table: string) => ({ select: (select: string) => ({ eq: (col: string, val: string) => { calls.push({ table, select, eq: [col, val] }); return table === "listing_wearable_contexts_v1" ? { maybeSingle: async () => ctx } : Promise.resolve(flags); } }) }));
  return { c: { from } as unknown as SupabaseClient, calls };
}
const show = async (c: SupabaseClient) => { const el = await WearableReviewEvidence({ client: c, listingId: id }); if (el) render(el); return el; };

describe("Admin wearable review evidence", () => {
  it("renders nothing for non-wearable listings", async () => {
    const { c } = client({ data: null, error: null }); expect(await show(c)).toBeNull();
  });
  it("fails closed when the database refuses either read", async () => {
    await expect(WearableReviewEvidence({ client: client({ data: null, error: { message: "denied" } }).c, listingId: id })).rejects.toThrow("Wearable review evidence unavailable.");
    await expect(WearableReviewEvidence({ client: client({ data: base, error: null }, { data: null, error: { message: "denied" } }).c, listingId: id })).rejects.toThrow("Wearable review evidence unavailable.");
  });
  it("shows flags, pairing caveat and seller-reported facts for a flagged listing", async () => {
    const { c } = client({ data: { ...base, other_model: true, model_name: "Zephyr Z1", pairing_status: "still_paired", transfer_ready: false }, error: null }, { data: [{ signal: "other_model" }, { signal: "still_paired" }], error: null });
    await show(c);
    expect(screen.getByRole("region", { name: "Wearable review evidence" })).toBeInTheDocument();
    expect(screen.getByText(/Zephyr Z1 \(typed by seller\)/)).toBeInTheDocument();
    expect(screen.getByText(/Still paired with the seller’s account — not transfer-ready/)).toBeInTheDocument();
    expect(screen.getByText(/Model typed by seller/)).toBeInTheDocument(); expect(screen.getByText(/must not be presented as ready for transfer/)).toBeInTheDocument();
    expect(screen.getByText(/Only lets an active moderator|only lets an active moderator/i)).toBeInTheDocument();
    expect(screen.getByText(/Battery health: 91%/)).toBeInTheDocument(); expect(screen.getByText(/Original charger, Original box/)).toBeInTheDocument();
  });
  it("shows a clean listing without signals or warnings", async () => {
    await show(client({ data: base, error: null }).c);
    expect(screen.getByText("No wearable signals recorded.")).toBeInTheDocument(); expect(screen.queryByText(/not transfer-ready/)).toBeNull();
    expect(screen.getByText(/Reset, ready for a new owner \(seller-reported\)/)).toBeInTheDocument();
  });
  it("never renders private or unknown fields even if the row contained them", async () => {
    await show(client({ data: base, error: null }).c);
    const text = document.body.textContent ?? "";
    for (const leak of ["SECRET-SERIAL", "x@y.in", "60, 61", "serial_number", "heart_rate"]) expect(text).not.toContain(leak);
    expect(text).toMatch(/does not collect serial numbers, IMEI, account details, invoices, health or location data/);
  });
  it("uses only the request client, explicit columns and the listing id (no wildcard, no extra tables)", async () => {
    const { c, calls } = client({ data: base, error: null }); await show(c);
    expect(calls.map(x => x.table)).toEqual(["listing_wearable_contexts_v1", "listing_wearable_risk_flags_v1"]);
    expect(calls[0].select).toBe(WEARABLE_CONTEXT_COLUMNS); expect(calls[0].select).not.toContain("*"); expect(calls[1].select).toBe("signal");
    expect(calls.every(x => x.eq[0] === "listing_id" && x.eq[1] === id)).toBe(true);
  });
  it("is wired into the existing staff-guarded review page and adds no service-role or approval path", () => {
    const page = readFileSync("src/app/admin/listings/[listingId]/page.tsx", "utf8"), comp = readFileSync("src/components/wearable-review-evidence.tsx", "utf8");
    expect(page).toMatch(/pageClient\(\["administrator","moderator"\]\)/); expect(page).toMatch(/categorySlug === "wearables" && <WearableReviewEvidence client=\{supabase as SupabaseClient\}/);
    expect(comp).not.toMatch(/service|rpc\(|moderate_listing|\.update\(|\.insert\(|\.delete\(|"use server"/i);
  });
});
