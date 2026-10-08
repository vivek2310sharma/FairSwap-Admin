"use server";
import { field, submitAdminMutation } from "@/lib/admin/action";
import type { AdminResult } from "@/lib/admin/mutations";
export type LocationActionResult = AdminResult;
export async function manageLocationAction(_state: AdminResult | null, form: FormData) {
  return submitAdminMutation({ operation: "location", action: field(form,"action") as "create_city" | "update_city" | "create_locality" | "update_locality", cityId: field(form,"city_id"), localityId: field(form,"locality_id"), name: field(form,"name"), state: field(form,"state"), slug: field(form,"slug"), active: ["on","true"].includes(field(form,"is_active") ?? "") }, ["/admin/locations","/admin/audit"]);
}
