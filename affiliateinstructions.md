# GodaApp Affiliate Program and Portal

**Status:** Product and implementation specification  
**Prepared:** 14 November 2026  
**Scope:** Affiliate applications, super-admin review, authentication, referrals, balances, payouts, disputes, KYC, and dashboard experience.

## 1. Product goals

Build a trusted affiliate program in which:

1. Anyone can submit an application, but an application is not an account and does not grant access.
2. The super admin controls an authoritative allowlist. Only an applicant whose current membership status is approved can access the affiliate portal.
3. Supabase verifies the user's email and manages sessions. Payload remains the source of truth for affiliate membership, attribution, commissions, and payout records.
4. A referral counts only after a successfully paid course checkout has been verified by the server-side Bachs webhook.
5. Affiliate earnings, payout reservations, and completed payouts are auditable and cannot be duplicated by client requests.
6. The affiliate sign-in page follows the student sign-in composition; the affiliate dashboard follows the supplied Commerce Layer and Bachs visual references adapted to GodaApp.

## 2. Recommended end-to-end flow

### 2.1 Application

1. The visitor opens the public Affiliate Program page and submits their name, email, phone, reason for applying, and acceptance of the affiliate terms.
2. The server validates and normalizes the email, then creates a pending membership/application record in Payload.
3. GodaApp sends an application notification to `godaappinfo@gmail.com`. Email is a notification channel; the Payload record is the durable review queue.
4. The visitor sees a clear confirmation that the application is pending. They are not signed in, and no affiliate dashboard access is granted.
5. Repeated applications for the same normalized email surface the existing application and ask the applicant to contact support; they do not create duplicate memberships.

The form should submit to a GodaApp server endpoint, not directly to an email-forwarding service as its only action. This keeps the email and admin review queue in sync. The notification should not include unnecessary sensitive information.

### 2.2 Super-admin review

The Payload admin panel should include an **Affiliate applications / membership** view, available only to the super admin. It should show applicant name, normalized email, submitted date, application answers, current status, and a status-change history.

Admin actions:

- **Approve:** mark the membership approved. A matching applicant can then request a Supabase one-time email link; the affiliate profile and referral code are created after verification.
- **Deny:** mark the membership denied and keep an internal review note.
- **Re-approve:** a previously denied or revoked membership can be approved again. Existing referral and payout history remains attached.
- **Revoke access:** immediately make the membership ineligible to use the portal. The linked affiliate profile is suspended.
- **Delete:** the application can be deleted from Payload; its linked affiliate profile is suspended. Deletion does not yet retain a decision-history record, so archiving is preferable when an audit trail is needed.

The current status is authoritative: a denied or revoked membership cannot sign in; if a super admin later re-approves it, access can be restored. Status changes record the prior/new state, timestamp, actor, and review note. Deleting the application also suspends the linked affiliate profile, but permanently removes that application's decision history.

### 2.3 Affiliate sign-in and authorization

Use a dedicated route such as `/affiliate/sign-in`. The form may ask for the applicant's name and email as requested, but **a typed name is not an authentication factor**. Names can be guessed or changed; only control of the registered email address, verified by Supabase, proves identity.

Recommended sign-in sequence:

1. The user enters their name and email.
2. A server endpoint normalizes the email and checks the Payload membership. Only an approved membership may initiate the affiliate login flow.
3. Return a generic response such as “If this email is eligible, check your inbox” for all valid submissions, so the form does not reveal which emails are on the allowlist.
4. Supabase sends a one-time email magic link or OTP. The link proves control of the registered email; it is not a permanent password or approval grant.
5. After Supabase verifies the email and establishes a session, the server rechecks the membership status before every protected page/action. A successful email verification is not sufficient if the membership is denied, revoked, archived, or not yet approved.
6. Approved users continue to `/affiliate-dashboard`. Non-approved users are signed out or denied access and shown a helpful message:
   - **Pending/denied/revoked:** contact support if they believe access was removed or their application was declined.
   - **No application found:** visit the affiliate application page.

Supabase supports one-time email links/OTPs, redirect allowlists, and built-in Auth rate limits. In the current scaffold, the server sends a link only after the submitted name and normalized email match an approved application. It permits Supabase to create that email identity at that point; the callback then rechecks approval before creating a Payload student profile and affiliate record. The public application endpoint never creates a Supabase identity.

