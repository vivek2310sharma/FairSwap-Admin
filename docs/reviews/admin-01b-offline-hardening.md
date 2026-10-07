# ADMIN-01B offline hardening review

Date: 2026-10-05. Application source: `77a5c741b879ecd4315083069cfeb32c127cd09f`. This isolated local test/docs branch does not update draft PR #3. Antigravity remains primary. No application source, dependencies, configuration, historical progress or risks changed.

## Evidence boundaries

Hosted run 37367011835 attempt 2 / job 111962444757 passed 228 tests in six files and other checks for synthetic PR merge `f7f54e75cfd581d8bfed53ae16bd52a058cf0cf5`, whose parents were staging `454f0f77e3f7e25df15ca6736a30e590e9ca6f17` and the reviewed head. These are preserved historical hosted results, not validation of this local branch. Attempt 1's runner-acquisition failure remains infrastructure evidence with cause unknown.

The latest supervised session retains successful guard groups, an owner-reported confirmed/200 Admin baseline, and owner-reported after-Web HTTP 200. Exact after-Web JSON, Web browser context and unique request association remain unconfirmed. No after-Web Admin denial was observed. This is partial evidence consistent with non-reproduction, not a complete acceptance result. Historical session-loss observations and gates remain separate. Detailed private artifact evidence is kept outside Git.

## Coverage map at the reviewed head

Names below are literal Vitest declaration titles; `%s`/`%j` identify parameterized cases, not separate end-to-end journeys. The inventory below lists every existing auth/security declaration with its source line. SDK doubles control intermediate responses; production guard/mutation/adapter functions decide outcomes. UI tests mock actions and establish presentation only.

