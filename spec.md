# Chosen One

## Current State
- Full-stack AI music platform with charts, uploads, artist profiles, following feed, leaderboard
- AudioPlayer component (`AudioPlayer.tsx`) is a standalone self-contained component with play/pause, seek, volume controls and a waveform visualizer
- Each track card on ChartsPage, FollowingPage, and ArtistProfilePage embeds its own AudioPlayer
- No global playback state, no playlist, no next/repeat/continuous stream support

## Requested Changes (Diff)

### Add
- **Global music player bar** — a persistent bottom bar that appears once a track starts playing. Shows track title, artist, cover art, and full playback controls (play/pause, seek, volume)
- **Player context / global state** — a React context (`PlayerContext`) that manages the current queue (playlist), current track index, playback mode (normal, repeat-one, repeat-all, shuffle)
- **Playback controls** in the global bar:
  - Previous track button
  - Play/Pause button
  - Next track button
  - Repeat toggle (cycles: off → repeat-all → repeat-one → off)
  - Shuffle toggle
- **"Play All" / "Add to Queue" button** on the ChartsPage and FollowingPage — adds all visible (filtered) tracks to the queue and starts playback
- **"Play" / "Add to Queue" button** on individual track cards — tapping play on a card starts playback from that track in the current chart context (queue = current chart list)
- **Continuous stream** — when a track ends, automatically advance to the next track in the queue (unless repeat-one is active)
- **Playlist/Queue panel** — accessible from the global player bar, shows the current queue with ability to jump to any track or remove individual tracks

### Modify
- `AudioPlayer.tsx` — refactor to be driven by the global player context when used in the global bar; individual inline players can remain or be replaced by "Add to queue / Play" buttons
- `App.tsx` — wrap with `PlayerProvider` context; render `GlobalPlayerBar` component at root layout level (above Footer, below Outlet)
- Track cards on ChartsPage and FollowingPage — replace inline `AudioPlayer` with a "Play" button that adds the track to the global queue and starts it

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/contexts/PlayerContext.tsx`:
   - Types: `QueueTrack { id, title, artist, audioUrl, coverUrl }`
   - State: `queue`, `currentIndex`, `playing`, `repeatMode` (off/all/one), `shuffle`
   - Actions: `playTrack(track, contextQueue?)`, `playAll(tracks)`, `enqueue(track)`, `next()`, `prev()`, `togglePlay()`, `setRepeat()`, `toggleShuffle()`, `removeFromQueue(idx)`, `jumpTo(idx)`
   - Internal `<audio>` element managed via ref, exposed via context

2. Create `src/frontend/src/components/GlobalPlayerBar.tsx`:
   - Fixed bottom bar (z-50, full width)
   - Left: cover art thumbnail + track title + artist
   - Center: prev / play-pause / next buttons + seek slider + time display
   - Right: repeat toggle icon (cycling through modes), shuffle toggle, volume, queue button
   - Queue panel: slide-up panel showing ordered list of tracks, clickable rows with remove button

3. Modify `App.tsx`:
   - Wrap root in `<PlayerProvider>`
   - Add `<GlobalPlayerBar />` inside the root layout (between `<Outlet>` and `<Footer />`)
   - Add bottom padding to main content area when player is active to avoid overlap

4. Modify `ChartsPage.tsx`:
   - Add "Play All" button in the chart heading row
   - Replace expanded `AudioPlayer` in each TrackCard with a `Play` button that calls `playTrack` with the full chart list as context queue
   - Keep the expand panel for ratings and comments

5. Modify `FollowingPage.tsx` similarly — play buttons on feed cards launch global player

6. Ensure `ArtistProfilePage.tsx` track list also has Play buttons wired to global player

7. Add deterministic `data-ocid` markers to all new interactive surfaces
