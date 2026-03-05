# Chosen One

## Current State
The app is a full-featured AI music chart platform with Charts, Following, Battles, Playlists, Leaderboard, Upload, My Tracks, and Profile pages. Navigation is via a hamburger sidebar. There is no About page.

## Requested Changes (Diff)

### Add
- New `/about` route and `AboutPage.tsx` component
- "About" nav link added to the hamburger sidebar nav links list
- AboutPage sections:
  1. Hero section -- what the platform is and why users should join (bold CTA to sign up)
  2. "Why Join?" section -- reasons to join with icon cards
  3. "How to Use the Platform" step-by-step guide with numbered sections covering: signing in, uploading tracks, viewing/rating charts, viewing artist profiles, following artists, battling other artists, managing playlists, and using the notifications bell
  4. "Add to Home Screen" section -- instructions for iOS (Safari share > Add to Home Screen) and Android (Chrome menu > Add to Home Screen)
  5. "Contact Us" section -- email Chosenoneproductions901@gmail.com with a mailto link

### Modify
- `Navbar.tsx` -- add "About" entry to the `navLinks` array so it appears in the hamburger drawer

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/pages/AboutPage.tsx` with all five sections
2. Add the `/about` route to `App.tsx` and register it in the router
3. Add About link to navLinks array in `Navbar.tsx` with an Info icon
