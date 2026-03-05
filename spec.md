# Chosen One

## Current State
The app has an admin role system. Admin access is claimed by calling `_initializeAccessControlWithSecret` with the correct `CAFFEINE_ADMIN_TOKEN`. The token is currently passed via a URL hash param (`caffeineAdminToken`). The user does not have this token, so they cannot claim admin through the URL.

An Admin Subscribers page exists at `/admin/subscribers` but only shows if `isCallerAdmin` is true. There is no way for the user to enter a token manually or claim admin from the UI.

## Requested Changes (Diff)

### Add
- New page `/admin/setup` — Admin Setup page with:
  - A token input field (password type, masked) for the user to paste their `CAFFEINE_ADMIN_TOKEN`
  - A "Claim Admin" button that calls `_initializeAccessControlWithSecret` with the entered token
  - Feedback states: loading, success (you are now admin), already-admin (you are already admin), error (wrong token)
  - A "Check my current role" display showing the caller's current role
  - Login gate if not authenticated
- Route `/admin/setup` added to router
- Link to `/admin/setup` added in the nav's Admin section (visible to everyone when logged in, not just admins — so the user can find it before they have admin)

### Modify
- Navbar: add an "Admin Setup" link visible to all authenticated users (not just admins), pointing to `/admin/setup`. This can sit next to or replace the existing admin link until admin is claimed; after claiming admin, user sees both the Setup page and the Subscribers page.

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/pages/AdminSetupPage.tsx` with:
   - `useIsCallerAdmin` to check current role
   - `useActor` to get the actor
   - Token input + Claim button calling `actor._initializeAccessControlWithSecret(token)` directly
   - Success/error/already-admin states with clear messaging
   - Instructions explaining what the token is and where to find it (Caffeine dashboard)
2. Add route `/admin/setup` in `App.tsx`
3. Update `Navbar.tsx` to show an "Admin Setup" link for all authenticated users (separate from the admin-only link)
4. Add a `useClaimAdmin` mutation to `useQueries.ts` (or inline in the page) that calls `_initializeAccessControlWithSecret`
