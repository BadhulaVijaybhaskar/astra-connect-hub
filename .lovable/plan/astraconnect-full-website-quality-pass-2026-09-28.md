# AstraConnect full website quality pass

## Goal
Bring every existing route up to the homepage’s premium product-story standard without changing the brand, removing working demos, inventing claims, or merging Astra Voice and Astra Chat.

## What will change

### 1. Shared visual system and navigation
- Standardize containers near 1400px, section spacing, type scale, focus states, and mobile touch targets.
- Refine the existing sticky navigation copy and product/solution indicators while preserving all routes.
- Expand the footer into clear Product, Solutions, Company, and Legal groups.
- Extend Astra Guide’s deterministic section-aware messages and retain the offset desktop follower plus fixed mobile helper.

### 2. Homepage consistency pass
- Preserve the approved hero and existing narrative components.
- Tighten spacing, keep product independence explicit, expose all five solutions, and replace the final generic CTA with the requested three-choice conversion prompt.
- Ensure every sample metric is visibly labeled “Illustrative demo · sample data.”

### 3. Product pages
- **Astra Voice:** keep “Give the conversation a job” and the interactive four-step studio; add visual sections for teaching Maya, three customer inputs, post-call structure, compact campaigns, inbound/outbound paths, use cases, and a final CTA.
- **Astra Chat:** keep the large interactive inbox; strengthen the hero and customer panel, preserve assignment/note/tag/stage actions, expand selectable capability demonstrations, and add responsible broadcasts, automation, optional Voice connection, and a final CTA.
- Reuse existing interactive components rather than duplicating or replacing them.

### 4. Five solution stories
- Build one reusable framework with distinct data and visual workflows for Lead qualification, Sales follow-up, Customer support, Appointments, and Customer engagement.
- Each route will include a problem, workflow, separate Voice and Chat roles, optional connected path, example journey, outcome, related solutions, and CTA.
- Keep statements conservative and integrations generic unless confirmed.

### 5. Integrations and pricing
- Replace static integration cards with an animated inputs → AstraConnect → outcomes architecture and two truthful sample flows.
- Turn pricing into three selectable quote configurations—Voice, Chat, Connected—plus a four-step “How pricing works” explanation; no invented prices.

### 6. Real demo requests
- Enable Lovable Cloud and store demo requests securely instead of discarding them.
- Add the complete conditional field set, client and server validation, accessible errors, loading/failure handling, and the exact success message.
- Use a narrowly scoped public submission path; no customer-facing login is needed.

### 7. SEO, truthfulness, and QA
- Normalize the exact AstraConnect/Astra Voice/Astra Chat/Astra Guide names.
- Verify unique route metadata, canonical URLs, OpenGraph text, favicon, robots, sitemap, legal/security pages, 404, and all links.
- Inspect every requested route at 360, 390, 430, 768, 1024, and 1440+ widths for overflow, clipping, Guide collisions, hierarchy, interaction, and keyboard access.
- Verify the form submission, existing Voice/Chat demos, reduced-motion behavior, runtime console, and final build status.

## Technical approach
- Keep TanStack Start routing and the current component boundaries.
- Add focused reusable story primitives rather than a generic card system.
- Motion remains responsible for interface state; Anime.js handles workflow signal paths; existing GSAP remains limited to shared scroll choreography.
- Add a Cloud table for demo requests with explicit grants, row-level security, and insert-only public access through validated server code.
- Update the architecture notes only where the persistent demo-request flow changes the current static-site rule.
