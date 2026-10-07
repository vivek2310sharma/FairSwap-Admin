# Progress

Updated: 2026-10-07 (Europe/Copenhagen).

## Current Test workflow follow-up

The existing-feature Admin migration remains in place. Latest executable checkpoint 7353c1f5f11f598e6596ec3571dfa1e3e8bd2f2d is Ready on the protected Test Preview https://fairswap-admin-61sjsaokx-fairswap.vercel.app/admin. Two separately approved backend changes are applied to FairSwapTest and checkpointed in FairSwap-Web at da4a2055d9ee41778ef094380eeb4e2bddab3e06. Full Admin verification passed: 412 tests / 11 files, typecheck, zero-warning lint, standard build and whitespace checks. No custody/native suite was run.

Earlier owner observations confirmed local staff sign-in/MFA/protected access/logout, all visible migrated local areas and a listing review. The owner reported sign-in complete on the preceding hosted Preview. Final hosted page/logout and actual local/hosted medium-photo observations remain pending. Metadata/grant and anonymous/missing-identity database denials passed; positive decisions and two-session database concurrency remain NOT RUN without exact disposable targets/actors/recipients. Backend pgTAP is not installed on Test; its existing account-creating suite was not run. No application data record, Production setting, other-platform source, push or merge changed. Account deletion/export fulfillment/schema editing remain unavailable. See [current evidence and gates](plans/admin-test-workflow-completion.md). Historical assignment records below retain their original scope and outcomes.

## ADMIN-00

Repository bootstrap and corrected documentation baseline reviewed and saved locally. The supplied completed discovery review is the evidence basis; broad discovery was not repeated. No backend runtime testing was performed in that review or this closeout.

Initial checks confirmed the local folder was completely empty, including hidden entries, and not a Git repository. Read-only remote verification returned no advertised refs; GitHub metadata identified `vivek2310sharma/FairSwap-Admin`, size 0, default branch `main`. The empty repository was cloned into the existing local folder using existing Git authentication. Before the reviewed baseline commit, remote inspection again returned no refs and the working tree contained exactly the eight approved untracked files, with nothing staged.

Documentation-only initial commit on main: **`34e80ae894c744cbd2ec4cf99310dc61ac2884dc`**, message `docs: establish reviewed ADMIN-00 baseline`. Only the eight baseline files were explicitly staged. Existing Git identity was incomplete, so work stopped until the user supplied `Codex <codex@fairswap.in>`. That identity was configured only in this repository and effective author/committer were verified before committing. Global/system configuration, credentials, authentication, signing, and hooks were not changed. Local staging and feature/admin-01a-foundation were created from that commit; main/staging remain the documentation bootstrap, not a production application release. No pushes or remote branches.

Remote: https://github.com/vivek2310sharma/FairSwap-Admin.git

Authoritative reviewed Web revision: **`8ad67672896a1a11f51009ffddf3bb39ee3cf698`**.

## Current environment

ADMIN-01A is accepted and merged into remote staging through PR #1, with merge commit **4cafc94d5e5b25f1738ea139f7a324631b435471** (2026-10-05T13:18:24Z). Its parents are documentation baseline 34e80ae894c744cbd2ec4cf99310dc61ac2884dc and accepted foundation 1eaf682b6875d26f06c4056296d22535b2146e96; its tree is d3c1ba349af8ecce671eaedcbbe80dee5f303e34. Remote main remains the documentation baseline. The normal merge did not establish passing CI: zero check runs/statuses existed then.

CI-01 merged normally through PR #2 at **454f0f77e3f7e25df15ca6736a30e590e9ca6f17**, merged_at 2026-10-05T13:48:18Z. Its parents are 4cafc94d5e5b25f1738ea139f7a324631b435471 and 676f05a865da09d39f72d7df78247f0d009a473d; tree a829586102e724951e87c88375bea19d8abae9c9. The actual push run [37319645279](https://github.com/vivek2310sharma/FairSwap-Admin/actions/runs/37319645279) checked out that real merge commit and passed toolchain assertions, frozen installation, typecheck, zero-warning lint, 21 tests and build. This is distinct from the earlier synthetic-merge PR run 37318068503. No rules or settings were bypassed; rule-detail reads remained HTTP 403, not evidence of absent rules.

The current explicit ADMIN-01B assignment permits bounded authentication implementation, isolated testing, branch publication and one draft PR, stopping before merge or live acceptance. Antigravity remains primary. Runtime configuration enforcement, request-scoped server-only sessions, staff guards, MFA and policy states are implemented and isolated-tested, pending code/security review. **Live FairSwapTest acceptance NOT RUN / UNVERIFIED; ADMIN-01C NOT STARTED / NOT TESTED; all seven backend/security items OPEN / UNVERIFIED.** No live Supabase/credential/real environment-file access, backend changes, hosting or deployment. Historical scope/results below remain records of their original assignment.

## ADMIN-01

**ADMIN-01A ACCEPTED after source/artifact review for its limited foundation scope. ADMIN-01B implemented with isolated tests, pending review; live acceptance NOT RUN / UNVERIFIED. ADMIN-01C NOT STARTED / NOT TESTED.** Local installation/typecheck/lint/21 tests/build/loopback smoke results below are the implementing agent's execution evidence, not independent reviewer reruns. The reviewer did not verify authentication, RLS, or deployment. See [implementation plan](plans/admin-01-plan.md). The full sign-in/MFA/listing/moderation/media/state/audit workflow is not implemented or verified, and the overall ADMIN-01 milestone is not complete.

