# Test Admin workflow completion — approval package

Current acceptance status (2026-10-07): owner-reported hosted sign-in/MFA, navigation/details and listing denial after logout succeeded on the current Preview. After the separately approved Test policy correction, the owner confirms all listing photos render. Disposable-record mutations and live moderation conflicts have NOT RUN. The acceptance pass remains incomplete; historical implementation/build evidence below is preserved.

Latest configuration correction: the subsequent locations-fix Preview lacked the three required FairSwap settings and is not a working acceptance target. Preview-only project settings are now persisted and replacement https://fairswap-admin-4pa3725r3-fairswap.vercel.app is freshly built with them. Authenticated Locations (with/without search) and registered Support-ticket observations remain pending; READY/configuration metadata is not a browser PASS. The detailed correction below supersedes the earlier replacement URL for remaining clicks.

Date: 2026-10-07 (Europe/Copenhagen). Admin baseline HEAD: 927c56ce88970aa9af022e4d1d43181c5307ba14; deployed executable: 0707b6b4b80dd5c6b5bc1ab579f7db7d8c8df15d. Preserve existing Preview, migration history and unrelated AGENTS.md changes.

## Observations and source

Current status: owner combined approval received ("approve for all"). A scoped local FairSwap-Web checkout now exists at Documents/FairSwap-Web, branch codex/admin-test-workflow-contracts, pinned to c415d689124f405db56cbe8d7daecde7eeef1c29. Both exact proposed changes applied to Test as 20261007153735_admin_pending_medium_download and 20261007153744_atomic_reviewed_moderation. Their definitions, grants and unchanged legacy function/trigger fingerprints were verified. Rollback-only anonymous/missing-identity database denials passed; these do not establish positive staff acceptance or concurrent decisions. The new backend pgTAP file is NOT RUN (Test lacks pgTAP; no disposable local database identified). The preapproval proposal/gate text below is preserved as history, not current execution status.

Backend checkpoint: da4a2055d9ee41778ef094380eeb4e2bddab3e06 (four files; original Web application unchanged). Admin executable checkpoint: 7353c1f5f11f598e6596ec3571dfa1e3e8bd2f2d. Final deployment dpl_9qiN2tyTnr8SPomCvw87TSFWh5Yw at https://fairswap-admin-61sjsaokx-fairswap.vercel.app was independently inspected **Ready / Preview**. Its metadata associates both checkpoints. Anonymous HTTP returned 302 to vercel.com; protection remains prod_deployment_urls_and_all_previews. Production still references canceled dpl_24adDX2fwSaG6QBe79r5z88irkVy. All older Previews remain retained. Local sign-in returned 200 at http://127.0.0.1:3000/auth/sign-in. None of these HTTP/metadata checks establishes authenticated page acceptance.

Read-only metadata identified listing 6da6bc3e-fd1e-4271-97e2-63e06ce73f65 / media 4c10d13a-a2d3-4dc6-82ed-ee05b0d9f3ec, revision 1, pending_review / ready, with matching medium object. Manual local/hosted photo and final page/logout observations were requested; no mutation of this listing was authorized by identifying it for reads. Active-listing photos remain outside this narrowly approved pending-only route/policy scope.

Separate source review checked exact SQL proposal equality/hashes, additive signatures, function search paths/grants, guard ordering, lock-before-comparison/delegation, no old RPC rewrite, status-conflict sanitization, no legacy fallback/retry, and unchanged photo-route restrictions. Backend advisor warnings concerned other existing functions/configuration; no new reviewed-RPC finding appeared, and no baseline advisor comparison or broad repair was performed. Details and remediation references are in the backend evidence plan.

Admin now sends expected_revision/expected_status to moderate_listing_reviewed, reports PT409 as refresh-required, and has no legacy fallback or automatic retry. Final focused regressions: 174 tests / 3 files passed. Complete default suite: 412 tests / 11 files; typecheck, zero-warning lint and standard Test-configured Next build passed. An initial fixture-union narrowing typecheck failed and was corrected before these successful checks. No dependency changes were required.

Exact disposable mutation targets and recipients are still unspecified. No listing, account, staff, report, support, privacy, category or location record was changed. User reported hosted sign-in complete on the previous Preview; page/MFA/logout/photo observations are not inferred from that report. Account deletion remains disabled. Export fulfillment and schema editing are now explicitly unavailable in page copy and metadata.

Read-only Test inspection: both listing buckets private; no storage.objects policies; 11 ready media records, 11 matching medium objects, 33 derivative objects and 11 originals. Eight ready media records belong to pending-review listings, three to active listings. No payload was read and no Test record changed.

Source: vivek2310sharma/FairSwap-Web at c415d689124f405db56cbe8d7daecde7eeef1c29: migrations 08/16/33, src/lib/media/processor.ts, src/app/admin/listings/actions.ts and existing Admin photo/decision code. Live function definitions, listing triggers and RLS were inspected. The source Web moderation caller supplies only listing_id/action/reason. Admin adds a precheck but currently calls the same legacy RPC. iOS/Android source callers have not been independently inspected; no existing signature, helper, trigger or business-rule body will be altered.

