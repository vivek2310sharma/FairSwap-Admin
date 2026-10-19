import { AdminMutationForm } from "@/components/admin-mutation-form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pageClient } from "@/lib/admin/server";
import { manageLocationAction } from "./actions";
import { loadLocations } from "@/lib/admin/locations";

export default async function AdminLocationsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
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

  const { cities, hasMore, page, q } = await loadLocations(supabase, await searchParams);
  const pageLink = (number: number) => `/admin/locations?${new URLSearchParams({ q, page: String(number) })}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-8">
      <div>
        <Link href="/admin" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
          ← Staff Portal
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Location Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage marketplace cities and their constituent localities for localized classified discovery.
        </p>
      </div>

      {/* Configured Cities & Localities */}
      <div className="space-y-6">
        <h2 className="text-base font-bold text-gray-900">Configured Cities & Localities</h2>
        <form className="flex gap-2">
          <label>City name <input name="q" defaultValue={q} maxLength={100} className="border rounded px-2 py-1" /></label>
          <button type="submit" className="border rounded px-3">Search</button>
        </form>
        <p className="text-xs text-gray-600">Page {page}. Select a city to manage its complete, paginated catalog of localities.</p>
        <nav aria-label="City pages" className="flex gap-4">
          {page > 1 && <Link href={pageLink(page - 1)}>Previous cities</Link>}
          {hasMore && <Link href={pageLink(page + 1)}>Next cities</Link>}
        </nav>
        {cities.length === 0 && <p>No cities match this search.</p>}
        {cities?.map((city: { id: string, name: string, slug: string, is_active: boolean, state: string, localities_count?: number }) => (
          <div key={city.id} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900">{city.name}</h3>
                  <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                    {city.slug}
                  </code>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      city.is_active ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {city.is_active ? "Active" : "Disabled"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">State: {city.state}</p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/locations/${city.id}`}
                  className="rounded border border-emerald-600 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  Manage {city.localities_count} Localities →
                </Link>
                {/* City status toggle */}
                <AdminMutationForm mutation={manageLocationAction} confirm="Confirm this configuration change?">
                  <input type="hidden" name="action" value="update_city" />
                  <input type="hidden" name="city_id" value={city.id} />
                  <input type="hidden" name="is_active" value={(!city.is_active).toString()} />
                  <button
                    type="submit"
                    className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    {city.is_active ? "Deactivate City" : "Activate City"}
                  </button>
                </AdminMutationForm>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New City Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900">Add New City</h2>
        <AdminMutationForm mutation={manageLocationAction} confirm="Confirm this configuration change?" className="space-y-4">
          <input type="hidden" name="action" value="create_city" />
          <input type="hidden" name="is_active" value="true" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="city_name" className="block text-xs font-semibold text-gray-700">
                City Name *
              </label>
              <input
                id="city_name"
                name="name"
                type="text"
                required
                placeholder="e.g. Udaipur"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="city_state" className="block text-xs font-semibold text-gray-700">
                State *
              </label>
              <input
                id="city_state"
                name="state"
                type="text"
                required
                placeholder="e.g. Rajasthan"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="city_slug" className="block text-xs font-semibold text-gray-700">
                Slug *
              </label>
              <input
                id="city_slug"
                name="slug"
                type="text"
                required
                placeholder="e.g. udaipur"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
          >
            Create City
          </button>
        </AdminMutationForm>
      </div>
    </div>
  );
}
