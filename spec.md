# Chosen One

## Current State
Full-stack AI music charts app with charts, upload, profiles, follows, playlists, global player bar, and comments. The global player plays tracks with a bottom bar. Track cards show rank, title, artist, rating, likes, comments, and a play button.

## Requested Changes (Diff)

### Add
- Live listeners count badge on the currently-playing track card -- shows a pulsing green dot and "X listening now" count
- A `useLiveListeners` hook that generates a realistic-looking live count for a given track ID (simulated: seeded from track ID + current minute, small increments to simulate movement, polled every 15s)
- The badge also appears in the GlobalPlayerBar on the currently-playing track info section

### Modify
- `ChartsPage.tsx` TrackCard: when the track is the currently playing one, show the live listeners badge inline in the header row
- `GlobalPlayerBar.tsx`: show the live listeners count beneath track title/artist in the left info section

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/hooks/useLiveListeners.ts` -- a hook that takes a trackId and returns a simulated live listener count. Uses a deterministic seed (hash of trackId + current 15-minute bucket) so different tracks have different counts, and adds small ±random deltas on each 15s poll tick to simulate live movement. Count range: 5–350.
2. Update `ChartsPage.tsx` TrackCard: import the hook, show a green pulsing dot + "X listening" badge when `isCurrentTrack` is true.
3. Update `GlobalPlayerBar.tsx`: import the hook, show a compact "● X listening" line below the artist name when a track is playing.
