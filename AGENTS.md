# GodaApp Project Instructions

## Project Context

- GodaApp uses Next.js App Router, React 19, TypeScript, Payload CMS, Supabase, Tailwind CSS v4, and pnpm.
- Preserve the existing route, collection, component, and service boundaries. Look for a nearby implementation before introducing a new pattern or dependency.
- Use the scripts in `package.json` for validation. Check which scripts exist; do not assume there is a test or lint script.

## Engineering Workflow

- Start at the code that owns the requested behavior. Read the closest implementation, call site, and relevant test before widening the search.
- Before editing, form a local, falsifiable hypothesis and identify the narrowest check that could disprove it.
- Make the smallest root-cause change. Preserve unrelated and uncommitted work; do not reset or revert user changes.
- After the first substantive edit, run the narrowest relevant executable check before further exploration or edits. Rerun it after local repairs and validate follow-up changes.
- Avoid unrelated refactors and report checks that could not be run.

## UI and Design

- Treat `src/app/globals.css` and the shared components in `src/components/ui/` as the design-system starting points. Reuse their semantic color tokens and component APIs where they fit.
- Keep reusable product UI cohesive: use clear type hierarchy, restrained spacing, predictable alignment, and consistent control and corner-radius treatments. Avoid introducing arbitrary one-off design tokens or decorative card-on-card layouts.
- `globals.css` declares a Geist font variable, but the root layout does not currently load or apply it. Do not assume Geist is active; when changing the global typeface, load it once at the root and wire the shared token rather than adding page-specific font imports.
- Prefer semantic theme colors (`background`, `foreground`, `muted`, `primary`, `accent`, `destructive`, `border`, and related tokens) over hard-coded color values in shared product components. Keep text and controls legible in both light and dark themes.
- Use intentional brand colors and distinct visual direction in marketing sections when appropriate; do not force every page into one palette. Keep dashboard and operational surfaces calm, scannable, and focused on their tasks.
- Make layouts work at narrow and wide viewport sizes. Prevent text and controls from overlapping or overflowing; provide keyboard access, visible focus, and accessible names for interactive controls.
- Prefer the existing Lucide icon and Radix UI components when available. Use familiar controls for actions, choices, and numeric settings rather than inventing unfamiliar UI patterns.

## Validation and Safety

- Choose checks that cover the changed behavior: relevant tests when present, then focused type/build checks as appropriate.
- Do not add packages, change shared tokens, or make broad visual changes unless they are necessary for the request.
- For UI changes, inspect the affected page or component at desktop and mobile sizes when the available environment supports it.