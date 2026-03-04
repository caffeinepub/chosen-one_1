import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  Globe,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  Music2,
  Pause,
  Play,
  PlayCircle,
  Send,
  TrendingUp,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { AverageRating } from "../backend.d";
import { CommentsSection } from "../components/CommentsSection";
import { StarRating } from "../components/StarRating";
import { type QueueTrack, usePlayer } from "../contexts/PlayerContext";
import { useGlobalListeners } from "../hooks/useGlobalListeners";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useLiveListeners } from "../hooks/useLiveListeners";
import {
  useCharts,
  useChartsFilteredByLocation,
  useChartsInWindow,
  useCommentCount,
  useLikeTrack,
  useRateTrack,
  useSendMusicRequest,
} from "../hooks/useQueries";

function toQueueTrack(entry: AverageRating): QueueTrack {
  return {
    id: entry.track.id,
    title: entry.track.title,
    artist: entry.track.artist,
    audioUrl: entry.track.audioFileKey.getDirectURL(),
    coverUrl: entry.track.coverKey?.getDirectURL(),
  };
}

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
] as const;

const US_REGIONS = [
  "Northeast",
  "Southeast",
  "Midwest",
  "Southwest",
  "West",
  "Mid-Atlantic",
  "Pacific Northwest",
] as const;

const GENRES = [
  "Hip-Hop",
  "Electronic",
  "Pop",
  "Ambient",
  "Classical",
  "Jazz",
  "Rock",
  "R&B",
  "Other",
] as const;

type TimePeriod = "daily" | "weekly" | "monthly" | "alltime";
type LocationScope = "nationwide" | "region" | "state" | "city";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="rank-badge-1 h-8 w-8 rounded-full flex items-center justify-center text-sm font-display font-black shrink-0">
        1
      </div>
    );
  if (rank === 2)
    return (
      <div className="rank-badge-2 h-8 w-8 rounded-full flex items-center justify-center text-sm font-display font-black shrink-0">
        2
      </div>
    );
  if (rank === 3)
    return (
      <div className="rank-badge-3 h-8 w-8 rounded-full flex items-center justify-center text-sm font-display font-black shrink-0">
        3
      </div>
    );
  return (
    <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-display font-bold text-muted-foreground border border-border shrink-0">
      {rank}
    </div>
  );
}

