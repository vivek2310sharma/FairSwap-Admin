import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { readAuthConfig } from "./runtime-config";

const stages = ["configuration", "claims", "claims-validation", "identity", "identity-consistency", "account", "role", "eligibility", "mfa", "policy", "final", "proxy-claims", "refresh"] as const;
const outcomes = ["ok", "missing", "denied", "required", "malformed", "error", "exception", "attempt", "http-success", "http-error", "sdk-success"] as const;
export const PROVIDER_CODES = ["bad_jwt", "session_not_found", "session_expired", "refresh_token_not_found", "refresh_token_already_used", "user_not_found", "user_banned", "insufficient_aal"] as const;
const categories = ["none", "configuration-unavailable", "missing-data", "invalid-claims", "identity-inconsistent", "ineligible", "mfa-required", "policy-required", "malformed-policy", "code-unavailable", "unclassified", ...PROVIDER_CODES] as const;
export const diagnosticEventSchema = z.object({
  timestamp: z.string().datetime(),
  group: z.enum(["guard", "proxy"]),
  correlationId: z.string().uuid(),
  stage: z.enum(stages),
  outcome: z.enum(outcomes),
  category: z.enum(categories),
  status: z.number().int().min(100).max(599).optional(),
  fixture: z.literal("UNKNOWN"),
}).strict();
export type DiagnosticEvent = z.infer<typeof diagnosticEventSchema>;
type Stage = typeof stages[number];
type Outcome = typeof outcomes[number];
type Category = typeof categories[number];
export type Diagnostics = {
  readonly enabled: boolean;
  emit: (stage: Stage, outcome: Outcome, error?: unknown, category?: Category, status?: number) => void;
};
const silent: Diagnostics = Object.freeze({ enabled: false, emit: () => {} });
const contexts = new WeakMap<object, Diagnostics>();
// Only a non-identifying output budget is process-global; request state is not.
let outputBudget = 256;
function localSink(event: DiagnosticEvent) {
  if (outputBudget > 0) { outputBudget--; console.info("[admin-auth-diag]", JSON.stringify(event)); }
}
function ownValue(object: unknown, key: string): unknown {
  try {
    if (!object || (typeof object !== "object" && typeof object !== "function")) return undefined;
    return Object.getOwnPropertyDescriptor(object, key)?.value;
  } catch { return undefined; }
}
export function safeErrorMetadata(error: unknown) {
  const code = ownValue(error, "code");
  const rawStatus = ownValue(error, "status");
  const category: Category = typeof code === "string" && (PROVIDER_CODES as readonly string[]).includes(code) ? code as Category : "unclassified";
  const status = typeof rawStatus === "number" && Number.isInteger(rawStatus) && rawStatus >= 100 && rawStatus <= 599 ? rawStatus : undefined;
  return { category, status };
}

export function sdkError(result: unknown) { return ownValue(result, "error"); }
/** Read only data descriptors; diagnostic inspection never invokes accessors. */
export function observeResult(diagnostics: Diagnostics, stage: Stage, result: unknown, present?: boolean) {
  const error = sdkError(result);
  const hasData = present ?? !!ownValue(result, "data");
  diagnostics.emit(stage, error ? "error" : hasData ? "ok" : "missing", error, hasData ? "none" : "missing-data");
}

/** Conservative CLI subset: no attached values, positionals, terminator or
 * other options. Reject rather than approximate Commander's full grammar. */
function hasLoopbackBinding(argv: string[]): boolean {
  if (!/[\\/]next[\\/]dist[\\/]bin[\\/]next(?:\.js)?$/.test(argv[1] ?? "") ||
    !["start", "dev"].includes(argv[2] ?? "")) return false;
  let hostname = false;
  let port = false;
  for (let index = 3; index < argv.length; index += 2) {
    const option = argv[index];
    const value = argv[index + 1];
    if (option === "--hostname" || option === "-H") {
      if (hostname || !["127.0.0.1", "localhost"].includes(value)) return false;
      hostname = true;
    } else if (option === "--port" || option === "-p") {
      if (port || !/^[1-9]\d{0,4}$/.test(value ?? "") || Number(value) > 65535) return false;
      port = true;
    } else return false;
  }
  return hostname;
}

/** Requires server-owned opt-in AND an explicit loopback Next CLI binding.
 * Host/URL alone, NODE_ENV, cookies and diagnostic headers cannot enable it.
 * Internal runtime/sink seams are for isolated tests, never incoming inputs.
 */
export function createDiagnostics(host: string, group: "guard" | "proxy", forwarded = false,
  runtime: { env?: NodeJS.ProcessEnv; argv?: string[]; sink?: (event: DiagnosticEvent) => void } = {}): Diagnostics {
  try {
    const env = runtime.env ?? process.env;
    const argv = runtime.argv ?? process.argv;
    const hosted = ["VERCEL", "VERCEL_ENV", "CI", "AWS_LAMBDA_FUNCTION_NAME", "K_SERVICE", "WEBSITE_INSTANCE_ID", "NETLIFY", "CF_PAGES", "FLY_APP_NAME", "RENDER", "RAILWAY_ENVIRONMENT", "DENO_DEPLOYMENT_ID"].some((key) => !!env[key]);
    if (env.FAIRSWAP_AUTH_DIAGNOSTICS !== "loopback" || hosted || forwarded || readAuthConfig(env)?.environment !== "test" ||
      !/^(127\.0\.0\.1|localhost)(:\d{1,5})?$/.test(host) || !hasLoopbackBinding(argv)) return silent;
    const correlationId = randomUUID();
    const sink = runtime.sink ?? localSink;
    let remaining = 32;
    return { enabled: true, emit(stage, outcome, error, category = "none", status) {
      try {
        if (remaining <= 0) return;
        remaining--;
        const metadata = error == null ? { category, status } : safeErrorMetadata(error);
        // Explicit fields only: never serialize an input/error and then redact.
        const event = diagnosticEventSchema.safeParse({ timestamp: new Date().toISOString(), group, correlationId,
          stage, outcome, category: metadata.category, ...(metadata.status === undefined ? {} : { status: metadata.status }), fixture: "UNKNOWN" });
        if (event.success) sink(Object.freeze(event.data));
      } catch { /* Diagnostics are observational and must never escape. */ }
    } };
  } catch { return silent; }
}

/** Reliable linkage only within the same request-local SDK client. */
export function attachDiagnostics(client: object, diagnostics: Diagnostics) { contexts.set(client, diagnostics); }
export function diagnosticsFor(client: object): Diagnostics { return contexts.get(client) ?? silent; }

export function requestDiagnostics(host: string, group: "guard" | "proxy", headers: Pick<Headers, "get">) {
  try {
    const forwarded = headers.get("forwarded");
    const forwardedHost = headers.get("x-forwarded-host");
    const forwardedFor = headers.get("x-forwarded-for");
    const nonlocal = !!forwarded || (!!forwardedHost && forwardedHost !== host) ||
      (!!forwardedFor && !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(forwardedFor));
    return createDiagnostics(host, group, nonlocal);
  } catch { return silent; }
}