Add application-level throttling for the sign-in-request endpoint as a second layer, and use CAPTCHA only if abuse warrants it. Configure Supabase redirect URLs for production and local development. Rate-limit and authentication errors should be visible without disclosing membership status.

### 2.4 Referral attribution and successful sale

The affiliate shares a validated GodaApp catalog redirect carrying their active referral code, for example:

`https://<godaapp-domain>/api/affiliate/referral?code=<CODE>&next=%2Fcatalog`

The journey is:

1. A prospect opens the link and lands on the catalog. The server validates both the active affiliate code and approved membership before setting the HTTP-only, SameSite cookie.
2. The prospect chooses a course and starts checkout.
3. The server-created Bachs checkout session carries the referral code in trusted metadata. The browser redirect alone never grants enrollment or commission.
4. The Bachs webhook verifies the raw-body signature, event type, paid status, course, student, and amount. Only then may it activate enrollment and create an affiliate commission.
5. The webhook records the referral against the affiliate, course, paid order/checkout, USD base sale amount, commission rate, commission amount, attribution date, and status.
6. A duplicate webhook or retry must not create another enrollment, referral, or commission. Database uniqueness/idempotency protection is required in addition to a “find before create” check.

Recommended v1 attribution rule: retain the 30-day cookie window and enforce **last valid affiliate link wins**. A new referral code replaces the cookie only after the server validates an approved application and active affiliate. Invalid codes leave an existing valid cookie untouched. Only approved, active codes can produce a commission when the verified paid webhook is processed. Retiring a link prevents new attribution through it but does not erase existing referrals.

Commissions remain in the course's USD base currency and are immediately available after the signed paid-checkout webhook creates the credit. If a purchase is refunded, reversed, or charged back, record a compensating adjustment or mark the referral ineligible; do not silently delete the original transaction. Refund and chargeback events are currently handled by a super admin entering a ledger adjustment.

### 2.5 Balance and payout request

The Balance page shows commission credits that are eligible and not already reserved for a payout. The affiliate chooses **Request payout** and sees a form with:

- Requested USD amount, prefilled as the full currently available balance and confirmed in the review step; the server recalculates it and rejects a stale confirmation.
- Payout method: bank transfer or USDT (TRC-20).
- Payee/account name.
- Country.
- Bank name and account number for bank transfer, or wallet address with an explicit TRC-20 network confirmation for USDT.

The form displays a summary before submission. The server recalculates eligibility and available funds; it never trusts the displayed amount or balance from the browser.

Payouts are handled entirely by GodaApp staff **offline**. Bachs is used only for the prospect's course checkout; it does not initiate, process, or settle affiliate payouts. No payment processor or payment API is part of the affiliate payout workflow.

On submission, create a payout request and reserve the specific eligible referral credits included in it. The Balance page then excludes those credits because they are **reserved**, while Payouts shows the pending request and its allocated referrals. Referral rows are not moved or deleted: a payout allocation links immutable referral credits to a payout request.

Verified KYC is required before a payout request can be submitted. The current request form pre-fills the full available balance and does not accept a client-selected amount. The server independently calculates the amount, reserves the eligible referral credits, and records the payment details supplied by the affiliate.

Admin processing:

- **Pending:** allocated credits are reserved and cannot fund another request.
- **Paid offline (settled):** after staff complete the offline payment, mark the request approved and optionally record its external transaction reference and internal notes. The system records the paid timestamp and settles the allocated credits; it does not send money.
- **Rejected/canceled:** enter a rejection reason. The request's credits are released to Balance and remain visible in Payouts history as released allocations.

The portal must clearly state that a request is reviewed and paid manually outside GodaApp. Do not imply that submitting a request automatically sends a bank transfer or crypto. Before staff pay USDT, confirm the TRC-20 network and address out of band and follow the published fee/FX policy. The app records the request and its outcome only.

### 2.6 Disputes and KYC

**Disputes:** The Disputes page lists the signed-in affiliate's cases and status. **Create dispute** opens a form for a subject, category, and complaint details. Submissions are rate-limited, stored in the admin-only Payload collection, and then sent to `godaappinfo@gmail.com` through the configured FormSubmit endpoint. A mail-delivery failure does not discard the saved case; the affiliate sees a warning to contact support.

