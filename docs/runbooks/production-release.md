# Production release candidate — 2026-10-08

Authorized as one implementation assignment. Admin base f8f4e93944d61ca3bf1c54c4787a6d566deaf6b6; backend base 395151bfc98616fea70a1e1122ba37e2b8aa40b3. Unrelated checkouts and AGENTS.md edits are preserved. This document does not authorize a Production change.

## Implemented contract

One request-time server contract selects only the exact environment/project pair. Consumers share URL, project reference, verified JWT issuer, cookie namespace, MFA issuer and fixed marketplace/policy links. Unknown, partial, mixed and malformed targets deny access before client/network construction. Publishable-key syntax does not establish remote project identity; independently confirm the correct project's modern publishable key at the approved configuration gate without logging it. No key was retrieved in this task.

| Setting | Preview / Test | Production, after approval |
| --- | --- | --- |
| FAIRSWAP_DEPLOYMENT_ENV | test | production |
| FAIRSWAP_SUPABASE_URL | https://wpppxlnbzqynvhpeuavd.supabase.co | https://kriuhwppxgxsyyrbjsau.supabase.co |
| FAIRSWAP_SUPABASE_PUBLISHABLE_KEY | Existing FairSwapTest publishable key; Preview scope only | Matching FairSwapProd modern publishable key; Production scope only |
| FAIRSWAP_ADMIN_RELEASE_STATE | Empty or active preserves Test | maintenance disables access; active required for approved launch |
| FAIRSWAP_AUTH_DIAGNOSTICS | Empty; loopback opt-in only in existing local Test context | Empty; Production always rejects diagnostics |
| Platform VERCEL_ENV | preview/development permits only Test | production permits only Production |
| Cookie | fairswap-admin-test-auth and its chunks/verifier | fairswap-admin-production-auth and its chunks/verifier |
| Verified issuer | https://wpppxlnbzqynvhpeuavd.supabase.co/auth/v1 | https://kriuhwppxgxsyyrbjsau.supabase.co/auth/v1 |
| MFA issuer | FairSwap Admin Test | FairSwap Admin Production |
| Marketplace / policy | https://fair-swap-git-staging-fairswap.vercel.app /account/policy-review | https://fairswap.in /account/policy-review |

NODE_ENV=production selects build mode, not the backend. No backend is selected from a Host header, form, query, browser flag or decoded token. No environment fallback; redirects on backend transport are rejected. Authenticated SDK clients remain request-scoped and server-only. Host-only HttpOnly SameSite=Lax cookies retain no Domain attribute; Production and hosted cookies are always Secure. Four roles, active account, verified identity/signature/expiry/issuer, AAL2, exact policy boolean, input/origin checks and backend RLS remain required. Policy navigation transfers no session/account data. No service-role browser/client or data access during static rendering was added.

## Initial scope and exclusions

Retain accepted Test paths: staff sign-in/TOTP, pending listing review/medium, approval/rejection, case-scoped reports, support, categories, locations and authorized reads/audit. Working Test actions remain available. Approval does not broaden roles.

Production direct server actions reject listing removal, account suspension/reinstatement, staff assignment/revocation and privacy-status changes before constructing a client. These are pending isolated/live verification. The visible Production notice explains the exclusions. UI hiding is not the enforcement. Existing account deletion, privacy-export fulfillment and category-schema editing remain unavailable.

The capability policy governs this standalone Admin application only. Existing Web/mobile/database entry points retain their semantics and are not disabled by it. An account role permitting a legacy operation can still use an independently deployed application; organizational launch scope must acknowledge that boundary.

True overlapping moderation, pgTAP, live deliberate duplicate submission, listing removal, additional role-specific live actors and notification delivery/read remain distinct from mocked tests and prior sequential owner acceptance. All seven historical risks stay OPEN / UNVERIFIED. Production smoke/acceptance is NOT RUN.

## Hosting and protection observations

Connected metadata confirms fairswap-admin / prj_FGcPmQBikEg6JUCspX3hQqmfMbCj in team_Fk8MZq6cxDXPS4ViXloT6AZW. Node 24.x, pnpm build, frozen pnpm installation. The actual project has link=null and gitRepository=null: no automatic Git branch deployment. GitHub default branch is main, no repository hooks, and the existing Admin quality workflow runs on PRs to staging/main and pushes to those branches with contents:read. No release/merge pipeline was added.

Persistent variable-name/scope inspection finds FAIRSWAP_DEPLOYMENT_ENV, FAIRSWAP_SUPABASE_URL, FAIRSWAP_SUPABASE_PUBLISHABLE_KEY and ENABLE_EXPERIMENTAL_COREPACK scoped Preview only, no hidden Production variables. Sensitive values were not decrypted. New previews inherit that persistent scope; no temporary credential flag or env file upload.

