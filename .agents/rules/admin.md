# Admin project rules

## Ownership and workflow

Antigravity is the primary development environment. One Admin codebase uses Next.js App Router, TypeScript, Tailwind CSS, and Supabase. Admin owns UI, auth/session orchestration, staff presentation, Admin routes/actions, tests, and later deployment configuration.

FairSwap-Web/Supabase owns `supabase/migrations/**`, `supabase/tests/**`, shared schema, RLS, grants, RPC implementations, and shared backend configuration. Do not introduce Admin migrations or duplicate moderation business rules. Raise backend changes as separately reviewed Web/backend tasks, with explicit Web, Android, and iOS impact review. Preserve Web `/admin` until separately approved retirement.

Use plan/build/verify separation. Approval of a plan does not establish successful implementation or testing. Carry unresolved findings forward until supported by evidence. Proposed workflow: feature/fix/chore branches from `staging`, PR to `staging`, FairSwapTest verification, reviewed release PR to `main`. Branches are not created in ADMIN-00.

## Environment and session boundaries

Test uses FairSwapTest (`wpppxlnbzqynvhpeuavd`); Production uses FairSwapProd with configuration outside current scope. Each deployment has a fixed assigned project. Missing Test configuration fails closed; never use Production as fallback or offer a runtime database selector. No production access during ordinary feature development.

Use separate Test/Production browser sessions and host-specific Web/Admin cookies. No password or token handoff between applications; never place credentials/tokens in navigation URLs. A Supabase JWT is not intrinsically hostname-bound: verify issuer/project, reject wrong-project tokens, and test intended logout effects.

## Authorization and inputs

Enforce verified identity, active account, appropriate staff role, and AAL2 at every protected server/backend boundary. Navigation and layouts are insufficient. Listing moderation is limited to authorized moderator/admin roles. Use Zod for application/server boundary validation and safe redirect allow-lists.

Use existing staff accounts with email/password and TOTP MFA. No public signup, social login, new email OTP, or shared Auth settings change. Sign-in/MFA bootstrap must work before AAL2. Preserve current FairSwap policy-acceptance gating; do not bypass or automatically accept policies. Document supervised activation, enrolment, and recovery.

## Media and secrets

Media access is server-mediated, authorized before signing, limited to listing-matched thumb/medium/large derivatives, short-lived URLs, and sensitive responses with `Cache-Control: no-store`. Refuse originals. Do not copy the Web media route unchanged. Avoid unnecessary bucket-path disclosure and signed URLs in logs.

Media-signing credential design requires review before coding that portion. Service-role/secret keys are elevated server credentials, not storage-scoped credentials. Never expose secrets or service-role credentials in the browser. No credential provisioning or Storage policies during ADMIN-00.

## Provenance and safety

Pinned Web source: `8ad67672896a1a11f51009ffddf3bb39ee3cf698`. For every copied/adapted/rewritten source record repository, source path, SHA, destination path, and treatment in docs/PROVENANCE.md. Do not silently use newer HEAD; adoption needs a separately reviewed provenance update.

Preserve existing work. No destructive Git commands, resets, cleans, force checkouts, or overwrites. No deployments or production changes without explicit approval. Historical ADMIN-00 permitted only documentation and the empty-repository clone. The accepted review explicitly permits one local documentation baseline commit and local staging/feature branches, then ADMIN-01A foundation code, dependencies, local tests, and a placeholder-only .env.example. Keep foundation changes uncommitted. No ADMIN-01B/01C implementation, real environment files, backend operations, private-data access, credentials, pushes, PRs, issues, or emails. All seven reported security/backend items remain OPEN / UNVERIFIED.
