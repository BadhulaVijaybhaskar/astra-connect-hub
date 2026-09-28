# Astra Connect Website

## Overview
Build a polished three-page Astra Connect product website based on the supplied references, using the uploaded brand marks as real assets and recreating the showcased product interfaces as responsive, interactive React components rather than screenshots.

## Pages and navigation
- Add a shared header with the Astra Connect logo, product navigation, solutions/integrations/pricing links, a mobile menu, and a working “Book demo” dialog.
- Build `/` as the overview page with the two-product proposition, interactive Astra Voice and Astra Chat previews, a connected-workflow story, outcome charts, and clear links into each product.
- Build `/astra-voice` around the “Give the conversation a job” concept, including an AI employee setup walkthrough, call simulation, campaign sequence, call-outcome chart, and sales-funnel view.
- Build `/astra-chat` around the “Every chat. The full picture.” concept, including an inbox, contact details, qualification controls, pipeline progression, response composer, and conversation analytics.
- Give every page unique Astra Connect metadata and working internal navigation.

## Visual direction
- Follow the references’ crisp white product aesthetic with deep navy type, electric blue for Voice, teal/green for Chat, fine borders, restrained shadows, and compact 6–8px radii.
- Use the supplied Astra Connect, Astra Voice, and Astra Chat logos in the relevant locations; derive the site favicon from the uploaded brand mark.
- Use a modern geometric sans-serif pairing with large, high-impact headlines and dense, legible product UI.
- Preserve a hint of the next section on common desktop and mobile viewport heights.

## Interaction and animation
- Use Motion for panel transitions, hover feedback, tooltips, dialog/menu movement, and an optional pointer-following Astra Guide element.
- Use Anime.js only for separate narrative sequences: blue/green connection tracks, campaign progression, and conversation-to-qualified-result transformations.
- Add direct controls to replay or step through demonstrations; interactions will update the visible UI rather than playing decorative loops only.
- Respect reduced-motion preferences by disabling pointer tracking and replacing sequences with immediate state changes.

## Components and data visualisation
- Add reusable branded buttons, dropdowns, tabs, dialogs, form fields, inbox controls, status chips, and tooltips using the project’s component conventions.
- Use Lucide icons consistently and Recharts for responsive call-outcome and funnel visualisations.
- Keep all sample content local and clearly illustrative; no backend, authentication, or external messaging will be added in this phase.

## Responsive and accessibility
- Recompose complex desktop product panels into focused stacked views on phones instead of shrinking the desktop canvas.
- Provide accessible labels, keyboard navigation, visible focus states, sufficient contrast, stable dimensions, and non-color status cues.
- Verify the overview and both product pages at desktop and mobile widths, including menus, dialogs, tabs, demonstrations, charts, and reduced-motion handling.

## Technical details
- Retain TanStack Start file-based routing and add route files for the two product pages.
- Extend the Tailwind v4 token system in `src/styles.css`; load any external font through the root document head.
- Install `motion` and `animejs`; keep each library responsible for separate elements as requested.
- Store uploaded image binaries through the project asset flow, while keeping a real square favicon in `public/`.
- Record the shared component and animation-boundary decisions in `AGENTS.md`.