Next gate: ADMIN-01B draft-PR code/security review, followed by a separately authorised live FairSwapTest acceptance exercise. Request-time configuration checks are implemented and isolated-tested; the static Test label and mocked results do not establish live enforcement. Before later media implementation, separately review the credential/signing design. Resolve policy-acceptance UX and supervised staff activation/enrolment/recovery details. All seven backend/security candidates in [risks](risks/admin-extraction.md) remain OPEN / UNVERIFIED; none is resolved by foundation acceptance.

## Baseline review and delivery sequence (historical record)

The eight-document baseline is reviewed and accepted with media identity-match, audit-access, reported-source-reference, and delivery-sequence corrections. The new assignment authorises one local documentation-only initial commit on main, local staging from that commit, and feature/admin-01a-foundation from staging. The baseline is a bootstrap snapshot, not a production application release. The historical documentation-only restriction is superseded only for this explicit assignment.

- ADMIN-01A: foundation implemented; local check results below. Minimal framework shell, Test configuration validation, local tests, and placeholder-only .env.example. Application changes remain uncommitted for review.
- ADMIN-01B: staff authentication and authorization, not started and not authorised here.
- ADMIN-01C: listing moderation and media, not started and not authorised here. Media credential/signing design remains a review gate.

Listing-state checks later use the permitted moderator session. Audit integration checks use an authorised administrator AAL2 session without expanding moderator audit access. Service-role access cannot demonstrate staff permissions or RLS correctness. All seven security/backend items remain OPEN / UNVERIFIED.

Antigravity remains the primary implementation environment. Codex is explicitly authorised for this foundation assignment. No push, remote branch, backend change, or deployment is authorised.

## Initial ADMIN-01A implementation and verification (historical record)

The shell displays `FairSwap Admin — TEST` and `Foundation only. Staff workflows are not implemented.` No login, session, policy acceptance, staff/listing query, moderation, photo signing, or authorization stub exists. Zod validates explicit FAIRSWAP_DEPLOYMENT_ENV independently of NODE_ENV and accepts only test plus the exact Test HTTPS origin. Missing/partial settings are unconfigured; malformed/wrong-target settings are invalid. Even validated settings enable no workflow and establish no backend connection. Configuration status is currently statically rendered at build time; rebuild when settings change.

Selected versions: pnpm 10.12.1; Next.js/eslint-config-next 16.3.5; React/react-dom 19.2.8; Zod 3.24.2; Tailwind/@tailwindcss/postcss 4.1.18; PostCSS 8.5.6; TypeScript 5.9.3; ESLint 9.39.1; Vitest 3.2.4; jsdom 26.1.0; Testing Library React 16.3.0, DOM 10.4.0, jest-dom 6.6.3; @types/node 20.19.9, @types/react and @types/react-dom 19.1.9. Host Node.js 24.15.0 and npm 11.12.1. All direct packages are pinned; pnpm-lock.yaml records resolved transitives. Relevant constraints came from the pinned Web manifest; no unrelated Web upgrades or packages.

Commands and actual outcomes:

| Command | Result |
| --- | --- |
| npm exec --yes --package=pnpm@10.12.1 -- pnpm install | PASS; lockfile generated, dependencies installed with pnpm 10.12.1 |
| npm run typecheck | PASS initially and after the final script change: next typegen generated route declarations and tsc --noEmit passed |
| npm run lint | Initial FAIL on one anonymous PostCSS export warning; fixed with a named export object. Final PASS with zero warnings; no rule disabled |
| npm run test:unit | Sandbox attempt FAIL before tests due to esbuild filesystem access denial; rerun with required host access PASS: 2 files, 21 tests |
| NEXT_TELEMETRY_DISABLED=1 npm run build | PASS: Next.js 16.3.5 Turbopack compile, TypeScript, and static prerender of / and /_not-found. PowerShell set the process environment value before npm run build |
| node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100 | PASS in a temporary Node harness: local HTTP 200, required labels, missing-config disabled state, no form/input/button controls; server stopped afterward |

Three initial npm-exec check wrappers stalled on restricted registry access and were interrupted before running checks; project scripts were then run directly with npm without installing packages. Installation reported ESLint 9 deprecation, deprecated transitive whatwg-encoding, and an ignored unrs-resolver build script; lint/build/tests passed without approving that additional script. These are recorded tooling limitations, not backend security findings.

Configuration tests use synthetic values only; component tests cover missing, wrong-project, production-setting, and validated Test states. All 21 tests block fetch and assert no fetch calls. Source inspection found no SDK/client or request code; only the Test-origin constant references Supabase. The local HTTP check contacted loopback only. This is not a hosted connectivity test or proof of authentication, RLS, audit, or backend security. All seven risks remain OPEN / UNVERIFIED.

## Pre-closeout uncommitted ADMIN-01A file inventory (historical record)

Modified: .agents/rules/admin.md, .gitignore, AGENTS.md, README.md, docs/PROGRESS.md, docs/PROVENANCE.md, docs/plans/admin-01-plan.md. docs/risks/admin-extraction.md is unchanged and its seven items remain open.

Added:

