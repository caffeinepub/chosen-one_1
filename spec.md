# Chosen One

## Current State
The app is a full-featured AI music charts platform with track cards on ChartsPage, artist profile pages (ArtistProfilePage), My Tracks, Following feed, and a global player bar. Tracks and artist profiles are viewable but have no sharing capability.

## Requested Changes (Diff)

### Add
- A `ShareButton` reusable component that opens a share modal/dialog with:
  1. **Copy Link** -- copies the current shareable URL to clipboard, shows a toast confirmation
  2. **QR Code** -- generates a QR code for the URL using a canvas-based QR generator (no external library needed, use qrcode library from npm or inline canvas generation)
  3. **Social media sharing** -- Twitter/X, Facebook, WhatsApp, Telegram share links that open in new tab
- Share button on each TrackCard in ChartsPage (shares the track's artist profile page URL)
- Share button on ArtistProfilePage (shares the artist profile URL)
- Share button on ArtistTrackRow (within artist profile track list)

### Modify
- `ChartsPage.tsx` -- add Share button to TrackCard header row actions
- `ArtistProfilePage.tsx` -- add Share button to the profile header stats row
- Install `qrcode` npm package (or use inline QR generation via canvas)

### Remove
- Nothing

## Implementation Plan
1. Install `qrcode` package for QR code generation (and `@types/qrcode` for types)
2. Create `src/frontend/src/components/ShareModal.tsx` -- reusable share dialog with copy link, QR code canvas, and social share buttons for Twitter/X, Facebook, WhatsApp, Telegram
3. Add Share button + ShareModal to `TrackCard` in `ChartsPage.tsx` (shares artist profile URL `/artist/:principalId`)
4. Add Share button + ShareModal to `ArtistProfilePage.tsx` header area (shares the current profile URL)
5. Optionally add Share button to `ArtistTrackRow` on the artist profile page
