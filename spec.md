# Chosen One

## Current State
ChartsPage has a hero banner with a title, subtitle, and two badges (Live Charts, Top 100). The `useLiveListeners` hook simulates per-track listener counts based on a hash of track ID. Individual track cards show a live listener count only when that track is the currently playing one.

## Requested Changes (Diff)

### Add
- A global "X people listening right now" counter displayed in the hero banner of the charts page.
- A `useGlobalListeners` hook (or inline logic) that produces a simulated global count, separate from per-track counts. It should start at a realistic aggregate number (e.g. 800–1500) and fluctuate every ~10 seconds to feel live.

### Modify
- The hero banner section in `ChartsPage` to include the global listener counter below or alongside the existing badges, styled with a pulsing green dot and a formatted number like "1,247 people listening right now".

### Remove
- Nothing removed.

## Implementation Plan
1. Add a `useGlobalListeners` hook in `src/frontend/src/hooks/useGlobalListeners.ts` that returns a simulated global listener count (seed ~1000–1500, fluctuates ±50 every 10s).
2. In `ChartsPage`, import and call `useGlobalListeners`.
3. Render the counter in the hero banner section, below the title and description, with a pulsing green dot, formatted number, and "people listening right now" label. Style to match the existing gold/green aesthetic.
