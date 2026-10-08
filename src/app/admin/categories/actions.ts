"use server";
import { field, submitAdminMutation } from "@/lib/admin/action";
import type { AdminResult } from "@/lib/admin/mutations";
export type CategoryActionResult = AdminResult;
export async function manageCategoryAction(_state: AdminResult | null, form: FormData) {
  const order = field(form,"sort_order");
  return submitAdminMutation({ operation: "category", action: field(form,"action") as "create" | "update", categoryId: field(form,"category_id"), name: field(form,"name"), slug: field(form,"slug"), description: field(form,"description"), icon: field(form,"icon"), sortOrder: order === null ? (field(form,"action") === "create" ? 0 : null) : Number(order), active: ["on","true"].includes(field(form,"is_active") ?? "") }, ["/admin/categories","/admin/audit"]);
}
