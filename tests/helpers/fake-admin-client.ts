/**
 * In-memory stand-in for the guarded Admin page client. No network, so tests can never reach a
 * hosted project. It records every query, and each table can resolve normally, resolve with an
 * `error`, or reject (which is what `pageClient`'s checked proxy does for failed reads).
 */
export interface QueryRecord {
  table: string;
  select?: string;
  eq: Array<[string, unknown]>;
  inValues?: unknown[];
  limit?: number;
  order?: string;
  method?: "single" | "maybeSingle" | "list";
}

export type TableOutcome =
  | { data?: unknown; error?: { message: string; code?: string } | null }
  | { throws: true };

export function createFakeAdminClient(options: {
  user?: { id: string } | null;
  tables?: Record<string, TableOutcome | ((q: QueryRecord) => TableOutcome)>;
}) {
  const queries: QueryRecord[] = [];
  const user = options.user === undefined ? { id: "staff-1" } : options.user;

  const from = (table: string) => {
    const q: QueryRecord = { table, eq: [], method: "list" };
    queries.push(q);

    const finish = () => {
      const entry = options.tables?.[table];
      const outcome = typeof entry === "function" ? entry(q) : entry;
      if (outcome && "throws" in outcome) {
        return Promise.reject(new Error("Data unavailable. Refresh or contact the backend owner."));
      }
      let data = outcome?.data ?? null;
      // Single-row reads return one row (or null), like PostgREST's single / maybeSingle.
      if ((q.method === "single" || q.method === "maybeSingle") && Array.isArray(data)) {
        data = data[0] ?? null;
      }
      return Promise.resolve({ data, error: outcome?.error ?? null });
    };

    const builder: Record<string, unknown> = {
      select(columns?: string) {
        q.select = columns;
        return builder;
      },
      eq(column: string, value: unknown) {
        q.eq.push([column, value]);
        return builder;
      },
      in(_column: string, values: unknown[]) {
        q.inValues = values;
        return builder;
      },
      order(column: string) {
        q.order = column;
        return builder;
      },
      limit(n: number) {
        q.limit = n;
        return builder;
      },
      single() {
        q.method = "single";
        return finish();
      },
      maybeSingle() {
        q.method = "maybeSingle";
        return finish();
      },
      then(onFulfilled: (v: unknown) => unknown, onRejected?: (r: unknown) => unknown) {
        return finish().then(onFulfilled, onRejected);
      },
    };
    return builder;
  };

  return {
    client: {
      auth: {
        getUser: async () => ({ data: { user }, error: user ? null : { message: "no session" } }),
      },
      from,
    },
    queries,
  };
}
