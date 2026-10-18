import { AdminMutationForm } from "@/components/admin-mutation-form";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pageClient } from "@/lib/admin/server";
import { manageCategoryAction } from "./actions";

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const supabase = await pageClient(["administrator","content_editor"]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?next=/admin/categories");
  }

  // Content editor or administrator role required
  const { data: staffData, error: staffError } = await supabase
    .from("staff_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (staffError) {

    throw new Error("Failed to verify staff permissions.");
  }

  if (!staffData || !["administrator", "content_editor"].includes(staffData.role)) {
    redirect("/admin");
  }

  const resolvedParams = await searchParams;
  const q = typeof resolvedParams.q === "string" ? resolvedParams.q.trim().slice(0, 100) : "";
  const statusFilter = ["active", "inactive", "all"].includes(typeof resolvedParams.status === "string" ? resolvedParams.status : "")
      ? resolvedParams.status
      : "all";

  let query = supabase
    .from("categories")
    .select(`*, category_attributes(*)`, { count: "exact" })
    .order("sort_order", { ascending: true })
    .limit(50);

  if (q) {
      query = query.or(`name.ilike.%${q.replace(/[\\%_]/g, "\\$&")}%,slug.ilike.%${q.replace(/[\\%_]/g, "\\$&")}%`);
  }

  if (statusFilter !== "all") {
      query = query.eq("is_active", statusFilter === "active");
  }

  const { data: filteredCategories, count } = await query;
  const safeCategories = filteredCategories || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-8">
      <div>
        <Link href="/admin" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
          ← Staff Portal
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Category Administration</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create and activate marketplace categories. Attribute schemas are read-only; schema editing is unavailable.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <form method="get" className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="q" className="block text-xs font-semibold text-gray-700 mb-1">Search Categories</label>
            <input
              type="text"
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Search by name or slug..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="w-full sm:w-48">
            <label htmlFor="status" className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
            <select
              id="status"
              name="status"
              defaultValue={statusFilter}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Disabled</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              Filter
            </button>
            {(q || statusFilter !== "all") && (
              <Link
                href="/admin/categories"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center"
              >
                Reset
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Categories table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-900">Current Categories</h2>
          <span className="text-xs text-gray-500 font-medium bg-white px-2.5 py-1 rounded-full border border-gray-200 shadow-sm">
            {count || safeCategories.length} result{(count || safeCategories.length) === 1 ? "" : "s"}
          </span>
        </div>

        {safeCategories.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">No categories found matching your criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 p-2 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {safeCategories.map((cat) => (
                <div key={cat.id} className="flex flex-col justify-between border border-gray-100 bg-white rounded-lg p-4 shadow-sm hover:shadow transition-shadow">
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate" title={cat.name}>{cat.name}</h3>
                        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 inline-block mt-1 truncate max-w-full" title={cat.slug}>
                          {cat.slug}
                        </code>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                          cat.is_active ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {cat.is_active ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2" title={cat.description || "No description"}>{cat.description || "No description"}</p>

                    {/* Attributes list */}
                    <div className="mt-2 flex flex-wrap gap-1 pt-2 border-t border-gray-50">
                      {cat.category_attributes?.length ? cat.category_attributes.map((attr) => (
                        <span
                          key={attr.id}
                          className="inline-flex items-center rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-600"
                          title={`${attr.label} (${attr.value_type})`}
                        >
                          {attr.label}
                          {attr.is_required && <span className="text-red-500 ml-0.5">*</span>}
                        </span>
                      )) : (
                        <span className="text-[10px] text-gray-400 italic">No attributes defined</span>
                      )}
                    </div>
                  </div>

                  {/* Status toggle form */}
                  <div className="pt-3 border-t border-gray-100 mt-auto flex justify-end">
                    <AdminMutationForm mutation={manageCategoryAction} confirm="Confirm this configuration change?">
                      <input type="hidden" name="action" value="update" />
                      <input type="hidden" name="category_id" value={cat.id} />
                      <input type="hidden" name="is_active" value={(!cat.is_active).toString()} />
                      <button
                        type="submit"
                        className={`rounded border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                          cat.is_active
                            ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {cat.is_active ? "Deactivate Category" : "Activate Category"}
                      </button>
                    </AdminMutationForm>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Category Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900">Add New Category</h2>
        <AdminMutationForm mutation={manageCategoryAction} confirm="Confirm this configuration change?" className="space-y-4">
          <input type="hidden" name="action" value="create" />
          <input type="hidden" name="is_active" value="true" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-gray-700">
                Display Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Musical Instruments"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-xs font-semibold text-gray-700">
                URL Slug *
              </label>
              <input
                id="slug"
                name="slug"
                type="text"
                required
                pattern="^[a-z0-9\-]+$"
                placeholder="e.g. musical-instruments"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-semibold text-gray-700">
              Description
            </label>
            <input
              id="description"
              name="description"
              type="text"
              placeholder="Guitars, keyboards, drums, and music accessories"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500"
            >
              Create Category
            </button>
          </div>
        </AdminMutationForm>
      </div>
    </div>
  );
}