- .env.example (empty placeholders only)
- package.json and pnpm-lock.yaml
- tsconfig.json and next-env.d.ts (Next.js-managed declarations)
- next.config.ts, postcss.config.mjs, eslint.config.mjs, vitest.config.ts
- src/app/globals.css, src/app/layout.tsx, src/app/page.tsx
- src/components/foundation-shell.tsx and src/lib/config.ts
- tests/setup.ts, tests/config.test.ts, tests/foundation-shell.test.tsx

Final documentation links, whitespace, credential-pattern scan, real-environment-file absence, and real-environment ignore checks passed. Git contains exactly one commit across main/staging/feature branches; no foundation files are staged. Generated node_modules/.next/typecheck artifacts remain ignored. No source from another FairSwap application was modified.

## Targeted tooling corrections after review (2026-10-05)

Foundation structure/scope were accepted; final ADMIN-01A acceptance remains pending review of these corrections. At start, HEAD was 34e80ae894c744cbd2ec4cf99310dc61ac2884dc, branch feature/admin-01a-foundation, origin https://github.com/vivek2310sharma/FairSwap-Admin.git, and status matched the prior 7 modified / 17 new files with nothing staged. All pre-existing foundation changes were preserved; no branch or Git identity changes, commits, pushes, or backend work occurred.

Current development baseline: **Node 24.15.0**, package engine **>=24.15.0 <25**, pnpm **10.12.1**, exact Vitest **4.1.11**, related @vitest/mocker/runner/utils/spy/expect/snapshot **4.1.11**, retained Vite **7.3.6**, retained jsdom **26.1.0**. Next.js **16.3.5** and all other direct dependency versions are unchanged. pnpm-lock.yaml is the only lockfile; no test configuration, test-source, fetch-protection, or application-source edits were needed.

Actual package engine checks: Vite 7.3.6 requires ^20.19.0 or >=22.12.0; Vitest 4.1.11 requires ^20.0.0, ^22.0.0, or >=24.0.0; Next.js 16.3.5 requires >=20.9.0; jsdom 26.1.0 requires >=18. A Node stdin inspection of installed package manifests using the installed semver implementation checked 324 distinct declared Node engine ranges with zero incompatible entries for Node 24.15.0. This includes installed dependencies retained in the pnpm store; no runtime was installed or changed globally.

