# Chosen One

## Current State
Full-stack AI music chart platform. Users can upload MP3/WAV tracks, rate music, battle other artists, follow creators, and manage playlists. The upload page accepts audio files and metadata. There is an About page explaining the platform. No terms and conditions exist anywhere in the app.

## Requested Changes (Diff)

### Add
- **Terms & Conditions page** at `/terms` — a dedicated page listing platform rules, including:
  - Originality requirement: uploaded music must be AI-generated and original, not owned by any other artist or covered by third-party copyright
  - Prohibited content clause
  - User conduct rules
  - Intellectual property policy
  - Disclaimer of liability
  - Contact info (chosenoneproductions901@gmail.com)
- **T&C acceptance checkbox on Upload page** — before a user can submit a track, they must check "I agree to the Terms & Conditions" (with a link to `/terms`). The submit button is disabled until checked.
- **T&C link in footer** — add "Terms & Conditions" link alongside existing footer links
- **T&C link in hamburger nav** — add a Terms & Conditions nav item at the bottom of the nav list with a FileText icon

### Modify
- `UploadPage.tsx` — add a required T&C acceptance checkbox above the Submit button; submission is blocked if unchecked
- `Navbar.tsx` — add Terms link to navLinks array
- `Footer.tsx` — add Terms link

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/pages/TermsPage.tsx` with full terms content
2. Add `/terms` route in `App.tsx`
3. Add T&C checkbox state + validation in `UploadPage.tsx`
4. Add Terms nav link to Navbar navLinks array
5. Add Terms link to Footer
6. Validate build