| Requirement | Exact existing test names (file) | Production path / scope |
| --- | --- | --- |
| Runtime Test-only / zero-call rejection | `rejects configuration before SDK construction (%s, %s)`; `revalidates configuration after an earlier valid request`; `constructs a new client per call and filters Web cookies` (`auth.test.ts`); `keeps sign-in disabled with configuration unset and makes no calls` (`auth-ui.test.tsx`) | `auth/runtime-config.ts:readAuthConfig`, `supabase/client.ts:createAdminClient`, `auth/guard.ts:requireStaffAccess`, `auth/mutations.ts:authMutation`; synthetic settings, no live environment |
| Verified claims and confirmed identity | `rejects unverified/forged cookie identity without querying staff`; `rejects Auth identity lookup failure`; `rejects invalid verified identity field %s` (`auth.test.ts`); `uses the real SDK to reject a forged JWT through a controlled transport` (`auth-sdk.test.ts`) | `guard.ts:staffAccess` exact issuer/audience/subject/expiry/role/AAL and `getUser` confirmation; real SDK rejects via controlled verification transport, not deployed keys |
| Staff account / role | `allows active %s AAL2 with current policy`; `rejects role %s despite forged user metadata`; `denies account %s`; `denies lookup errors and thrown diagnostics safely` (`auth.test.ts`) | `staffAccess` self-user `user_accounts` / `staff_roles` queries; live grants/RLS unavailable |
| AAL1 bootstrap / AAL2 protected | `permits AAL1 bootstrap reading only self eligibility, never policy or staff data`; `direct protected route invocation denies AAL1 and returns private responses`; `successful-looking challenge without a verified AAL2 token remains denied`; `reverifies claims after successful MFA before redirecting` (`auth.test.ts`) | `staffAccess(false/true)`, protected route `GET`, `authMutation(verify)`; the first title's “staff data” means protected workflow data, since self-role eligibility is queried |
| Policy true / false / error / malformed | `distinguishes policy result %j`; `denies both policy error and exception without leaking messages`; `protected page blocks stale policy and rechecks it each invocation` (`auth.test.ts`); `preserves result/order/SDK-query arguments for %s` (`auth-diagnostics.test.ts`) | `staffAccess` only literal true allows; `AdminPage`; policy RPC double, no consent mutation |
| Direct server boundaries | `direct protected route verifies identity and policy without navigation`; `direct protected action fails closed on policy errors`; `direct MFA action cannot grant access from a submitted role/AAL`; `rejects origin %s before any client use`; `restricts redirects %s` (`auth.test.ts`) | `/admin/access:GET`, `auth/actions.ts:recheckAction/verifyAction`, `mutations.ts`, `inputs.ts`; independent of navigation |
| Cookie propagation / cache / forwarding | `refresh cookies survive the proxy response and reach downstream requests`; `server-action refreshed cookies remain in the outgoing cookie store on redirect` (`auth.test.ts`); `real NextRequest forwarding preserves original Host for proxy diagnostics`; `proxy preserves cookies/cache and safely observes getClaims %s`; `proxy sink failure cannot prevent downstream cookie propagation` (`auth-diagnostics.test.ts`) | `src/proxy.ts:proxy`, `supabase/server.ts:requestClient`, `createAdminClient/adminCookieOptions`; host-only/Secure flags asserted offline, not hosted transport/CDN |
| Fixed real-SDK transport | `blocks unexpected destinations before fetch`; `forces no-store and refuses HTTP redirects on the fixed Test origin`; forged-JWT test above (`auth-sdk.test.ts`); `real SDK refresh %s distinguishes HTTP from SDK outcome without leaking session data` (`auth-diagnostics.test.ts`) | `client.ts:testOnlyFetch/observeRefresh`, SDK 2.116.0; transport doubles are not live provider validation |
| Refresh / isolation | `does not label claims/user/password requests or SDK events alone as refresh`; `keeps request/cancellation semantics and returns the identical unconsumed response`; `preserves a transport exception identity and emits unclassified without retry`; `concurrent clients keep refresh observation and groups separate` (`auth-diagnostics.test.ts`) | `observeRefresh`, HTTP versus SDK success, unchanged response/cancellation; existing concurrency test did not combine cookies and authorization |
| Diagnostic leakage / activation | `constructs only exact permitted fields, never arbitrary properties`; `does not invoke throwing accessors or traverse cyclic objects`; `bounds each event group and cannot share correlation/fixture identity`; `schema failure and throwing sink never escape`; `malformed event primitives cannot emit arbitrary values`; `emits nothing by default, despite incoming diagnostic inputs`; `blocks hosted marker %s`; `public endpoint is identical with diagnostics on/off for %s` (`auth-diagnostics.test.ts`) | `diagnostics.ts:createDiagnostics/requestDiagnostics/observeResult`; finite schema, budgets, process opt-in, loopback CLI/forwarding restrictions and output parity |
| MFA boundary / UI | `failed challenge stays denied and cannot fall back to enrollment`; `rejects foreign factors and unverified-factor bypass when a verified factor exists`; `page rendering never enrolls a factor or reads protected data at AAL1` (`auth.test.ts`); `existing-factor challenge provides no enrollment bypass and validates the code` (`auth-ui.test.tsx`) | `mutations.ts:authMutation/ownFactors`, `MfaPage`, `MfaForms`; existing tests covered challenge failure but lacked empty/missing/malformed/error lookup matrix through mutation |

## Selected gaps and new tests

| Exact new declaration | Gap addressed / production path | Limit |
| --- | --- | --- |
| `interleaved clients isolate cookie writes, guard outcomes and diagnostic groups` | `createAdminClient` adapter filters and cookie options + `staffAccess`: hold one request's claims while another finishes with AAL1 denial; distinct identities, writes, final outcomes, query/RPC boundaries and correlations | SSR construction is doubled; guards and adapters are real. Not cross-app provider policy |
| `direct route discards a prior allow when fresh %s changes` (account, role, policy) | Actual `GET -> requireStaffAccess -> requestClient -> staffAccess`, fresh success then account suspension, role removal or policy false; verifies new construction and queries, 200/confirmed then 403/denied with private cache | Controlled intermediate SDK state, not real fixture mutation |
| `MFA verification refuses %s factor lookup without enrollment fallback` (empty, missing, malformed, error) | Actual `authMutation(verify) -> staffAccess -> ownFactors`; no challenge/enrollment/redirect/policy on invalid lookup | No live factor operation |
| `rotates cookies and isolates failed refresh with expired=%s` (false, true) | Real SSR 0.12.7 / SDK 2.116.0 through `createAdminClient/observeRefresh`: synthetic token rotation, fresh-client cookie continuity, failure preserves valid token versus removes expired session, no Web-cookie writes, exactly two fetch-double calls | Fake clock and in-process transport. `getSession` asserts adapter continuity only, never authorization or real session validity |

