# Connected customer journey redesign

## Goal
Transform only the existing dark “Two products. Connected when you choose.” section into a signature interactive story following Arjun Mehta from enquiry to accountable next action.

## What will change
- Preserve the section headline, dark graphite setting, independent Voice/Chat positioning, and all surrounding homepage content.
- Replace the static three-card layout with one staged customer journey: enquiry, Voice call, conversation-to-data, Chat handoff, customer workspace, and final summary.
- Add Connected, Voice only, and Chat only modes plus Watch/Replay controls; Connected remains the default.
- Keep Astra Guide as a small explanatory website guide at the edge of the experience, never as the data processor.
- Provide a dedicated vertical mobile composition, clear illustrative-demo/configuration language, keyboard access, and reduced-motion behavior.

## Technical details
- Refactor only `ConnectedStory` and focused private helpers colocated with it.
- Motion will handle interface and layout state; Anime.js will own SVG path drawing, signal travel, and phrase-to-field sequencing without property overlap.
- Use timed local demo state with cleanup, cancellation, and an immediate final-state fallback for reduced motion.
- Validate playback and modes at desktop, tablet, and mobile widths, then check the current build diagnostics.