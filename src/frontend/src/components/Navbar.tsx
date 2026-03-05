import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Principal } from "@icp-sdk/core/principal";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Bell,
  CornerDownRight,
  Eye,
  ListMusic,
  LogIn,
  LogOut,
  Menu,
  Music2,
  Swords,
  Trophy,
  Upload,
  User,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Notification } from "../backend.d";
import { Variant_newTrack_requestReply } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type ProfileViewNotif,
  useMyProfileViewNotifications,
} from "../hooks/useProfileViewNotifications";
import {
  useMarkNotificationsRead,
  useMyNotifications,
  usePendingBattlesForMe,
  useUserProfile,
} from "../hooks/useQueries";

/* ── Relative time ───────────────────────────────────── */
function relativeTime(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function relativeTimeMs(ms: number): string {
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/* ── Single notification item ────────────────────────── */
function NotificationItem({
  notification,
  index,
}: {
  notification: Notification;
  index: number;
}) {
  const { data: artistProfile } = useUserProfile(
    notification.fromArtistId as Principal,
  );
  const artistName =
    artistProfile?.username ||
    `${notification.fromArtistId.toString().slice(0, 8)}…`;

  const isRequestReply =
    notification.notifType === Variant_newTrack_requestReply.requestReply;

  const truncatedReply =
    notification.replyText && notification.replyText.length > 60
      ? `${notification.replyText.slice(0, 60)}…`
      : notification.replyText;

  return (
    <div
      className="px-3 py-2.5 rounded-lg hover:bg-secondary/60 transition-colors"
      data-ocid={`navbar.notifications.item.${index + 1}`}
    >
      <div className="flex items-start gap-2">
        {isRequestReply ? (
          <div className="h-7 w-7 rounded-full bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0 mt-0.5">
            <CornerDownRight className="h-3.5 w-3.5 text-violet-400" />
          </div>
        ) : (
          <div className="h-7 w-7 rounded-full bg-gold/15 border border-gold/25 flex items-center justify-center shrink-0 mt-0.5">
            <Music2 className="h-3.5 w-3.5 text-gold/80" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {isRequestReply ? (
            <>
              <p className="text-xs font-ui leading-snug text-foreground">
                <span className="font-semibold text-violet-400">
                  {artistName}
                </span>{" "}
                replied to your request
              </p>
              {truncatedReply && (
                <p className="text-xs font-ui text-muted-foreground italic truncate mt-0.5 pl-1 border-l-2 border-violet-500/40">
                  "{truncatedReply}"
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-xs font-ui leading-snug text-foreground">
                <span className="font-semibold text-gold">{artistName}</span>{" "}
                dropped a new track
              </p>
              <p className="text-xs font-ui font-medium text-muted-foreground truncate mt-0.5">
                "{notification.trackTitle}"
              </p>
            </>
          )}
          <p className="text-[10px] font-ui text-muted-foreground/60 mt-0.5">
            {relativeTime(notification.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Profile view notification item ─────────────────── */
function ProfileViewNotifItem({
  notif,
  index,
}: {
  notif: ProfileViewNotif;
  index: number;
}) {
  return (
    <div
      className="px-3 py-2.5 rounded-lg hover:bg-secondary/60 transition-colors"
      data-ocid={`navbar.notifications.profile_view.item.${index + 1}`}
    >
      <div className="flex items-start gap-2">
        <div className="h-7 w-7 rounded-full bg-purple-500/15 border border-purple-500/25 flex items-center justify-center shrink-0 mt-0.5">
          <Eye className="h-3.5 w-3.5 text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-ui leading-snug text-foreground">
            <span className="font-semibold text-purple-400">
              {notif.viewerName}
            </span>{" "}
            viewed your profile
          </p>
          <p className="text-[10px] font-ui text-muted-foreground/60 mt-0.5">
            {relativeTimeMs(notif.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
}

const navLinks = [
  { to: "/", label: "Charts", icon: ListMusic, ocid: "nav.charts.link" },
  {
    to: "/following",
    label: "Following",
    icon: Users,
    ocid: "nav.following.link",
  },
  {
    to: "/battles",
    label: "Battles",
    icon: Swords,
    ocid: "nav.battles.link",
  },
  {
    to: "/leaderboard",
    label: "Leaderboard",
    icon: Trophy,
    ocid: "nav.leaderboard.link",
  },
  { to: "/upload", label: "Upload", icon: Upload, ocid: "nav.upload.link" },
  {
    to: "/my-tracks",
    label: "My Tracks",
    icon: Music2,
    ocid: "nav.my_tracks.link",
  },
  { to: "/profile", label: "Profile", icon: User, ocid: "nav.profile.link" },
];

export function Navbar() {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: notifications } = useMyNotifications();
  const markRead = useMarkNotificationsRead();
  const { data: pendingBattles } = usePendingBattlesForMe();

  // Profile view notifications (localStorage-only, client-side)
  const {
    notifications: profileViewNotifs,
    unreadCount: pvUnreadCount,
    markAllRead: markPVRead,
  } = useMyProfileViewNotifications();

  const backendUnreadCount = notifications?.length ?? 0;
  const unreadCount = backendUnreadCount + pvUnreadCount;
  const pendingBattleCount = pendingBattles?.length ?? 0;

  // Build a merged, time-sorted list for display
  type MergedNotif =
    | { kind: "backend"; item: Notification; ts: number }
    | { kind: "profileView"; item: ProfileViewNotif; ts: number };

  const mergedNotifs: MergedNotif[] = [
    ...(notifications ?? []).map((n) => ({
      kind: "backend" as const,
      item: n,
      ts: Number(n.timestamp / BigInt(1_000_000)),
    })),
    ...profileViewNotifs.map((n) => ({
      kind: "profileView" as const,
      item: n,
      ts: n.timestamp,
    })),
  ].sort((a, b) => b.ts - a.ts);

  function handleMarkRead() {
    markRead.mutate(undefined, {
      onSuccess: () => {
        markPVRead();
        setNotifOpen(false);
      },
    });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        {/* Left side: Hamburger + Logo */}
        <div className="flex items-center gap-3">
          {/* Hamburger button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            onClick={() => setMenuOpen(true)}
            data-ocid="nav.hamburger.button"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <motion.div
              className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"
              whileHover={{ scale: 1.05 }}
            >
              <Music2 className="h-5 w-5 text-gold" />
              <div className="absolute inset-0 rounded-lg bg-gold/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
            <span className="font-display text-xl font-black tracking-tight">
              <span className="text-gold">CHOSEN</span>
              <span className="text-foreground"> ONE</span>
            </span>
          </Link>
        </div>

        {/* Auth button + notifications */}
        <div className="flex items-center gap-2">
          {/* Notification bell — only when authenticated */}
          {isAuthenticated && (
            <Popover open={notifOpen} onOpenChange={setNotifOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  data-ocid="navbar.notifications.button"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center font-ui tabular-nums">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-80 p-0 border-border bg-card shadow-xl"
                data-ocid="navbar.notifications.popover"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="font-display font-bold text-sm text-foreground">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-2 text-xs font-ui font-normal text-gold">
                        {unreadCount} new
                      </span>
                    )}
                  </h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs font-ui text-muted-foreground hover:text-foreground px-2"
                      onClick={handleMarkRead}
                      disabled={markRead.isPending}
                      data-ocid="navbar.notifications.mark_read_button"
                    >
                      Mark all read
                    </Button>
                  )}
                </div>

                {/* Notification list */}
                {unreadCount === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center"
                    data-ocid="navbar.notifications.empty_state"
                  >
                    <div className="h-10 w-10 rounded-full bg-secondary/60 border border-border flex items-center justify-center">
                      <Bell className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-ui font-medium text-muted-foreground">
                      All caught up
                    </p>
                    <p className="text-xs font-ui text-muted-foreground/60">
                      New track drops, replies, and profile views will appear
                      here
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-80">
                    <div className="p-2 space-y-0.5">
                      {mergedNotifs.map((entry, idx) =>
                        entry.kind === "backend" ? (
                          <NotificationItem
                            key={entry.item.id}
                            notification={entry.item}
                            index={idx}
                          />
                        ) : (
                          <ProfileViewNotifItem
                            key={entry.item.id}
                            notif={entry.item}
                            index={idx}
                          />
                        ),
                      )}
                    </div>
                  </ScrollArea>
                )}
              </PopoverContent>
            </Popover>
          )}

          {isAuthenticated ? (
            <Button
              variant="outline"
              size="sm"
              onClick={clear}
              className="gap-1.5 font-ui font-semibold border-border text-muted-foreground hover:text-foreground hover:border-gold/40"
              data-ocid="nav.login.button"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={login}
              disabled={isLoggingIn}
              className="gap-1.5 font-ui font-bold bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30"
              data-ocid="nav.login.button"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isLoggingIn ? "Signing in…" : "Sign In"}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Hamburger Sheet — all nav links */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="left"
          className="w-72 p-0 bg-card border-r border-border flex flex-col"
          data-ocid="nav.menu.sheet"
        >
          <SheetHeader className="px-5 py-5 border-b border-border shrink-0">
            <SheetTitle asChild>
              <Link
                to="/"
                className="flex items-center gap-2 group"
                onClick={() => setMenuOpen(false)}
              >
                <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Music2 className="h-5 w-5 text-gold" />
                </div>
                <span className="font-display text-xl font-black tracking-tight">
                  <span className="text-gold">CHOSEN</span>
                  <span className="text-foreground"> ONE</span>
                </span>
              </Link>
            </SheetTitle>
          </SheetHeader>

          {/* Nav links list */}
          <ScrollArea className="flex-1">
            <nav className="flex flex-col gap-1 px-3 py-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;
                const isBattles = link.to === "/battles";
                const battleBadge =
                  isBattles && isAuthenticated && pendingBattleCount > 0;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    data-ocid={link.ocid}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg font-ui font-semibold text-sm transition-all duration-150",
                      isActive
                        ? "bg-gold/10 text-gold border border-gold/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{link.label}</span>
                    {battleBadge && (
                      <span className="h-5 min-w-5 px-1 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center font-ui tabular-nums">
                        {pendingBattleCount > 9 ? "9+" : pendingBattleCount}
                      </span>
                    )}
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Sign in / out at bottom */}
          <div className="px-4 py-4 border-t border-border shrink-0">
            {isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clear();
                  setMenuOpen(false);
                }}
                className="w-full gap-2 font-ui font-semibold border-border text-muted-foreground hover:text-foreground hover:border-gold/40"
                data-ocid="nav.menu.signout.button"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  login();
                  setMenuOpen(false);
                }}
                disabled={isLoggingIn}
                className="w-full gap-2 font-ui font-bold bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30"
                data-ocid="nav.menu.signin.button"
              >
                <LogIn className="h-4 w-4" />
                {isLoggingIn ? "Signing in…" : "Sign In"}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