**KYC:** The page collects legal name, date of birth, country, residential address, identity-document type, and only the last four ID digits; it does not upload identity documents. KYC records and review notes are super-admin-only. Current states are `submitted`, `under_review`, `verified`, `needs_information`, and `rejected` (an affiliate without a record is `not_started`). Verified KYC is required before a payout request. A retention period and privacy policy still need to be established; do not imply that KYC is automatically deleted.

### 2.7 Revocation and sign-out

The Profile control sits at the bottom of the dashboard navigation and opens a menu with profile details and **Sign out**. Sign-out clears the Supabase session and sends the user to `/affiliate/sign-in`.

When an admin denies or revokes an account, enforce the new state on the next protected request and server action, not just in the sidebar. Revoke active refresh sessions where supported. Preserve completed payout and referral records for financial audit; make deletion an archive/retention operation rather than destroying the ledger.

## 3. Affiliate dashboard information architecture

Use the supplied Bachs and Commerce Layer screenshots as the primary dashboard visual references; do not treat the student dashboard as a strict portal-shell requirement. Adapt the references to GodaApp's semantic colors, type, and interaction patterns without copying competitor branding. The affiliate **sign-in page** is the exception: it should follow the student sign-in composition, using `/afi.avif` from `public` for its image panel.

The supplied dashboard screenshots show a persistent left navigation, compact global header, prominent page title, restrained white/light-gray work surfaces, search and date controls, data tables, clear empty states, export actions, and a focused multi-step dialog for a payout request. Use those patterns for the affiliate portal: group Dashboard, Balance, Payouts, and Referral links in the primary navigation; keep Disputes and KYC accessible; anchor Profile/sign-out at the bottom. Collapse the navigation accessibly on mobile and retain a readable row/card presentation at narrow widths.

For the affiliate sign-in page, follow the student sign-in page's responsive two-panel layout: branded image with a dark overlay and short welcome copy on one side, a light form panel on the other, and a stacked layout on small screens. Use `afi.avif` (actual path `/afi.avif`) for the image. Keep the affiliate's email-verification flow and eligibility messaging; reuse the composition, not the student's password/Google sign-in behavior.

| Navigation item | Purpose and primary content |
| --- | --- |
| **Dashboard** | Welcome/status message; available, reserved, and paid totals; referrals in the selected period; recent referrals; recent payout requests; shortcuts to links and payout request. |
| **Balance** | Available USD balance and date filter; eligible commission table; **Request payout** form/dialog; clear pending/refund/hold statuses. |
| **Payouts** | Payout request and transaction history plus the referral credits allocated to each payout; statuses, dates, methods, admin transaction references, and CSV export. |
| **Referral links** | Active catalog link, copy action, link status, and create/retire controls. Use one stable referral code for v1; allow campaign/deep links later if needed. Retiring a code must not erase historic attribution. |
| **Disputes** | Existing disputes and statuses, with **Create dispute** opening the submission form. |
| **KYC** | Minimal identity fields, current review state, and resolution instructions; this version does not collect document uploads. |
| **Profile** (bottom) | Basic profile and membership state; chevron menu with sign out. Avoid displaying full bank or wallet details after submission. |

### Balance table

Suggested columns: referral date, course, masked purchaser identifier, order reference (non-secret), eligible sale amount in USD, commission rate, commission earned in USD, and status. Add a date range filter and a visible total for the same range. Avoid exposing a referred customer's full email address to the affiliate.

### Payouts CSV

The server generates a CSV containing only the signed-in affiliate's data: payout/referral reference, dates, course, commission, payout amount, payout status, payout method, and transaction reference. Escape spreadsheet formula-leading characters and never include full customer emails, bank account numbers, wallet credentials, or KYC fields.

## 4. Payload data model and access rules

Adapt existing collections instead of introducing a second competing source of truth:

- **Affiliates / membership allowlist:** normalized unique email, name, application fields, current membership status, optional Supabase/Payload user relationship, referral-code relationship, application/approval/denial/revocation timestamps, admin decision reason, and archived timestamp. Applicants must be representable before a user record exists. Do not require bank details just to submit an application.
- **Affiliate status history:** append-only decisions with previous/new status, actor, timestamp, and reason.
- **Affiliate links:** for v1, the active code can remain on the affiliate membership. If multiple links/campaigns are added later, create a dedicated collection with unique code, destination, status, and created/retired timestamps.
- **Referrals/commission credits:** immutable paid-sale facts, USD base amounts, status/eligibility dates, provider event/order identifiers, and attribution code. Add a unique provider event/order constraint so retries cannot duplicate a credit.
- **Payout requests:** affiliate, amount, currency, method, submitted payout-detail snapshot, status, decision/paid timestamps, admin notes, and transaction reference.
- **Payout allocations:** explicit join records between payout requests and referral credits. Each credit can be allocated to at most one active request. Rejections release allocations; paid allocations remain settled.
- **Disputes:** affiliate, related referral/payout, category, description, status, submitted/resolved dates, and admin response. No document upload unless separately secured.
- **KYC:** minimal identity fields and review metadata, with protected document storage and restrictive access.

