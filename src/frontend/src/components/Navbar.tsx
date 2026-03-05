import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Principal } from "@icp-sdk/core/principal";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Bell,
  ListMusic,
  LogIn,
  LogOut,
  Music2,
  Search,
  Swords,
  Trophy,
  Upload,
  User,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Notification } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
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

  return (
    <div
      className="px-3 py-2.5 rounded-lg hover:bg-secondary/60 transition-colors"
      data-ocid={`navbar.notifications.item.${index + 1}`}
    >
      <div className="flex items-start gap-2">
        <div className="h-7 w-7 rounded-full bg-gold/15 border border-gold/25 flex items-center justify-center shrink-0 mt-0.5">
          <Music2 className="h-3.5 w-3.5 text-gold/80" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-ui leading-snug text-foreground">
            <span className="font-semibold text-gold">{artistName}</span>{" "}
            dropped a new track
          </p>
          <p className="text-xs font-ui font-medium text-muted-foreground truncate mt-0.5">
            "{notification.trackTitle}"
          </p>
          <p className="text-[10px] font-ui text-muted-foreground/60 mt-0.5">
            {relativeTime(notification.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
}

const navLinks = [
  { to: "/", label: "Charts", icon: ListMusic, ocid: "nav.charts.link" },
  {
    to: "/artists",
    label: "Artists",
    icon: Search,
    ocid: "nav.artists.link",
  },
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
  const { data: notifications } = useMyNotifications();
  const markRead = useMarkNotificationsRead();
  const { data: pendingBattles } = usePendingBattlesForMe();

  const unreadCount = notifications?.length ?? 0;
  const pendingBattleCount = pendingBattles?.length ?? 0;

  function handleMarkRead() {
    markRead.mutate(undefined, {
      onSuccess: () => setNotifOpen(false),
    });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
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

        {/* Nav links — desktop */}
        <nav className="hidden md:flex items-center gap-1">
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
                className="relative group"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-1.5 font-ui font-semibold text-sm transition-all duration-200",
                    isActive
                      ? "text-gold hover:text-gold hover:bg-transparent"
                      : "text-muted-foreground hover:text-foreground hover:bg-transparent",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                  {battleBadge && (
                    <span className="ml-0.5 h-4 min-w-4 px-0.5 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center font-ui tabular-nums">
                      {pendingBattleCount > 9 ? "9+" : pendingBattleCount}
                    </span>
                  )}
                </Button>
                {/* Gold underline indicator */}
                <span
                  className={cn(
                    "absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-gold transition-all duration-200",
                    isActive
                      ? "opacity-100 scale-x-100"
                      : "opacity-0 scale-x-0 group-hover:opacity-40 group-hover:scale-x-100",
                  )}
                  style={{ transformOrigin: "center" }}
                />
              </Link>
            );
          })}
        </nav>

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
                      New tracks from followed artists will appear here
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-80">
                    <div className="p-2 space-y-0.5">
                      {notifications?.map((notif, idx) => (
                        <NotificationItem
                          key={notif.id}
                          notification={notif}
                          index={idx}
                        />
                      ))}
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

      {/* Mobile nav */}
      <nav className="md:hidden flex border-t border-border">
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
              className="flex-1"
            >
              <button
                type="button"
                className={cn(
                  "w-full flex flex-col items-center gap-1 py-2 text-xs font-ui font-semibold transition-colors relative",
                  isActive ? "text-gold" : "text-muted-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="h-4 w-4" />
                  {battleBadge && (
                    <span className="absolute -top-1 -right-1.5 h-3.5 min-w-3.5 px-0.5 rounded-full bg-red-500 text-[8px] font-bold text-white flex items-center justify-center">
                      {pendingBattleCount > 9 ? "9+" : pendingBattleCount}
                    </span>
                  )}
                </span>
                {link.label}
              </button>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
