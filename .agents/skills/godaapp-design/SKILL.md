---
name: godaapp-design
description: "Use when designing or implementing GodaApp UI, adapting remodeled 21st.dev components, building pages or shared components, or reviewing typography, color, layout, responsiveness, and accessibility against the app's design system."
---

# GodaApp UI Design

Use this skill when creating or changing user-facing interfaces in GodaApp. The app uses Next.js App Router, React 19, TypeScript, Tailwind CSS v4, and shared Radix UI/Lucide components. Some components are remodeled from 21st.dev references; treat those as starting material to adapt, not as a separate design system.

## Design Sources

- Read `src/app/globals.css` for the semantic color tokens, light/dark values, Tailwind theme mappings, radius scale, and font variable.
- Read `src/app/layout.tsx` before changing global typography or document-level styling. The Geist variable is declared in CSS but is not currently loaded/applied by the root layout; verify actual font loading before relying on it.
- Reuse component APIs in `src/components/ui/`, especially `button.tsx`, `card.tsx`, `input.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, and `tabs.tsx`, where they suit the interaction.
- Check nearby pages and components for the target surface. Existing 21st.dev-remodeled work includes expressive marketing sections and course presentation components; retain their useful composition while adapting details to the product.

## Procedure

1. Identify the user, task, and surface: operational/dashboard UI, learning/catalog flow, or public marketing content. Read the target page and the closest shared components before choosing a visual direction.
2. Inspect relevant global tokens and local component patterns. Determine whether the target should use semantic shared styling or a deliberate branded treatment.
3. Compose the actual workflow first. Keep navigation, information hierarchy, states, and primary actions clear; do not substitute a promotional landing page or decorative cards for a usable tool.
4. Adapt 21st.dev-derived components to local conventions: use existing component APIs and semantic tokens for reusable controls, remove unnecessary wrappers or decorative effects, and avoid copying arbitrary colors, typography, or dependencies into shared product UI.
5. Implement responsive and accessible behavior. Support keyboard interaction and visible focus; provide accessible names; prevent overflow, clipped content, and overlapping controls at narrow and wide widths.
6. Validate the changed UI with the narrowest relevant checks. When a running app/browser is available, inspect the affected page at desktop and mobile sizes and verify that imagery, typography, controls, and content render without collisions.

## Visual Rules

- Prefer semantic theme colors (`background`, `foreground`, `card`, `muted`, `primary`, `accent`, `destructive`, `border`, and related tokens) for shared product surfaces. Preserve legibility in both light and dark themes.
- Allow distinct intentional brand colors and visual treatments in marketing sections; do not force every route into the same palette. Keep dashboards and operational surfaces restrained, scannable, and action-oriented.
- Establish a clear type hierarchy. Do not assume Geist is active or add page-specific font imports; global font changes belong at the root layout and shared token.
- Keep spacing, alignment, control sizes, and corner radii consistent with nearby UI and shared components. Avoid arbitrary one-off design tokens and nested decorative cards.
- Use familiar controls for actions and choices. Prefer existing Lucide icons and Radix UI components; provide tooltips or accessible labels for icon-only actions.
- Use imagery when it clarifies the real course, product, place, or state. Treat decorative effects as supporting detail, not as substitutes for useful content.

## Completion Criteria

- The interface fits its intended task and uses the existing route/component boundaries.
- Reusable elements align with the shared design system; any page-specific art direction is intentional.
- Desktop and mobile layouts remain legible and usable, with no overflow or overlap.
- Interactive controls have keyboard access, visible focus, and accessible names.
- Relevant validation has been run, and any unavailable visual check or remaining limitation is reported.
