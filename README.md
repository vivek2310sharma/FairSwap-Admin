# FairSwap Admin

FairSwap-Admin is the standalone staff application for FairSwap, using Next.js App Router, TypeScript, Tailwind CSS and Supabase. The root opens the guarded Admin dashboard.

| Environment | Current Admin address | Backend |
| --- | --- | --- |
| Production | https://admin.fairswap.in | FairSwapProd: kriuhwppxgxsyyrbjsau |
| Test integration | https://fairswap-admin-git-staging-fairswap.vercel.app/admin | FairSwapTest: wpppxlnbzqynvhpeuavd |

Verified 2026-10-08: Production source 2f1f2617b1274a3b1c280ecd742fa6b7171317a3, READY deployment dpl_G3DSMaodZwrHKSQrvfXWJiJDAiEF. Test integration currently serves e74b7bf406cbbe771a02b58bd652460b4c1d1852 / dpl_FRU1SCS1xyBS3PuCZzwavu7Dj552; staging already includes the later homepage fix. Automatic Preview builds can advance Test. admin-test.fairswap.in is not configured; the older test-rc alias is a retained acceptance checkpoint.

Vercel Authentication protects all deployments. Platform access and FairSwap staff authorization are separate requirements.

## Staff access and features

Existing staff sign in with email/password and complete TOTP MFA. Protected access requires verified identity/email, active account, permitted staff role, AAL2 and explicit current policy acceptance. Roles are administrator, moderator, support_agent and content_editor. Every page/action enforces its own role allowlist; navigation is not authorization. There is no public signup, social login or account-provisioning interface.

Implemented areas: dashboard/navigation, pending listing queue/detail and ready medium photos, manual approval/rejection with reviewed revision/status conflicts, account/staff views, case-scoped reports, support notes/replies/status, privacy queue, immutable audit reads, category catalogue and bounded cities/localities. Moderation/reports require administrator/moderator; support actions administrator/support_agent; category actions administrator/content_editor; location actions administrator. Existing backend RLS/RPC rules still apply.

Production restrictions are enforced on the server before backend client construction:

- Listing removal is disabled.
- Account suspension/reinstatement is disabled.
- Staff-role assignment/revocation is disabled.
- Privacy-status mutations are disabled.
- Account deletion, privacy-export fulfillment and category-schema editing remain unavailable.
- Automatic listing approval is not delivered by this cleanup.

Test retains existing capabilities subject to authorization. Production exclusions govern this application, not independently deployed clients or shared backend semantics. See [staff onboarding/recovery](docs/runbooks/staff-onboarding-recovery.md).

## Environments and workflow

main is the approved Production source branch; staging is the Test integration branch. Feature/fix/docs branch -> PR to staging -> CI and Test verification -> reviewed history-preserving PR to main. Reconciliation puts the already-deployed application into main without another release.

Automatic Test/Preview builds are distinct from deliberate Production releases. Vercel uses main as its Production branch, but the existing ignored-build command allows only Preview builds and skips Production. Keep that restriction for ordinary merges. Deliberate Production releases require separate explicit approval of the exact source/operation; see [production release](docs/runbooks/production-release.md).

Branch names alone do not select a backend. Request-time validated FAIRSWAP_DEPLOYMENT_ENV and exact FAIRSWAP_SUPABASE_URL select the environment with its matching server-only publishable key; platform VERCEL_ENV must agree. Production requires FAIRSWAP_ADMIN_RELEASE_STATE=active; maintenance denies access. NODE_ENV controls build mode only. Missing/malformed/mixed settings fail closed with no fallback or runtime selector.

Test/Production have distinct host-only HttpOnly cookies, MFA issuers and fixed marketplace/policy links. Policy completion happens in the corresponding marketplace with separate sign-in and manual return/fresh Admin check. Null/error policy checks deny access. No credential/token/account handoff occurs in URLs. Cookie isolation does not make same-project bearer tokens intrinsically hostname-bound. Hosted diagnostics stay disabled.