Maintenance decision: the user explicitly authorised the bounded Vitest upgrade beyond the initial Web constraint. [Current maintainer support](https://vitest.dev/releases) provides important/security backports to 4.1; 4.1.11 is the latest stable 4.1 patch returned by npm metadata. The [4.1.11 release](https://github.com/vitest-dev/vitest/releases/tag/v4.1.11) includes redirect-mock file-allowlist restriction. [GHSA-82fw-gwwq-j7x9](https://github.com/vitest-dev/vitest/security/advisories/GHSA-82fw-gwwq-j7x9) identifies 4.1.11 as patched; [GHSA-5xrq-8626-4rwp](https://github.com/vitest-dev/vitest/security/advisories/GHSA-5xrq-8626-4rwp) identifies patched 4.1.0 and 3.2.5. The chosen version contains both fixes. This tooling maintenance is not evidence of compromise or a new Supabase/backend defect. No Vitest 5 or blanket upgrade was performed.

Actual commands and correction-pass results (earlier results above remain historical):

| Command | Actual result |
| --- | --- |
| node --version | v24.15.0; compatible with the new package range |
| npm view vitest@4.1 version engines deprecated --json | Stable patches through 4.1.11, with no deprecation field for the selected patch |
| npm view vite@7.3.6 engines --json | ^20.19.0 or >=22.12.0 |
| npm view vitest@4.1.11 version engines deprecated --json | 4.1.11; ^20.0.0 or ^22.0.0 or >=24.0.0 |
| npm exec --yes --package=pnpm@10.12.1 -- pnpm --version | 10.12.1 |
| npm exec --yes --package=pnpm@10.12.1 -- pnpm install | PASS; bounded Vitest update and lockfile refresh |
| npm exec --yes --package=pnpm@10.12.1 -- pnpm install --frozen-lockfile | PASS; up to date, resolution skipped |
| npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm typecheck | PASS; next typegen and tsc --noEmit, exit 0; telemetry disabled in process environment |
| npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm lint | PASS; eslint . --max-warnings=0, exit 0 |
| npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm test:unit | PASS; Vitest 4.1.11, 2 test files and all existing 21 cases, exit 0 |
| npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm build | PASS; Next.js 16.3.5 Turbopack compile, TypeScript, static / and /_not-found, exit 0; PowerShell set $env:NEXT_TELEMETRY_DISABLED='1' first |
| node stdin loopback smoke harness | PASS; launched node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100, asserted HTTP 200, required labels, disabled missing-config message, and no form/input/button controls; stopped server and exited 0 |

No permission/compatibility blocker remained. The existing allowlist for dependency build scripts was preserved; unrs-resolver's script remains ignored. ESLint 9 deprecation and the deprecated whatwg-encoding transitive warning remain recorded tooling limitations, outside this bounded correction. Tests remain non-interactive vitest run with jsdom, unchanged behavioral assertions and fetch protections, and no test UI/API or Browser Mode exposure.

Remaining limitation: the current static page captures configuration state at build time; rebuild after setting changes. Effective server-side configuration validation at future session/client and protected-operation boundaries is an **ADMIN-01B requirement**, not verified by the static Test label or these checks. ADMIN-01B/01C remain unstarted. All seven existing backend/security verification items remain **OPEN / UNVERIFIED**.

Exactly six project files changed in this correction pass: package.json, pnpm-lock.yaml, README.md, docs/PROGRESS.md, docs/PROVENANCE.md, docs/plans/admin-01-plan.md. A small review ZIP outside the repository contains these complete files and an outside-repository correction-summary.txt. Unchanged project files are not resubmitted. All correction changes remain uncommitted and unstaged.

## Accepted foundation closeout (2026-10-05)

The supplied acceptance review accepts ADMIN-01A only for the limited local foundation, including both tooling corrections. Its evidence consists of source/configuration artifact inspection, comparison of the six corrected files with the original submission, manifest/lockfile consistency checks, and the implementing agent's recorded local verification results. The reviewer did not access this checkout, install dependencies, independently rerun tests/build, contact Supabase, or verify authentication, RLS, or deployment. Historical command results above are preserved as implementing-agent evidence; no tests/build were newly executed for this documentation closeout.

Before closeout edits, actual origin, branch, HEAD, and 7 modified / 17 new unstaged files matched the reported state. Original submission SHA256 5cedbcede27f55c68ccaef0afaab8a2e6eb4097c0514ad795fcc444daf8a9646 and correction submission SHA256 a946ea65c03494c259cc717f13b4c0bb307d7c74b3625c53bb202a9bdbcc31a3 matched the review's artifact identities. Every one of the 25 current project files matched the reviewed original submission with the six correction files overlaid byte-for-byte. The 24-file working-tree inventory was extracted from correction-summary.txt and matched actual Git status. Only README.md and this progress document received acceptance-status changes during closeout; no application, test, configuration, dependency, or lockfile changes.

The user authorises explicit staging of those 24 reviewed foundation files and one local commit, feat(admin): add reviewed Test-only application foundation, on feature/admin-01a-foundation. Its parent is the intact documentation baseline 34e80ae894c744cbd2ec4cf99310dc61ac2884dc. Review metadata, correction summary, archives, real environment files, dependencies, generated output, and unrelated files are excluded from the commit. Existing repository-local Git identity, credentials, signing, and hooks are preserved. No merging, pushing, backend operation, hosting configuration, or deployment is authorised.

ADMIN-01B and ADMIN-01C remain NOT STARTED / NOT TESTED. All seven backend/security items remain OPEN / UNVERIFIED. Effective runtime server-side configuration enforcement is still an ADMIN-01B requirement. Production, hosting, live backend integration, staff access, and Web Admin retirement remain out of scope. This acceptance does not complete the whole ADMIN-01 milestone.

## CI-01 foundation checks (2026-10-05)

Created chore/admin-ci from verified remote staging 4cafc94d5e5b25f1738ea139f7a324631b435471 with a clean starting working tree. Remote main was 34e80ae894c744cbd2ec4cf99310dc61ac2884dc. PR #1 was confirmed merged at the recorded merge SHA. No existing workflows or deployment records were returned; the owner's confirmation that no automatic deployment service is connected remains the deployment evidence. No repository settings were changed.

The new .github/workflows/ci.yml runs on pull requests targeting staging/main and pushes to staging/main, without path filters. One quality job, displayed as Admin quality checks, uses ubuntu-24.04 and a 20-minute timeout. Workflow/PR-or-ref concurrency cancels superseded runs. CI=true and NEXT_TELEMETRY_DISABLED=1 are set; deployment configuration is unset and NODE_ENV is not overridden. Frozen installation, typecheck, lint, unit tests, and build are separate steps. No caching, secrets, credential persistence, privileged triggers, deployment environment, or deployment steps are configured.

Official release refs and action.yml inputs were inspected through authenticated read-only GitHub API access. Verified full release commit pins: actions/checkout v7.0.1 at 3d3c42e5aac5ba805825da76410c181273ba90b1; actions/setup-node v7.0.0 at 820762786026740c76f36085b0efc47a31fe5020; pnpm/action-setup v6.1.0 at ea17c68df8912ef543352723c149a84f56e3d413 (the annotated release tag was peeled to its commit). All three use the Node 24 Action runtime. The workflow selects Node 24.15.0 and pnpm 10.12.1 and prints/verifies both.

New local implementing-agent evidence, separate from the historical foundation results:

| Actual command/check | Result |
| --- | --- |
| node --version | PASS: v24.15.0 |
| npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm --version | PASS: 10.12.1 |
| npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm install --frozen-lockfile | PASS: lockfile up to date, resolution skipped; existing unrs-resolver build script remains ignored |
| npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm typecheck | PASS: next typegen and tsc --noEmit, exit 0 |
| npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm lint | PASS: eslint . --max-warnings=0, exit 0 |
| npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm test:unit | PASS: Vitest 4.1.11, 2 files, all 21 cases passed; no failed/skipped cases |
| npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm build | PASS: Next.js 16.3.5 compile, TypeScript and static / and /_not-found, exit 0 |
| Node stdin harness using installed js-yaml 4.3.2 | PASS: YAML parsing and assertions for triggers, permissions, concurrency, runner, timeout, action refs/inputs, commands and prohibited configuration |
| Official pinned action.yml input inspection | PASS: all selected inputs exist; no actionlint executable was available, so actionlint was not run |
| git diff --check; local documentation-link and credential-pattern checks | PASS; no credential values found in the three changed files |

Local command processes used CI=true and NEXT_TELEMETRY_DISABLED=1, with application deployment configuration unset. An initial probe for the yaml module found it unavailable; syntax validation used the existing js-yaml dependency instead, without installing validation tooling. No application/test/configuration/dependency/lockfile changes were needed. The existing build-script allowlist and fetch protections are preserved. Historical ESLint 9/transitive deprecation limitations remain recorded above; this frozen install emitted the ignored unrs-resolver warning, which was not bypassed.

Hosted GitHub Actions evidence for the final CI PR head will be recorded in the PR/report after execution, including the PR merge-ref checkout SHA. These local results do not claim hosted success. CI-01 stops before merge. All seven backend/security items remain OPEN / UNVERIFIED; ADMIN-01B/01C remain NOT STARTED / NOT TESTED. Build-time configuration capture remains a limitation; effective server-side runtime enforcement is still an ADMIN-01B requirement. No authentication, RLS, backend integration, deployment or production readiness is established.

## ADMIN-01B implementation and isolated verification (2026-10-05)

Starting checkout was clean on chore/admin-ci; authenticated remote checks matched staging 454f0f77e3f7e25df15ca6736a30e590e9ca6f17 and main 34e80ae894c744cbd2ec4cf99310dc61ac2884dc. feature/admin-01b-auth did not exist locally/remotely and was created from verified origin/staging. The accepted staging tree was a829586102e724951e87c88375bea19d8abae9c9. Relevant pinned Web sources only were read; contracts and destinations are registered in provenance, not assumed from current Web HEAD. No broad discovery or prior acceptance was repeated.

Implemented: email/password staff sign-in; explicit TOTP enrollment and existing-factor challenge; limited AAL1 bootstrap; dynamic minimal protected landing and read-only access endpoint; reusable server-only guard; fresh policy recheck and distinct policy-required/error states; fixed Test Web consent journey without consent writes/token handoff; local-scope signout; host-only Admin-specific HttpOnly cookies with refresh propagation and private/no-store responses. Passwords use existing-account validation, not signup complexity rules. The setup key is returned only to the initiating same-origin POST for manual authenticator entry; no external QR service or raw SVG insertion. Failed challenges never cause enrollment/replacement/deletion, and successful-looking MFA must be followed by newly verified AAL2 claims.

Runtime target/key validation occurs before SDK creation and protected operations. Only Test plus the exact approved HTTPS origin and non-elevated publishable-key format are supported; no legacy anonymous JWT, elevated key, localhost backend or Production fallback. getClaims verifies token signature/expiry through the configured SDK; the guard additionally validates exact issuer, authenticated audience/role, subject and AAL and checks getUser identity/email confirmation. Only self user_accounts.account_status and staff_roles.role are read through the session/RLS. Active administrator/moderator is required, and protected access also needs AAL2 and explicit boolean policy true. Errors, exceptions, null/malformed policy results fail closed. Proxy is refresh-only, never the protected authorization boundary. No authenticated singleton or user-specific cache exists.

Added exact @supabase/ssr 0.12.7 and @supabase/supabase-js 2.116.0 from pinned Web manifest/lockfile, plus server-only 0.0.1. Registry metadata and installed version-matched API source/types were checked. The lockfile adds only their bounded dependency records (11 packages); existing package/snapshot versions, Node 24.15.0 baseline/range, pnpm 10.12.1, Next 16.3.5, Vitest 4.1.11, CI workflow and build-script allowlist remain unchanged.

| Actual local command/check | Actual result |
| --- | --- |
| npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm add --save-exact @supabase/ssr@0.12.7 @supabase/supabase-js@2.116.0 server-only@0.0.1 | Initial FAIL: server-only offline registry metadata absent; no substituted version |
| npm exec --yes --package=pnpm@10.12.1 -- pnpm add --save-exact @supabase/ssr@0.12.7 @supabase/supabase-js@2.116.0 server-only@0.0.1 | PASS: exact dependency additions; ESLint/whatwg-encoding deprecation and ignored unrs-resolver warnings retained |
| npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm typecheck | Initial FAIL: possible null staff lookup; guard narrowing corrected. Final PASS: next typegen and tsc --noEmit, exit 0 |
| npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm install --frozen-lockfile | PASS: lockfile current, resolution skipped; unrs-resolver script still ignored |
| npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm lint | PASS: eslint . --max-warnings=0, exit 0 |
| npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm test:unit | PASS: 5 files, 97 cases, no failures/skips; unchanged 21 foundation cases plus 76 new isolated cases |
| npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm build | PASS: compile/TypeScript/static foundation plus dynamic /auth/sign-in, /auth/mfa, /admin, /admin/access and Proxy; configuration unset, no backend calls |
| git diff --check; Node dependency/lockfile/CI/regression invariant checks; local documentation links | PASS; existing package/snapshot records and all original assertions preserved |

Local processes used CI=true and NEXT_TELEMETRY_DISABLED=1. Existing global fetch-blocking setup is unchanged. New tests call real production guard/mutation/action/route/proxy code with SDK/request doubles, plus real SDK getClaims rejection of a forged token using a controlled synthetic transport. Coverage includes runtime configuration rejection with zero backend construction, untrusted identities/metadata, role/account/AAL denials, AAL1 bootstrap, MFA failure/no premature AAL2, policy true/false/error/exception/malformed responses, direct entry points, safe redirects/POST origins, cookie isolation/propagation, intended local logout and generic diagnostic handling. Five accessible form/configuration UI tests also run. No foundation-test adaptations, skips, rule disablement, extra install scripts, live sign-in or hosted Web consent verification.

The proposed staff-onboarding/recovery runbook needs named activation/recovery/backup owners and approved identity/recovery/reactivation procedure. Existing incomplete factors are retained; lost enrollment material is a supervised recovery gate. No recovery UI or real account/factor mutation was performed. Same-project JWTs remain intrinsically transferable bearer tokens; host-only cookies do not prove cross-application isolation or revocation. Live self-read grants/RLS, Auth email confirmation/expiry, MFA, policy journey, cookie refresh/logout and cross-host behavior require separate authorised FairSwapTest acceptance after code/security review. All seven risks remain OPEN / UNVERIFIED; ADMIN-01B is not fully accepted and ADMIN-01C remains NOT STARTED / NOT TESTED.

Final-head hosted CI evidence will be recorded in the draft PR/report after publication, separately from these local results. No merge/auto-merge, deployment, Production access, backend change or other-application change is authorised.

Additional isolated integration evidence: a Node stdin harness launched the built application on 127.0.0.1:3101 with all three application backend settings explicitly empty. GET /auth/sign-in, /auth/mfa and /admin returned disabled content; /admin/access returned 403 with access denied. All four responses included private/no-store caching. Only loopback HTTP was contacted, no sign-in/MFA request was made, and the temporary server was stopped.

## ADMIN-01B-DIAG local diagnostics (2026-10-05)

The explicit diagnostics-only assignment starts from reviewed eb3e5a0d8b1c61e5f032e7f2b69c8f57eb491eba on feature/admin-01b-auth / draft PR #3. Preflight confirmed clean tree, expected origin, matching local/remote head, main 34e80ae894c744cbd2ec4cf99310dc61ac2884dc and staging 454f0f77e3f7e25df15ca6736a30e590e9ca6f17. Antigravity remains primary. This authorizes one bounded diagnostic follow-up commit/push to the existing branch and draft PR only; no authentication correction, live experiment, backend change, deployment or merge.

The preserved outside-repository acceptance report remains historical evidence. Owner observations support investigation of session interaction, not a confirmed cause. No Dashboard/health requests, provider logs or live authentication were repeated. The app remained stopped. Full ADMIN-01B acceptance remains incomplete; ADMIN-01C NOT STARTED / NOT TESTED; all seven historical risks OPEN / UNVERIFIED.

Implemented server-only off-by-default metadata, guard-stage observers, proxy returned/exception error observers, and a request-local transport observer for actual refresh-token grants. Activation requires the exact FAIRSWAP_AUTH_DIAGNOSTICS=loopback flag, existing validated Test runtime configuration, an explicitly loopback-bound Next CLI in the actual process argv, loopback request context and no disallowed forwarding/hosting/CI markers. Host/header/query/cookie/form inputs alone cannot activate it. Production-mode local Next builds are supported; worker/wrapper argv without the explicit binding fail closed. See README for exact schema, code allowlist, runtime limitations and disabling instructions.

Events are explicitly constructed and Zod-validated: UTC timestamp, finite group/stage/outcome/category, optional genuine numeric status, random server correlation UUID, fixture UNKNOWN. Own data descriptors only for SDK code/status; no arbitrary errors/claims/records/URLs/headers/bodies/identifiers are serialized. The bounded local stdout sink caps 32 events per group and 256 per process, no remote/file capture. Parser/sink/observer registration/metadata failures are isolated. Proxy/server groups remain separate; client-to-guard correlation uses only the same request-local SDK client. No verified fixture association is fabricated.

Actual refresh is recognized at the fixed Test transport's POST refresh-token grant without reading response bodies. HTTP attempted/received status is distinct from success; the pinned auth-js TOKEN_REFRESHED event following a successful observed response is required for sdk-success. SDK-exposed safe codes are captured where available; swallowed codes remain unavailable. No extra sign-in/refresh/retry/logout, modified scheduling, new endpoint or logging dependency. The fixed destination, redirect refusal, cancellation, no-store and unconsumed Response semantics remain intact.

Installed pinned source/types inspected only as needed: auth-js 2.116.0 GoTrueClient.ts, lib/fetch.ts (API-version error-code exposure), lib/errors.ts, lib/error-codes.ts; Next 16.3.5 installed proxy documentation. Package versions, pnpm-lock.yaml, CI/build-script permissions, authentication mutations/forms, public endpoint and all original tests are byte/hash unchanged after Git normalization. No Web source or pinned provenance was changed.

| Actual diagnostic verification command | Actual outcome |
| --- | --- |
| npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm install --frozen-lockfile | PASS, unchanged/current lockfile, resolution skipped; existing unrs-resolver script remains ignored; no extra script approval |
| npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm typecheck | Initial FAIL on callback/test ProcessEnv annotations and a test parameter row shape; corrected within diagnostic scope. Final PASS, next typegen and tsc --noEmit |
| npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm lint | PASS, eslint . --max-warnings=0, including final source |
| npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm test:unit | Initial new-fixture FAIL: error code unavailable because synthetic response omitted SDK-required API version header; fixture corrected, assertions retained. Final PASS: 6 files, 181 tests (97 original unchanged + 84 diagnostic cases), no failure/skip |
| npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm build | PASS on final source, Node 24.15.0 / Next 16.3.5; backend configuration and diagnostic flag explicitly empty; CI=true and NEXT_TELEMETRY_DISABLED=1. Same static/dynamic routes and Proxy; no configured server or backend connection |
| git diff --check; protected-file normalized Git hashes | PASS; unchanged dependencies/lockfile/workflow, public endpoint, mutations/forms and original 97-test source/setup |

New tests cover hosted/nonlocal/wrong-target/untrusted-input activation, exact schema, sensitive sentinels, malformed/cyclic/throwing-property error inputs, sink/parser/response-metadata failures, concurrent request isolation, representative guard result/order/call/argument parity, public endpoint status/body, redirects and cookie propagation/no-store. Real pinned SDK refresh success/rejection uses controlled synthetic transport with all network mocked/blocked. These checks do not establish live refresh or session-policy behavior.

Known limitations: diagnostics do not expose raw internal errors, associate primary-staff without trusted matching evidence, link proxy and guard merely by adjacency, recover swallowed SDK codes via raw-body capture, verify historical deployment/AAL/session settings, or make concurrent sessions work. No root cause is confirmed or authentication fix attempted. Missing/budget-truncated events are not proof of absent requests. Future local activation/live testing requires a separate assignment after diagnostic review.

Only the nine allowed files comprise this delta: .env.example, README.md, docs/PROGRESS.md, src/lib/auth/diagnostics.ts, src/lib/auth/guard.ts, src/lib/supabase/client.ts, src/lib/supabase/server.ts, src/proxy.ts, tests/auth-diagnostics.test.ts. New-head hosted CI evidence will be recorded in the existing draft PR and outside-repository delivery report after publication, not borrowed from the earlier green run. main/staging must remain unchanged; PR #3 remains draft awaiting diagnostic code review.

## ADMIN-01B-DIAG activation correction (2026-10-05)

Started from 85fcf76ad613d14c41e79bddfe748965fd4549a9 with clean feature/admin-01b-auth, matching draft PR #3 and expected remote main/staging. The prior 181-test record above is historical evidence for that diagnostic revision, not this correction.

Review identified a diagnostic launch-check defect: standalone scanning could ignore attached conflicting hostname values or treat tokens after -- as binding evidence. This is not evidence of authentication bypass, actual exposure or the session-loss cause. Installed Next 16.3.5 CLI source uses Commander -H/--hostname. Parser-only synthetic checks using the installed Commander confirmed both reviewed mixed sequences resolve to 0.0.0.0, while hostname tokens after -- do not set a hostname. No server was started.

The correction accepts only actual Next CLI start/dev argv containing one standalone --hostname/-H with 127.0.0.1 or localhost, optionally one standalone --port/-p with decimal 1–65535, in either order. All attached forms, duplicate aliases, missing/malformed values, positional arguments, -- and other options are rejected. Existing mandatory server opt-in, fixed Test configuration, hosted/CI denial and request-context checks are unchanged. Worker/wrapper argv continues to fail closed. No parser dependency, alternative flag, override or Host-only fallback was added.

Changed files only: src/lib/auth/diagnostics.ts, tests/auth-diagnostics.test.ts, README.md, docs/PROGRESS.md. No guard/mutation/form/client/proxy/endpoint/dependency/lockfile/workflow changes. The existing 181 tests and assertions remain; 30 full-factory regression cases added. Rejected cases explicitly assert disabled plus no emitted output.

Actual local verification used Node v24.15.0 and pnpm 10.12.1 via npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm:

| Command | Actual result |
| --- | --- |
| install --frozen-lockfile | PASS; lockfile current, resolution skipped, existing ignored unrs-resolver script warning retained without permission changes |
| typecheck | PASS; next typegen and tsc --noEmit |
| lint | PASS; eslint . --max-warnings=0 |
| test:unit | PASS; 6 files, 211 tests (181 retained + 30 added), no failures/skips; mocked/blocked network |
| build | PASS; Next 16.3.5, backend configuration and diagnostics explicitly empty, CI=true, telemetry disabled; no live server |
| git diff --check | PASS |

Hosted new-head CI evidence will be recorded in existing draft PR #3 and the outside-repository correction report after publication. Historical CI is not substituted for this new head. main/staging remain unchanged; no live test, credential access, Supabase call, backend/settings change, deployment or merge. All seven risks remain OPEN / UNVERIFIED, full ADMIN-01B acceptance incomplete, ADMIN-01C NOT STARTED / NOT TESTED. Stop for correction review; no automatic live reproduction.
## Diagnostic proxy Host consistency correction (2026-10-05)

Starting head 5a8f7517850772d22fcf30abd4140ade24123a85, clean feature/admin-01b-auth, draft PR #3 and remote main/staging verified against the assignment. Antigravity remains primary. Only isolated correction/testing and branch publication authorized; no launcher, application listener, cookie-free probe or owner sign-in under this task.

Historical live gate preserved: HTTP 403, access denied; three validated guard events (configuration OK -> claims missing -> final denied); no proxy-group events observed; application stopped before staff authentication. This does not prove proxy nonexecution, bypass or session-loss cause.

Before production-code edits, a new isolated test used the real installed Next.js 16.3.5 NextRequest and production proxy with SDK doubles: URL http://127.0.0.1:3102/admin/access; original Host and x-forwarded-host both 127.0.0.1:3102, x-forwarded-for 127.0.0.1. Actual nextUrl.host was localhost:3102. The proxy's getClaims ran exactly once but no diagnostic output appeared. The requested targeted command (npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm test:unit -- tests/auth-diagnostics.test.ts -t 'real NextRequest forwarding exposes') forwarded a literal --, so Vitest actually ran the full suite: 212 passed in 6 files, including the before-correction reproduction. This is isolated reproduction, not live evidence.

Applied only request.headers.get("host") ?? "" as proxy requestDiagnostics input. No changes to cookie security calculation, SDK refresh, response/request propagation, headers, diagnostic schema/CLI grammar or forwarding validation. No alias equivalence or normalized-URL fallback. Original Host remains untrusted; all explicit server/Test/loopback/hosting prerequisites stay mandatory.

Regression coverage includes schema-valid proxy output for the realistic normalized request, missing/malformed/nonlocal Host, mismatched forwarded host (including port and localhost alias), nonlocal forwarded-for, Forwarded headers and production-proxy prerequisite denials. Existing proxy test fixtures gained explicit Host headers to represent real HTTP while retaining all behavior, leakage and sink-failure assertions. All previous 211 cases retained; 17 new cases added. Network remains mocked/blocked; no real configuration or credentials used. Only README.md, docs/PROGRESS.md, src/proxy.ts and tests/auth-diagnostics.test.ts changed.
| New local verification (Node v24.15.0 / pnpm 10.12.1) | Actual result |
| --- | --- |
| npm exec --offline --yes --package=pnpm@10.12.1 -- pnpm install --frozen-lockfile | PASS; current lockfile, resolution skipped; existing ignored unrs-resolver script warning retained |
| Same prefix: pnpm typecheck | PASS; next typegen and tsc --noEmit |
| Same prefix: pnpm lint | PASS; eslint . --max-warnings=0 |
| Same prefix: pnpm test:unit | PASS; 6 files, 228 tests (211 retained + 17 new), no failures/skips |
| Same prefix: pnpm build | PASS; Next 16.3.5; backend configuration and diagnostic flag explicitly empty, CI=true, telemetry disabled; no server launch |
| git diff --check | PASS |

Scope inspection confirms only four allowed files. All non-diagnostic proxy code is unchanged; guards, mutations, SDK clients, endpoint, dependencies, lockfile, workflow and diagnostic schema/CLI activation implementation are unchanged. Final new-head hosted CI will be observed with bounded waits and recorded separately in draft PR #3 / outside-repository report. Prior green runs are not validation of this new head. Remaining live activation uncertainty requires separately authorized work; do not start the launcher. All seven risks OPEN / UNVERIFIED, full ADMIN-01B acceptance incomplete, ADMIN-01C NOT STARTED / NOT TESTED. main/staging unchanged; no live Supabase call, credential read, backend/settings change, deployment or merge.

## Owner-authorized local queue and protected Test Preview (2026-10-07)

The subsequent owner task explicitly authorized live Test authentication, focused application troubleshooting and protected Preview hosting, superseding the historical offline-only restrictions for this task. Custom credential/bootstrap workstreams remain stopped. The previously tested local sign-in, existing MFA, protected Admin access and logout were accepted by the owner; no account, factor, role, policy, schema or Production changes were made.

The new read-only queue at `http://127.0.0.1:3000/admin/listings` uses the existing request-scoped staff guard and nonprivileged RLS client. It shows pending listing details, prices, categories, locations, seller display names, timestamps and media processing status. Loading, empty, sanitized error and unavailable-photo states are implemented. The owner reported **five pending listings** and **no ready photos**. Live photo-byte delivery is therefore NOT OBSERVED; existing private Storage policy may deny staff-session reads, and no elevated fallback was introduced. No approval/rejection controls exist.

Focused listing/auth/diagnostic tests passed: **232 tests in three files**. Pinned pnpm 10.12.1 typecheck, zero-warning lint, standard Next.js 16.3.5 build and whitespace checks passed. The build used the authorized local Test configuration with diagnostics unset. Unauthenticated local HTTP checks observed a sign-in redirect without listing cards and HTTP 403 from `/admin/access`. These focused checks do not replace historical suite or synthetic/native evidence.

One fresh Vercel CLI 62.5.0 authorization completed; `whoami` confirmed the owner identity. One deployment of the current uncommitted application source to existing `fairswap-admin` / FairSwap explicitly selected `--target preview`, with deployment-only Test build/runtime configuration. Deployment `dpl_2E6M9Jerxmxw437vNSLrCvw7EhiA` is **Ready / Preview** at `https://fairswap-admin-pbudov29u-fairswap.vercel.app`. Vercel Authentication protection is reported for this deployment; an anonymous request redirects to `https://vercel.com/sso-api`. The owner subsequently reported **no error** opening the Preview after being asked to complete normal sign-in/MFA; that report did not separately specify a hosted listing count or each authentication step. Browser automation was unavailable, so those details were not independently observed. The existing Production checkpoint `dpl_24adDX2fwSaG6QBe79r5z88irkVy` remains CANCELED and unchanged. No Git connection, push, merge or Production fallback was performed; source changes remain unstaged and uncommitted.
