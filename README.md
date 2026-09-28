# Astra Connect Hub

Build the Astra Connect website with the overview page and separate product pages for Astra voice and Astra Chat.

Stack & libraries:
- React + TypeScript
- Tailwind CSS: Brand colours, typography, spacing and responsive layouts
- shadcn/ui: Navigation, tabs, forms, dialogs, dropdowns and inbox controls
- Motion (motion.dev): Astra Guide’s cursor-following behaviour, tooltips, hover effects and panel transitions
- Anime.js: Blue/green track animations, campaign sequences and conversation-to-result transformations
- Charts for call outcomes and sales funnels
- Lucide React: Consistent interface icons

Motion will handle interface movement; Anime.js will handle storytelling sequences. They won’t animate the same element.

The attached images are design references. The website will use real interactive components, with mobile and reduced-motion alternatives.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6215131e-09d5-47d7-b1d6-d1da5afb3b5b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