FairSwap-Web owns shared Supabase migrations, schema, RLS, grants and RPC contracts. Admin has no competing migration history. Web Admin was retired via PR #109 / b5369f2e19d11177ac45e69633a3310d23d4a9ed; old marketplace /admin URLs return standard themed HTTP 404s, not redirects here.

## Local setup and verification

Use Node >=24.15.0 <25 (verified baseline 24.15.0), pnpm 10.12.1, Next.js 16.3.5 and the committed pnpm-lock.yaml. Do not upgrade tooling for housekeeping.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm build
```

dev/start bind to loopback. The placeholder-only [.env.example](.env.example) lists settings. No real configuration is required for disabled-state builds/isolated tests; missing configuration enables no staff workflow. Separately authorized Test configuration uses the existing owner process; never commit real environment files or print credentials. pnpm build is a local production-mode check, not a Production deployment.

[CI](.github/workflows/ci.yml) runs pinned Node/pnpm, frozen install, typecheck, zero-warning lint, unit tests and build for PRs to staging/main and pushes to those branches. It supplies no live backend credentials and has no deployment step.

## Evidence and operations

[Progress](docs/PROGRESS.md) separates release, documentation and cleanup. [Provenance](docs/PROVENANCE.md) preserves the original Web pin 8ad67672896a1a11f51009ffddf3bb39ee3cf698 and the separately selected later migration snapshot.

Accepted Test evidence includes owner browser observations and separately corroborated saved fixtures/audits; this is not full authenticated Production acceptance. True simultaneous moderation, deliberate live duplicate submission, listing removal, extra role actors, account/staff/privacy mutations and pgTAP remain NOT RUN. Notification creation is not delivery/read. All seven [historical risks](docs/risks/admin-extraction.md) remain OPEN / UNVERIFIED. Historical failures/counts and local diagnostic details remain in progress and acceptance records. The full Web suite is not labelled passing; its documented PGlite limitations belong to Web.

Backups: Deferred by owner; not configured by this work.

Guidance: [AGENTS.md](AGENTS.md), [Admin rules](.agents/rules/admin.md).
Historical evidence: [ADMIN-01 plan](docs/plans/admin-01-plan.md), [migration](docs/plans/admin-feature-migration.md), [Test completion](docs/plans/admin-test-workflow-completion.md), [remaining auth acceptance](docs/runbooks/admin-01b-remaining-acceptance.md).

## Historical local diagnostics reference

The following ADMIN-01B diagnostic record retains the original schema, activation constraints and unverified live observations. Its assignment restrictions and unstarted milestone labels describe the earlier checkpoint; they grant no current authorization to activate diagnostics or repeat acceptance.

## Local authentication diagnostics (ADMIN-01B-DIAG)

Diagnostics are server-only, off by default, and observational. This delta does not fix authentication or prove a root cause. The preserved outside-repository acceptance report contains historical owner observations and investigation findings; they are not rewritten as passes. Full ADMIN-01B acceptance remains incomplete, ADMIN-01C unstarted, and all seven historical backend/security items OPEN / UNVERIFIED.

For a separately approved future local exercise only, set the server process environment `FAIRSWAP_AUTH_DIAGNOSTICS=loopback` and launch Next explicitly bound to `127.0.0.1` or `localhost`, for example `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3102`. The supported actual Node argv is the Next CLI followed by `start` or `dev`, exactly one standalone `--hostname VALUE` or `-H VALUE` (`127.0.0.1` or `localhost`), and optionally one standalone `--port VALUE` or `-p VALUE` (decimal 1–65535), in either option order. Attached values (`--hostname=VALUE`, `-HVALUE`, attached port forms), duplicate options, positional directory arguments, `--`, missing/malformed values and all other options are rejected. This conservative subset preserves the canonical launch above; unsupported invocations fail closed rather than approximating the complete Next/Commander grammar. The same validated Test target/publishable-key configuration is required; no credentials are needed in builds or isolated tests. A local production-mode build (`NODE_ENV=production`) is supported and does not select the FairSwap Production backend. This diagnostic task does not authorize starting a configured server or providing real credentials.

Loopback request host checks and forwarding checks apply as well as server-owned opt-in/binding. Proxy and guard diagnostics both use the original Host header; NextURL normalization is not binding evidence. Forwarded-host validation stays exact (including port), with no hostname-alias fallback. The earlier live activation gate remains failed because proxy events were not observed; isolated regression tests do not establish a successful live gate. Non-loopback forwarding, wrong/missing Test configuration, Vercel/CI and recognized hosted runtime markers disable output. A Host header, query, cookie, form value or diagnostic header cannot enable it. Child-worker/wrapper launchers without the explicit Next CLI binding in their own argv fail closed, including dev workers that do not retain the CLI argv. Clear/unset the flag or use any value other than `loopback` to disable; restart the local process to apply owner changes. Never activate in hosting. No environment file is created by diagnostics.

The local sink writes `[admin-auth-diag]` plus a schema-validated JSON event to console stdout only. It is capped at 32 events per request-local client/group and 256 events per process lifetime; restart resets the output budget. It performs no remote export, file capture or telemetry. Proxy and server-client groups have independently server-generated random UUIDs; linkage exists only within the same request-local client. No ID is read from incoming headers or derived from a credential/identity. Association is always `UNKNOWN`: no approved-fixture identity reference is configured or verified, and timing alone is not attribution.

Exact event keys: `timestamp` (server UTC ISO time), `group` (`guard`/`proxy`), `correlationId` (server UUID), `stage`, `outcome`, `category`, optional `status` (genuinely available integer 100–599), and `fixture` (`UNKNOWN`). No additional fields are permitted. Stages: `configuration`, `claims`, `claims-validation`, `identity`, `identity-consistency`, `account`, `role`, `eligibility`, `mfa`, `policy`, `final`, `proxy-claims`, `refresh`. Outcomes: `ok`, `missing`, `denied`, `required`, `malformed`, `error`, `exception`, `attempt`, `http-success`, `http-error`, `sdk-success`.

Provider-code allowlist (checked against installed auth-js 2.116.0 types): `bad_jwt`, `session_not_found`, `session_expired`, `refresh_token_not_found`, `refresh_token_already_used`, `user_not_found`, `user_banned`, `insufficient_aal`. Local categories: `none`, `configuration-unavailable`, `missing-data`, `invalid-claims`, `identity-inconsistent`, `ineligible`, `mfa-required`, `policy-required`, `malformed-policy`, `code-unavailable`, `unclassified`. Unknown codes/classes become `unclassified`. Only own data descriptors for code/status are read; getters, messages, stacks, causes and nested diagnostic objects are never traversed. Only explicitly constructed fields are serialized; raw objects are not serialized/redacted. Parser, registration and sink failures cannot affect guards, responses or cookies.

An actual fixed-Test-origin POST `/auth/v1/token` refresh-token grant is observed internally at the existing transport boundary. No URL, query, request body or header is emitted. `attempt` denotes that request; `http-success`/`http-error` denotes an HTTP response and its status, not SDK refresh success. The same unconsumed Response and cancellation/request semantics are returned to the SDK; no retry/scheduling change or extra Auth operation is introduced. Only the real pinned SDK `TOKEN_REFRESHED` event after an observed successful refresh response emits `sdk-success`. A claims call, cookie write or reload is never treated as refresh. SDK-exposed safe error codes can be recorded by guard/proxy result handling; codes swallowed internally remain unavailable, rather than parsing raw response bodies to recover them. HTTP status alone does not establish a particular provider cause or configured single-session policy.

Synthetic example only (not a live observation):

```json
{"timestamp":"2026-10-05T18:00:00.000Z","group":"guard","correlationId":"11111111-1111-4111-8111-111111111111","stage":"refresh","outcome":"http-error","category":"code-unavailable","status":400,"fixture":"UNKNOWN"}
```

Public access endpoint, redirects, sign-in/MFA/enrollment/logout logic, session-cookie attributes and private/no-store handling remain unchanged. Diagnostics distinguish guard stages, not broad risk resolution. No actual live refresh, deployed Web revision/AAL, effective single-session setting, concurrent-session cause, hosted Secure-cookie/CDN behavior or full acceptance is established by the isolated diagnostic tests. Missing or budget-truncated events are not evidence that an operation did not happen.
