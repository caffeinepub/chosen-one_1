# Chosen One

## Current State
The app has a notification system for followers when an artist drops a new track. Artists can also reply to fan music requests via `replyToMusicRequest`. Fans can send requests and see replies via `getMyRequestReplies`. There is no notification when an artist replies to a fan's request.

## Requested Changes (Diff)

### Add
- A new notification variant for request replies (type = "requestReply") carrying the artist name, original request message snippet, and reply text
- Backend logic to create a notification for the fan (fromUserId) when an artist calls `replyToMusicRequest`
- Frontend display of "request reply" notifications in the navbar notification bell, distinct from "new track" notifications

### Modify
- `Notification` type in backend: add a `notifType` field (variant: `#newTrack` or `#requestReply`) and optional `replyText` and `requestId` fields
- `replyToMusicRequest` function: after saving the reply, create a notification for the fan who sent the request
- Navbar `NotificationItem`: render differently based on notification type — for `requestReply` show a message icon and "replied to your request" text with the reply snippet
- Empty state description in navbar: updated to mention both track drops and request replies

### Remove
- Nothing removed

## Implementation Plan
1. Update `Notification` type in `main.mo` to add variant `notifType` field (`#newTrack` or `#requestReply`), optional `replyText` (Text) and `requestId` (Text)
2. Update `notificationsSendToFollowers` to set `notifType = #newTrack`
3. In `replyToMusicRequest`, after saving the reply, create a notification for `request.fromUserId` with `notifType = #requestReply`, the reply text, and requestId
4. Update `backend.d.ts` to reflect new Notification shape
5. Update Navbar `NotificationItem` to branch on `notifType` and render a distinct "replied to your request" card for `requestReply` notifications
