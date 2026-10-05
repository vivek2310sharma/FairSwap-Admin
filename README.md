# FairSwap Admin

FairSwap-Admin is the planned separate staff-facing application for FairSwap. ADMIN-00 is reviewed and saved in the documentation baseline. The accepted ADMIN-01A foundation has been published and merged into staging. **ADMIN-01A is accepted for its limited local application-foundation scope after source/artifact review**, including the Node and Vitest corrections. ADMIN-01B now implements bounded staff authentication with isolated verification, pending code/security review and live acceptance. **Live FairSwapTest acceptance is NOT RUN / UNVERIFIED; ADMIN-01C remains NOT STARTED / NOT TESTED**; the whole ADMIN-01 milestone is not complete.

Acceptance uses reviewed source/configuration artifacts, comparison of the six corrected files with the original submission, manifest/lockfile consistency checks, and the implementing agent's recorded local verification evidence. The reviewer did not independently rerun tests/build, verify authentication or RLS, or verify a deployment. All seven backend/security items remain **OPEN / UNVERIFIED**. Request-time configuration enforcement is implemented in ADMIN-01B and covered by isolated tests; live enforcement remains UNVERIFIED; Production, hosting, and live backend integration remain out of scope.

Antigravity remains the primary development environment. Codex is explicitly authorised for the bounded ADMIN-01B implementation, isolated verification, branch publication, and draft-PR assignment; the stack, architecture, and workflow remain unchanged.

The agreed stack is Next.js App Router, TypeScript, Tailwind CSS, and Supabase, with one Admin codebase and one separate Admin Vercel project planned for Test and Production deployments. Hosting and DNS are not configured by this task.

| Deployment | Planned host | Assigned backend |
| --- | --- | --- |
| Test | admin-test.fairswap.in | FairSwapTest, project ref `wpppxlnbzqynvhpeuavd` |
| Production | admin.fairswap.in | FairSwapProd; configuration out of scope |

Each deployment connects only to its assigned project. Missing Test configuration must fail closed, never fall back to Production. There is no runtime database selector. Test and Production use separate browser sessions; Web and Admin use host-specific cookies and no password/token handoff.

