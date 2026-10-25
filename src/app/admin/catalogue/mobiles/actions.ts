"use server";
import { field, submitAdminMutation } from "@/lib/admin/action";
import type { AdminResult } from "@/lib/admin/mutations";
export async function manageMobileCatalogue(_state:AdminResult|null,form:FormData):Promise<AdminResult> {
 const kind=field(form,"kind");if(kind!=="brand"&&kind!=="model")return {error:"Invalid catalogue type."};
 return submitAdminMutation({operation:"phone-catalogue",kind,entry:{
  ...(field(form,"id")?{id:field(form,"id")!}:{}),name:field(form,"name")??"",aliases:(field(form,"aliases")??"").split(",").map(s=>s.trim()).filter(Boolean),
  enabled:form.get("enabled")==="on",sort_order:Number(field(form,"sort_order")??0),
  ...(kind==="model"?{brand_id:field(form,"brand_id")??"",older_group:form.get("older_group")==="on",other:form.get("other")==="on"}:{}),
 }},["/admin/catalogue/mobiles","/admin/audit"]);
}
