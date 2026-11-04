import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

/**
 * Staff-only evidence for Smartwatches & Wearables listings. Rendered inside the existing moderator/administrator
 * listing review page (which already enforces verified staff, AAL2 and policy acceptance). Reads through the
 * request-scoped client, so database RLS decides what staff can see; this panel grants no approval path of its own
 * (activation of a flagged listing is enforced by the database trigger and the existing review RPC).
 * Only whitelisted seller-reported fields are rendered; there is no serial/IMEI, account, invoice or health/GPS data to show.
 */
const TYPES = { smartwatch: "Smartwatch", fitness_band: "Fitness band", sports_gps_watch: "Sports / GPS watch", smart_ring: "Smart ring" } as const;
const PAIRING = {
  reset_ready: "Reset, ready for a new owner (seller-reported)",
  signed_out: "Signed out, not reset (seller-reported)",
  still_paired: "Still paired with the seller’s account — not transfer-ready",
  unknown: "Seller has not checked pairing or account status — not transfer-ready",
} as const;
const SIGNALS: Record<string, string> = {
  other_model: "Model typed by seller (not in the catalogue) — check it is a genuine, supported wearable",
  other_brand: "Brand typed by seller (not in the catalogue) — check it is a genuine brand",
  still_paired: "Seller says the device is still paired — it must not be presented as ready for transfer",
  unknown_pairing: "Pairing/account status not confirmed by the seller",
};
const INCLUDED: Record<string, string> = { charger: "Original charger", box: "Original box", invoice: "Bill/invoice", warranty_card: "Warranty card", extra_strap: "Extra strap", charging_case: "Charging case" };
const details = z.object({
  condition: z.string().optional(), generation: z.string().optional(), finish: z.string().optional(), connectivity: z.string().optional(), gps_status: z.string().optional(),
  case_size_mm: z.number().nullable().optional(), ring_size: z.string().optional(), battery_mode: z.string().optional(), battery_health_percent: z.number().optional(), battery_runtime_hours: z.number().optional(),
  screen: z.string().optional(), strap: z.string().optional(), included: z.array(z.string()).default([]), purchase_month: z.string().optional(), warranty_until: z.string().optional(),
}).passthrough();
const context = z.object({
  device_type: z.enum(["smartwatch", "fitness_band", "sports_gps_watch", "smart_ring"]), brand_name: z.string(), model_name: z.string(), other_model: z.boolean(),
  pairing_status: z.enum(["reset_ready", "signed_out", "still_paired", "unknown"]), transfer_ready: z.boolean(), catalogue_revision: z.string(), details,
});
const flagRows = z.array(z.object({ signal: z.string() }));
export const WEARABLE_CONTEXT_COLUMNS = "device_type,brand_name,model_name,other_model,pairing_status,transfer_ready,catalogue_revision,details";

export async function WearableReviewEvidence({ client, listingId }: { client: SupabaseClient; listingId: string }) {
  const r = await client.from("listing_wearable_contexts_v1").select(WEARABLE_CONTEXT_COLUMNS).eq("listing_id", listingId).maybeSingle();
  if (r.error) throw new Error("Wearable review evidence unavailable.");
  if (!r.data) return null;
  const c = context.parse(r.data);
  const f = await client.from("listing_wearable_risk_flags_v1").select("signal").eq("listing_id", listingId);
  if (f.error) throw new Error("Wearable review evidence unavailable.");
  const signals = flagRows.parse(f.data);
  const d = c.details;
  const facts = [
    d.generation && `Generation: ${d.generation}`, d.finish && `Finish: ${d.finish}`, d.case_size_mm ? `Case size: ${d.case_size_mm} mm` : "", d.ring_size && `Ring size: ${d.ring_size}`,
    d.connectivity && `Connectivity: ${d.connectivity}`, d.gps_status && `GPS: ${d.gps_status.replaceAll("_", " ")}`,
    d.battery_mode === "health_percent" && d.battery_health_percent ? `Battery health: ${d.battery_health_percent}%` : d.battery_mode === "runtime_hours" && d.battery_runtime_hours ? `Battery runtime: about ${d.battery_runtime_hours} h` : d.battery_mode ? "Battery: not tested" : "",
    d.purchase_month && `Purchased: ${d.purchase_month}`, d.warranty_until && `Warranty until: ${d.warranty_until}`,
  ].filter(Boolean) as string[];
  const flagged = signals.length > 0;
  return <section aria-label="Wearable review evidence" className="space-y-3 rounded-lg border border-amber-200 bg-white p-5">
    <h2 className="font-semibold">Wearable review evidence</h2>
    <p>{TYPES[c.device_type]} · {c.brand_name} · {c.model_name}{c.other_model ? " (typed by seller)" : ""}{d.condition ? ` · ${d.condition.replaceAll("_", " ")}` : ""}</p>
    <p className={c.transfer_ready ? "" : "font-medium text-amber-900"}>Pairing: {PAIRING[c.pairing_status]}</p>
    {facts.length > 0 && <p>{facts.join(" · ")}</p>}
    <p>Included (seller-declared): {d.included.map(i => INCLUDED[i]).filter(Boolean).join(", ") || "None declared"}</p>
    <div>
      <h3 className="text-sm font-semibold">Moderation signals</h3>
      {flagged ? <ul className="list-disc pl-5 text-sm">{signals.map(s => <li key={s.signal}>{SIGNALS[s.signal] ?? s.signal.replaceAll("_", " ")}</li>)}</ul> : <p className="text-sm">No wearable signals recorded.</p>}
      {flagged && <p className="mt-1 text-xs">The database only lets an active moderator or administrator activate this listing. Use the normal review actions below.</p>}
    </div>
    <p className="text-xs">Everything above is seller-reported. FairSwap has not verified the device, ownership, authenticity or account status, and does not collect serial numbers, IMEI, account details, invoices, health or location data. Catalogue revision {c.catalogue_revision}.</p>
  </section>;
}
