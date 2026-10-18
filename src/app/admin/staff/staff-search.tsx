"use client";

import { useState, useCallback, useTransition } from "react";
import { Search, UserCheck } from "lucide-react";
import type { Database } from "@/types/database";
import { searchUsersAction } from "./actions";

type UserResult = Database["public"]["Functions"]["admin_search_users"]["Returns"][0];

export function StaffSearch({ onSelect }: { onSelect: (user: UserResult) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim()) return;

      setHasSearched(true);
      setError(null);
      startTransition(async () => {
        try {
          const res = await searchUsersAction(query.trim());
          if (res.error) {
            setError(res.error);
            setResults([]);
          } else {
            setResults(res.data || []);
          }
        } catch {
          setError("Failed to search. Please try again.");
          setResults([]);
        }
      });
    },
    [query]
  );

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or UUID..."
            className="w-full rounded-md border border-gray-300 pl-9 pr-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <button
          type="submit"
          disabled={isPending || !query.trim()}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
        >
          {isPending ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {hasSearched && !isPending && results.length === 0 && !error && (
        <p className="text-sm text-gray-500">No users found.</p>
      )}

      {results.length > 0 && (
        <div className="border border-gray-200 rounded-md overflow-hidden bg-gray-50">
          <ul className="divide-y divide-gray-200">
            {results.map((user) => (
              <li
                key={user.user_id}
                className="flex items-center justify-between p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.display_name || "Unnamed User"}
                    </p>
                    {user.role && (
                      <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-800">
                        {user.role}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  <p className="text-[10px] font-mono text-gray-400 truncate mt-0.5">
                    {user.user_id}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Status: <span className="font-semibold">{user.account_status}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelect(user)}
                  className="ml-4 flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
                >
                  <UserCheck className="h-3 w-3" /> Select
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
