# Chosen One AI Music Charts

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- AI music upload system supporting MP3 and WAV formats
- Optional album cover image upload per track
- Optional profile picture upload per user
- Rating system for uploaded tracks (star or numeric rating from other users)
- Music charts leaderboard sorted by rating
- Ability to delete own uploaded tracks
- User authentication so each user owns their uploads

### Modify
N/A

### Remove
N/A

## Implementation Plan

### Backend (Motoko)
- User profile type: userId, username, profilePicBlob (optional, blob-storage key)
- Track type: id, ownerId, title, artist, description, fileBlob (blob-storage key for MP3/WAV), coverBlob (optional blob-storage key), uploadedAt, ratings (list of {userId, score})
- Methods:
  - `createOrUpdateProfile(username, profilePicKey?)` -> Profile
  - `getProfile(userId)` -> ?Profile
  - `uploadTrack(title, artist, description, fileKey, coverKey?)` -> Track
  - `deleteTrack(trackId)` -> Bool (only owner can delete)
  - `rateTrack(trackId, score: 1-5)` -> Track (one rating per user per track, update if exists)
  - `getCharts()` -> [Track] sorted by average rating descending
  - `getMyTracks()` -> [Track] for calling user
  - `getTrack(trackId)` -> ?Track

### Frontend
- Pages/Views:
  1. **Charts** (home) - Leaderboard of top-rated AI tracks, ranked list with album art, title, artist, average rating, play button
  2. **Upload** - Form to upload track (title, artist, description, MP3/WAV file, optional album cover). Requires login.
  3. **My Tracks** - User's own uploads with delete button and current rating
  4. **Profile** - Set username and optional profile picture
- Audio player component embedded in charts and track cards (play/pause, progress bar)
- Rating component: 5-star interactive widget (logged-in users can rate; shows average for all)
- File upload via blob-storage component for audio files and images
- Auth gate: prompt login for upload, rating, profile actions
- Navigation bar with app name "Chosen One", links to Charts, Upload, My Tracks, Profile