Every affiliate data read/write must be scoped server-side to the authenticated affiliate. Payload admin collections remain super-admin only; affiliate browser clients must never receive unrestricted Payload access. For financial writes, use narrowly scoped server actions/routes with server-side validation and idempotency.

## 5. Design and interaction guidance

- Reuse existing shared controls and responsive patterns, but take the dashboard composition from the supplied Commerce Layer/Bachs screenshots rather than reproducing the student dashboard shell.
- Use semantic theme tokens and the GodaApp signature green/orange only for clear emphasis. Do not reproduce competitor colors or brand assets.
- Use a persistent desktop sidebar and compact top bar with an accessible mobile navigation pattern. Keep Profile/Sign out at the bottom on desktop and reachable without scrolling through every item on mobile.
- Use familiar tables with responsive horizontal scrolling or a deliberate mobile row/card layout; do not hide important statuses on narrow screens.
- Every table needs loading, empty, error, and populated states. Use explicit retryable errors rather than success-shaped empty data.
- Confirm destructive or financial actions. Retiring a referral link, submitting a payout request, and submitting KYC should have clear consequences and confirmation.
- Label values with currency and date range. Show earnings in USD consistently; any offline payout conversion/fee policy must be explicit before the request is submitted.
- Provide visible focus, keyboard support, accessible dialog labels, and clear success/error feedback.
- Use Bachs' multi-step withdrawal dialog only as an interaction/layout reference. The GodaApp form creates an offline payout request and must not call Bachs or any other payment service.

## 6. Current implementation compared with this specification

The affiliate dashboard routes are populated and use a shared responsive portal shell. The user-facing actions are server-side, recheck Supabase authentication and current approved Payload membership, and scope records to the signed-in affiliate.

- `/affiliate` stores a pending Payload application and terms acceptance, rate-limits submissions, and notifies `godaappinfo@gmail.com`. Duplicate normalized emails do not create another application.
- Payload's super-admin-only **Affiliate Applications** collection supports pending, approved, denied, revoked, and archived states. Status history records the actor, timestamp, prior/new state, and review note. Approval attempts a Supabase OTP email automatically; the admin collection records whether that notification was sent or failed.
- `/affiliate/sign-in` checks the submitted name and normalized email against an approved application, rate-limits requests, and sends a Supabase one-time link. The callback verifies the email and checks membership again before establishing the affiliate profile. Protected pages and server actions repeat the membership check. Supabase redirect allowlisting and `APP_BASE_URL` (or `NEXT_PUBLIC_SITE_URL`) must be configured.
- Referral attribution uses a 30-day HTTP-only cookie and explicit **last valid link wins** behavior. Only an approved member's active link can replace it. The paid Bachs webhook records USD commissions and unique checkout identifiers on referrals/enrollments to prevent duplicate credits on webhook retries.
- The dashboard provides recent referrals, available/reserved/earned metrics, an active-link manager, referral balance, payout history with a CSV export, disputes, KYC, and profile/sign-out. Purchaser emails are masked; CSV values are escaped against spreadsheet formulas.
- Payout requests require verified KYC. The server calculates the request amount, reserves the eligible credits, and stores payout details; no affiliate payout payment API is called. Super admins mark offline-completed requests as paid or reject them. Rejection releases the reserved credits while retaining allocation history.
- Disputes are stored before email delivery is attempted. KYC records are restricted to super admins and store only the last four identity digits; uploaded ID documents are not collected.
- Refund/chargeback corrections are currently entered by a super admin as ledger adjustments. A verified Bachs refund/chargeback event integration has not been implemented because the provider event contract has not been confirmed.