Actual team plan: Hobby / active. Current SSO protection: prod_deployment_urls_and_all_previews. It covers Preview/generated protected URLs, and is not proof that a canonical Production domain is protected. Admin currently has fairswap-admin.vercel.app; admin.fairswap.in is a proposal and is not assigned. fairswap.in is verified external-domain ownership under this team; DNS nameservers are Cloudflare. Web project metadata verifies fairswap.in as its canonical marketplace, with www redirecting to apex. No DNS/domain setting changed.

Before launch: require platform protection for every canonical/alias/generated Production hostname. Exact proposal: Vercel Authentication with deploymentType=all. Current official documentation (updated 2026-09-15) states All Deployments is available on all plans and Vercel Authentication requires no paid add-on. The current Hobby plan therefore does not itself require an upgrade for this proposal. Actual settings must still be changed and verified after approval before DNS/public launch. No purchase or settings write occurred. Existing staff/MFA authorization remains independently mandatory. Confirm each initial operator has team/project platform access and its own verified staff/MFA account; no automation account is created.

## Monitoring and recovery arrangements

Use existing Vercel deployment status/build/function logs and Supabase health/queue metadata within authorized access. The app error boundary displays only a numeric framework digest as an incident reference; no SDK error, cookie, JWT, key, message, medium path or signed URL is returned/logged by new code. Local diagnostics remain disabled in hosting. Record deployment ID, source SHA, timestamp, route pattern, status and digest when investigating; do not export raw request bodies or authenticated traces. Incident owner/on-call remains an owner decision. Logs availability/retention and alert routing are not assumed configured; no paid monitoring or recurring automation was created.

No healthy standalone Admin Production deployment exists as a rollback target. Prepare a same-commit Production maintenance deployment with the exact Production project pair and FAIRSWAP_ADMIN_RELEASE_STATE=maintenance after final approval, under identical all-hostname protection; validate disabled auth/access before launching an active artifact. The maintenance contract returns null before SDK/transport construction. If first launch fails, restore that Production maintenance artifact; never promote a Test Preview or point Production at Test. Later rollbacks use a previously verified same-environment artifact.

Application recovery order: restrict/disable Admin -> preserve audit/decisions -> roll back only the app to the same-environment maintenance/known-good artifact -> investigate -> approved fresh verification -> reopen. The three additive backend changes can remain in place while Admin is disabled. Any SQL rollback is separately approved, dependency-reviewed and preserves audit/history/completed decisions; no broad SQL undo, restore over current data or copying Test records.

Production backup/PITR status/retention and last successful snapshot are NOT VERIFIED through accessible metadata in this run. Database backups do not contain Storage object bytes. Recovery requires a separately documented object-byte backup/version/retention arrangement as well as DB recovery. Do not download Production data or perform a live restore for preflight. Isolated restore/rollback rehearsal is NOT RUN while the local database engine is unavailable. Owner must accept documented RPO/RTO/storage limits or fund a recovery arrangement before launch.

## Release order — requires final release approval

1. Review exact Admin/backend candidate commits and staging PRs; resolve blockers/owner table. Recheck source/trigger/config/protection metadata immediately before approved operations.
2. In an isolated Supabase database, apply the exact ordered baseline and three missing migrations, run pgTAP and real overlapping-transaction/side-effect tests. Resolve any catalog dependency mismatch without broad synchronization. Never reapply the three to shared Test.
3. After explicit release approval only, apply those exact Web-owned migration bytes to FairSwapProd, verifying prerequisites, definitions/grants/policies and history. No new migration identities.
4. Configure only Production variables and all-hostname protection in the existing Admin project; approve canonical DNS/assignment and named staff onboarding/access. Preview retains only Test variables.
5. Build protected same-environment maintenance and active Production artifacts from approved source. Verify no-config/maintenance denies access; manually verify Production login/MFA, authorized scopes and approved non-destructive smoke. This is not accomplished by offline synthetic tests.
6. Reviewed main merges / Production deployment/promotion and DNS are separate approved actions. Preserve accepted Test alias and unrelated deployments. Record deployment/source IDs and rollback target before exposing the canonical address.

## Owner decisions — one combined gate

