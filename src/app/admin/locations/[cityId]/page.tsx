import { AdminMutationForm } from "@/components/admin-mutation-form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pageClient } from "@/lib/admin/server";
import { manageLocationAction } from "../actions";
import type { Locality } from "@/types/listing";
import { loadLocalities } from "@/lib/admin/locations";

export default async function AdminCityLocalitiesPage({ params, searchParams }: { params: Promise<{ cityId: string }>; searchParams: Promise<{ q?: string; page?: string }> }) {
  const supabase = await pageClient(["administrator"]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?next=/admin/locations");
  }

  // Administrator role required
  const { data: staffData, error: staffError } = await supabase
    .from("staff_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (staffError) {
    throw new Error("Failed to verify staff permissions.");
  }

  if (!staffData || staffData.role !== "administrator") {
    redirect("/admin");
  }

  const { cityId } = await params;
  const resolvedSearchParams = await searchParams;

  const { city, localities, hasMore, total, page, q } = await loadLocalities(supabase, cityId, resolvedSearchParams);

  const pageLink = (number: number) => `/admin/locations/${cityId}?${new URLSearchParams({ q, page: String(number) })}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-8">
      <div>
        <Link href="/admin/locations" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
          ← Back to Cities
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold text-gray-900">{city.name} Localities</h1>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              city.is_active ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
            }`}
          >
            {city.is_active ? "City Active" : "City Disabled"}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          State: {city.state} | Slug: {city.slug} | ID: <span className="font-mono text-xs">{city.id}</span>
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden space-y-4 p-6">
         <form className="flex gap-2">
          <label>Search localities <input name="q" defaultValue={q} maxLength={100} placeholder="Locality name..." className="border border-gray-300 rounded px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" /></label>
          <button type="submit" className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500">Search</button>
        </form>

        <div className="flex justify-between items-center text-sm text-gray-600 mt-4 border-b pb-4">
           <span>Total localities: <span className="font-semibold text-gray-900">{total}</span></span>
           <span>Page {page}</span>
        </div>

        {localities.length === 0 ? (
           <div className="p-8 text-center text-gray-500 text-sm">No localities found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {localities.map((loc: Locality) => (
              <div
                key={loc.id}
                className={`flex items-center justify-between gap-2 rounded-md border p-3 ${
                  loc.is_active
                    ? "border-gray-200 bg-white shadow-sm"
                    : "border-gray-100 bg-gray-50 text-gray-500"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${!loc.is_active && "line-through text-gray-400"}`} title={loc.name}>
                    {loc.name}
                  </p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5 truncate" title={loc.slug}>
                    {loc.slug}
                  </p>
                </div>

                <AdminMutationForm mutation={manageLocationAction} confirm="Confirm this configuration change?">
                  <input type="hidden" name="action" value="update_locality" />
                  <input type="hidden" name="locality_id" value={loc.id} />
                  <input type="hidden" name="is_active" value={(!loc.is_active).toString()} />
                  <button
                    type="submit"
                    className={`rounded border px-3 py-1.5 text-[10px] font-semibold transition-colors ${
                      loc.is_active
                        ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {loc.is_active ? "Deactivate" : "Activate"}
                  </button>
                </AdminMutationForm>
              </div>
            ))}
          </div>
        )}

        <nav aria-label="Locality pages" className="flex gap-4 pt-4 mt-4 border-t border-gray-100">
          {page > 1 && <Link href={pageLink(page - 1)} className="text-sm font-medium text-emerald-600 hover:text-emerald-700">← Previous</Link>}
          {hasMore && <Link href={pageLink(page + 1)} className="text-sm font-medium text-emerald-600 hover:text-emerald-700">Next →</Link>}
        </nav>
      </div>

      <details className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <summary className="cursor-pointer font-semibold text-emerald-600 hover:text-emerald-700 text-sm">
          + Add New Locality to {city.name}
        </summary>
        <AdminMutationForm mutation={manageLocationAction} confirm="Confirm this configuration change?" className="mt-4 space-y-4">
          <input type="hidden" name="action" value="create_locality" />
          <input type="hidden" name="city_id" value={city.id} />
          <input type="hidden" name="is_active" value="true" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="loc_name" className="block text-xs font-semibold text-gray-700 mb-1">
                Locality Name *
              </label>
              <input
                id="loc_name"
                name="name"
                type="text"
                required
                placeholder="e.g. Civil Lines"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="loc_slug" className="block text-xs font-semibold text-gray-700 mb-1">
                URL Slug *
              </label>
              <input
                id="loc_slug"
                name="slug"
                type="text"
                required
                placeholder="e.g. civil-lines"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Add Locality
          </button>
        </AdminMutationForm>
      </details>
    </div>
  );
}