Official references checked: [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [operation helpers](https://supabase.com/docs/guides/storage/schema/helper-functions), [database functions](https://supabase.com/docs/guides/database/functions), [PostgREST errors](https://docs.postgrest.org/en/stable/references/errors.html). Installed Storage operation helpers are present. The current changelog was read; no applicable API change required a dependency upgrade.

## Backend ownership and gate

These SQL blocks are review proposals, NOT Admin migrations and NOT applied SQL. Actual migrations and database tests belong in FairSwap-Web/supabase/migrations and FairSwap-Web/supabase/tests. No local backend checkout has been identified: the named Documents/FairSwap-Web path does not exist and the registered local project is Admin only. An owner-identified checkout or authorization to create a scoped local backend checkout is required. Generate migration filenames through the existing Supabase CLI, inspect that repository's instructions and history, and preserve its outstanding work. Do not create another migration history here.

Apply only to wpppxlnbzqynvhpeuavd after one combined owner approval of these changes and exact fixtures/actors/recipients. No Production application.

## Change 1: medium derivative download policy

Exactly the object.get_authenticated operation, listing-derivatives bucket, recorded READY medium path, pending_review listing and current eligible moderator/admin AAL2 account with policy acceptance. Existing listing/media RLS additionally applies. No originals, bucket listing, signing, transform endpoint, public bucket, write or other derivative size is granted.

```sql
CREATE POLICY admin_pending_medium_download
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'listing-derivatives'
  AND storage.allow_only_operation('object.get_authenticated')
  AND app_security.is_active_staff_aal2('moderator'::public.staff_role_enum)
  AND app_security.has_current_policy_acceptance(auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.listing_media m
    JOIN public.listings l ON l.id = m.listing_id
    WHERE m.processing_status = 'ready'::public.media_processing_status_enum
      AND l.status = 'pending_review'::public.listing_status_enum
      AND m.medium_storage_path = storage.objects.name
  )
);
```

The existing is_active_staff_aal2 helper includes administrators. The Admin route independently validates IDs, media/listing binding, pending status, safe recorded path, MIME/size, current verified staff identity/MFA/policy and no-store byte delivery. It uses the existing user session and publishable key. This policy grants authenticated staff direct access to exactly those same allowed derivative bytes, not application-host-specific access. App-host isolation is not a claim.

Verification after approval: exact approved listing/media pair loads locally and on Preview; medium GET succeeds only for eligible staff; original, unrelated path, thumb/large, listing/signing, missing policy, AAL1, nonstaff and other roles deny. No new accounts or factor manipulation to obtain missing negative actors. Test processing/failed/missing states remain covered offline; live states require approved fixtures. Check bucket public=false and the exact policy definition afterward.

Rollback: DROP POLICY admin_pending_medium_download ON storage.objects; derivative reads revert to denial. No bucket/object/data deletion or old-policy replacement.

## Change 2: additive atomic reviewed-decision RPC

New name avoids PostgREST overload ambiguity and leaves public.moderate_listing and app_security.impl_moderate_listing unchanged. A narrow private entry point uses the established guarded definer architecture to acquire the listing lock; it delegates all decisions to the existing implementation under that same transaction/lock. The invoker public wrapper grants no new table-write capability.

```sql
CREATE FUNCTION app_security.impl_moderate_listing_reviewed(
  p_listing_id uuid, p_action text, p_reason text,
  p_expected_revision integer, p_expected_status public.listing_status_enum
) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_listing public.listings%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL
     OR NOT app_security.is_active_staff_aal2('moderator'::public.staff_role_enum)
     OR NOT app_security.has_current_policy_acceptance(auth.uid()) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Staff authorization required';
  END IF;
  IF p_listing_id IS NULL OR p_expected_revision IS NULL
     OR p_expected_revision < 1 OR p_expected_status IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Reviewed identity required';
  END IF;
  SELECT * INTO v_listing FROM public.listings
    WHERE id = p_listing_id FOR UPDATE;
  IF NOT FOUND OR v_listing.seller_id = auth.uid() THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Listing unavailable';
  END IF;
  IF v_listing.revision IS DISTINCT FROM p_expected_revision
     OR v_listing.status IS DISTINCT FROM p_expected_status THEN
    RAISE EXCEPTION USING ERRCODE = 'PT409', MESSAGE = 'MODERATION_REVIEW_CONFLICT';
  END IF;
  RETURN app_security.impl_moderate_listing(p_listing_id, p_action, p_reason);
END;
$$;
REVOKE ALL ON FUNCTION app_security.impl_moderate_listing_reviewed(
  uuid,text,text,integer,public.listing_status_enum) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_security.impl_moderate_listing_reviewed(
  uuid,text,text,integer,public.listing_status_enum) TO authenticated;

CREATE FUNCTION public.moderate_listing_reviewed(
  listing_id uuid, action text, reason text,
  expected_revision integer, expected_status public.listing_status_enum
) RETURNS jsonb
LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path = ''
AS $$
  SELECT app_security.impl_moderate_listing_reviewed(
    listing_id,action,reason,expected_revision,expected_status);
$$;
REVOKE ALL ON FUNCTION public.moderate_listing_reviewed(
  uuid,text,text,integer,public.listing_status_enum) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.moderate_listing_reviewed(
  uuid,text,text,integer,public.listing_status_enum) TO authenticated;
```

No rewrite of authorization/self-review, approval-media checks, cover validation, status transitions, audit writes or notifications. Existing trigger/audit exceptions roll back the decision transaction. Two reviewers of the same revision/status serialize: after the first transition, the second gets PT409 without another decision/history/audit/notification. Revision mismatch similarly fails under lock. A transport-uncertain result is not retried.

After approved backend verification, change only Admin's moderation RPC mapping to the new name/expected arguments and map PT409 to a fixed refresh-required conflict. Preserve final-state observation and no automatic retry. Add actual-client mock regressions for parameters, stale/conflicting decisions, missing RPC (deny; no legacy fallback), backend errors and repeated submission. Do not deploy that switch before backend readiness.

Scope of guarantee: only callers of the new operation gain atomic expected revision/status protection. Legacy Web/iOS/Android calls remain unchanged and keep their old semantics. These fields do not detect content changes that the existing schema does not reflect in revision/status. This does not redesign seller edit/revision semantics.

Backend verification: existing pgTAP/RLS suites plus approved actor/fixture tests; matching approve/reject/remove must each produce the intended record state, one expected listing_status_transitions row and required audit event with actor/revision/reason. Inspect notification semantics rather than inferring delivery. Invalid reasons/self/nonstaff/AAL1/stale/repeated calls must produce no new side effects. A two-session test is required to establish actual concurrent behavior; in-memory mocks cannot prove database locking. Do not run a privileged SQL session and call it staff RLS acceptance.

Rollback: first stop/revert the Admin switch to the preserved previous application checkpoint; then revoke/drop public.moderate_listing_reviewed and private impl_moderate_listing_reviewed with exact signatures. Do not alter the legacy RPC or undo completed fixture actions by broad SQL. Future deployments and rollback each remain Test-only and preserve evidence.

## Combined decisions needed

- Approve the two exact backend changes above for Test, including repository-local migration/tests and narrow Admin RPC integration afterward.
- Identify the backend checkout path, or permit a scoped local clone of the existing FairSwap-Web repository (no remote push).
- Identify approved disposable listing/media IDs (approve/reject/remove; expected revisions/status), reporter/recipient approvals, support tickets/replies/notes/status, non-operator user IDs for suspend/reinstate, category/city/locality IDs or names for create/toggle, disposable staff targets/roles, and synthetic privacy request IDs/status. Provide actor identity/role for each and approved notification recipients. No genuine request, ordinary user, active operator or last administrator will be changed.
- Identify existing additional role-specific accounts if coverage is wanted; missing accounts remain a gap. No new staff assignment to obtain a test actor is implied.

## Independent application work and evidence

Current changes label privacy export/deletion and category schema editing explicitly unavailable. Deletion remains disabled and status updates remain separate. Focused action tests extend restore/category update/locality paths and actual four-role server boundaries; 128 focused tests passed with global network blocking. Hosted sign-in was reported complete by the owner; hosted representative page loads/MFA/logout observations remain pending. No live mutation or backend policy/RPC change has been made.

## Real acceptance observations and photo blocker — 2026-10-07

Source inspection confirmed Admin HEAD dbdfa94750eacfaf0685c3830366c525b05cc064 on codex/admin-feature-migration, with only the pre-existing AGENTS.md modification before this evidence update. The Preview's independently inspected executable/backend checkpoints remain 7353c1f5f11f598e6596ec3571dfa1e3e8bd2f2d / da4a2055d9ee41778ef094380eeb4e2bddab3e06. No application source, backend configuration, deployment or existing record was changed in this pass.

The owner's hosted checklist reports normal sign-in and existing MFA completed, dashboard/visible lists/representative details all working, and logout followed by denial of the listing URL. These are manual owner observations, not automated browser or authenticated API checks. Post-logout /admin denial was not separately reported. The owner reports Photo 2 unavailable and then the same unavailable message on its exact byte route. Photo 1 rendering (the required media 4c10d13a-a2d3-4dc6-82ed-ee05b0d9f3ec) has not been confirmed.

Exact Preview request metadata confirms GET /admin/listings/6da6bc3e-fd1e-4271-97e2-63e06ce73f65/photos/f63e9067-6424-43af-9046-a1c9d5de70bb returned 503 at 16:04:14.501Z (also 16:03:46.352Z and 15:59:49.202Z). Read-only Test metadata shows Photo 2 ready with its medium object present, private bucket, image/webp and 52,072 bytes. Metadata existence is not image-rendering or backing-object durability evidence.

Narrow Test log projections for this listing show the approved staff user's object-download requests returning 400. Storage 1.77.5 reports GET info-route operations object.get_authenticated_info with NoSuchKey during the same interval. The installed operation helper compares normalized operation names exactly. Consequently the current admin_pending_medium_download policy, which permits only object.get_authenticated, cannot admit that metadata operation. This is an evidence-supported explanation for the failure; actual backing-byte delivery remains unverified. No raw logs, token claims, headers, storage paths or image bytes were exported. The pinned SDK's download method itself selects /object; it does not directly call info. Changing the client to a different download URL is not an established fix.

[Current official Storage access-control documentation](https://supabase.com/docs/guides/storage/security/access-control) demonstrates an explicit allowlist containing both object.get_authenticated_info and object.get_authenticated. [Operation helper documentation](https://supabase.com/docs/guides/storage/schema/helper-functions) confirms exact matching. A proposed Test-only correction is to ALTER the existing policy with the identical predicate except replacing its operation term with:

```sql
storage.allow_any_operation(ARRAY[
  'object.get_authenticated_info',
  'object.get_authenticated'
])
```

All other restrictions remain identical: authenticated SELECT, private listing-derivatives bucket, active AAL2 moderator/administrator, current policy acceptance, ready media, pending listing and exact recorded medium path. Listing, signing, transformation, originals, other derivatives and writes are not added. This would permit metadata read for the same allowed medium objects, so it is a permission change requiring separate owner approval under the current acceptance request. It is PROPOSED ONLY, not applied. A new backend-owned migration and narrow policy/operation regression would preserve the applied historical migration. After approval, verify the actual Test policy and normal hosted byte/rendering result; do not claim pgTAP execution without an approved database test environment.

The ordinary Test owner/recipient selected by the owner is tiyasharma081998@gmail.com, ID b1e0a6ea-3b91-44f1-8b14-ec72b4c238b7. Read-only metadata confirms verified, active, current policy acceptance and no staff role. The moderator is the distinct existing administrator 644cf146-1949-4521-b779-655d99785934. No password, MFA secret, session or credential record was read. No new listing/report/ticket/category/location ID exists from this pass; none was created or mutated.

### Subsequently approved and applied photo correction

The owner explicitly approved the exact two-operation Test correction above. Migration admin_pending_medium_download_info was applied once to wpppxlnbzqynvhpeuavd; recorded version 20261007161425. Local source filename was aligned with that actual version without changing its SQL bytes. Backend local checkpoint 152243a4b6134686c28c446c4f14850502340421 (parent da4a2055d9ee41778ef094380eeb4e2bddab3e06) contains only supabase/migrations/20261007161425_admin_pending_medium_download_info.sql and supabase/tests/admin_medium_operation.test.sql. Migration SHA-256: 6abb2756000d9fb01c8895c8a42ec9bceb0f3af7e7f92e01b9df1ee565471af3. No push or merge. The deployed Admin executable and its original deployment metadata remain unchanged; the backend correction is a later additive Test migration, not part of the original backend checkpoint.

Actual readback confirms authenticated SELECT, the exact two-operation allowlist, unchanged remaining predicate and both listing buckets private. Four rollback-only checks of the installed operation helper pass: info/download permitted by that operation allowlist, list/sign denied. They set only a transaction-local Storage operation, not user/JWT claims, and read no payloads or protected records. They do not establish positive staff RLS, complete negative-actor coverage, actual image bytes or rendering. The new six-assertion pgTAP source has NOT RUN; its approved database-test prerequisite remains absent. Whitespace checks passed and existing accepted backend migration/RPC test files are unchanged. Security advisor readback reports warnings on other existing functions, extension placement and Auth settings, with no policy-specific finding; no broad repair or clean-security claim is made. References: [database linter](https://supabase.com/docs/guides/database/database-linter), [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

After application, the owner reports: "Yes, all photos are visible now" in response to the request to verify actual Photo 1/Photo 2 rendering. This establishes a manual owner rendering PASS, including the specified media 4c10d13a-a2d3-4dc6-82ed-ee05b0d9f3ec; it is not an automated image inspection or direct authenticated API check. /admin denial after logout was not separately answered; earlier listing-URL denial remains confirmed. No Admin executable change or redeployment was needed for this backend-only correction.

Browser automation failed during initialization with the Windows sandbox helper error and again after one runtime reset. There is no agent-accessible authenticated owner/staff session. The documented seed-listings script is localhost-only and uses administrative account creation; it is unsuitable for this hosted Test task and was not executed or relaxed. Normal user flows require the owner's session; reports also forbid self-reporting. Privileged SQL inserts or forged JWT claims would not constitute approved creation or acceptance. Fixture creation, notification/history observation, invalid/duplicate live submissions, sequential stale review and true concurrent decisions remain NOT RUN pending normal authenticated interaction. Staff-role/account-status/privacy mutations also remain NOT RUN. No synthetic/native suite or unchanged Admin build checks were rerun; historical 412/11 and 174/3 results remain historical. The new backend checks are separately identified above.

## Assisted manual pass — registered intentions, not execution

The owner subsequently authorized normal assisted manual clicks and scoped read-only verification; browser automation is not a prerequisite. Keep the accepted hosted observations above. Exact pre-creation Test reads found no existing records with these labels/slugs for the approved owner. No fixtures have yet been created by this assisted pass.

Use Admin https://fairswap-admin-61sjsaokx-fairswap.vercel.app and Test Web https://fair-swap-git-staging-fairswap.vercel.app. Seller/reporter/support recipient: tiyasharma081998@gmail.com (b1e0a6ea-3b91-44f1-8b14-ec72b4c238b7); reviewing administrator: vivek2310sharma@gmail.com (644cf146-1949-4521-b779-655d99785934). Sign into each application's normal flow; no session export. Any actual policies/eligibility prompts must be answered by their owner, never invented by an agent.

Registered new fixtures and intended actions:

| Label / slug | Intended action | ID |
| --- | --- | --- |
| FS TEST 20261007 M1 Approve | seller draft, normal photos/cover/submit, staff approve; retained active for disposable chat/report | f431e2a3-803f-4e76-a513-5abafe9d11ec |
| FS TEST 20261007 M1 Reject | seller draft/submit, staff rejection with FS TEST M1 rejection reason | 377ba83b-366b-4020-9353-f10050243323 |
| FS TEST 20261007 M1 Stale | separate seller draft/submit; two stale review tabs, one approval and one denied stale rejection | 8946c945-d248-48de-8717-56243fdb7099 |
| FS TEST 20261007 M1 Support | owner-created General Question; internal note, customer reply, In Progress / Low update | b3ad1c93-d156-4f69-8b8b-f271fbadc735 |
| FS TEST 20261007 M1 Category / fs-test-20261007-m1 | create active, deactivate then activate only this new category | 84f961f1-9783-4c9c-8923-a5e1037b46c4 |
| FS TEST 20261007 M1 City / fs-test-20261007-m1-city | create active with explicitly synthetic state Test Only, deactivate/reactivate | f34168c9-58cd-4ff4-b979-16cd449ed059 |
| FS TEST 20261007 M1 Locality / fs-test-20261007-m1-locality | create only under the new city, deactivate/reactivate | 74bf2173-663a-4c25-bf80-bf16368599ad |
| FS TEST 20261007 M1 report | staff Web Contact Seller on the newly approved listing sends one explicitly synthetic message to Tiya; Tiya reports that received message; staff resolves with synthetic-case notes, no sanction | NOT CREATED |

The report path is source-derived: public listing Contact Seller -> account/messages conversation -> received-message Report Message -> ReportDialog -> create_report. There is no wired listing-detail ReportDialog in the reviewed source. This path sends its message and report-resolution notification to the already approved ordinary recipient. It does not report a genuine existing account record, create a staff role, or impose a user sanction. The initial message and report details explicitly identify acceptance testing rather than genuine misconduct.

Manual hold points: after initial drafts/ticket/category/city/locality creation, report visible outcomes; scoped reads register exact IDs and return exact listing/detail links before decisions/toggles. After the disposable report is created, register its exact ID before resolution. Stop a path on an uncertain response; reconcile its saved state before any repeat mutation. Two-tab stale review is sequential stale testing, never true concurrency. Final evidence must separately record browser observations, saved-record/audit/history/notification observations, historical automated checks and NOT RUN paths.

### First manual hold point: independently inspected saved state

Owner reports "1–4 - all done." This records the instructed application logout-denial and initial creation steps as manual owner observations, not agent browser inspection. Exact scoped Test reads identify the five IDs registered above. All three listings belong to the approved ordinary seller, are draft/revision 1, have null cover_photo_id and zero media records (not merely zero ready records). Normal photo upload/cover and review submission remain pending reconciliation; no moderation action is yet authorized by a ready-state claim. Ticket TICK-B3AD1C93 is saved open/normal for the approved recipient. Category is saved active with the exact requested slug. Audit f44ad57f-9044-4ba7-901f-9f6e014dc314 records category.created by the approved administrator for that category at 2026-10-07T16:32:33.238008Z. No audit rows were returned for the other four exact fixture targets; no claim is made that draft/ticket creation requires those audit rows.

No city or locality matched either registered name or slug. Exact visible creation confirmation/error or alternative synthetic labels were requested before a repeat submission. Location creation remains unconfirmed despite the combined manual report. No privileged mutation was used for reconciliation. Support-note/reply/update, category activation cycle, listing decisions, report resolution and conflict checks remain NOT RUN until performed and inspected.

### Observed locations failure and focused application correction

The owner clarified that /admin/locations shows the application "Test data unavailable" boundary; no city/locality creation was completed. Source embeds all localities in an unbounded city read. Read-only catalogue counts show 909 cities and 215,783 localities. Exact approved staff /rest/v1/cities requests with embedded localities returned HTTP 500 at 16:35:39.862Z, 16:35:54.419Z and 16:36:29.248Z; PostgreSQL 57014 cancellations occur in that interval. These observations support a query-size/cancellation cause; logs do not establish every cancellation's exact request attribution. The actual cities/localities columns and sole city foreign key match the existing contract.

Application-only checkpoint 9724a16c91011c945a031d1568ab1019a07c7efb contains src/app/admin/locations/page.tsx, src/lib/admin/locations.ts and tests/admin-locations.test.ts. It bounds cities to 25 plus one lookahead, bounds embedded localities to 25 each, selects only needed fields, provides bounded city-name search and city pagination, and explicitly labels the limited locality display. The full locality catalogue is not claimed displayed or fully paginated. Existing administrator authorization, normal user-session RLS and location actions remain unchanged. No backend, schema, permission or business-rule change was made for this failure.

Actual new verification: focused 140 tests / 2 files; default 421 tests / 12 files; final typecheck and zero-warning lint PASS; standard Next build PASS; whitespace PASS. A newly added transport spy initially caused a TypeScript tuple-typing error; its fetch type annotation was corrected and final typecheck passed. The installed SDK test uses intercepted synthetic transport and verifies distinct parent offset/limit and localities.limit, not live staff access. Historical 412/11 evidence remains above; no native custody/matrix suite ran.

The deployment used a newly created temporary export of committed source only, excluding real .env files, Git metadata, dependencies and unrelated uncommitted work. Existing fairswap-admin project/team/protection and unchanged deployment configuration were verified. Deployment dpl_6Cx1cK5FeTdirZVfodGWiSUAiCWx is independently inspected Ready / Preview at https://fairswap-admin-dmdnshpdg-fairswap.vercel.app, with sourceCheckpoint 9724a16c91011c945a031d1568ab1019a07c7efb and backendCheckpoint 152243a4b6134686c28c446c4f14850502340421. Protection remains prod_deployment_urls_and_all_previews. The earlier Preview and evidence remain retained. No push, merge or Production operation. Runtime location-page recovery remains pending the owner's normal browser observation; remaining checklist actions use the new Preview with the same registered fixture IDs.

### Preview configuration regression and correction

The owner inspected the preceding deployment and reported "Test configuration unavailable" for both /admin/locations (digest 1528887632) and /admin/support/b3ad1c93-d156-4f69-8b8b-f271fbadc735. Independent project metadata contained only ENABLE_EXPERIMENTAL_COREPACK. Inspection of that exact deployment's build/runtime variable-name lists confirmed the three required FairSwap fields were absent. Local standard-build success and READY state did not establish deployment configuration or authenticated page functionality; that preflight omission was an agent error.

Exact source chain: readAuthConfig in src/lib/auth/runtime-config.ts requires deployment environment exactly test, URL exactly https://wpppxlnbzqynvhpeuavd.supabase.co and a publishable key matching /^sb_publishable_[A-Za-z0-9_-]{20,}$/ with maximum length 256. Missing fields return null. createAdminClient returns null; requestClient propagates it; pageClient in src/lib/admin/server.ts throws "Test configuration unavailable" before staff authorization/data reads. This explains both page failures independently of their individual query contracts. Guard/schema/application code is unchanged.

With explicit owner authority, only those three fields were compared from ignored local configuration in memory. The local scope/format checks passed, and SHA-256 comparison confirmed its key matches the existing active modern publishable key retrieved for FairSwapTest; disabled legacy keys were not selected. No key, password, token or privileged key was printed, passed as a command argument or written to a new file.

Persisted in existing fairswap-admin project prj_FGcPmQBikEg6JUCspX3hQqmfMbCj / team_Fk8MZq6cxDXPS4ViXloT6AZW, targeting Preview only with no branch restriction:

| Variable | Expected value / verification | Storage |
| --- | --- | --- |
| FAIRSWAP_DEPLOYMENT_ENV | test; exact non-secret readback passed | Config (encrypted at rest) |
| FAIRSWAP_SUPABASE_URL | https://wpppxlnbzqynvhpeuavd.supabase.co; exact non-secret readback passed | Config (encrypted at rest) |
| FAIRSWAP_SUPABASE_PUBLISHABLE_KEY | existing active FairSwapTest publishable key; value suppressed, verified before stdin persistence | Secret (API type sensitive); not decrypted for readback |

The npm/PowerShell piped invocation misparsed CLI flags and failed before saving the first non-secret variable; metadata reconciliation confirmed absence. Direct invocation of the already installed, version-verified Vercel 62.5.0 Node entry point then persisted all three sequentially through stdin. No execution-policy, approval, elevation, authentication or permission bypass was used. The project list returns encrypted Config values, so comparison against those ciphertexts is not value verification; subsequent readback used the documented single-variable endpoint for only the two non-secret fields and verified exact matches. The Secret was never requested through that endpoint.

A fresh committed-source export of 9724a16c91011c945a031d1568ab1019a07c7efb contained neither real local .env files nor .next/prebuilt output. One deploy --target preview --force to the existing explicit project/team performed a fresh remote build with cache skipped, frozen lockfile, pnpm 10.12.1 and Next 16.3.5. Build/type checking passed. No code, dependency, schema, business-rule, Test-record or Production setting change occurred in this configuration repair. Existing unrelated AGENTS.md and in-progress evidence edits remain preserved; historical 421/12 unit evidence was not rerun for unchanged source.

Replacement: dpl_5cpqwcUzM7pB7zv6FsNaq5cDiatr, https://fairswap-admin-4pa3725r3-fairswap.vercel.app. Independently inspected Ready / Preview, project ID and source/backend checkpoint metadata match. All three required variables are present in its actual build and runtime variable-name lists. Protection remains prod_deployment_urls_and_all_previews; CLI reports vercel_authentication. Old artifacts were preserved. No push/merge.

Authenticated browser observation requested once, without mutations: /admin/locations must show city rows/forms; /admin/locations?q=FS%20TEST%20261007%20M1 must show search/empty-state/forms; exact registered Support ticket must show its detail and reply/state controls. The owner subsequently reported "all three worked." All three are therefore manual owner authenticated browser PASS on the replacement Preview, not agent browser automation or authenticated API checks. Read-only request metadata separately records HTTP 200 for the locations path and the exact support path; its requestPath projection omits query parameters and cannot independently distinguish searched versus unsearched locations. Configuration recovery is confirmed for these tested journeys; the registered fixture acceptance actions may resume. No fixture mutation or additional deployment was performed to record this observation.

### Resumed fixture actions: owner observations and exact saved-state verification

The owner reports all three continuation steps done and looking good. This is manual browser evidence, not automated browser verification or a new unit-test result. Exact read-only FairSwapTest checks independently confirm all three registered listings pending_review / revision 1, each with one ready media record and its cover selected. Covers: Approve 69cb680d-dc0d-461b-892a-2ebd57c4247c; Reject 68f78ad4-80f1-4b3b-89ab-8ba3f20e765c; Stale 67548489-81b2-4081-8c82-c23d5c2ec57c. Their seller remains b1e0a6ea-3b91-44f1-8b14-ec72b4c238b7, distinct from reviewer 644cf146-1949-4521-b779-655d99785934. Each has one draft-to-pending transition: bb38f54b-eb17-491d-b9a5-bc911ec8418b, ed6cc2fe-b8db-4e5a-97ea-4c1b162bec3d, and dba73882-7404-49c1-a3f1-72a36be6fc0b respectively. Decisions remain NOT RUN.

Support internal note c69646d1-be92-44c7-b3ac-7253b7773eeb and customer reply 74ed1de1-23cd-4283-a474-73aff4708a1f are saved once each from the approved administrator. Reply notification 26778192-af9a-435a-8c28-2fa7149e8092 targets only the approved ordinary recipient; saved notification is not delivery/read evidence. Ticket update audit 172ce96a-a158-47c4-bd07-126a654fe233 records in_progress / normal; later audit 770aeab6-74fd-4975-8e30-a6603a95838f records awaiting_user / low, matching current saved state. Do not label its final state In Progress / Low or infer a bug from this difference. Recipient-visible reply/internal-note exclusion remains unobserved.

City f34168c9-58cd-4ff4-b979-16cd449ed059 matches the requested synthetic name/slug and Test Only state, active; city.created audit 61125a46-723b-40fb-9f2a-bf9b466d5f67 records the approved administrator. The first exact locality name/slug read returned none; a subsequent exact-city read returned locality 74bf2173-663a-4c25-bf80-bf16368599ad with the requested name/slug, active. Reconciled before proposing any repeat creation: do not resubmit. Category remains active with only its previously recorded creation audit. Activation cycles, report creation/resolution, stale review and invalid/duplicate live submission checks remain pending. True concurrent requests and pgTAP remain NOT RUN. No database mutation, application edit, deployment or unchanged test-suite rerun occurred in this verification. Executable HEAD remains 9724a16c91011c945a031d1568ab1019a07c7efb; unrelated AGENTS.md work is preserved.
Exact locality audit read also confirms locality.created entry 35b5853a-87bf-4573-beb0-f71ac2ebfe04 for the registered locality, by the approved administrator at 2026-10-07T18:57:50.728665Z.

### Listing decisions and continuation report reconciliation

The owner reports all continuation checks tested and passed. Exact read-only Test inspection confirms Approve f431e2a3-803f-4e76-a513-5abafe9d11ec is active, with one pending-to-active transition 0c06fbfe-ed80-4f97-9f91-c1c7d0fab6cc and listing.approved audit 0b03f967-99c0-4026-b465-23a7f6f944fa. Reject 377ba83b-366b-4020-9353-f10050243323 is rejected with FS TEST M1 rejection reason, one pending-to-rejected transition 95f6993f-65f0-4981-892f-5efd8d2cb812 and listing.rejected audit e6a19918-a177-4c6b-8f7d-27cb244ad47e. Both decisions are revision 1 by the approved administrator, distinct from the approved seller. No duplicate decision/transition audit effects are present for those exact targets at inspection. This does not establish a deliberate duplicate-submit test.

Empty-reason rejection prevention and the approved recipient seeing the customer reply but not the internal note are recorded as manual owner PASS, without independent browser/session inspection. The separate stale listing 8946c945-d248-48de-8717-56243fdb7099 remains pending_review / revision 1 with no moderation transition or decision audit. Category, city and locality remain active, and their exact target audits contain creation entries only, no category.updated/city.updated/locality.updated entries. Existing backend source writes those update actions. Consequently the combined browser report does not yet establish a completed stale decision/conflict or persisted deactivate/reactivate cycles. Requested exact visible confirmations/errors before any repeated mutation; do not infer success or a specific application bug. Report creation/resolution remains outstanding. True concurrency and pgTAP remain NOT RUN. No mutation, code change, deployment, staging or commit occurred in this reconciliation; unchanged automated results remain historical.

### Latest combined PASS report: independently observed partial results

Owner reports "all passed now." A subsequent exact Test read confirms deactivation saved for the three registered configuration fixtures, with approved-administrator audits: category.updated / false 10ba0ff5-b4ff-4eae-8929-28a583b0ce61; locality.updated / false 0c271ad6-27e1-46bf-af36-44a276e621fb; city.updated / false 4950d4f2-aad4-4add-895d-4bc82595f3e9. All three are currently inactive; no reactivation audit is yet present. These are deactivation PASS, not complete activation-cycle PASS. The separate M1 Stale listing remains pending_review / revision 1 with no pending-review moderation transition or target audit, so a saved initial decision and competing stale rejection remain unconfirmed despite the combined owner report. Exact approved-reporter reads matching the registered FS TEST 20261007 M1 report details returned no record; no report ID is registered yet. Do not label report resolution complete or infer absence of all possible reports from that scoped filter. No repeat mutation was executed by the agent. HEAD remains 9724a16c91011c945a031d1568ab1019a07c7efb with only pre-existing AGENTS.md and evidence-document modifications. No new automated results, code changes, deployments, commits or remote Git actions.

### Reactivation and support resolution reconciled

The owner explicitly reports M1 City and Locality Active, identifies the stale fixture by title, and reports TICK-B3AD1C93 Resolved. Exact FairSwapTest reads now confirm category/city/locality all active with complete false-to-true audit pairs. Reactivation audits are category 771a2733-9bc7-4006-8a77-785d14ee44fe, locality 7ec20275-1017-42fd-8444-a0d880b42524, city 68890950-2348-4baa-9011-6f340adacb48, all by the approved administrator. Configuration creation and activation cycles are independently saved/audited PASS, with browser observations separately attributed.

The registered support ticket is resolved / low, with support_ticket.updated audit 160b5601-38e4-4e13-a63a-2681bb154399 by the approved administrator. This verifies support ticket resolution, not moderation report resolution: TICK-B3AD1C93 is a support identifier. Exact report-to-message-to-conversation reads restricted to the approved reporter, staff sender and the new M1 Approve listing return no matching message report. No report ID is registered. The separate M1 Stale listing remains pending_review / revision 1, without a moderation transition or audit; its title alone is not an observed approval or conflict result. These two live checks remain incomplete. No agent mutation or new test/deployment occurred; historical results and prior partial observations remain preserved.

### Sequential stale review PASS and message report registered

The owner reports tab B displayed "The listing changed. Refresh and review it again." Exact Test reads confirm the separate Stale listing is active / revision 1 with exactly one pending-to-active transition 8d04c022-46fb-4205-80a7-9fc38891b780 and one listing.approved audit 3008df39-04fe-4113-b98f-9c975b0c3bc4 by the approved administrator. No competing rejection transition/audit exists for the exact fixture. This is manual sequential stale-conflict PASS corroborated by saved effects, not actual concurrent-request testing.

The owner reports the synthetic message sent and Tiya receiving Report Message confirmation. The expected Approve-listing join returned none. One subsequent synthetic-label lookup scoped to the approved reporter and current time interval identified report 116ffb19-b346-47f7-9910-aeef595fc986, pending, targeting message 1b3566b0-ee89-48c6-be5b-be2b6532adb6 in conversation 91548225-98b2-4860-93a9-a8c9e23ba29b. The conversation instead references the separately approved disposable Stale listing 8946c945-d248-48de-8717-56243fdb7099. Sender is the approved administrator and reporter is the distinct approved Tiya account, so this remains within the approved disposable-fixture/recipient scope. The mismatch is explicitly recorded, not an absent-report conclusion or request to recreate it.

Registered next intended action: resolve only report 116ffb19-b346-47f7-9910-aeef595fc986 through the normal protected Admin report screen, notes FS TEST M1 synthetic case resolved; no sanction. No actual account sanction, role change or other record action is requested. After owner confirmation, inspect this exact report's resolver/status/time, audit and approved-recipient notification. Resolution remains pending. No agent mutation, code edit, new automated run, deployment, commit or push occurred.

### Assisted acceptance closeout: report resolution and remaining coverage

Owner reports "Backend operation completed" after the exact Admin resolution instruction. Exact read-only FairSwapTest inspection confirms report 116ffb19-b346-47f7-9910-aeef595fc986 resolved at 2026-10-07T21:03:24.376952Z, with exact notes FS TEST M1 synthetic case resolved; no sanction and approved resolver 644cf146-1949-4521-b779-655d99785934. Exactly one report.resolved audit 54e1b74d-0f36-4e6e-9d9e-ffcde2f23bb1 records that operation; separate report.evidence_accessed entries reflect evidence reads, not repeated resolution. Target remains synthetic message 1b3566b0-ee89-48c6-be5b-be2b6532adb6, reporter the approved ordinary account. Browser message is owner-observed; saved status/notes/resolver/audit are independently read, not an agent-authenticated browser/API operation.

The initial notification query expecting a report-ID link returned none. Existing backend source instead sends report_update to /account/reports. A recipient/type/one-second-resolution-window read returns exactly one notification 4f0d2ea2-da56-4f53-a42b-e007d6878bfb, at 2026-10-07T21:03:24.404121Z, with exact expected generic message-report-resolution body and link. This corroborates notification creation against the existing procedure and resolution timestamp; notification lacks a report-specific foreign key, so stronger direct record linkage is not claimed. read_at remains null: delivery/read is NOT OBSERVED. No notification was recreated.

Coordinated assisted pass now establishes: accepted manual sign-in/MFA/navigation/photo rendering/application logout-denial observations; saved and audited disposable listing approval/rejection; manual empty-reason prevention; sequential stale conflict with one saved approval/no competing decision; saved support internal note/reply/status updates and resolved state; manual recipient reply visibility/internal-note exclusion; saved and audited category/city/locality creation and deactivate/reactivate cycles; saved synthetic message-report resolution and recipient notification creation. Native browser automation and direct staff-authenticated API checks were not used as substitutes. Fixtures are retained, with no automatic deletion.

Remaining explicit coverage: true simultaneous moderation requests, deliberate duplicate-submit live exercise, listing removal, additional role-specific actors, staff-role/account-status/privacy mutations and backend pgTAP NOT RUN. Deletion/export/schema editing remain unavailable. Notifications being stored do not establish recipient delivery/read. No new password/MFA interaction is required for this closeout. Historical automated application verification remains focused 140 tests / 2 files, default 421 tests / 12 files, typecheck/zero-warning lint/standard build/whitespace PASS; no unchanged suite or native test was rerun. Current executable checkpoint 9724a16c91011c945a031d1568ab1019a07c7efb; backend checkpoint 152243a4b6134686c28c446c4f14850502340421; protected Preview https://fairswap-admin-4pa3725r3-fairswap.vercel.app. Closeout changes are documentation-only and remain unstaged/uncommitted alongside preserved unrelated AGENTS.md work. No new deployment, permission/schema change, privileged mutation, push or merge.

### Owner acceptance and documentation checkpoint

The owner accepts completion of the agreed Test acceptance batch, including the explicit NOT RUN limitations above, and authorizes one documentation-only local commit. This checkpoint preserves the historical sequence and limitations; acceptance of this batch does not expand coverage or authorize further operations.

Final Test Preview: https://fairswap-admin-4pa3725r3-fairswap.vercel.app/admin, deployment dpl_5cpqwcUzM7pB7zv6FsNaq5cDiatr, Preview target in fairswap-admin. Independently verified deployed executable/source checkpoint remains 9724a16c91011c945a031d1568ab1019a07c7efb, backend checkpoint 152243a4b6134686c28c446c4f14850502340421, FairSwapTest wpppxlnbzqynvhpeuavd. A later documentation commit is not the executed source checkpoint. Earlier accepted authentication/navigation/photo observations retain their originally recorded deployment attribution; replacement-Preview page checks and subsequent assisted fixture workflows are separately recorded above.

The local documentation commit contains only this plan/evidence document. Unrelated AGENTS.md changes remain outside it. No additional test, executable change, deployment, permission change, push or merge is part of this checkpoint. Stop after the documentation handback; no automatic next workstream.
