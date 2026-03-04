# Chosen One

## Current State
The app has a Charts page with Daily/Weekly/Monthly/All Time time period filters, geographic location filters, and genre filters. The Charts page fetches data using three parallel queries: `useCharts` (all-time), `useChartsInWindow` (windowed), and `useChartsFilteredByLocation` (location-filtered). Users are seeing "Failed to load charts" -- the `getTracksSortedByRatingInWindow` canister call is returning an error, likely due to a type issue or stale canister deployment.

## Requested Changes (Diff)

### Add
- Retry button in the charts error state so users can manually re-trigger the query
- Auto-retry logic (retry: 2) in the chart queries so transient errors self-heal
- Graceful fallback: if the windowed query fails, fall back to the all-time query data

### Modify
- `useChartsInWindow` and `useChartsFilteredByLocation` hooks -- add `retry: 2` and `retryDelay: 1000`
- `ChartsList` component -- on windowed query error, fall back to all-time data instead of showing error
- Error state UI -- add a "Retry" button that calls `refetch()` on the active query
- The backend `getTimeWindowInNanos` -- fix potential `Int`/`Nat` multiplication overflow by using `Int` literals for nanosecond values

### Remove
Nothing removed.

## Implementation Plan
1. Fix backend: change `nanosecondsPerDay` from `Nat` to explicit `Int` to avoid type issues in time comparisons
2. Update `useChartsInWindow` hook to add `retry: 2` and wrap queryFn in try/catch that returns `[]` on error
3. Update `useChartsFilteredByLocation` similarly
4. Update `ChartsList` to show a retry button in the error state and attempt fallback to all-time data
5. Redeploy
