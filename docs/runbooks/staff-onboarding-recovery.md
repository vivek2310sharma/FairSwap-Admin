# Proposed staff onboarding and recovery

Status: **PROPOSED / REQUIRES OPERATIONS AND SECURITY REVIEW**. No live account or factor was created or changed for ADMIN-01B. This document does not close risk D or establish live acceptance.

## Ownership and activation

The platform owner must name a staff-activation owner, a recovery approver and a backup operator before rollout. Confirm identity, assignment, least-privilege role and approval through reviewed operational channels. Account activation and role assignment belong to the existing Web/backend owner; Admin supplies no provisioning interface. Any proposed backend change needs separate review with Web, Android and iOS impact assessment.

For a separately authorised acceptance exercise, use approved existing Test accounts. Confirm email verification and first-factor readiness without asking for or recording the password. Confirm authoritative user_accounts.account_status is active and staff_roles.role is administrator or moderator. User-editable metadata grants no access. Sign-in messages do not distinguish nonexistent accounts from incorrect passwords.

## Initial MFA

Under separately approved supervision, the person signs into Admin, opens their own AAL1 bootstrap and explicitly starts TOTP enrollment only when no factor exists. Enter the private setup key into an authenticator; never copy it to logs, tickets, screenshots, chat or the approval record. Admin offers manual setup-key entry without an external QR service. Setup is incomplete until a code is verified and the resulting token is verified as AAL2. Record outcomes, never codes or secrets.

Challenge existing verified factors. Complete an unverified factor only with the person's saved authenticator; lost setup material requires reviewed recovery. Admin does not delete, replace or recover factors. Failed challenge never permits new enrollment. Non-TOTP or malformed factor states fail closed. Bootstrap reads only self-eligibility and own factors, never listings or other staff data. Policy-required accounts can complete MFA but cannot enter protected content until current acceptance is confirmed.

## Policy completion

Explicit policy false uses the fixed Test Web policy-review journey. The person may need to sign into Web separately using the same account, complete its existing consent journey, return manually and request a fresh Admin recheck. Visiting Web is not consent evidence. No tokens, passwords, identifiers or cross-host return URLs are transferred. Verification outages show retry/signout; never bypass an error or write consent from Admin. Live hosted Web behavior was not verified here.

## Recovery and reactivation

Approve a recovery procedure with strong identity verification, a named approver, a recorded reason and an authorised operator using the existing provider/backend process. Password or email access alone must not be assumed sufficient for privileged recovery. Review temporary suspension, session revocation, factor removal/re-enrollment and approval ordering before real operations. Admin implements none of these mutations. Never perform real recovery to make a test pass.

After separately authorised recovery, reverify first-factor readiness, supervised MFA, current policy, active account and role. Reactivation needs explicit owner approval. Keep records free of secrets and private user data. Same-project JWTs are not intrinsically host-bound; host-only HttpOnly Admin cookies limit automatic sharing but do not prove token revocation or session isolation. Local-scope logout and effects on Web/other sessions need live acceptance.

## Separate live acceptance gate

After code/security review and explicit authorisation, exercise approved existing Test accounts with synthetic fixtures: credentials and expiry, role/account/AAL denials, initial and existing-factor MFA, failed challenges, stale/error policy states, fresh recheck, refreshed cookies through redirects, local logout/revocation and wrong-project/cross-host behavior. Verify actual self-read grants/RLS and email confirmation. Operational owners and provider recovery procedures still need approval. This runbook authorises no live task, deployment, backend change or Production access.
