# GodaApp

GodaApp is a digital-asset education platform built with Next.js App Router. The repository contains public marketing and policy pages, student and affiliate route groups, a Payload CMS data model, Supabase authentication middleware, a Paystack webhook, and shared UI components.

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
| Payments | Paystack webhook integration |
| Analytics | Tinybird event ingestion and Payload-admin dashboard |
| Package manager | pnpm 10.18.2 |

## Prerequisites

- Node.js 20 LTS is recommended. Next.js 15 requires Node.js 18.18 or newer.
- pnpm 10.18.2, as pinned by the `packageManager` field.
- A PostgreSQL database for Payload CMS.
- Supabase project credentials for authenticated features.
- Optional Paystack and Tinybird credentials for their respective integrations.

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
| `pnpm build` | Create an optimized production build |
| `pnpm start` | Serve the most recent production build |
| `pnpm exec tsc --noEmit` | Run the TypeScript compiler without emitting files |

The repository currently defines no dedicated test or lint scripts.

## Environment Configuration

Create a local `.env.local` file. The current integration code references these variables:

| Variable | Required for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase-backed authentication | Public project URL; middleware skips auth checks when this or the anon key is missing. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase-backed authentication | Public/anonymous Supabase key. Do not put a service-role key here. |
| `DATABASE_URI` | Payload/PostgreSQL | PostgreSQL connection string used by the Payload adapter. |
| `PAYLOAD_SECRET` | Payload CMS | Set a strong, unique secret in every non-local environment. The source currently contains a development fallback; replace it for deployment. |
| `PAYSTACK_SECRET_KEY` | Paystack webhook verification | Used to calculate the request signature. |
| `PAYSTACK_WEBHOOK_SECRET` | Not currently referenced by source | Present in local configuration conventions, but the webhook currently verifies with `PAYSTACK_SECRET_KEY`. |
| `TINYBIRD_API_KEY` | Platform analytics | Server-only Tinybird token with event-ingest and SQL-query permission for the analytics data source. Never expose this as a `NEXT_PUBLIC_*` variable. |
| `TINYBIRD_URL` | Platform analytics | Region-specific Tinybird API base URL, such as `https://api.tinybird.co`. |
| `TINYBIRD_ANALYTICS_DATASOURCE` | Platform analytics | Optional data source name; defaults to `godaapp_events`. |

Never place secret values in `NEXT_PUBLIC_*` variables; Next.js exposes those values to browser bundles.

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
    paystack/              Payment integration helpers
    supabase/              Supabase adapters
    tinybird/               Analytics integration helpers
```

Parenthesized route-group names are organizational and are not included in public URLs.

## Route Map

| URL | Route source | Purpose/status |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Public homepage |
| `/about` | `src/app/(public)/about/page.tsx` | About page |
| `/affiliate` | `src/app/(public)/affiliate/page.tsx` | Currently renders shared navigation only |
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
| `/api/webhooks/paystack` | `src/app/(frontend)/api/webhooks/paystack/route.ts` | Paystack webhook and verified-payment analytics event |
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

Courses can contain scheduled Google Meet live classes with a title, meeting URL, start time, and end time. Instructors manage these in the course editor; active students enrolled in the course see upcoming, ongoing, and ended sessions at `/dashboard/live`. The schedule schema is added by the `20261004_000000_add_course_live_classes` Payload migration.

### Supabase Authentication and Middleware

`src/middleware.ts` uses `@supabase/ssr` to read and refresh session cookies when Supabase URL and anon key are configured. It also:

- Captures a `ref` query parameter into the `godaapp_affiliate_ref` cookie for 30 days.
- Applies Supabase session checks to `/dashboard` and `/affiliate-dashboard`.
- Captures non-prefetch page requests in Tinybird using a first-party random visitor ID; Payload admin paths are excluded.

Without the two public Supabase variables, the middleware logs a warning and skips authentication checks. This is suitable only for local UI development, not a production security boundary.

### Paystack Webhook

`src/app/(frontend)/api/webhooks/paystack/route.ts` accepts POST requests, verifies the HMAC-SHA512 signature, checks the course, currency, amount, and student metadata, and creates the enrollment and optional referral once. Verified payments are also recorded in Tinybird for analytics.

### Tinybird Analytics

The analytics dashboard lives in Payload at `/instructor-panel/analytics` and the API independently verifies an active Payload administrator session. Deploy `tinybird/datasources/godaapp_events.datasource` to the Tinybird Cloud workspace from the `tinybird/` directory using the Tinybird CLI command `tb --cloud deploy`. Middleware records page views; Paystack checkout initialization and verified webhook events record the purchase funnel; successful student account deletions are recorded without sending email addresses. Event history starts when the data source is deployed and has a one-year retention policy.

Paid/free learner counts are derived from active enrollments and each course’s current Payload price; platform revenue is derived from verified Paystack payment events; paid affiliate payouts are Payload payout requests marked approved. Checkout abandonment is the number of distinct Paystack checkout references without a verified successful payment. Confirm that these definitions match finance/reporting requirements before using the dashboard for formal accounting.

## Payload Admin

Payload is configured in `src/payload.config.ts`. The configuration defines the database and collections; an explicit custom Payload admin route and generated type workflow are not currently defined in the repository. Use Payload's framework integration/version-specific conventions when adding the admin UI.

## Git and Configuration Hygiene

`.gitignore` excludes `.env*`, build output, dependencies, local archives, logs, and local PowerShell cache data. The local `.env.local` file must not be committed. `package.json`, `pnpm-lock.yaml`, source code, documentation, and assets under `Public/` are intended to be version-controlled.

## Known Implementation Gaps

These areas should be completed and tested before relying on the corresponding workflows in production:

- `src/lib/paystack/client.ts` is empty; payment creation/checkout client functionality is not implemented there.
- Deploy the Tinybird analytics data source before relying on traffic/revenue analytics; without it the Payload dashboard shows Payload database totals and an analytics-unavailable notice.
- `/affiliate` currently contains only navigation; a public affiliate information page is not implemented.
- The student dashboard landing page is minimal, and the instructor route group has no complete dashboard flow.
- Add automated tests and linting before making broader production changes; `package.json` currently exposes only dev/build/start scripts.

## Operational Notes

- Use `pnpm install --frozen-lockfile` in CI and clean clones.
- Use `pnpm build` for the production compilation check, followed by `pnpm start` to run the generated build.
- Do not run development and production build processes concurrently because both operate on `.next`.
- Configure real production secrets in the deployment environment, never in source control.