**Operational items still required:** apply both registered affiliate migrations in the target database; configure/verify the production Supabase email template, redirect allowlist, and public app URL; configure the existing FormSubmit endpoint; define and publish KYC data retention/privacy policy; and decide whether to implement provider-verified refund/chargeback ingestion. Supabase sessions are checked against membership on each protected request, but this implementation does not proactively revoke existing Supabase refresh sessions when a membership is denied.

## 7. Implementation status

1. **Application, allowlist, and sign-in:** implemented; production email and redirect configuration remains environment-dependent.
2. **Referral attribution and paid-checkout ledger:** implemented with active-link validation and checkout uniqueness; refund/chargeback ingestion remains a documented manual admin operation.
3. **Dashboard workflows:** Dashboard, Balance, Payouts history/export, Referral links, Disputes, KYC, and Profile/sign-out are implemented.
4. **Operations:** admin-only review collections and offline payout settlement are implemented. Define KYC retention policy and, if required, proactively revoke Supabase sessions on membership revocation.
5. **Visual and engineering validation:** responsive UI is in place; complete desktop/mobile visual review and the final test, typecheck, lint, and build pass before release.

## 8. Acceptance criteria

- A new application is persisted and visible to the super admin; it does not grant a session or portal access.
- Only an approved email can complete the affiliate sign-in flow. The name field alone can never authenticate a user.
- A denied/revoked user cannot access protected pages or server actions, even with an existing Supabase session; re-approval can restore access.
- A valid affiliate link can attribute a verified paid Bachs checkout within the declared attribution window. Browser redirects cannot create commissions.
- When more than one valid affiliate link is visited within the attribution window, the most recently visited valid link receives attribution (“last valid link wins”).
- Replayed webhooks do not duplicate enrollments or referral credits. Refunds/chargebacks adjust eligibility and balances transparently.
- A payout request reserves the selected eligible credits immediately. Two concurrent requests cannot reserve the same credit or exceed the available balance.
- Rejected requests release their reservations. Staff can record an offline payment as paid, with an auditable reference and matching allocated credits; no payment service is invoked.
- Affiliates can only read their own records; super-admin-only data, KYC evidence, full payment details, and other affiliates' customer data are not exposed.
- CSV exports contain only the current affiliate's allowed fields and are safe to open in spreadsheet software.
- Application, login, payout, dispute, and KYC flows provide accessible validation, explicit errors, and clear confirmation states.

## 9. Research notes and references

Reviewed on 14 November 2026. Public references informed workflow patterns and component-system considerations; they are not specifications to copy.

- [Selar Affiliate Network](https://affiliates.selar.com/) and [Selar affiliate feature overview](https://selar.com/features-affiliates): affiliate marketplace and discovery context.
- [Selar: Become a Selar Affiliate](https://help.selar.com/portal/en/kb/articles/become-a-selar-affiliate-17-6-2024): public onboarding guide describes joining the network, selecting products, generating unique links, and accessing affiliate links.
- [Commerce Layer App Elements — Applications](https://commercelayer.github.io/app-elements/?path=/docs/getting-started-applications--docs): explains that App Elements components are used to build dashboard applications and can be reused to match an app's look and feel.
- [Commerce Layer App Elements — Custom apps](https://commercelayer.github.io/app-elements/?path=/docs/getting-started-custom-apps--docs): describes custom dashboard apps, organization/admin enablement, deployment, and app-specific permissions. This supports adopting a coherent shell and explicit role boundaries, not copying its brand.
- [Lemon Squeezy Affiliate documentation](https://docs.lemonsqueezy.com/help/affiliates): links to affiliate hub, referral generation, and payout guidance as separate workflow areas.
- [Supabase passwordless email authentication](https://supabase.com/docs/guides/auth/auth-email-passwordless): documents one-time magic links/OTPs, redirect configuration, and disabling automatic account creation.
- [Supabase Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits): describes built-in authentication endpoint limits and configuration.
- User-supplied screenshots of the Bachs sandbox dashboard and Commerce Layer test dashboard: visual references for sidebar navigation, global controls, tables, empty states, export actions, settings tabs, and a multi-step withdrawal dialog. They are used for visual direction only; Bachs' payout mechanics are not part of GodaApp's flow.

The Commerce Layer Storybook documentation was opened and read. The live authenticated dashboards could not be inspected directly, so the attached screenshots are the source for their UI patterns. Competitor styling, account details, and sandbox values should not be copied into GodaApp.