No duplicate Host/CLI matrix, new framework or production changes were warranted. All original assertions remain. Ten new cases in two files. Fixtures are synthetic; the established fetch rejection remains, with explicit controlled responses only where needed. Fake clocks, mocks and environment stubs are restored.

The first SSR test incorrectly expected a failed refresh to clear a still-valid session and emitted a jsdom multiple-client warning. Installed SDK `GoTrueClient._callRefreshToken` explicitly preserves a valid access token after proactive refresh failure. The corrected regression distinguishes valid versus expired state and uses a Node server test environment; two targeted cases pass without that warning. This was a fixture-contract correction, not a confirmed production defect.

## Local validation

See the validation table appended after actual execution. No historical CI result is substituted for this branch. No live backend behavior, shared session policy, hosted cookie/CDN behavior or complete ADMIN-01B acceptance is established by these tests. All seven risks remain OPEN / UNVERIFIED; ADMIN-01C NOT STARTED / NOT TESTED.

## Remaining acceptance

Use the [remaining acceptance runbook](../runbooks/admin-01b-remaining-acceptance.md). Review this isolated test/docs delta before any future integration; this is not a newly agreed merge requirement. No new authentication sequence or launcher is authorized by this document.

## Complete existing auth/security declaration inventory

Source lines refer to the unchanged reviewed files. Parameterized declaration titles are retained literally; outcomes above identify the relevant contracts. Configuration tests exercise `src/lib/config.ts:validateFoundationConfig`.

