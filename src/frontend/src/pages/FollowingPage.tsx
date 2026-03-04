import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Principal } from "@icp-sdk/core/principal";
import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  Compass,
  Heart,
  Loader2,
  LogIn,
  MessageCircle,
  Music2,
  Rss,
  Send,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AverageRating, Track } from "../backend.d";
import { AudioPlayer } from "../components/AudioPlayer";
import { CommentsSection } from "../components/CommentsSection";
import { StarRating } from "../components/StarRating";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCharts,
  useCommentCount,
  useFollowArtist,
  useFollowedArtists,
  useLikeTrack,
  useRateTrack,
  useSendMusicRequest,
} from "../hooks/useQueries";

/* ── Relative time ───────────────────────────────────── */
function relativeTime(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 86400 * 7) return `${Math.floor(seconds / 86400)}d ago`;
  const date = new Date(ms);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ── Feed Track Card ─────────────────────────────────── */
function FeedTrackCard({ track, index }: { track: Track; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const callerPrincipal = identity?.getPrincipal().toString();
  const rateMutation = useRateTrack();
  const likeMutation = useLikeTrack();
  const sendRequestMutation = useSendMusicRequest();
  const commentCount = useCommentCount(track.id);

  const coverUrl = track.coverKey?.getDirectURL();
  const audioUrl = track.audioFileKey.getDirectURL();

  const avgRating =
    track.ratings.length > 0
      ? track.ratings.reduce((sum, r) => sum + Number(r.score), 0) /
        track.ratings.length
      : 0;

  const likeCount = track.likes.length;
  const hasLiked = callerPrincipal
    ? track.likes.some((p) => p.toString() === callerPrincipal)
    : false;
  const isOwner = callerPrincipal
    ? track.ownerId.toString() === callerPrincipal
    : false;

  const ocid = `following.item.${index + 1}`;

  const handleRate = async () => {
    if (!userRating) return;
    try {
      await rateMutation.mutateAsync({ trackId: track.id, score: userRating });
      toast.success("Rating submitted!");
      setUserRating(0);
    } catch {
      toast.error("Failed to submit rating");
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Sign in to like tracks");
      return;
    }
    if (isOwner) return;
    likeMutation.mutate({ trackId: track.id, liked: hasLiked });
  };

  const handleSendRequest = async () => {
    if (!requestMessage.trim()) return;
    try {
      await sendRequestMutation.mutateAsync({
        toArtistId: track.ownerId,
        message: requestMessage.trim(),
      });
      toast.success("Request sent!");
      setRequestMessage("");
      setRequestOpen(false);
    } catch {
      toast.error("Failed to send request");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      data-ocid={ocid}
      className="group"
    >
      <div
        className={cn(
          "rounded-xl border bg-card transition-all duration-300 overflow-hidden",
          "border-border hover:border-gold/25 hover:shadow-[0_0_30px_oklch(0.78_0.17_72/0.08),0_4px_32px_oklch(0_0_0/0.4)]",
          expanded && "border-gold/20",
        )}
      >
        {/* Header row */}
        <div className="w-full flex items-center gap-3 p-4">
          {/* Clickable left portion — expand/collapse */}
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
            aria-expanded={expanded}
          >
            {/* Album art */}
            <div
              className={cn(
                "h-14 w-14 rounded-lg overflow-hidden shrink-0 bg-secondary border transition-all duration-300",
                "border-border group-hover:border-gold/20",
              )}
            >
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={`${track.title} cover`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Music2 className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Title, artist, meta */}
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold truncate text-base leading-tight text-foreground">
                {track.title}
              </h3>
              <Link
                to="/artist/$principalId"
                params={{ principalId: track.ownerId.toString() }}
                onClick={(e) => e.stopPropagation()}
                data-ocid="following.track.artist.link"
                className="text-sm text-gold/80 font-ui truncate mt-0.5 hover:text-gold hover:underline cursor-pointer transition-colors duration-150 block"
              >
                {track.artist}
              </Link>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {track.genre && track.genre !== "Unknown" && (
                  <Badge
                    variant="outline"
                    className="h-4 px-1.5 text-[10px] font-ui font-semibold border-gold/20 text-gold/70 bg-gold/5"
                  >
                    {track.genre}
                  </Badge>
                )}
                <span className="text-[11px] text-muted-foreground/60 font-ui">
                  {relativeTime(track.uploadTimestamp)}
                </span>
              </div>
            </div>
          </button>

          {/* Right section */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Rating */}
            {track.ratings.length > 0 && (
              <div className="flex flex-col items-end gap-0.5 shrink-0 hidden sm:flex">
                <StarRating value={Math.round(avgRating)} size="sm" readonly />
                <span className="text-xs text-muted-foreground font-ui tabular-nums">
                  {avgRating.toFixed(1)} · {track.ratings.length}{" "}
                  {track.ratings.length === 1 ? "rating" : "ratings"}
                </span>
              </div>
            )}

            {/* Comment count */}
            {commentCount > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground/70 shrink-0">
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="text-xs font-ui tabular-nums">
                  {commentCount}
                </span>
              </div>
            )}

            {/* Like button */}
            <button
              type="button"
              onClick={handleLike}
              disabled={likeMutation.isPending || isOwner}
              data-ocid="following.track.like.button"
              aria-label={hasLiked ? "Unlike track" : "Like track"}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-ui font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
                hasLiked
                  ? "text-red-400 bg-red-500/10 hover:bg-red-500/20"
                  : isOwner
                    ? "text-muted-foreground/40 cursor-default"
                    : !isAuthenticated
                      ? "text-muted-foreground/50 hover:text-muted-foreground"
                      : "text-muted-foreground hover:text-red-400 hover:bg-red-500/10",
              )}
            >
              <Heart
                className={cn(
                  "h-3.5 w-3.5 transition-all duration-200",
                  hasLiked ? "fill-red-400 text-red-400" : "",
                  likeMutation.isPending ? "animate-pulse" : "",
                )}
              />
              <span className="tabular-nums">{likeCount}</span>
            </button>

            {/* Request More button */}
            {!isOwner && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isAuthenticated) {
                    toast.error("Sign in to request music");
                    return;
                  }
                  setRequestOpen(true);
                }}
                data-ocid="following.track.request.open_modal_button"
                aria-label="Request more music from this artist"
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-ui font-semibold text-muted-foreground hover:text-gold hover:bg-gold/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
              >
                <Send className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Request</span>
              </button>
            )}

            {/* Expand icon */}
            <button
              type="button"
              onClick={() => setExpanded((p) => !p)}
              aria-label={expanded ? "Collapse" : "Expand"}
              className="text-muted-foreground ml-1 shrink-0 transition-transform duration-200 hover:text-foreground p-1 rounded"
              style={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Expanded detail */}
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
                <AudioPlayer src={audioUrl} />

                {track.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {track.description}
                  </p>
                )}

                {/* Rating widget */}
                {isAuthenticated ? (
                  <div className="flex items-center gap-3 pt-1 flex-wrap">
                    <span className="text-sm text-muted-foreground font-ui">
                      Your rating:
                    </span>
                    <StarRating
                      value={userRating}
                      onChange={setUserRating}
                      size="lg"
                    />
                    <Button
                      size="sm"
                      disabled={!userRating || rateMutation.isPending}
                      onClick={handleRate}
                      className="ml-2 bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30 font-ui font-bold"
                      data-ocid="following.track.rate.submit_button"
                    >
                      {rateMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Rate"
                      )}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground font-ui italic">
                    Sign in to rate this track
                  </p>
                )}

                <Separator className="bg-border/50" />
                <CommentsSection trackId={track.id} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Request Music Dialog */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent
          className="bg-card border-border max-w-md"
          data-ocid="following.track.request.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display font-bold">
              Request Music from{" "}
              <span className="text-gold">{track.artist}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Your message (e.g. genre, style, or anything you want)"
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              rows={4}
              className="bg-secondary border-border focus:border-gold/50 font-ui resize-none"
              data-ocid="following.track.request.textarea"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRequestOpen(false);
                setRequestMessage("");
              }}
              className="font-ui border-border"
              data-ocid="following.track.request.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSendRequest}
              disabled={!requestMessage.trim() || sendRequestMutation.isPending}
              className="bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30 font-ui font-bold gap-2"
              data-ocid="following.track.request.submit_button"
            >
              {sendRequestMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

/* ── Feed Skeleton ───────────────────────────────────── */
function FeedSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <Skeleton className="h-14 w-14 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

/* ── Following Feed ──────────────────────────────────── */
function FollowingFeed() {
  const { actor, isFetching: actorFetching } = useActor();
  const { data: followedArtists, isLoading: artistsLoading } =
    useFollowedArtists();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(false);

  useEffect(() => {
    if (!actor || actorFetching || artistsLoading) return;
    if (!followedArtists || followedArtists.length === 0) {
      setFeedLoading(false);
      setTracks([]);
      return;
    }

    let cancelled = false;
    setFeedLoading(true);
    setFeedError(false);

    // Fetch all artists' tracks in parallel
    Promise.all(
      followedArtists.map((principal: Principal) =>
        actor.getTracksByOwner(principal),
      ),
    )
      .then((results) => {
        if (cancelled) return;
        const merged = results.flat();
        // Sort by uploadTimestamp descending (newest first)
        merged.sort((a, b) => {
          if (b.uploadTimestamp > a.uploadTimestamp) return 1;
          if (b.uploadTimestamp < a.uploadTimestamp) return -1;
          return 0;
        });
        setTracks(merged);
        setFeedLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setFeedError(true);
          setFeedLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [actor, actorFetching, followedArtists, artistsLoading]);

  const isLoading = artistsLoading || feedLoading;

  if (isLoading) {
    return (
      <div className="space-y-3" data-ocid="following.loading_state">
        {[1, 2, 3, 4].map((i) => (
          <FeedSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (feedError) {
    return (
      <div
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
        data-ocid="following.error_state"
      >
        <p className="text-destructive font-ui">
          Failed to load your following feed
        </p>
      </div>
    );
  }

  if (!followedArtists || followedArtists.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[35vh] gap-5 rounded-xl border border-border bg-card p-12 text-center"
        data-ocid="following.empty_state"
      >
        <div className="h-16 w-16 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20">
          <Users className="h-7 w-7 text-gold/70" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-display font-bold text-xl">
            You're not following anyone yet
          </h3>
          <p className="text-muted-foreground text-sm font-ui max-w-xs">
            Follow artists from their profile pages to see their latest drops
            here.
          </p>
        </div>
        <Link to="/">
          <Button
            className="gap-2 bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30 font-ui font-bold"
            data-ocid="following.discover.button"
          >
            <Rss className="h-4 w-4" />
            Discover Artists on Charts
          </Button>
        </Link>
      </motion.div>
    );
  }

  if (tracks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[30vh] gap-5 rounded-xl border border-border bg-card p-12 text-center"
        data-ocid="following.empty_state"
      >
        <div className="h-16 w-16 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20">
          <Music2 className="h-7 w-7 text-gold/70" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-display font-bold text-xl">
            No tracks from followed artists yet
          </h3>
          <p className="text-muted-foreground text-sm font-ui max-w-xs">
            The artists you follow haven't dropped any tracks yet. Check back
            soon.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3" data-ocid="following.list">
      {tracks.map((track, idx) => (
        <FeedTrackCard key={track.id} track={track} index={idx} />
      ))}
    </div>
  );
}

/* ── Discover Section ────────────────────────────────── */
type ArtistSuggestion = {
  ownerId: Principal;
  artistName: string;
  topGenre: string;
  coverUrl: string | null;
  score: number;
};

function DiscoverArtistCard({
  suggestion,
  index,
  onFollowed,
}: {
  suggestion: ArtistSuggestion;
  index: number;
  onFollowed: (id: string) => void;
}) {
  const followMutation = useFollowArtist();
  const cardOcid = `following.discover.item.${index + 1}` as const;
  const btnOcid = `following.discover.follow.button.${index + 1}` as const;
  const linkOcid = `following.discover.artist.link.${index + 1}` as const;

  const handleFollow = async () => {
    try {
      await followMutation.mutateAsync(suggestion.ownerId);
      onFollowed(suggestion.ownerId.toString());
      toast.success(`Following ${suggestion.artistName}`);
    } catch {
      toast.error("Failed to follow artist");
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, y: -8 }}
      transition={{ duration: 0.3 }}
      data-ocid={cardOcid}
      className="rounded-xl border border-gold/15 bg-card hover:border-gold/30 hover:shadow-[0_0_24px_oklch(0.78_0.17_72/0.07)] transition-all duration-300 overflow-hidden flex flex-col shrink-0 w-44 sm:w-auto"
    >
      {/* Cover art */}
      <div className="relative aspect-square bg-secondary overflow-hidden">
        {suggestion.coverUrl ? (
          <img
            src={suggestion.coverUrl}
            alt={`${suggestion.artistName} cover`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gold/10 via-secondary to-secondary">
            <Music2 className="h-10 w-10 text-gold/30" />
          </div>
        )}
        {/* Genre badge overlay */}
        {suggestion.topGenre && suggestion.topGenre !== "Unknown" && (
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-black/70 text-gold border-gold/30 text-[10px] px-1.5 py-0 font-ui font-semibold backdrop-blur-sm">
              {suggestion.topGenre}
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <Link
          to="/artist/$principalId"
          params={{ principalId: suggestion.ownerId.toString() }}
          data-ocid={linkOcid}
          className="font-display font-bold text-sm leading-tight text-foreground hover:text-gold transition-colors duration-150 line-clamp-2"
        >
          {suggestion.artistName}
        </Link>
        <Button
          size="sm"
          onClick={handleFollow}
          disabled={followMutation.isPending}
          data-ocid={btnOcid}
          className="mt-auto w-full gap-1.5 bg-gold/15 text-gold hover:bg-gold/25 border border-gold/25 font-ui font-bold text-xs h-7"
        >
          {followMutation.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <UserPlus className="h-3 w-3" />
          )}
          Follow
        </Button>
      </div>
    </motion.div>
  );
}

function DiscoverSection() {
  const { identity } = useInternetIdentity();
  const callerPrincipal = identity?.getPrincipal().toString();
  const { data: followedArtists } = useFollowedArtists();
  const { data: allRatedTracks, isLoading: chartsLoading } = useCharts();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  if (!identity) return null;

  // Build genre preference map from followed artists' tracks
  const followedSet = new Set(
    (followedArtists ?? []).map((p: Principal) => p.toString()),
  );

  const allTracks: Track[] = (allRatedTracks ?? []).map(
    (ar: AverageRating) => ar.track,
  );

  // Genre preference: count genres from tracks of followed artists
  const genrePrefs = new Map<string, number>();
  for (const track of allTracks) {
    const ownerStr = track.ownerId.toString();
    if (followedSet.has(ownerStr) && track.genre && track.genre !== "Unknown") {
      genrePrefs.set(track.genre, (genrePrefs.get(track.genre) ?? 0) + 1);
    }
  }

  // Group tracks by artist (excluding self + already followed + dismissed)
  const artistMap = new Map<string, Track[]>();
  for (const track of allTracks) {
    const ownerStr = track.ownerId.toString();
    if (
      ownerStr === callerPrincipal ||
      followedSet.has(ownerStr) ||
      dismissedIds.has(ownerStr)
    )
      continue;
    if (!artistMap.has(ownerStr)) artistMap.set(ownerStr, []);
    artistMap.get(ownerStr)!.push(track);
  }

  // Score each artist
  const suggestions: ArtistSuggestion[] = [];
  for (const [_ownerStr, tracks] of artistMap.entries()) {
    // Score = sum of genre preference counts for this artist's genres
    const artistGenres = new Set(
      tracks.map((t) => t.genre).filter((g) => g && g !== "Unknown"),
    );
    let score = 0;
    for (const genre of artistGenres) {
      score += genrePrefs.get(genre) ?? 0;
    }
    // Only suggest if there's a genre overlap (score > 0) or if no genre prefs exist yet (show top artists)
    const genrePrefsEmpty = genrePrefs.size === 0;
    if (!genrePrefsEmpty && score === 0) continue;

    // Best track: highest avg rating
    const bestTrack = tracks.reduce((best, t) => {
      const avgA =
        best.ratings.length > 0
          ? best.ratings.reduce((s, r) => s + Number(r.score), 0) /
            best.ratings.length
          : 0;
      const avgB =
        t.ratings.length > 0
          ? t.ratings.reduce((s, r) => s + Number(r.score), 0) /
            t.ratings.length
          : 0;
      return avgB > avgA ? t : best;
    });

    // Most common genre for this artist
    const genreCount = new Map<string, number>();
    for (const t of tracks) {
      if (t.genre && t.genre !== "Unknown") {
        genreCount.set(t.genre, (genreCount.get(t.genre) ?? 0) + 1);
      }
    }
    const topGenre =
      [...genreCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";

    suggestions.push({
      ownerId: bestTrack.ownerId,
      artistName: bestTrack.artist,
      topGenre,
      coverUrl: bestTrack.coverKey ? bestTrack.coverKey.getDirectURL() : null,
      score,
    });
  }

  // Sort by score desc, take top 6
  suggestions.sort((a, b) => b.score - a.score);
  const topSuggestions = suggestions.slice(0, 6);

  if (chartsLoading || topSuggestions.length === 0) return null;

  const handleFollowed = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      data-ocid="following.discover.section"
      className="space-y-4"
    >
      {/* Divider + heading */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/8 border border-gold/15">
          <Sparkles className="h-3.5 w-3.5 text-gold/80" />
          <span className="text-xs font-ui font-semibold text-gold/80 uppercase tracking-widest">
            Discover
          </span>
          <Compass className="h-3.5 w-3.5 text-gold/80" />
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      </div>

      <div className="rounded-xl border border-gold/12 bg-gold/3 p-5 space-y-4">
        <div>
          <h2 className="font-display font-bold text-xl text-foreground">
            Discover Artists
          </h2>
          <p className="text-sm text-muted-foreground font-ui mt-0.5">
            Based on the genres you already love
          </p>
        </div>

        {/* Horizontal scroll on mobile, grid on larger screens */}
        <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible no-scrollbar">
          <AnimatePresence mode="popLayout">
            {topSuggestions.map((suggestion, idx) => (
              <DiscoverArtistCard
                key={suggestion.ownerId.toString()}
                suggestion={suggestion}
                index={idx}
                onFollowed={handleFollowed}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
}

/* ── Following Page ──────────────────────────────────── */
export function FollowingPage() {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return (
    <main className="container py-8 space-y-6" data-ocid="following.page">
      {/* Hero header */}
      <div className="relative rounded-2xl overflow-hidden border border-gold/15">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.78 0.17 72 / 0.5) 0%, transparent 70%)",
          }}
        />
        <div className="relative px-6 py-8 sm:px-10 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-3"
          >
            <Badge className="bg-gold/20 text-gold border-gold/30 font-ui font-semibold">
              <Rss className="h-3 w-3 mr-1" />
              Your Feed
            </Badge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-4xl sm:text-5xl font-black tracking-tight"
          >
            <span className="text-gold glow-text-gold">Following</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-muted-foreground font-ui max-w-lg"
          >
            Latest drops from artists you follow — sorted newest first.
          </motion.p>
        </div>
      </div>

      {/* Auth gate */}
      {!isAuthenticated ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center justify-center min-h-[40vh] gap-6 rounded-xl border border-border bg-card p-12 text-center"
          data-ocid="following.empty_state"
        >
          <div className="h-16 w-16 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20">
            <LogIn className="h-7 w-7 text-gold/70" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-bold text-2xl text-foreground">
              Sign in to see your feed
            </h2>
            <p className="text-muted-foreground font-ui max-w-sm text-sm">
              Follow artists and get a personalized feed of their latest AI
              music drops.
            </p>
          </div>
          <Button
            onClick={login}
            disabled={isLoggingIn}
            className="gap-2 bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30 font-ui font-bold px-6"
            data-ocid="nav.login.button"
          >
            {isLoggingIn ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {isLoggingIn ? "Signing in…" : "Sign In"}
          </Button>
        </motion.div>
      ) : (
        <>
          <FollowingFeed />
          <DiscoverSection />
        </>
      )}
    </main>
  );
}
