import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Principal } from "@icp-sdk/core/principal";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronDown,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  Music2,
  Pause,
  Play,
  PlayCircle,
  Share2,
  Swords,
  User,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Track } from "../backend.d";
import { CommentsSection } from "../components/CommentsSection";
import { ShareModal } from "../components/ShareModal";
import { StarRating } from "../components/StarRating";
import { type QueueTrack, usePlayer } from "../contexts/PlayerContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCommentCount,
  useFollowArtist,
  useFollowerCount,
  useIsFollowing,
  useTracksByOwner,
  useUnfollowArtist,
  useUserProfile,
} from "../hooks/useQueries";
import { ChallengeArtistButton } from "./BattlesPage";

function trackToQueueTrack(track: Track): QueueTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    audioUrl: track.audioFileKey.getDirectURL(),
    coverUrl: track.coverKey?.getDirectURL(),
  };
}

/* ── BG Style helpers (same as ProfilePage) ─────────── */
type BgStyle = "dark" | "purple" | "blue" | "gold" | "neon" | "sunset";

const BG_STYLES: { id: BgStyle; css: string }[] = [
  {
    id: "dark",
    css: "oklch(0.12 0.01 260)",
  },
  {
    id: "purple",
    css: "linear-gradient(135deg, oklch(0.15 0.08 290), oklch(0.22 0.12 280))",
  },
  {
    id: "blue",
    css: "linear-gradient(135deg, oklch(0.14 0.07 250), oklch(0.2 0.1 240))",
  },
  {
    id: "gold",
    css: "linear-gradient(135deg, oklch(0.16 0.08 70), oklch(0.22 0.12 60))",
  },
  {
    id: "neon",
    css: "linear-gradient(135deg, oklch(0.13 0.07 160), oklch(0.18 0.1 150))",
  },
  {
    id: "sunset",
    css: "linear-gradient(135deg, oklch(0.18 0.1 30), oklch(0.22 0.12 350))",
  },
];

function getProfileBg(bgStyle: string): React.CSSProperties {
  const found = BG_STYLES.find((s) => s.id === bgStyle);
  return { background: found?.css ?? "oklch(0.12 0.01 260)" };
}

