# Chosen One

## Current State
Full-stack AI music charts app with Charts, Leaderboard, Upload, My Tracks, Profile, Artist Profile, Following, and Battles pages. The `useAllArtists` hook already exists in `useQueries.ts` and aggregates unique artists from the charts data. No artist directory or search page exists yet.

## Requested Changes (Diff)

### Add
- A new "Artists" page (`/artists`) accessible from the navbar
- Search bar on the Artists page that filters artists by name in real time
- Artists displayed in alphabetical order (A–Z)
- Each artist card shows profile picture (avatar fallback if none), username, and a link to their public artist profile page
- Empty state when no artists have uploaded yet
- No-results state when the search query matches nothing

### Modify
- Navbar: add "Artists" link between Charts and Following (or at a logical position)
- `App.tsx`: register the new `/artists` route

### Remove
- Nothing

## Implementation Plan
1. Create `src/frontend/src/pages/ArtistsPage.tsx` — uses `useAllArtists` hook, local search state, filters and sorts A–Z, renders artist cards with avatar + username + profile link
2. Update `App.tsx` — import `ArtistsPage`, add `artistsRoute` at path `/artists`, add to `routeTree`
3. Update `Navbar.tsx` — add "Artists" nav link to the navigation