| File:line | Exact declaration title |
| --- | --- |
| `tests/auth.test.ts:68` | `rejects configuration before SDK construction (%s, %s)` |
| `tests/auth.test.ts:84` | `revalidates configuration after an earlier valid request` |
| `tests/auth.test.ts:90` | `constructs a new client per call and filters Web cookies` |
| `tests/auth.test.ts:102` | `allows active %s AAL2 with current policy` |
| `tests/auth.test.ts:110` | `rejects role %s despite forged user metadata` |
| `tests/auth.test.ts:113` | `denies account %s` |
| `tests/auth.test.ts:116` | `rejects unverified/forged cookie identity without querying staff` |
| `tests/auth.test.ts:121` | `rejects Auth identity lookup failure` |
| `tests/auth.test.ts:125` | `rejects invalid verified identity field %s` |
| `tests/auth.test.ts:135` | `denies lookup errors and thrown diagnostics safely` |
| `tests/auth.test.ts:141` | `permits AAL1 bootstrap reading only self eligibility, never policy or staff data` |
| `tests/auth.test.ts:147` | `distinguishes policy result %j` |
| `tests/auth.test.ts:151` | `denies both policy error and exception without leaking messages` |
| `tests/auth.test.ts:160` | `rejects origin %s before any client use` |
| `tests/auth.test.ts:165` | `restricts redirects %s` |
| `tests/auth.test.ts:166` | `supports loopback development with same-origin protection` |
| `tests/auth.test.ts:167` | `accepts an existing short password without signup rules, then uses MFA bootstrap` |
| `tests/auth.test.ts:174` | `rejects invalid input and invalid credentials without exposing details` |
| `tests/auth.test.ts:181` | `denies direct enrollment for a nonstaff user` |
| `tests/auth.test.ts:186` | `enrolls only by explicit mutation with no existing factors; never claims AAL2` |
| `tests/auth.test.ts:192` | `does not replace an existing %s factor` |
| `tests/auth.test.ts:198` | `failed challenge stays denied and cannot fall back to enrollment` |
| `tests/auth.test.ts:203` | `successful-looking challenge without a verified AAL2 token remains denied` |
| `tests/auth.test.ts:207` | `reverifies claims after successful MFA before redirecting` |
| `tests/auth.test.ts:213` | `rejects foreign factors and unverified-factor bypass when a verified factor exists` |
| `tests/auth.test.ts:219` | `targets local Admin signout explicitly` |
| `tests/auth.test.ts:224` | `reports signout errors without false success` |
| `tests/auth.test.ts:231` | `direct protected route invocation denies AAL1 and returns private responses` |
| `tests/auth.test.ts:238` | `direct protected route verifies identity and policy without navigation` |
| `tests/auth.test.ts:239` | `direct protected action fails closed on policy errors` |
| `tests/auth.test.ts:244` | `direct MFA action cannot grant access from a submitted role/AAL` |
| `tests/auth.test.ts:249` | `page rendering never enrolls a factor or reads protected data at AAL1` |
| `tests/auth.test.ts:253` | `protected page blocks stale policy and rechecks it each invocation` |
| `tests/auth.test.ts:256` | `refresh cookies survive the proxy response and reach downstream requests` |
| `tests/auth.test.ts:268` | `server-action refreshed cookies remain in the outgoing cookie store on redirect` |
| `tests/auth-sdk.test.ts:8` | `blocks unexpected destinations before fetch` |
| `tests/auth-sdk.test.ts:14` | `forces no-store and refuses HTTP redirects on the fixed Test origin` |
| `tests/auth-sdk.test.ts:19` | `uses the real SDK to reject a forged JWT through a controlled transport` |
| `tests/auth-ui.test.tsx:9` | `keeps sign-in disabled with configuration unset and makes no calls` |
| `tests/auth-ui.test.tsx:15` | `provides labelled email/password inputs and client validation` |
| `tests/auth-ui.test.tsx:23` | `does not enroll automatically and shows an explicit setup button` |
| `tests/auth-ui.test.tsx:28` | `existing-factor challenge provides no enrollment bypass and validates the code` |
| `tests/auth-ui.test.tsx:34` | `policy failures have distinct retry and local signout controls` |
| `tests/auth-diagnostics.test.ts:77` | `real NextRequest forwarding preserves original Host for proxy diagnostics` |
| `tests/auth-diagnostics.test.ts:94` | `proxy cannot enable diagnostics with rejected original headers %j` |
| `tests/auth-diagnostics.test.ts:113` | `proxy original Host cannot override prerequisite %s` |
| `tests/auth-diagnostics.test.ts:127` | `enables the supported unambiguous CLI grammar %j` |
| `tests/auth-diagnostics.test.ts:141` | `rejects ambiguous or unsupported CLI options %j` |
| `tests/auth-diagnostics.test.ts:174` | `emits nothing by default, despite incoming diagnostic inputs` |
| `tests/auth-diagnostics.test.ts:182` | `blocks hosted marker %s` |
| `tests/auth-diagnostics.test.ts:185` | `blocks non-loopback host %s` |
| `tests/auth-diagnostics.test.ts:188` | `blocks invalid server configuration %j` |
| `tests/auth-diagnostics.test.ts:192` | `does not trust Host without explicit Next loopback binding %j` |
| `tests/auth-diagnostics.test.ts:197` | `supports local production-mode builds without using NODE_ENV as authorization` |
| `tests/auth-diagnostics.test.ts:202` | `blocks nonlocal forwarding` |
| `tests/auth-diagnostics.test.ts:205` | `accepts Next's loopback forwarding but ignores diagnostic headers` |
| `tests/auth-diagnostics.test.ts:211` | `constructs only exact permitted fields, never arbitrary properties` |
| `tests/auth-diagnostics.test.ts:219` | `unknown errors never pass arbitrary strings (%j)` |
| `tests/auth-diagnostics.test.ts:223` | `does not invoke throwing accessors or traverse cyclic objects` |
| `tests/auth-diagnostics.test.ts:231` | `bounds each event group and cannot share correlation/fixture identity` |
| `tests/auth-diagnostics.test.ts:237` | `schema failure and throwing sink never escape` |
| `tests/auth-diagnostics.test.ts:243` | `malformed event primitives cannot emit arbitrary values` |
| `tests/auth-diagnostics.test.ts:254` | `preserves result/order/SDK-query arguments for %s` |
| `tests/auth-diagnostics.test.ts:262` | `sink/parser failures do not change guard success or early denial` |
| `tests/auth-diagnostics.test.ts:269` | `throwing SDK result accessors do not change original query ordering` |
| `tests/auth-diagnostics.test.ts:284` | `public endpoint is identical with diagnostics on/off for %s` |
| `tests/auth-diagnostics.test.ts:294` | `redirects and server-action cookie writes survive a failing sink` |
| `tests/auth-diagnostics.test.ts:305` | `proxy preserves cookies/cache and safely observes getClaims %s` |
| `tests/auth-diagnostics.test.ts:321` | `proxy sink failure cannot prevent downstream cookie propagation` |
| `tests/auth-diagnostics.test.ts:327` | `proxy query/header/cookie inputs cannot activate diagnostics without opt-in` |
| `tests/auth-diagnostics.test.ts:333` | `client construction exceptions retain existing failure behavior` |
| `tests/auth-diagnostics.test.ts:343` | `does not label claims/user/password requests or SDK events alone as refresh` |
| `tests/auth-diagnostics.test.ts:350` | `keeps request/cancellation semantics and returns the identical unconsumed response` |
| `tests/auth-diagnostics.test.ts:361` | `preserves a transport exception identity and emits unclassified without retry` |
| `tests/auth-diagnostics.test.ts:368` | `response metadata accessor failures still return the original response` |
| `tests/auth-diagnostics.test.ts:375` | `real SDK refresh %s distinguishes HTTP from SDK outcome without leaking session data` |
| `tests/auth-diagnostics.test.ts:388` | `concurrent clients keep refresh observation and groups separate` |
| `tests/auth-diagnostics.test.ts:394` | `client observer registration failure preserves SDK construction` |
| `tests/config.test.ts:5` | `keeps absent or incomplete configuration safely unconfigured: %j` |
| `tests/config.test.ts:15` | `recognises only the intended Test target without connecting` |
| `tests/config.test.ts:29` | `rejects malformed/wrong-target inputs without echoing values: %j` |

