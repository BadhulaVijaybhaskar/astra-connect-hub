<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project architecture

- Shared Astra site chrome and interactive product demonstrations live in `src/components/astra-site.tsx` so all product routes use one consistent visual and behavior system.
- Motion handles direct interface feedback, GSAP handles scroll choreography, and Anime.js handles isolated track/campaign/extraction sequences; never animate the same element with multiple libraries.
- The global motion layer is limited to GSAP section choreography; do not add site-wide blue or green background lines because they distract from content.
- Product pages remain public TanStack routes with illustrative local state; only validated demo enquiries persist through a server function into a private Lovable Cloud table.
- Secondary marketing pages (solutions, integrations, pricing, security, book-demo, legal) share building blocks in `src/components/astra-pages.tsx`; solutions use one data-driven `/solutions/$slug` route so new solutions are a data change.
- Interactive Voice/Chat workspaces live in `src/components/astra-workspaces.tsx` (re-exported from astra-site) to keep the shared chrome file small.
- The homepage hero is isolated in `src/components/astra-hero.tsx` so its orbital identity interaction can evolve without affecting shared product demos.
- The homepage connected-products experience lives in `src/components/astra-connected-journey.tsx`; keep its customer playback isolated from shared site chrome.
