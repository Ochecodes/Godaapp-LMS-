# GodaApp

GodaApp is a digital-asset education platform built with Next.js App Router. The repository contains public marketing and policy pages, student and affiliate route groups, a Payload CMS data model, Supabase authentication middleware, a Bachs checkout and webhook integration, and shared UI components.

> **Implementation status:** This repository is under active development. Some route files and integration helpers are currently placeholders. Consult [Known implementation gaps](#known-implementation-gaps) before treating an area as deployable.

## Technology Stack

| Area | Technology |
| --- | --- |
| Web framework | Next.js 15.3.8, App Router |
| Language | TypeScript 5.8, strict mode |
| UI runtime | React 19 |
| Styling | Tailwind CSS 4 |
| CMS and application data | Payload CMS 3 with PostgreSQL adapter |
| Authentication | Supabase Auth with `@supabase/ssr` |
| Payments | Bachs overlay checkout and signed webhook integration |
| Analytics | Tinybird event ingestion and Payload-admin dashboard |
| Package manager | pnpm 10.18.2 |

## Prerequisites

- Node.js 20 LTS is recommended. Next.js 15 requires Node.js 18.18 or newer.
- pnpm 10.18.2, as pinned by the `packageManager` field.
- A PostgreSQL database for Payload CMS.
- Supabase project credentials for authenticated features.
- Optional Bachs and Tinybird credentials for their respective integrations.

## Local Setup

1. Install the pinned package manager if needed, then install dependencies:

   ```sh
   corepack enable
   corepack prepare pnpm@10.18.2 --activate
   pnpm install --frozen-lockfile
   ```

2. Create `.env.local` in the repository root. This file is intentionally ignored by Git. Define the variables listed in [Environment configuration](#environment-configuration); do not commit real credentials.

3. Start the development server:

   ```sh
   pnpm dev
   ```

4. Open <http://localhost:3000>.

The first request to a route may take longer while Next.js compiles it. Avoid running `next build` at the same time as `next dev`; both use the `.next` output directory.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Next.js development server |
| `pnpm lint` | Run ESLint with the Next.js core-web-vitals and TypeScript rules |
| `pnpm typecheck` | Run the TypeScript compiler without emitting files |
| `pnpm test` | Run unit and mocked route/component tests once |
| `pnpm test:watch` | Run Vitest interactively while developing |
| `pnpm test:coverage` | Run tests and generate V8 coverage reports in `coverage/` |
| `pnpm build` | Create an optimized production build |
| `pnpm start` | Serve the most recent production build |

The test suite uses Vitest and React Testing Library. External Supabase, Payload, Bachs, and Tinybird boundaries are mocked so tests do not require credentials, network access, or a live database. The current suites cover verified middleware identity forwarding, authentication and rate limits, student enrollment synchronization, lesson access and viewer interactions, affiliate payout actions and application-form behavior, Bachs checkout initialization and signed webhook fulfillment, quiz authorization and answer disclosure, the Bachs API client, Tinybird analytics shaping, and accessible loading/checkout UI states. Coverage output is informational and does not claim that every route or component is tested; add tests alongside new behavior and expand integration/browser coverage as features require it.

## Environment Configuration

Create a local `.env.local` file. The current integration code references these variables:

| Variable | Required for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase-backed authentication | Public project URL. Protected routes fail closed when this or the anon key is missing. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase-backed authentication | Public/anonymous Supabase key. Do not put a service-role key here. |
| `SUPABASE_SECRET_KEY` | Server-side account administration and distributed rate limiting | Server-only Supabase secret key (`sb_secret_...`). Required by the database-backed rate limiter; never expose or commit it. `SUPABASE_SERVICE_ROLE_KEY` remains a temporary fallback during migration. |
| `DATABASE_URI` | Payload/PostgreSQL | PostgreSQL connection string used by the Payload adapter. |
| `PAYLOAD_SECRET` | Payload CMS | Set a strong, unique secret in every non-local environment. The source currently contains a development fallback; replace it for deployment. |
| `BACHS_API_KEY` | Bachs checkout session creation | Use a sandbox key (`sk_sandbox_...`) for development and a live key (`sk_live_...`) in production. Server-only. |
| `BACHS_WEBHOOK_SECRET` | Bachs webhook verification | Signing secret for the configured webhook endpoint. Server-only. |
| `APP_BASE_URL` | Bachs checkout return URLs | Public HTTPS URL for this app. Bachs rejects localhost; for local checkout testing, use an HTTPS tunnel that forwards to the local Next.js server. |
| `TINYBIRD_API_KEY` | Platform analytics | Server-only Tinybird token with event-ingest and SQL-query permission for the analytics data source. Never expose this as a `NEXT_PUBLIC_*` variable. |
| `TINYBIRD_URL` | Platform analytics | Region-specific Tinybird API base URL, such as `https://api.tinybird.co`. |
| `TINYBIRD_ANALYTICS_DATASOURCE` | Platform analytics | Optional data source name; defaults to `godaapp_events`. |
| `NEXT_PUBLIC_SITE_URL` | Canonical metadata and `sitemap.xml` | Public production origin using HTTPS. The sitemap falls back to `APP_BASE_URL`, Vercel's deployment URL, then `https://godaapp.com`. |

Never place secret values in `NEXT_PUBLIC_*` variables; Next.js exposes those values to browser bundles.

The generated `src/app/sitemap.ts` serves `/sitemap.xml` and includes indexable public pages only. Signed-in dashboard, payment, API, and CMS routes are intentionally excluded from search-engine discovery. The footer's Sitemap link points to this XML document.

The public catalog uses Zustand for its transient search/category selection and TanStack Query for the public featured-course details endpoint. Its five-minute client stale window aligns with that endpoint's public cache policy. Do not reuse this cache for user-specific, authentication, enrollment, or payment data; these libraries do not eliminate server/database latency and are not a blanket performance fix.

Tinybird ingestion requires a valid token for the workspace matching `TINYBIRD_URL`, with permission to append to the configured event data source. The analytics integration is optional; when `TINYBIRD_API_KEY` or `TINYBIRD_URL` is unset, page-view ingestion is skipped.

The Payload PostgreSQL migrations enable Row Level Security on the Payload-managed tables in the `public` schema without adding client-facing policies. Supabase `anon` and `authenticated` API roles therefore cannot directly read or write CMS records; the Payload server connects as the database table owner and performs access checks in its collection/access layer. Do not add permissive RLS policies unless a feature is intentionally changed to access these tables directly through the Supabase Data API.

Automatic Drizzle schema push is disabled in `payload.config.ts`; use Payload migrations to keep databases in sync. Do not mix development-mode schema push with the migration workflow.

Apply pending migrations only after confirming `DATABASE_URI` points to the intended Supabase project:

```sh
pnpm exec payload migrate
```

The authentication, checkout-initialization, and lesson-quiz rate limits use the `consume_app_rate_limits` Postgres function created by migration `20261111_000000_add_app_rate_limits`. Apply that migration before deploying the new authentication route. In development, a process-local limiter is used and a warning is logged; it is only for a single local process. In production, limits are atomic and shared across app instances; configure `SUPABASE_SECRET_KEY` and apply the migration or protected requests return `503` rather than silently bypassing limits.

The app's `/api/auth` route adds protection to the app's sign-in, sign-up, and OAuth entry points. Because Supabase's Auth API is public by design, this route cannot prevent clients from calling Supabase Auth directly with the public anon key. Keep Supabase Auth's built-in rate limits and abuse protections enabled as well.

The sign-in and sign-up forms submit credentials to the same-origin `/api/auth` route. Configure an asymmetric JWT signing key (RSA or ECDSA) in Supabase Auth so `auth.getClaims()` can verify claims using the cached JWKS rather than making an Auth network request. Supabase's `getClaims()` may still use the Auth server for projects using a symmetric signing key, so local verification—and its latency benefit—depends on the signing-key algorithm. Middleware refreshes sessions and verifies claims on protected dashboard routes, then forwards a minimal, server-only verified identity header; dashboard server components consume that header rather than verifying the same token again. Keep remote `getUser()` checks for operations that need a current, authoritative user record.

The database-backed rate limiter makes an additional Supabase Postgres RPC before sign-in, sign-up, checkout initialization, and quiz requests. Place Vercel functions in the same region as the Supabase database and monitor this RPC's latency; it is an abuse-control trade-off, not a way to make an unhealthy database connection faster.

For Supabase Postgres connection issues, copy the connection string from **Project Settings → Database → Connection string** and use the pooler/session mode credentials when direct connections are unavailable. Keep the complete connection string server-only. Supabase authentication variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are separate from `DATABASE_URI`.

## Database Backups

On paid Supabase plans, review scheduled backups in **Database → Backups** and consider Point-in-Time Recovery for tighter recovery objectives. Free-plan projects should keep an off-site logical backup. On Windows, install compatible PostgreSQL command-line tools and run `pg_dump` with the host, port, username, and database shown by Supabase **Connect**; let `pg_dump` prompt for the password rather than putting it in the command or shell history. Store the resulting dump securely, verify it with `pg_restore --list`, and periodically rehearse a restore into a separate test project. Database dumps do not include Supabase Storage objects.

Do not introduce database sharding without measured evidence that indexing, query optimization, connection pooling, and a suitable compute size are insufficient. Sharding changes application routing and cross-table operations; it is not a remedy for invalid credentials or transient connection failures.

Example local return URL configuration (replace with your own public HTTPS tunnel URL):

```dotenv
APP_BASE_URL=https://your-public-tunnel.example
```

## Repository Layout

```text
src/
  app/
    (admin-control)/       Admin control-panel routes
    (affiliate-portal)/    Affiliate dashboard routes and server actions
    (auth)/                Sign-in, sign-up, and callback routes
    (instructor)/          Instructor route group
    (public)/              Public marketing, catalog, policy, and support pages
    (student)/             Student dashboard routes
    api/                   Analytics and payment webhook endpoints
  collections/             Payload collection schemas
  components/
    charts/                Analytics visualizations
    marketing/             Marketing page components
    shared/                Reusable media/meeting components
    ui/                    Shared UI primitives and page sections
  lib/
    bachs/                 Payment integration helpers
    supabase/              Supabase adapters
    tinybird/               Analytics integration helpers
```

Parenthesized route-group names are organizational and are not included in public URLs.

## Route Map

| URL | Route source | Purpose/status |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Public homepage |
| `/about` | `src/app/(public)/about/page.tsx` | About page |
| `/affiliate` | `src/app/(frontend)/(public)/affiliate/page.tsx` | Affiliate application form; program information page is not implemented |
| `/catalog` | `src/app/(public)/catalog/page.tsx` | Public catalog hero |
| `/contact` | `src/app/(public)/contact/page.tsx` | Contact information and policy/referral links |
| `/faq` | `src/app/(public)/faq/page.tsx` | FAQ hero and FAQ section |
| `/privacy-policy` | `src/app/(public)/privacy-policy/page.tsx` | Privacy, refund, and risk policy content |
| `/terms-of-service` | `src/app/(public)/terms-of-service/page.tsx` | Terms of use and mentorship terms, with acceptance control |
| `/sign-in`, `/sign-up` | `src/app/(frontend)/(auth)/...` | Student authentication routes |
| `/dashboard` | `src/app/(frontend)/(student)/dashboard/page.tsx` | Protected student dashboard |
| `/dashboard/courses`, `/dashboard/live`, `/dashboard/resources`, `/dashboard/settings` | `src/app/(student)/dashboard/...` | Student dashboard sections |
| `/affiliate-dashboard` and subroutes | `src/app/(affiliate-portal)/affiliate-dashboard/...` | Affiliate dashboard routes |
| `/instructor-panel` | `src/app/(instructor)/instructor-panel` | Payload admin and instructor workspace |
| `/instructor-panel/analytics` | Payload custom admin view | Administrator-only platform analytics |
| `/api/payments/bachs/initialize` | `src/app/(frontend)/api/payments/bachs/initialize/route.ts` | Creates a server-priced Bachs checkout session |
| `/api/webhooks/bachs` | `src/app/(frontend)/api/webhooks/bachs/route.ts` | Signed Bachs payment webhook and verified-payment analytics event |
| `/api/admin/analytics` | `src/app/(frontend)/api/admin/analytics/route.ts` | Payload-admin authenticated analytics data API |

## Application Architecture

### App Router and UI

Route segments live under `src/app`. Public page components reuse shared navigation, footer, hero, and UI primitives from `src/components`. The `AuroraHero` component is used by selected informational pages; the homepage uses a separate video-backed hero in `src/components/ui/hero-section1.tsx`.

Global Tailwind v4 setup and semantic theme tokens are in `src/app/globals.css`. Shared button, dialog, dropdown, tab, and card implementations are in `src/components/ui`.

### Payload CMS and PostgreSQL

`src/payload.config.ts` configures Payload with the PostgreSQL adapter and these collections:

- `users`
- `courses`
- `modules`
- `lessons`
- `enrollments`
- `affiliates`
- `referrals`
- `payout-requests`

The `users` collection stores a `supabase_uid` association and role metadata. Course, enrollment, affiliate, referral, and payout schemas are defined in `src/collections`.

Featured catalog cards use their `courseSlug` to match published Payload courses. Keep the slug identical when adding a course in the instructor panel; the enrollment page looks up that published course by slug before starting Bachs checkout. Featured prices and preview lesson titles are loaded from Payload. Set the three free preview lessons' `isPreview` field; locked lesson titles are not exposed in the public catalog. The optional editable `originalPriceUSD` defaults to twice `priceUSD` for paid courses.

Lessons support an optional `durationSeconds` value for the student course outline. After deploying a Payload schema change, apply pending migrations against the intended database with `pnpm exec payload migrate`, then regenerate `payload-types.ts` with `pnpm exec payload generate:types`. Do not apply migrations to a production database until the target is confirmed.

Courses can contain scheduled Google Meet live classes with a title, meeting URL, start time, and end time. Instructors manage these in the course editor; active students enrolled in the course see upcoming, ongoing, and ended sessions at `/dashboard/live`. The schedule schema is added by the `20261004_000000_add_course_live_classes` Payload migration.

### Supabase Authentication and Middleware

`src/middleware.ts` uses `@supabase/ssr` to read and refresh session cookies when Supabase URL and anon key are configured. It also:

- Captures a `ref` query parameter into the `godaapp_affiliate_ref` cookie for 30 days.
- Applies Supabase session checks to `/dashboard` and `/affiliate-dashboard`.
- Captures non-prefetch page requests in Tinybird using a first-party random visitor ID; Payload admin paths are excluded.

Without the two public Supabase variables, the middleware logs a warning and skips authentication checks. This is suitable only for local UI development, not a production security boundary.

### Bachs Checkout and Webhook

Paid courses in `/enroll/continue` use the [Bachs checkout overlay](https://docs.bachs.io/guides/checkout/overlay-checkout). The server creates a USD-priced checkout session and lets the overlay present all payment methods enabled for the Bachs account, including card and crypto. Bachs can offer local fiat currency choices when adaptive pricing is enabled in the dashboard, as described in [Charge in any currency](https://docs.bachs.io/guides/checkout/any-currency-checkout); available crypto assets depend on the account's crypto settings. Set the webhook endpoint to `/api/webhooks/bachs` and subscribe to `checkout.completed`.

`src/app/(frontend)/api/webhooks/bachs/route.ts` verifies the timestamped HMAC-SHA256 signature against the raw request body, checks for `payment_status: "paid"` and validates the student metadata, then activates the enrollment and optional referral. Browser events and redirects do not grant access. Verified payments are also recorded in Tinybird using their USD base price.

Affiliate commissions remain in the existing Payload ledger and payout flow. Bachs [destination splits](https://docs.bachs.io/connect/split-payments) are not enabled: the app does not yet store Bachs connected-account IDs for affiliates.

### Tinybird Analytics

The analytics dashboard lives in Payload at `/instructor-panel/analytics` and the API independently verifies an active Payload administrator session. From the `tinybird/` directory, validate the local definition with `tb check datasources/godaapp_events.datasource` and check for the remote resource with `tb datasource ls --match godaapp_events`. Run `tb push datasources/godaapp_events.datasource` only if the data source is missing; Tinybird does not let `tb push` replace an existing data source. Middleware records page views; Bachs checkout initialization and verified webhook events record the purchase funnel; successful student account deletions are recorded without sending email addresses. Event history starts when the data source is deployed and has a one-year retention policy.

Paid/free learner counts are derived from active enrollments and each course’s current Payload price; platform revenue is derived from verified Bachs payment events; paid affiliate payouts are Payload payout requests marked approved. Checkout abandonment is the number of distinct Bachs checkout sessions without a verified successful payment. Confirm that these definitions match finance/reporting requirements before using the dashboard for formal accounting.

## Payload Admin

Payload is configured in `src/payload.config.ts`. The configuration defines the database and collections; an explicit custom Payload admin route and generated type workflow are not currently defined in the repository. Use Payload's framework integration/version-specific conventions when adding the admin UI.

## Git and Configuration Hygiene

`.gitignore` excludes `.env*`, build output, dependencies, local archives, logs, and local PowerShell cache data. The local `.env.local` file must not be committed. `package.json`, `pnpm-lock.yaml`, source code, documentation, and assets under `Public/` are intended to be version-controlled.

## Known Implementation Gaps

These areas should be completed and tested before relying on the corresponding workflows in production:

- Configure and verify the Bachs sandbox keys, webhook signing secret, enabled payment methods, and adaptive-pricing settings before testing checkout.
- Deploy the Tinybird analytics data source before relying on traffic/revenue analytics; without it the Payload dashboard shows Payload database totals and an analytics-unavailable notice.
- The public affiliate program information page and affiliate dashboard pages are not implemented; the application form and payout actions exist.
- The student dashboard landing page is minimal, and the instructor route group has no complete dashboard flow.
- Expand the automated suite to cover remaining route handlers, server actions, collection access rules, and complete browser journeys before relying on those workflows in production.

## Operational Notes

- Use `pnpm install --frozen-lockfile` in CI and clean clones.
- Use `pnpm build` for the production compilation check, followed by `pnpm start` to run the generated build.
- Do not run development and production build processes concurrently because both operate on `.next`.
- Configure real production secrets in the deployment environment, never in source control.