## Executed validation (2026-10-05/06 Europe/Copenhagen)

Commands ran only in the isolated worktree. Each validation process had FAIRSWAP_DEPLOYMENT_ENV, FAIRSWAP_SUPABASE_URL, FAIRSWAP_SUPABASE_PUBLISHABLE_KEY and FAIRSWAP_AUTH_DIAGNOSTICS cleared; CI=true and NEXT_TELEMETRY_DISABLED=1. No inherited values were printed. Tests stub only synthetic configuration. Node `v24.15.0`, pnpm `10.12.1`, Next `16.3.5`, Vitest `4.1.11`; dependency and script permissions unchanged.

| Actual command | Result |
| --- | --- |
| `npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm --version` (initial restricted original-workspace read) | Failed ENOTCACHED under sandbox cache access; no new toolchain installed. Same established wrapper worked with approved host access for subsequent isolated commands |
| `npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm install --frozen-lockfile` | PASS, exit 0; resolution skipped; 454 reused, 0 downloaded; ignored unrs-resolver build-script warning retained, no approve-builds |
| `npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm test:unit tests/auth-offline-hardening.test.ts` | PASS, 8/8 |
| `npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm test:unit tests/auth-ssr-sequence.test.ts` (initial) | FAIL, 1/1 due to incorrect valid-token removal expectation; jsdom multiple-client warning. Installed SDK contract inspected; fixture/environment corrected |
| Same SSR targeted command after specific correction | PASS, 2/2, Node test environment; no stderr warning |
| `npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm typecheck` (initial) | FAIL: TS2741 missing NODE_ENV in two synthetic ProcessEnv inputs; no application error |
| Same typecheck command after adding synthetic NODE_ENV | PASS, exit 0 |
| `npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm lint` | PASS twice (before and after final test edit), exit 0, zero warnings |
| `npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm test:unit` | Final full suite executed once: PASS, 238/238 tests across 8/8 files; zero skips/failures |
| `npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm build` | PASS, exit 0; static foundation and dynamic auth/Admin routes built; expected fresh-worktree no-build-cache warning, no server launched |
| `git diff --check` | PASS; repeated after staging to check added files as well |

No reproducible production defect established. A real environment-file name check found only the tracked placeholder `.env.example`; no real environment contents read or copied. Detailed local preservation/commit evidence is in the outside-repository morning handoff. None of these checks establishes live acceptance or closes a risk.
