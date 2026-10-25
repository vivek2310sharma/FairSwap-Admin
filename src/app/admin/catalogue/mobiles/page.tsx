import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { pageClient } from "@/lib/admin/server";
import { AdminMutationForm } from "@/components/admin-mutation-form";
import { manageMobileCatalogue } from "./actions";
const entry=z.object({id:z.string().uuid(),name:z.string(),aliases:z.array(z.string()),enabled:z.boolean(),sort_order:z.number(),brand_id:z.string().uuid().optional(),older_group:z.boolean().optional(),other:z.boolean().optional()});
type Entry=z.infer<typeof entry>;
const cls="mt-1 block min-h-11 w-full rounded-md border border-gray-300 bg-white p-2";
function Editor({item,kind,brand}:{item?:Entry;kind:"brand"|"model";brand?:string}) {
 return <AdminMutationForm mutation={manageMobileCatalogue} confirm="Save these catalogue details? Existing listings retain their selected identifiers." className="space-y-3 rounded-xl border bg-white p-4">
  <input type="hidden" name="kind" value={kind}/>{item&&<input type="hidden" name="id" value={item.id}/>}{kind==="model"&&<input type="hidden" name="brand_id" value={item?.brand_id??brand}/>}
  <label className="block">Name<input name="name" required maxLength={100} defaultValue={item?.name} className={cls}/></label>
  <label className="block">Aliases (comma separated)<input name="aliases" maxLength={2000} defaultValue={item?.aliases.join(", ")} className={cls}/></label>
  <label className="block">Display order<input type="number" min={0} max={100000} name="sort_order" required defaultValue={item?.sort_order??0} className={cls}/></label>
  <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="enabled" defaultChecked={item?.enabled??true}/>Enabled for new selections</label>
  {kind==="model"&&<><label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="older_group" defaultChecked={item?.older_group}/>Older model group</label><label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="other" defaultChecked={item?.other}/>Other model (requires seller text and staff review)</label></>}
  <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-3 text-white">{item?"Save":"Add"} {kind}</button>
 </AdminMutationForm>;
}
export default async function MobileCataloguePage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 const client=await pageClient(["administrator","content_editor"]) as SupabaseClient;
 const params=await searchParams;const brandsResult=await client.from("phone_brands").select("*").order("sort_order").order("id").limit(100);
 const brands=z.array(entry).parse(brandsResult.data);const brand=typeof params.brand==="string"&&brands.some(b=>b.id===params.brand)?params.brand:brands[0]?.id;
 const page=typeof params.page==="string"&&/^\d{1,5}$/.test(params.page)?Math.max(0,Number(params.page)):0;
 const q=typeof params.q==="string"?params.q.slice(0,100).replace(/[%_\\]/g,""):"";
 let query=client.from("phone_models").select("*",{count:"exact"}).eq("brand_id",brand??"00000000-0000-0000-0000-000000000000").order("sort_order").order("id").range(page*30,page*30+29);
 if(q)query=query.ilike("name",`%${q}%`);const result=await query;const models=z.array(entry).parse(result.data);
 const href=(p:number)=>`/admin/catalogue/mobiles?${new URLSearchParams({brand:brand??"",q,page:String(p)})}`;
 return <div className="space-y-6"><Link href="/admin/categories">Back to categories</Link><h1 className="text-2xl font-bold">Mobile Catalogue</h1><p>Catalogue changes are audited. Included items and warranty are seller-declared. Catalogue settings cannot disable security controls or activate a posting route.</p>
  <form className="flex flex-wrap items-end gap-3"><label>Brand<select className={cls} name="brand" defaultValue={brand}>{brands.map(b=><option key={b.id} value={b.id}>{b.name}{b.enabled?"":" (disabled)"}</option>)}</select></label><label>Search models<input className={cls} name="q" defaultValue={q}/></label><button className="rounded border px-4 py-3">Filter</button></form>
  {brand&&<><details><summary className="cursor-pointer py-3 font-semibold">Edit {brands.find(b=>b.id===brand)?.name}</summary><Editor kind="brand" item={brands.find(b=>b.id===brand)}/></details><h2 className="text-lg font-semibold">Models ({result.count??0})</h2><div className="grid gap-4 md:grid-cols-2">{models.map(m=><details key={m.id} className="rounded-lg border p-3"><summary className="cursor-pointer">{m.name}{m.enabled?"":" (disabled)"}</summary><Editor kind="model" item={m}/></details>)}</div><nav aria-label="Model pages" className="flex gap-4">{page>0&&<Link href={href(page-1)}>Previous</Link>}{(page+1)*30<(result.count??0)&&<Link href={href(page+1)}>Next</Link>}</nav><details><summary className="cursor-pointer py-3 font-semibold">Add model</summary><Editor key={brand} kind="model" brand={brand}/></details></>}
  <details><summary className="cursor-pointer py-3 font-semibold">Add brand</summary><Editor kind="brand"/></details>
 </div>;
}
