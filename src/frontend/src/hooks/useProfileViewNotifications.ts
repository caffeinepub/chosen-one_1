import { useCallback, useEffect, useState } from "react";
import { useInternetIdentity } from "./useInternetIdentity";

/* ── Types ───────────────────────────────────────────── */
export interface ProfileViewNotif {
  id: string;
  viewerId: string;
  viewerName: string;
  timestamp: number; // ms
  read: boolean;
}

/* ── Storage helpers ─────────────────────────────────── */
function storageKey(artistPrincipalId: string): string {
  return `profile_view_notifs_${artistPrincipalId}`;
}

function readNotifs(artistPrincipalId: string): ProfileViewNotif[] {
  try {
    const raw = localStorage.getItem(storageKey(artistPrincipalId));
    if (!raw) return [];
    return JSON.parse(raw) as ProfileViewNotif[];
  } catch {
    return [];
  }
}

function writeNotifs(artistPrincipalId: string, notifs: ProfileViewNotif[]) {
  try {
    localStorage.setItem(storageKey(artistPrincipalId), JSON.stringify(notifs));
  } catch {
    // storage quota exceeded or private browsing – fail silently
  }
}

/**
 * Save (or refresh) a profile view notification for the given artist.
 * Deduplicates by viewerId — replaces the existing entry but marks it unread.
 * Caps storage at 50 entries.
 */
export function saveProfileViewNotification(
  artistPrincipalId: string,
  viewerId: string,
  viewerName: string,
) {
  const existing = readNotifs(artistPrincipalId);
  // Remove any previous entry for this viewer
  const filtered = existing.filter((n) => n.viewerId !== viewerId);
  const newEntry: ProfileViewNotif = {
    id: `${viewerId}_${Date.now()}`,
    viewerId,
    viewerName,
    timestamp: Date.now(),
    read: false,
  };
  const updated = [newEntry, ...filtered].slice(0, 50);
  writeNotifs(artistPrincipalId, updated);
}

/* ── Hook ────────────────────────────────────────────── */
/**
 * Returns profile-view notifications for the currently authenticated user,
 * stored entirely in localStorage.
 */
export function useMyProfileViewNotifications() {
  const { identity } = useInternetIdentity();
  const myPrincipalId = identity?.getPrincipal().toString();

  const [notifications, setNotifications] = useState<ProfileViewNotif[]>([]);

  // Load from storage whenever principal changes or storage updates
  const reload = useCallback(() => {
    if (!myPrincipalId) {
      setNotifications([]);
      return;
    }
    setNotifications(readNotifs(myPrincipalId));
  }, [myPrincipalId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Also reload when storage events fire (other tabs writing)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (myPrincipalId && e.key === storageKey(myPrincipalId)) {
        reload();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [myPrincipalId, reload]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    if (!myPrincipalId) return;
    const updated = notifications.map((n) => ({ ...n, read: true }));
    writeNotifs(myPrincipalId, updated);
    setNotifications(updated);
  }, [myPrincipalId, notifications]);

  return { notifications, unreadCount, markAllRead };
}
