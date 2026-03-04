# Chosen One

## Current State

The app has a full Battle Arena system where:
- Artists can challenge other artists by manually entering the opponent's Principal ID (a long crypto identifier that users don't know)
- Battles default to a 7-day duration (hardcoded in `respondToBattle`)
- `createBattle` takes `defenderArtistId` and `challengerTrackId` only -- no duration param
- No artist search functionality exists; users must copy-paste Principal IDs
- The backend has `getUserProfile(user: Principal)` and `getTracksByOwner(owner: Principal)` but no search endpoint

## Requested Changes (Diff)

### Add
- Backend: `searchArtists(query: Text)` query -- searches userProfiles by username (case-insensitive substring match), returns array of `{ artistId: Principal; username: Text; profilePicKey: ?ExternalBlob }` results (max 20)
- Backend: `durationHours` parameter to `createBattle` -- accepts a Nat between 1 and 72, stores the battle expiry as `acceptedAt + (durationHours * nanosecondsPerHour)` when accepted via `respondToBattle`
- Backend: `battleDurationHours` field stored on Battle record so the defender knows the chosen duration when accepting
- Frontend: Artist search UI inside `ChallengeModal` Step 2 -- replaces the raw Principal ID input with a search bar + result list; user can still type a Principal ID directly as a fallback
- Frontend: Duration picker in `ChallengeModal` Step 3 (confirm step) -- a set of preset buttons: 1h, 6h, 12h, 24h, 48h, 72h with 24h as default
- Frontend: Duration shown in battle card header and countdown

### Modify
- Backend: `Battle` type gains `battleDurationHours: Nat` field
- Backend: `createBattle` signature gains `durationHours: Nat` param (validated 1-72)
- Backend: `respondToBattle` uses `battle.battleDurationHours` instead of hardcoded 7 days
- Frontend: `ChallengeModal` Step 2 becomes an artist search step, with a text input for searching by username, showing profile pic + username results; selecting one pre-fills the defender ID; direct Principal ID entry still allowed
- Frontend: `ChallengeModal` Step 3 adds duration selector before confirm
- Frontend: `useCreateBattle` hook gains `durationHours` param
- Frontend: Battle summary in Step 3 shows chosen duration

### Remove
- Nothing removed

## Implementation Plan

1. Add `searchArtists` query to `main.mo` returning artist summaries filtered by username substring
2. Add `battleDurationHours: Nat` field to `Battle` type in `main.mo`
3. Add `durationHours: Nat` parameter to `createBattle`, validate range 1-72, store on battle record
4. Update `respondToBattle` to derive expiry from `battle.battleDurationHours` instead of 7 days
5. Update `backend.d.ts` bindings to reflect new `Battle` shape and `createBattle` signature + new `searchArtists` function
6. Update `ChallengeModal` Step 2: add search input + results list (calls `searchArtists`); keep fallback text input for direct Principal ID; selecting an artist sets the defender ID
7. Add `useSearchArtists` hook to `useQueries.ts`
8. Update `ChallengeModal` Step 3: add duration preset buttons (1h, 6h, 12h, 24h, 48h, 72h), default 24h; show duration in summary
9. Update `useCreateBattle` to pass `durationHours` to backend
10. Show chosen duration in battle card header