| Decision | Concrete proposal / unresolved value |
| --- | --- |
| Canonical address | Approve admin.fairswap.in after confirming DNS ownership and all-hostname protection; it is not configured. |
| Initial staff and access | Name initial individual operators, roles, supervisor/recovery contact and incident owner; confirm Vercel project access and supervised own-account MFA. No role/account changes yet. |
| Launch scope | Approve accepted operational paths with server-blocked removal/account/staff/privacy mutations; acknowledge legacy Web/mobile boundaries and remaining Test/local checks. |
| Protection and recovery cost | Approve All Deployments Vercel Authentication on the current plan (no paid add-on documented); accept/fund only any unavoidable DB + Storage RPO/RTO/retention and incident coverage choice. |

Do not approve a launch while exact catalog prerequisite comparison, isolated database tests or representative candidate authenticated Preview checks remain unverified. Raw Test/Production catalog SQL reads were rejected by automatic approval review citing historical assignment restrictions; permission reconciliation for metadata-only inspection is required. No denied operation was rerouted through another transport.

Provider references (behavior, not proof of live configuration): https://vercel.com/docs/deployment-protection ; https://vercel.com/docs/deployments/environments ; https://supabase.com/docs/guides/platform/backups .

## Exact backend release manifest

FairSwap-Web remains sole migration owner at 395151bfc98616fea70a1e1122ba37e2b8aa40b3. Connected migration history was rechecked: Production has 33 baseline identities through 20261002000033; Test has those plus the three below. No migration was applied/reapplied and all source SQL bytes remain untouched.

| Ordered existing migration | SHA-256 of SQL bytes | Production addition |
| --- | --- | --- |
| 20261007153735_admin_pending_medium_download.sql | d087734c7123e50e941b922976776fe2e332418673c0a8f225c40e0b7f35f409 | Authenticated pending-only ready-medium download policy in private derivative bucket |
| 20261007153744_atomic_reviewed_moderation.sql | 883f53e8350ff8e84e1a406a56952431b9ad2603caa73fa87bf8b3e6fe2da071 | Private reviewed function locks/checks expected revision/status before preserved legacy implementation; public invoker wrapper; restricted ACL |
| 20261007161425_admin_pending_medium_download_info.sql | 9f4dfd5825588106795acffb2a0228e73898d895e28b16674e857cf853588ecd | Same narrow policy adds authenticated object-info prerequisite; no original/list/sign/general access |

Exact source prerequisites inspected: auth.uid/auth.jwt; active user_accounts/staff_roles and is_active_staff_aal2; current-policy acceptance helper/records; listings seller/revision/status and ready listing_media medium path; cover/material-edit/status-transition triggers; preserved impl_moderate_listing with authorization/self/action/reason/ready-media/audit/history/notification semantics; private buckets and managed storage.allow_only_operation(text)/allow_any_operation(text[]) operation semantics. Baseline email/outbox replay needs pg_net, pg_cron and supabase_vault (migration 24 explicitly fails without them). Stubbed extensions/helper functions cannot establish a complete rehearsal.

Required comparison remains NOT RUN: exact pg_get_functiondef/arguments/definer/search_path/ACL, relevant pg_policies and table grants/RLS, pg_get_triggerdef, columns/enums, bucket private metadata and Storage operation helpers against reviewed source. Repeated catalog SQL reads were rejected by automatic review; migration history alone does not prove equality. A backend release-manifest/query file write was also rejected because review applied historical Admin-only authority. No backend file or new SQL was written, and no backend readiness PR/commit is claimed.

Local prerequisite failure: Docker named pipe //./pipe/dockerDesktopLinuxEngine does not exist; no psql executable is available. Existing repository local Supabase config selects PostgreSQL 15, while supplied live metadata reports PostgreSQL 17; compatibility remains unresolved. No dependency/engine upgrade or remote extension installation was attempted. Existing schema_security, schema_listings, schema_email_outbox, admin_reviewed_contract and admin_medium_operation pgTAP suites: NOT RUN.

Actual overlapping database calls with a synchronization barrier, saved audit/history/outbox counts, staff-role/self/last-admin, account/privacy status, processing/active/rejected medium rules and synthetic DB/object restore: NOT RUN. Required overlap protocol uses A/B/control separate connections: A holds listing row lock; start B with same reviewed revision/status; control observes pg_blocking_pids(B) includes A; A commits its permitted decision; B must return PT409; assert one transition/decision audit and expected scoped side effects. Do not label sequential two-tab or mocked retry evidence concurrent DB evidence.

The concurrent guarantee applies only to callers supplying expected revision/status to the new reviewed operation; legacy Web/mobile semantics are preserved. Pending-medium policy applies only to active authorized staff at AAL2/current policy and ready media of pending_review listings, never originals or blanket listing/signing access.
