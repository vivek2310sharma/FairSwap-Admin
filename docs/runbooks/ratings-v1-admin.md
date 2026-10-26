# Ratings V1 Admin release handoff

Local implementation only, 26 October 2026. No GitHub writes, fetch/pull,
hosted reads/writes, deployment, activation or manual/browser testing performed.
Observed local starting HEAD: `eed97a8cf0b95569ffd471367dd16461f7212c97`.
This is not a verified synchronized base. Existing unrelated local work was preserved.

## Contract and security

Reviewed [Backend Ratings contract](https://github.com/vivek2310sharma/FairSwap-Backend/blob/2c34f1135ae0ff59f4f8810b883980325ac96c84/docs/contracts/ratings-v1.md)
and schema/moderation/consumer-contract SQL read-only through GitHub PR #59.
The Admin consumes exactly `admin_ratings_cases(kind,status,before_at,before_id)`,
`admin_ratings_case(case_id,action,reason)` and
`admin_ratings_ticket(ticket_id,action,reason)`.

The queue contains only strict metadata DTOs, fixed 20-item maximum pages with the
Backend's paired cursor. Empty final pages may have fewer than 20 records.
Evidence is retrieved exclusively by an explicit reason-required Server Action POST.
Existing active staff, role, AAL2, current-policy and same-origin checks are retained.
No private Ratings table access, elevated keys, evidence GET endpoint, evidence
prefetch, logs, persistent client storage, automatic punishment or automatic retries.
All Ratings calls explicitly disable SDK retries. Evidence is cleared before every
request and after every moderation outcome; a fresh reason/read is needed to act again.
Client confirmation and contextual controls supplement authoritative Backend rules.

Actions include hide/restore, dispute resolve, final void and reputation
exclude/clear-exclusion. Backend acknowledgement is distinguished from a verified
final state. Concurrent or uncertain outcomes never trigger replay. The contract has
no expected-revision parameter; Backend locking/state checks are authoritative, and
this UI does not claim compare-and-swap protection against every concurrent decision.

Linked ticket investigation uses the ticket RPC and the same restricted staff roles.
The ticket RPC changes the linked Ratings case, not support-ticket status or replies.
The separate Support workflow retains its existing administrator/support-agent roles.
Moderators can investigate linked Ratings tickets without gaining Support thread access.
Administrators have a feature-gated investigation link in Support ticket details.

The Backend appends immutable audit evidence for each successful read/action.
The contract does not expose an audit-history read RPC or total queue counts.
Admin displays audit acknowledgement and accurate current-page counts only; no fake
totals, unbounded pagination crawl or direct private audit-table query is introduced.
An audit-history viewer or exact cross-page totals needs a separately reviewed Backend
contract. These remain limitations if required beyond the present contract.

## Focused files

- `src/app/admin/ratings/page.tsx`, `actions.ts`, `[id]/page.tsx`, `tickets/[id]/page.tsx`
- `src/components/ratings/case-page.tsx`, `case-workspace.tsx`
- `src/lib/admin/ratings/contract.ts`, `feature.ts`, `server.ts`
- `src/lib/admin/mutations.ts`, `release-policy.ts`
- `src/components/admin-shell.tsx`
- `src/app/admin/support/[id]/page.tsx`
- `tests/ratings-fixtures.ts`, `ratings-server.test.ts`, `ratings-release-policy.test.ts`,
  `ratings-ui.test.tsx`, `ratings-actions.test.ts`, `ratings-routes.test.tsx`
- This runbook.

The archive has an exact inventory, scoped diff against saved starting file bytes,
SHA-256 manifest and automated execution evidence. `mutations.ts` already contained
unrelated mobile-catalogue work; its complete changed-file copy retains that work,
while the scoped patch includes only Ratings additions. Integrate the patch, not an
unreviewed wholesale replacement of the complete working file. Other dirty/untracked
files are excluded. Baseline copies in the archive identify this overlap.

## Staging release preparation — FairSwap Admin / FairSwapTest

GitHub owner: ChatGPT. Proposed isolated integration branch
`feat/ratings-v1-admin-staging` from verified current `staging`, targeting `staging`.
No branch was created here. Apply only the scoped Ratings patch and resolve any
base drift while preserving unrelated work. Run unchanged CI gates and required
automated checks on the actual integration branch.

- DB migrations: **NONE in Admin**. Six additive Backend Ratings migrations remain
  pending, owned by Backend PR #59; do not create/copy/run them from Admin.
- New server-only environment variable: `FAIRSWAP_ADMIN_RATINGS_TEST_ENABLED=false`
  (unset is also OFF). No `NEXT_PUBLIC_` equivalent.
- The independent private Backend `staff_enabled` setting must also be enabled by
  the authorized Backend owner before this UI can operate. Do not infer it from
  the Admin flag, read it directly or change it from Admin.
- Preserve existing Test environment/project validation and deployment controls.

## Production release preparation — FairSwap Admin / FairSwapProd

GitHub owner: ChatGPT. Proposed separate integration branch
`feat/ratings-v1-admin-production` from verified current `main`, targeting `main`.
Apply the same focused Ratings delta; do not merge staging wholesale into main.
No branch, PR, merge or production release was performed here.

- DB migrations: **NONE in Admin**; the same six Backend-owned migrations are pending.
- New server-only environment variable:
  `FAIRSWAP_ADMIN_RATINGS_PRODUCTION_ENABLED=false` (unset is OFF).
- Test activation cannot enable Production and Production activation cannot enable Test.
- Preserve active-release configuration, environment/project mapping, Preview-only
  ignored-build boundary, CI protections and existing production blocks for listing
  removal, account status, staff assignment/revocation and privacy status.
- Changing source does not itself authorize a production deployment or activation.

## Deployment order and rollback

1. Authorized Backend staging release to FairSwapTest, with six migrations and
   release preflight/receipt owned by Backend; settings default OFF.
2. Compatible Admin/Web/HelpCenter staging releases and automated gates.
   Web PR #273 and compatible HelpCenter delivery remain external dependencies.
3. Authorized Backend production release to FairSwapProd with separate preflight/receipt.
4. Compatible Admin/Web/HelpCenter production releases. Web PR #274 remains an
   external dependency. Activation requires reviewed compatibility and independent
   environment-specific Admin/Backend gate decisions.

No owner staging approval hold is introduced. Hosted deployment authority is outside
this task. Rollback: disable the matching Admin flag and authorized Backend Ratings
activation/settings, revert Admin to its retained prior deployment, retain Backend
case/audit evidence and additive data. Do not delete audit records or invent a down
migration. No rollback was executed here.

After deployment, the owner should verify production deployment/source identity,
FairSwapProd mapping, flags initially OFF, independent Backend staff gate, authorized
role/AAL2/policy enforcement, metadata-only queue and fixed pagination, explicit
audited evidence access, own-case denials, truthful action acknowledgements, retained
audit evidence and unchanged unrelated production restrictions using approved
automated production checks. No predeployment owner testing is requested.

## Evidence and remaining dependencies

Use the ZIP's `checks/` logs and `checks.json` for actual local automated outcomes.
These are synthetic local unit/regression checks and a local build, not live RPC
acceptance or hosted authorization/race proof. No manual, browser or exploratory
checks were run. Responsive structure, escaped evidence, reason labels, dialog
confirmation, pending controls and confidentiality are checked in component tests;
native dialog focus behavior and actual narrow-screen rendering were not browser-tested.

Unresolved external release dependencies: Backend PR #59 deployment/activation,
compatible Web/HelpCenter release availability, final integration-branch CI, hosted
authorization/audit acceptance and production deployment authority. No HelpCenter,
Web or Backend checkout was modified. Total counts and a readable audit history
are unavailable from the supplied contract. Existing seven historical Admin risks
remain OPEN / UNVERIFIED; this task does not close them.