/* ── Track row on artist page ────────────────────────── */
function ArtistTrackRow({
  track,
  index,
  allTracks,
}: {
  track: Track;
  index: number;
  allTracks: Track[];
}) {
  const [expanded, setExpanded] = useState(false);
  const coverUrl = track.coverKey?.getDirectURL();
  const commentCount = useCommentCount(track.id);
  const player = usePlayer();

  const queueTrack = trackToQueueTrack(track);
  const contextQueue = allTracks.map(trackToQueueTrack);

  const isCurrentTrack =
    player.currentIndex >= 0 &&
    player.queue[player.currentIndex]?.id === track.id;
  const isPlaying = isCurrentTrack && player.playing;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentTrack) {
      player.togglePlay();
    } else {
      player.playTrack(queueTrack, contextQueue);
    }
  };

  const avgRating =
    track.ratings.length > 0
      ? track.ratings.reduce((sum, r) => sum + Number(r.score), 0) /
        track.ratings.length
      : 0;

  const likeCount = track.likes.length;

  const locationLabel =
    track.city && track.state
      ? `${track.city}, ${track.state}`
      : track.city || track.state || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      data-ocid={`artist.track.item.${index + 1}`}
    >
      <div
        className={cn(
          "rounded-xl border bg-card transition-all duration-300 overflow-hidden",
          "border-border hover:border-gold/25",
          "hover:shadow-[0_0_24px_oklch(0.78_0.17_72/0.07),0_4px_24px_oklch(0_0_0/0.35)]",
          expanded && "border-gold/20",
        )}
      >
        {/* Header row */}
        <div className="w-full flex items-center gap-3 p-4">
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
            aria-expanded={expanded}
          >
            {/* Track index */}
            <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-display font-bold text-muted-foreground border border-border shrink-0">
              {index + 1}
            </div>

            {/* Album art */}
            <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 bg-secondary border border-border">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={`${track.title} cover`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Music2 className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Title + meta */}
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold truncate text-sm leading-tight text-foreground">
                {track.title}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {track.genre && track.genre !== "Unknown" && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 font-ui border-gold/20 text-gold/80 bg-gold/5"
                  >
                    {track.genre}
                  </Badge>
                )}
                {locationLabel && (
                  <div className="flex items-center gap-0.5">
                    <MapPin className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                    <span className="text-xs text-muted-foreground/60 font-ui truncate">
                      {locationLabel}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </button>

          {/* Right meta */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Stars */}
            <div className="hidden sm:flex flex-col items-end gap-0.5">
              <StarRating value={Math.round(avgRating)} size="sm" readonly />
              <span className="text-[10px] text-muted-foreground font-ui tabular-nums">
                {avgRating.toFixed(1)} · {track.ratings.length}
              </span>
            </div>

            {/* Comments */}
            {commentCount > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground/60">
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="text-xs font-ui tabular-nums">
                  {commentCount}
                </span>
              </div>
            )}

            {/* Likes */}
            <div className="flex items-center gap-1 text-muted-foreground/60">
              <Heart className="h-3.5 w-3.5" />
              <span className="text-xs font-ui tabular-nums">{likeCount}</span>
            </div>

            {/* Play / Pause button */}
            <button
              type="button"
              onClick={handlePlayPause}
              aria-label={isPlaying ? "Pause" : "Play track"}
              data-ocid="track.play.button"
              className={cn(
                "flex items-center justify-center h-8 w-8 rounded-full transition-all duration-200 shrink-0",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
                isCurrentTrack
                  ? "bg-gold/20 border border-gold/40 text-gold hover:bg-gold/30 shadow-[0_0_8px_oklch(0.78_0.17_72/0.3)]"
                  : "text-muted-foreground hover:text-gold hover:bg-gold/10 border border-transparent hover:border-gold/25",
              )}
            >
              {isPlaying ? (
                <Pause className="h-3.5 w-3.5 fill-current" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
              )}
            </button>

            {/* Expand */}
            <button
              type="button"
              onClick={() => setExpanded((p) => !p)}
              aria-label={expanded ? "Collapse" : "Expand"}
              className="text-muted-foreground shrink-0 transition-transform duration-200 hover:text-foreground p-1 rounded"
              style={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Expanded */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
                {track.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {track.description}
                  </p>
                )}
                <Separator className="bg-border/50" />
                <CommentsSection trackId={track.id} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ── Loading skeleton ────────────────────────────────── */
function ProfileSkeleton() {
  return (
    <div className="space-y-0" data-ocid="artist.loading_state">
      {/* Banner */}
      <Skeleton
        className="w-full rounded-none"
        style={{ aspectRatio: "16/5" }}
      />
      {/* Header area */}
      <div className="px-6 py-5 space-y-3">
        <div className="flex items-end gap-4 -mt-10">
          <Skeleton className="h-20 w-20 rounded-full shrink-0 border-4 border-background" />
          <div className="space-y-2 pb-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-3.5 w-28" />
          </div>
        </div>
        <Skeleton className="h-4 w-64" />
      </div>
      {/* Tracks */}
      <div className="px-4 sm:px-6 space-y-3 pb-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"
          >
            <Skeleton className="h-7 w-7 rounded-full shrink-0" />
            <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────── */
export function ArtistProfilePage() {
  const { principalId } = useParams({ strict: false }) as {
    principalId: string;
  };
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const player = usePlayer();
  const [shareOpen, setShareOpen] = useState(false);

  let principal: Principal | undefined;
  let parseError = false;
  try {
    principal = Principal.fromText(principalId ?? "");
  } catch {
    parseError = true;
  }

  const myPrincipalStr = identity?.getPrincipal().toString();
  const isOwnProfile = !!myPrincipalStr && myPrincipalStr === principalId;

  const { data: profile, isLoading: profileLoading } =
    useUserProfile(principal);
  const { data: tracks, isLoading: tracksLoading } =
    useTracksByOwner(principal);
  const { data: isFollowing } = useIsFollowing(
    !isOwnProfile ? principal : undefined,
  );
  const { data: followerCount } = useFollowerCount(principal);
  const followMutation = useFollowArtist();
  const unfollowMutation = useUnfollowArtist();

  const isLoading = profileLoading || tracksLoading;

  /* ── Not found ── */
  if (parseError || (!isLoading && profile === null)) {
    return (
      <main className="container py-16 flex flex-col items-center gap-6 text-center">
        <div
          className="h-20 w-20 rounded-2xl bg-secondary border border-border flex items-center justify-center"
          data-ocid="artist.error_state"
        >
          <User className="h-9 w-9 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display font-bold text-2xl">Artist not found</h2>
          <p className="text-muted-foreground font-ui text-sm">
            This profile doesn't exist or hasn't been set up yet.
          </p>
        </div>
        <Link to="/">
          <Button
            variant="outline"
            className="gap-2 font-ui border-border hover:border-gold/40"
            data-ocid="artist.back.button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Charts
          </Button>
        </Link>
      </main>
    );
  }

  /* ── Loading ── */
  if (isLoading) {
    return (
      <main className="max-w-3xl mx-auto">
        <ProfileSkeleton />
      </main>
    );
  }

  const bannerUrl = profile?.bannerKey?.getDirectURL();
  const picUrl = profile?.profilePicKey?.getDirectURL();
  const username = profile?.username || "Unknown Artist";
  const bgStyle = (profile?.bgStyle as BgStyle) ?? "dark";
  const principalShort = principalId ? `${principalId.slice(0, 12)}…` : "";

  const sortedTracks = [...(tracks ?? [])].sort((a, b) => {
    const avgA =
      a.ratings.length > 0
        ? a.ratings.reduce((s, r) => s + Number(r.score), 0) / a.ratings.length
        : 0;
    const avgB =
      b.ratings.length > 0
        ? b.ratings.reduce((s, r) => s + Number(r.score), 0) / b.ratings.length
        : 0;
    return avgB - avgA;
  });

  return (
    <main className="max-w-3xl mx-auto pb-12" data-ocid="artist.page">
      {/* Back nav */}
      <div className="px-4 sm:px-6 pt-6 pb-2">
        <Link to="/">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 font-ui text-muted-foreground hover:text-foreground -ml-2"
            data-ocid="artist.back.button"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Charts
          </Button>
        </Link>
      </div>

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 sm:mx-6 rounded-2xl overflow-hidden border border-border shadow-[0_8px_48px_oklch(0_0_0/0.5)]"
        style={getProfileBg(bgStyle)}
        data-ocid="artist.card"
      >
        {/* Banner */}
        <div
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: "16/5" }}
        >
          {bannerUrl ? (
            <img
              src={bannerUrl}
              alt={`${username} banner`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gold/10 via-transparent to-gold/5 border-b border-border/50" />
          )}
          {/* Subtle gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Profile header */}
        <div className="px-6 pb-6 pt-0">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <Avatar className="h-20 w-20 border-4 border-background shadow-xl shrink-0">
              <AvatarImage src={picUrl} />
              <AvatarFallback className="bg-secondary text-gold text-2xl font-display font-bold">
                {username ? username.slice(0, 1).toUpperCase() : <User />}
              </AvatarFallback>
            </Avatar>
            <div className="mb-1 min-w-0">
              <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground truncate">
                {username}
              </h1>
              <p className="text-xs text-muted-foreground font-ui font-mono mt-0.5 truncate">
                {principalShort}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Music2 className="h-3.5 w-3.5 text-gold/70" />
              <span className="text-sm font-ui text-muted-foreground">
                <span className="text-foreground font-semibold">
                  {sortedTracks.length}
                </span>{" "}
                {sortedTracks.length === 1 ? "track" : "tracks"}
              </span>
            </div>
            {sortedTracks.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-red-400/70" />
                <span className="text-sm font-ui text-muted-foreground">
                  <span className="text-foreground font-semibold">
                    {sortedTracks.reduce((s, t) => s + t.likes.length, 0)}
                  </span>{" "}
                  likes
                </span>
              </div>
            )}
            {/* Follower count */}
            <div
              className="flex items-center gap-1.5"
              data-ocid="artist.follower_count.panel"
            >
              <Users className="h-3.5 w-3.5 text-blue-400/70" />
              <span className="text-sm font-ui text-muted-foreground">
                <span className="text-foreground font-semibold">
                  {Number(followerCount ?? BigInt(0))}
                </span>{" "}
                {Number(followerCount ?? BigInt(0)) === 1
                  ? "follower"
                  : "followers"}
              </span>
            </div>

            {/* Follow / Unfollow button */}
            {!isOwnProfile && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      {isAuthenticated ? (
                        <Button
                          size="sm"
                          variant={isFollowing ? "outline" : "default"}
                          disabled={
                            followMutation.isPending ||
                            unfollowMutation.isPending
                          }
                          onClick={() => {
                            if (!principal) return;
                            if (isFollowing) {
                              unfollowMutation.mutate(principal);
                            } else {
                              followMutation.mutate(principal);
                            }
                          }}
                          className={cn(
                            "gap-1.5 font-ui font-semibold text-xs h-8 px-3 transition-all duration-200",
                            isFollowing
                              ? "border-border text-muted-foreground hover:text-foreground hover:border-red-400/40 hover:text-red-400"
                              : "bg-gold/20 text-gold hover:bg-gold/30 border border-gold/40",
                          )}
                          data-ocid="artist.follow.button"
                        >
                          {followMutation.isPending ||
                          unfollowMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : isFollowing ? (
                            <UserCheck className="h-3.5 w-3.5" />
                          ) : (
                            <UserPlus className="h-3.5 w-3.5" />
                          )}
                          {isFollowing ? "Following" : "Follow"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          className="gap-1.5 font-ui font-semibold text-xs h-8 px-3 border-border text-muted-foreground"
                          data-ocid="artist.follow.button"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Follow
                        </Button>
                      )}
                    </span>
                  </TooltipTrigger>
                  {!isAuthenticated && (
                    <TooltipContent side="bottom" className="font-ui text-xs">
                      Sign in to follow this artist
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Challenge to Battle button */}
            {!isOwnProfile && isAuthenticated && principalId && (
              <ChallengeArtistButton defenderPrincipalId={principalId} />
            )}

            {/* Share button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShareOpen(true)}
              data-ocid="artist.share.open_modal_button"
              className="gap-1.5 font-ui font-semibold text-xs h-8 px-3 border-border text-muted-foreground hover:text-gold hover:border-gold/40 transition-all duration-200"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Share Modal */}
      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        url={`${window.location.origin}/artist/${principalId}`}
        title={`${username} on Chosen One – AI Music Charts`}
      />

      {/* Tracks section */}
      <div className="px-4 sm:px-6 mt-8 space-y-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-between"
        >
          <h2 className="font-display font-bold text-lg">
            Tracks{" "}
            {sortedTracks.length > 0 && (
              <span className="text-gold">· {sortedTracks.length}</span>
            )}
          </h2>
          {sortedTracks.length > 0 && (
            <Button
              size="sm"
              onClick={() =>
                player.playAll(sortedTracks.map(trackToQueueTrack))
              }
              data-ocid="charts.play_all.button"
              className="gap-2 bg-gold/15 text-gold hover:bg-gold/25 border border-gold/25 font-ui font-bold text-xs h-8"
            >
              <PlayCircle className="h-3.5 w-3.5" />
              Play All
            </Button>
          )}
        </motion.div>

        {sortedTracks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[20vh] gap-4 rounded-xl border border-border bg-card p-10 text-center"
            data-ocid="artist.track.empty_state"
          >
            <div className="h-14 w-14 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Music2 className="h-6 w-6 text-gold/60" />
            </div>
            <div className="space-y-1">
              <p className="font-display font-bold text-base">No tracks yet</p>
              <p className="text-muted-foreground text-sm font-ui">
                {username} hasn't uploaded any music yet
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3" data-ocid="artist.track.list">
            {sortedTracks.map((track, idx) => (
              <ArtistTrackRow
                key={track.id}
                track={track}
                index={idx}
                allTracks={sortedTracks}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