function TrackCard({
  entry,
  rank,
  index,
  contextQueue,
}: {
  entry: AverageRating;
  rank: number;
  index: number;
  contextQueue: QueueTrack[];
}) {
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
  const player = usePlayer();

  const { track, averageRating } = entry;
  const coverUrl = track.coverKey?.getDirectURL();
  const ratingCount = track.ratings.length;
  const isTopTrack = rank === 1;
  const commentCount = useCommentCount(track.id);

  const queueTrack = toQueueTrack(entry);
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

  const likeCount = track.likes.length;
  const hasLiked = callerPrincipal
    ? track.likes.some((p) => p.toString() === callerPrincipal)
    : false;
  const isOwner = callerPrincipal
    ? track.ownerId.toString() === callerPrincipal
    : false;

  const listenerCount = useLiveListeners(track.id);

  const ocid = `charts.item.${index + 1}`;

  const locationLabel =
    track.city && track.state
      ? `${track.city}, ${track.state}`
      : track.city || track.state || null;

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
          isTopTrack
            ? "border-gold/30 shadow-[0_0_40px_oklch(0.78_0.17_72/0.12),0_2px_20px_oklch(0_0_0/0.5)]"
            : "border-border",
          "hover:border-gold/25 hover:shadow-[0_0_30px_oklch(0.78_0.17_72/0.08),0_4px_32px_oklch(0_0_0/0.4)]",
          expanded && !isTopTrack && "border-gold/20",
        )}
      >
        {isTopTrack && (
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-gold via-gold/80 to-transparent rounded-l-xl" />
        )}

        {/* Header row */}
        <div className="w-full flex items-center gap-3 p-4">
          {/* Clickable left portion — expand/collapse */}
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
            aria-expanded={expanded}
          >
            <RankBadge rank={rank} />

            {/* Album art */}
            <div
              className={cn(
                "h-14 w-14 rounded-lg overflow-hidden shrink-0 bg-secondary border transition-all duration-300",
                isTopTrack
                  ? "border-gold/40 shadow-[0_0_12px_oklch(0.78_0.17_72/0.25)]"
                  : "border-border group-hover:border-gold/20",
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

            {/* Title, artist & location */}
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  "font-display font-bold truncate text-base leading-tight",
                  isTopTrack ? "text-gold" : "text-foreground",
                )}
              >
                {track.title}
              </h3>
              <Link
                to="/artist/$principalId"
                params={{ principalId: track.ownerId.toString() }}
                onClick={(e) => e.stopPropagation()}
                data-ocid="track.artist.link"
                className="text-sm text-muted-foreground font-ui truncate mt-0.5 hover:text-gold hover:underline cursor-pointer transition-colors duration-150 block"
              >
                {track.artist}
              </Link>
              {locationLabel && (
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                  <span className="text-xs text-muted-foreground/70 font-ui truncate">
                    {locationLabel}
                  </span>
                </div>
              )}
            </div>
          </button>

          {/* Right section — rating, likes, request, expand */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Rating */}
            <div className="flex flex-col items-end gap-0.5 shrink-0 hidden sm:flex">
              <StarRating
                value={Math.round(averageRating)}
                size="sm"
                readonly
              />
              <span className="text-xs text-muted-foreground font-ui tabular-nums">
                {averageRating.toFixed(1)} · {ratingCount}{" "}
                {ratingCount === 1 ? "rating" : "ratings"}
              </span>
            </div>

            {/* Comment count pill */}
            {commentCount > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground/70 shrink-0">
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="text-xs font-ui tabular-nums">
                  {commentCount}
                </span>
              </div>
            )}

            {/* Live listeners badge — only when this track is the current one */}
            {isCurrentTrack && (
              <div
                className="flex items-center gap-1.5 shrink-0"
                data-ocid="track.live_listeners.panel"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-xs font-ui font-semibold text-green-400 tabular-nums whitespace-nowrap">
                  {listenerCount.toLocaleString()} listening
                </span>
              </div>
            )}

            {/* Like button */}
            <button
              type="button"
              onClick={handleLike}
              disabled={likeMutation.isPending || isOwner}
              data-ocid="track.like.button"
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

            {/* Request More button — only for non-owners */}
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
                data-ocid="track.request.open_modal_button"
                aria-label="Request more music from this artist"
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-ui font-semibold text-muted-foreground hover:text-gold hover:bg-gold/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
              >
                <Send className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Request</span>
              </button>
            )}

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
                      data-ocid="track.rate.submit_button"
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
          data-ocid="track.request.dialog"
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
              data-ocid="track.request.textarea"
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
              data-ocid="track.request.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSendRequest}
              disabled={!requestMessage.trim() || sendRequestMutation.isPending}
              className="bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30 font-ui font-bold gap-2"
              data-ocid="track.request.submit_button"
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

function TrackSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <Skeleton className="h-14 w-14 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
  ocid,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ocid: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-ocid={ocid}
      className={cn(
        "shrink-0 inline-flex items-center rounded-full px-4 py-1.5 text-sm font-ui font-semibold border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
        active
          ? "bg-gold/20 text-gold border-gold/40 shadow-[0_0_12px_oklch(0.78_0.17_72/0.15)]"
          : "bg-secondary text-muted-foreground border-border hover:border-gold/25 hover:text-foreground",
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function ChartsList({
  windowType,
  locationScope,
  locationValue,
  selectedGenre,
}: {
  windowType: string;
  locationScope: LocationScope;
  locationValue: string;
  selectedGenre: string | null;
}) {
  const player = usePlayer();

  // Decide which query to use
  const allTimeQuery = useCharts();
  const windowQuery = useChartsInWindow(
    windowType !== "alltime" ? windowType : "daily",
  );
  const locationQuery = useChartsFilteredByLocation(
    windowType !== "alltime" ? windowType : "daily",
    locationScope,
    locationValue,
  );

  let data: AverageRating[] | undefined;
  let isLoading: boolean;
  let isError: boolean;

  if (locationScope !== "nationwide") {
    data = locationQuery.data;
    isLoading = locationQuery.isLoading;
    isError = locationQuery.isError;
  } else if (windowType === "alltime") {
    data = allTimeQuery.data;
    isLoading = allTimeQuery.isLoading;
    isError = allTimeQuery.isError;
  } else {
    data = windowQuery.data;
    isLoading = windowQuery.isLoading;
    isError = windowQuery.isError;
  }

  // Cap at 100
  const charts = (data ?? []).slice(0, 100);

  const filteredCharts =
    selectedGenre == null
      ? charts
      : charts.filter(
          (entry) =>
            entry.track.genre === selectedGenre ||
            (selectedGenre === "Unknown" && entry.track.genre === "Unknown"),
        );

  const queueTracks = filteredCharts.map(toQueueTrack);

  if (isLoading) {
    return (
      <div className="space-y-3" data-ocid="charts.loading_state">
        {[1, 2, 3, 4, 5].map((i) => (
          <TrackSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
        data-ocid="charts.error_state"
      >
        <p className="text-destructive font-ui">Failed to load charts</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[30vh] gap-4 rounded-xl border border-border bg-card p-12 text-center"
        data-ocid="charts.empty_state"
      >
        <div className="h-16 w-16 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20">
          <Music2 className="h-7 w-7 text-gold" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display font-bold text-xl">No tracks yet</h3>
          <p className="text-muted-foreground text-sm font-ui">
            Be the first to upload your AI music
          </p>
        </div>
      </motion.div>
    );
  }

  if (filteredCharts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[20vh] gap-4 rounded-xl border border-border bg-card p-10 text-center"
        data-ocid="charts.empty_state"
      >
        <div className="h-14 w-14 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20">
          <Music2 className="h-6 w-6 text-gold" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display font-bold text-lg">
            No tracks match this filter
          </h3>
          <p className="text-muted-foreground text-sm font-ui">
            Try a different genre or location
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3" data-ocid="charts.list">
      {/* Play All button */}
      <div className="flex justify-end mb-1">
        <Button
          size="sm"
          onClick={() => player.playAll(queueTracks)}
          data-ocid="charts.play_all.button"
          className="gap-2 bg-gold/15 text-gold hover:bg-gold/25 border border-gold/25 font-ui font-bold text-xs h-8"
        >
          <PlayCircle className="h-3.5 w-3.5" />
          Play All ({filteredCharts.length})
        </Button>
      </div>

      {filteredCharts.map((entry, idx) => {
        const originalRank =
          charts.findIndex((c) => c.track.id === entry.track.id) + 1;
        return (
          <TrackCard
            key={entry.track.id}
            entry={entry}
            rank={originalRank}
            index={idx}
            contextQueue={queueTracks}
          />
        );
      })}
    </div>
  );
}

export function ChartsPage() {
  const globalListeners = useGlobalListeners();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("daily");
  const [locationScope, setLocationScope] =
    useState<LocationScope>("nationwide");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [cityInput, setCityInput] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  // Derive the location value to pass to the query
  const locationValue =
    locationScope === "region"
      ? selectedRegion
      : locationScope === "state"
        ? selectedState
        : locationScope === "city"
          ? cityInput
          : "";

  const windowType =
    timePeriod === "alltime"
      ? "alltime"
      : timePeriod === "daily"
        ? "daily"
        : timePeriod === "weekly"
          ? "weekly"
          : "monthly";

  const periodLabels: Record<TimePeriod, string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    alltime: "All Time",
  };

  return (
    <main className="container py-8 space-y-6">
      {/* Hero header */}
      <div className="relative rounded-2xl overflow-hidden border border-gold/15">
        <img
          src="/assets/generated/hero-bg.dim_1600x900.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative px-6 py-8 sm:px-10 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-3 flex-wrap"
          >
            <Badge className="bg-gold/20 text-gold border-gold/30 font-ui font-semibold">
              <TrendingUp className="h-3 w-3 mr-1" />
              Live Charts
            </Badge>
            <Badge className="bg-secondary text-muted-foreground border-border font-ui font-semibold">
              Top 100
            </Badge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-4xl sm:text-5xl font-black tracking-tight"
          >
            <span className="text-gold glow-text-gold">AI Music</span>
            <br />
            <span className="text-foreground">Charts</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-muted-foreground font-ui max-w-lg"
          >
            The exclusive leaderboard for AI-generated music. Drop your track,
            get rated by the community, claim the throne.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-5 inline-flex items-center gap-2.5 rounded-full bg-black/30 border border-green-500/30 backdrop-blur-sm px-4 py-2"
            data-ocid="charts.global_listeners.panel"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <Users className="h-3.5 w-3.5 text-green-400 shrink-0" />
            <span className="text-sm font-ui font-semibold text-green-300">
              <span className="tabular-nums">
                {globalListeners.toLocaleString()}
              </span>
              <span className="text-green-400/80">
                {" "}
                people listening right now
              </span>
            </span>
          </motion.div>
        </div>
      </div>

      {/* ── Time Period Tabs ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="space-y-1"
      >
        <p className="text-xs text-muted-foreground font-ui font-semibold uppercase tracking-wider px-0.5">
          Time Period
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <FilterPill
            active={timePeriod === "daily"}
            onClick={() => setTimePeriod("daily")}
            ocid="charts.daily.tab"
          >
            Daily
          </FilterPill>
          <FilterPill
            active={timePeriod === "weekly"}
            onClick={() => setTimePeriod("weekly")}
            ocid="charts.weekly.tab"
          >
            Weekly
          </FilterPill>
          <FilterPill
            active={timePeriod === "monthly"}
            onClick={() => setTimePeriod("monthly")}
            ocid="charts.monthly.tab"
          >
            Monthly
          </FilterPill>
          <FilterPill
            active={timePeriod === "alltime"}
            onClick={() => setTimePeriod("alltime")}
            ocid="charts.alltime.tab"
          >
            All Time
          </FilterPill>
        </div>
      </motion.div>

      {/* ── Geographic Scope ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="space-y-2"
      >
        <p className="text-xs text-muted-foreground font-ui font-semibold uppercase tracking-wider px-0.5">
          Location
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <FilterPill
            active={locationScope === "nationwide"}
            onClick={() => setLocationScope("nationwide")}
            ocid="charts.nationwide.tab"
          >
            <Globe className="h-3.5 w-3.5 mr-1.5" />
            Nationwide
          </FilterPill>
          <FilterPill
            active={locationScope === "region"}
            onClick={() => setLocationScope("region")}
            ocid="charts.region.tab"
          >
            By Region
          </FilterPill>
          <FilterPill
            active={locationScope === "state"}
            onClick={() => setLocationScope("state")}
            ocid="charts.state.tab"
          >
            By State
          </FilterPill>
          <FilterPill
            active={locationScope === "city"}
            onClick={() => setLocationScope("city")}
            ocid="charts.city.tab"
          >
            <MapPin className="h-3.5 w-3.5 mr-1.5" />
            By City
          </FilterPill>
        </div>

        {/* Location sub-selectors */}
        <AnimatePresence mode="wait">
          {locationScope === "region" && (
            <motion.div
              key="region-select"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger
                  className="w-full sm:w-64 bg-secondary border-border focus:border-gold/50 font-ui"
                  data-ocid="charts.region.select"
                >
                  <SelectValue placeholder="Select a region…" />
                </SelectTrigger>
                <SelectContent>
                  {US_REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}

          {locationScope === "state" && (
            <motion.div
              key="state-select"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger
                  className="w-full sm:w-64 bg-secondary border-border focus:border-gold/50 font-ui"
                  data-ocid="charts.state.select"
                >
                  <SelectValue placeholder="Select a state…" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {US_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}

          {locationScope === "city" && (
            <motion.div
              key="city-input"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Input
                placeholder="Enter city name…"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                className="w-full sm:w-64 bg-secondary border-border focus:border-gold/50 font-ui"
                data-ocid="charts.city.input"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Genre Filter ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className="space-y-1"
      >
        <p className="text-xs text-muted-foreground font-ui font-semibold uppercase tracking-wider px-0.5">
          Genre
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <FilterPill
            active={selectedGenre === null}
            onClick={() => setSelectedGenre(null)}
            ocid="charts.genre.tab"
          >
            All
          </FilterPill>
          {GENRES.map((g, i) => (
            <FilterPill
              key={g}
              active={selectedGenre === g}
              onClick={() => setSelectedGenre(selectedGenre === g ? null : g)}
              ocid={`charts.genre.tab.${i + 1}`}
            >
              {g}
            </FilterPill>
          ))}
        </div>
      </motion.div>

      {/* ── Chart heading ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.18 }}
        className="flex items-center justify-between"
      >
        <h2 className="font-display font-bold text-lg text-foreground">
          Top 100 —{" "}
          <span className="text-gold">{periodLabels[timePeriod]}</span>
          {locationScope !== "nationwide" && locationValue && (
            <span className="text-muted-foreground font-normal text-base ml-1">
              · {locationValue}
            </span>
          )}
          {selectedGenre && (
            <span className="text-muted-foreground font-normal text-base ml-1">
              · {selectedGenre}
            </span>
          )}
        </h2>
      </motion.div>

      {/* ── Charts list ──────────────────────────────────── */}
      <ChartsList
        windowType={windowType}
        locationScope={locationScope}
        locationValue={locationValue}
        selectedGenre={selectedGenre}
      />
    </main>
  );
}
