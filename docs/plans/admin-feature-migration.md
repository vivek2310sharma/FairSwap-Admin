# Existing Admin feature migration

Source: FairSwap-Web `c415d689124f405db56cbe8d7daecde7eeef1c29`, explicitly selected by the owner on 2026-10-07. Destination: the working Antigravity checkout; baseline checkpoint `833e15b`, parent `51464fd77509a3906a6dab4da70edda00fd1e816`; branch `codex/admin-feature-migration`. Existing authentication, cookies, policy checks and pending queue were preserved and adapted in place. Web and older worktrees remain unchanged.

## Feature parity

M = implemented migration; offline, local live and hosted verification are separate.

| Source → destination | Actual implemented behavior | Backend / roles | Status |
| --- | --- | --- | --- |
| /admin → /admin | Overview and coherent navigation | Verified Test identity, active account, AAL2 and policy; all four staff roles | M; role-navigation/guard tests pass; live browse pending |
| /admin/listings and [id] → /admin/listings and [listingId] | Oldest pending queue (100); details/private location/media/history; approve/reject/remove and reasons | listings, listing_media, profiles, transitions; get_staff_listing_location_private; moderate_listing; moderator/admin | M; baseline five pending observed; mocked decisions pass; live decisions await exact fixtures; photos blocked below |
| /admin/users and [id] | Search, status filters, 20-row pagination; details and listing/report/admin-audit tabs; suspend/reinstate | admin_search_users; listings/reports/audit; admin_update_user_account_status; moderator/admin, self/staff restrictions | M; mocked actions pass; live browse pending; writes NOT RUN |
| /admin/reports and [id] | Status filters, target metadata, case-scoped bounded message evidence; resolution notes/status | reports/profiles/listings; admin_get_report_evidence/admin_resolve_report; moderator/admin | M; actual evidence envelope validated; live evidence/resolution NOT RUN |
| /admin/support and [id] | Status queue, conversations, internal notes/customer replies; ticket state/priority | support_tickets/messages/profiles; admin_add_ticket_internal_note/admin_reply_support_ticket/admin_update_ticket_status; support/admin | M; form/transport tests pass; live messages/state changes NOT RUN |
| /admin/privacy | Status queue; source deletion confirmation; generic resolution action | privacy_requests; admin_resolve_privacy_request; administrator | Queue/status M; deletion BLOCKED by elevated Web orchestrator requirement. Export is a source placeholder, not a fulfillment action |
| /admin/staff | Staff listing, assignment and source's revoke action | staff_roles; admin_assign_staff_role/admin_revoke_staff_role; administrator | M; revoke feedback exposed; live role changes NOT RUN |
| /admin/audit | Latest 50 audit rows; no source search/pagination | audit_logs; administrator | M; no audit write/delete capability; live browse pending |
| /admin/categories | Create/activate categories; display attribute schemas | categories/category_attributes; admin_manage_category; editor/admin | M; schema editing is not implemented in source; live writes NOT RUN |
| /admin/locations | City/locality lists, creation, activation toggles | cities/localities; admin_manage_location; administrator | M; live writes NOT RUN |

## Compatibility corrections and limitations

- Every page and action independently enforces its reviewed role allowlist with the existing verified identity, active account, Test issuer, AAL2 and policy checks. Support/editor sign-in/MFA integration was separately owner-approved after automatic review rejected the initial change. The default listing guard still rejects those roles.
- Zod and same-origin validation, confirmations, pending-state locks, sanitized errors and no automatic mutation retry. Existing RPC rules, audit and notification behavior are retained. An acknowledgement is not independent audit verification.
- Live Test metadata confirms RPC signatures and selected columns. profiles.account_status does not exist: support shows that limitation; reported-user status comes from admin_search_users. Nullable deleted-user references are handled safely.
- Report evidence is an envelope, not the source's assumed array. Validate report/message binding and at most three preceding messages before rendering.
- Listing decisions precheck reviewed revision/status and self identity, then verify resulting status after RPC acknowledgement. The existing RPC has no atomic expected-revision parameter: the precheck cannot eliminate an intervening revision race. Backend concurrency guarantees remain an external prerequisite.
- Test has no Storage object policies. Staff-session derivative delivery needs an authorized backend contract. No elevated key, privileged signer fallback, original access or policy change was added. The retained byte route supports pending-review medium derivatives; broader delivery awaits that backend contract.
- Account deletion denies before all deletion phases. Web's orchestration uses elevated Storage and Auth Admin capabilities, which were not adopted. An approved staff-scoped orchestration mechanism is required. Privacy status updates do not prove deletion/export fulfillment.
- Old marketplace/internal links are adapted to Admin detail routes without cookie/token transfer. Source branding and forms are retained. Only exact lucide-react 0.525.0 was added for source icons (cache reused); no existing dependency upgrade or script-permission expansion.
- Source schemas are display-only; export fulfillment has no implemented source action. Those dashboard descriptions are not claimed as features.

## Evidence

Integration milestone: complete default suite **314 tests / 10 files**, typecheck, zero-warning lint and unchanged standard Next.js 16.3.5 Test-configured build passed. Form milestone: **324 tests / 11 files** passed. Source test themes were inspected at the pinned revision; stronger actual guard/query/action/form tests supplement existing behavioral assertions.

Anonymous local GETs to all ten overview/list pages observed the streaming sign-in redirect. HTTP 200 was not treated as protected success. Browser automation failed to initialize with a Windows sandbox helper error; manual owner page observations were requested, with no bypass.

High-impact live mutations remain NOT RUN: the general go-ahead did not identify exact disposable fixture IDs, actor roles and notification recipients required by this task. No native custody tests, provisioning, shared-schema/RLS changes, Production changes or remote Git operations.

Final verification, owner observations, local checkpoint and protected Preview evidence will be appended separately.