Admin owns its UI, auth/session orchestration, staff workflow presentation, Admin server routes/actions, tests, and later deployment configuration. [FairSwap-Web](https://github.com/vivek2310sharma/FairSwap-Web) remains authoritative for the shared backend: schema, RLS, grants, RPCs, Supabase configuration, `supabase/migrations/**`, and `supabase/tests/**`. Admin must not create a competing migration history. Web's existing `/admin` remains until separately approved migration and retirement.

Reviewed Web source revision: **`8ad67672896a1a11f51009ffddf3bb39ee3cf698`**. Any future extraction must preserve provenance; newer Web HEAD is not automatically approved.

Branch model: permanent `staging` and `main`; short-lived feature/fix/chore branches from `staging`, PRs back to `staging`, verification against FairSwapTest, then reviewed release PRs from `staging` to `main`. Remote `main` remains at documentation baseline `34e80ae894c744cbd2ec4cf99310dc61ac2884dc`. [PR #1](https://github.com/vivek2310sharma/FairSwap-Admin/pull/1) merged the accepted foundation `1eaf682b6875d26f06c4056296d22535b2146e96` into remote `staging` with merge commit `4cafc94d5e5b25f1738ea139f7a324631b435471`. This is not a production release or deployment.

## Local foundation

Use Node.js 24.x, at least 24.15.0 and below 25, and pnpm 10.12.1 (pinned in package.json). Node 24.15.0 is the verified development baseline; this range also satisfies the selected tools' higher requirements, including Vite 7.3.6 (`^20.19.0 || >=22.12.0`) and Vitest 4.1.11 (`^20.0.0 || ^22.0.0 || >=24.0.0`). Install with `pnpm install --frozen-lockfile`, then run `pnpm dev` on loopback. No real credentials or environment files are required to build/run. The placeholder-only [.env.example](.env.example) documents empty configuration placeholders; do not populate credentials for this foundation.

`FAIRSWAP_DEPLOYMENT_ENV` is separate from `NODE_ENV`. Only `test` and the exact FairSwapTest HTTPS origin `https://wpppxlnbzqynvhpeuavd.supabase.co` pass target validation. Missing settings produce an unconfigured state; wrong targets/malformed settings produce an invalid state. Both are disabled, and even validated settings establish no backend connection and enable no staff workflows. The page reads these server settings during rendering; the current static page captures status at build time, so rebuild after changing them. There is no database selector. The foundation diagnostic at / remains unchanged; the new authentication routes use separate request-time server-only clients.

Checks: `pnpm typecheck`, `pnpm lint`, `pnpm test:unit`, and `pnpm build`. See [progress](docs/PROGRESS.md) for actual results and limitations. A Next.js production-mode build is a local build check, not production configuration or deployment.

Test tooling is pinned to Vitest 4.1.11 through an explicitly approved maintenance exception to the original Web dependency baseline. It includes the maintainer's fixes for [GHSA-82fw-gwwq-j7x9](https://github.com/vitest-dev/vitest/security/advisories/GHSA-82fw-gwwq-j7x9) and [GHSA-5xrq-8626-4rwp](https://github.com/vitest-dev/vitest/security/advisories/GHSA-5xrq-8626-4rwp). Tests remain non-interactive `vitest run` with jsdom and fetch protections; no exposed test UI/API or Browser Mode is used. This maintenance does not establish a compromise or a backend defect.

ADMIN-01B enforces deployment configuration validation before request-scoped client creation and protected operations. The static foundation label is not an authorization boundary. Live Auth, RLS, MFA, session revocation, and cross-application behavior remain unverified.

## Automated foundation checks

[CI workflow](.github/workflows/ci.yml) runs on pull requests targeting staging/main and pushes to those branches. The single `Admin quality checks` job uses Ubuntu 24.04, Node 24.15.0, and pnpm 10.12.1, then frozen installation, typecheck, zero-warning lint, all existing and new isolated tests, and build. Actions are pinned to verified release commits; checkout credentials are not persisted. No caching, backend configuration, secrets, or deployment steps are supplied.

CI-01 local verification and historical foundation checks are separately recorded in [progress](docs/PROGRESS.md). CI-01 merged through PR #2 as 454f0f77e3f7e25df15ca6736a30e590e9ca6f17; its push run 37319645279 passed all checks and the then-existing 21 tests. New ADMIN-01B hosted evidence belongs in its draft PR/report. All seven backend/security items remain OPEN / UNVERIFIED; ADMIN-01C remains NOT STARTED / NOT TESTED.

## Staff authentication (ADMIN-01B, pending review)

Use /auth/sign-in for existing staff email/password sign-in. /auth/mfa allows eligible staff to bootstrap their own TOTP factor or challenge an existing factor at AAL1; no enrollment runs during rendering and no existing factor is deleted or replaced. /admin and its read-only /admin/access endpoint require verified identity, email confirmation, active account, administrator/moderator role, current AAL2, and explicit current policy acceptance. These routes are dynamic and their responses private/no-store. No listing, moderation, media, or staff-management functionality is added.

Only Test plus the exact approved HTTPS backend origin and a non-elevated sb_publishable_ key are accepted. .env.example leaves FAIRSWAP_DEPLOYMENT_ENV, FAIRSWAP_SUPABASE_URL, and FAIRSWAP_SUPABASE_PUBLISHABLE_KEY empty. No real configuration is needed for builds/isolated tests. No legacy anonymous JWT key, secret key, service-role key, localhost backend, or Production fallback is supported. Do not populate credentials or run live sign-in/MFA under this assignment.

SDK clients stay on the server: client components submit POST Server Actions, never SDK tokens. Each request gets its own client. Admin Test uses host-only fairswap-admin-test-auth cookies (HttpOnly, SameSite=Lax, Secure except loopback development), separate from Web. Proxy refresh preserves cookies; server guards independently verify getClaims signature/issuer/expiry/AAL and getUser identity before user-scoped self-account/self-role reads. Signout explicitly uses scope: local. Host-specific cookies do not make same-project bearer tokens intrinsically hostname-bound; live session/revocation behavior requires separate acceptance.

Explicit stale policy acceptance shows the fixed Test Web policy-review link, with separate Web sign-in and manual return. Errors/null/malformed policy results deny access with retry/signout, never a policy redirect loop. Visiting Web does not prove acceptance; Recheck access repeats the protected server guard. No consent is written and no token, account identifier, or return URL is transferred.

See the [proposed supervised staff onboarding/recovery runbook](docs/runbooks/staff-onboarding-recovery.md). Operational ownership and live verification remain review gates. Automated tests/CI establish isolated behavior only, not live Auth, RLS, MFA or ADMIN-01B acceptance.

Project documents:

- [Agent instructions](AGENTS.md) and [Admin rules](.agents/rules/admin.md)
- [Progress and review gate](docs/PROGRESS.md)
- [Source provenance](docs/PROVENANCE.md)
- [ADMIN-01 plan](docs/plans/admin-01-plan.md)
- [Open security/backend verification items](docs/risks/admin-extraction.md)
