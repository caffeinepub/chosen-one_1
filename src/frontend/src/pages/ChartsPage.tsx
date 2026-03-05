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
  Award,
  Crown,
  Flame,
  Globe,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  Music2,
  Pause,
  Play,
  PlayCircle,
  Search,
  Send,
  Star,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
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
  useTopThreeTracks,
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

/* ── Reward Badge ─────────────────────────────────────── */
function RewardBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-ui font-bold border shrink-0"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.78 0.17 72 / 0.25), oklch(0.70 0.20 60 / 0.15))",
          borderColor: "oklch(0.78 0.17 72 / 0.5)",
          color: "oklch(0.85 0.18 72)",
          boxShadow:
            "0 0 12px oklch(0.78 0.17 72 / 0.35), 0 0 4px oklch(0.78 0.17 72 / 0.2)",
          animation: "reward-badge-pulse 2s ease-in-out infinite",
        }}
        title="Crown Champion — #1 on the charts!"
      >
        <Crown className="h-3 w-3" />
        Crown Champion
      </motion.span>
    );
  }
  if (rank === 2) {
    return (
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
          delay: 0.05,
        }}
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-ui font-bold border shrink-0"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.75 0.02 260 / 0.25), oklch(0.65 0.03 250 / 0.15))",
          borderColor: "oklch(0.75 0.03 260 / 0.5)",
          color: "oklch(0.85 0.03 260)",
          boxShadow: "0 0 8px oklch(0.75 0.03 260 / 0.2)",
          animation: "reward-badge-shimmer 3s ease-in-out infinite",
        }}
        title="Rising Star — #2 on the charts!"
      >
        <Star className="h-3 w-3" />
        Rising Star
      </motion.span>
    );
  }
  if (rank === 3) {
    return (
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-ui font-bold border shrink-0"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.68 0.13 50 / 0.25), oklch(0.62 0.15 45 / 0.15))",
          borderColor: "oklch(0.68 0.13 50 / 0.5)",
          color: "oklch(0.78 0.14 50)",
          boxShadow: "0 0 8px oklch(0.68 0.13 50 / 0.2)",
        }}
        title="On Fire — #3 on the charts!"
      >
        <Flame className="h-3 w-3" />
        On Fire
      </motion.span>
    );
  }
  return null;
}

/* ── Distribution Modal ──────────────────────────────── */
function DistributionModal({
  open,
  onClose,
  trackTitle,
  rank,
}: {
  open: boolean;
  onClose: () => void;
  trackTitle: string;
  artistName?: string;
  rank: number;
}) {
  const encouragements: Record<
    number,
    { headline: string; body: string; icon: React.ReactNode }
  > = {
    1: {
      headline: "You're #1 — Keep Dominating!",
      body: "The crown looks great on you. Your AI music is making waves and the community is voting loud. Stay consistent, keep creating, and your legacy is just getting started.",
      icon: (
        <Crown className="h-12 w-12" style={{ color: "oklch(0.85 0.18 72)" }} />
      ),
    },
    2: {
      headline: "You're Rising Fast!",
      body: "Silver is nothing to sleep on. You're right behind the top spot and the gap is closing. Keep pushing — #1 is within reach.",
      icon: <Star className="h-12 w-12 text-slate-300" />,
    },
    3: {
      headline: "On Fire and Climbing!",
      body: "Top 3 out of everyone — that's a serious achievement. The votes are coming in and your sound is resonating. Don't stop now.",
      icon: <Flame className="h-12 w-12 text-orange-400" />,
    },
  };

  const msg = encouragements[rank] ?? encouragements[3];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="bg-card border-border max-w-sm text-center"
        data-ocid="distribution.dialog"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, type: "spring" }}
          className="flex flex-col items-center gap-4 py-4"
        >
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 18,
              delay: 0.05,
            }}
          >
            {msg.icon}
          </motion.div>

          <div className="space-y-2">
            <h3 className="font-display font-bold text-xl text-foreground">
              {msg.headline}
            </h3>
            <p className="text-sm text-muted-foreground font-ui leading-relaxed">
              {msg.body}
            </p>
          </div>

          <div
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-ui font-semibold"
            style={{
              background:
                rank === 1
                  ? "oklch(0.78 0.17 72 / 0.12)"
                  : rank === 2
                    ? "oklch(0.75 0.02 260 / 0.12)"
                    : "oklch(0.68 0.13 50 / 0.12)",
              border:
                rank === 1
                  ? "1px solid oklch(0.78 0.17 72 / 0.3)"
                  : rank === 2
                    ? "1px solid oklch(0.75 0.03 260 / 0.3)"
                    : "1px solid oklch(0.68 0.13 50 / 0.3)",
              color:
                rank === 1
                  ? "oklch(0.85 0.18 72)"
                  : rank === 2
                    ? "oklch(0.85 0.03 260)"
                    : "oklch(0.78 0.14 50)",
            }}
          >
            <Award className="h-4 w-4" />
            {trackTitle} — #{rank} on the charts
          </div>

          <Button
            type="button"
            onClick={onClose}
            className="font-ui font-bold w-full mt-1"
            data-ocid="distribution.close_button"
          >
            Keep Going!
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Distribution CTA Bar ────────────────────────────── */
function DistributionCTABar({
  rank,
  trackTitle,
  artistName,
}: {
  rank: number;
  trackTitle: string;
  artistName: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  if (rank === 1) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-4 mb-3 rounded-lg px-4 py-2.5 flex items-center gap-3 flex-wrap"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.78 0.17 72 / 0.15), oklch(0.70 0.20 60 / 0.08))",
            border: "1px solid oklch(0.78 0.17 72 / 0.35)",
            boxShadow: "0 0 20px oklch(0.78 0.17 72 / 0.1)",
          }}
          data-ocid="distribution.cta.card"
        >
          <Crown
            className="h-4 w-4 shrink-0"
            style={{ color: "oklch(0.85 0.18 72)" }}
          />
          <span
            className="flex-1 text-sm font-ui font-bold min-w-0"
            style={{ color: "oklch(0.85 0.18 72)" }}
          >
            #1 Chart-Topper — You're making history!
          </span>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(true);
            }}
            className="font-ui font-bold text-xs h-7 shrink-0 gap-1.5"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.78 0.17 72 / 0.35), oklch(0.70 0.20 60 / 0.25))",
              color: "oklch(0.92 0.16 72)",
              border: "1px solid oklch(0.78 0.17 72 / 0.5)",
              boxShadow: "0 0 10px oklch(0.78 0.17 72 / 0.2)",
            }}
            data-ocid="distribution.submit.primary_button"
          >
            <Crown className="h-3 w-3" />
            You're #1!
          </Button>
        </motion.div>
        <DistributionModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          trackTitle={trackTitle}
          artistName={artistName}
          rank={rank}
        />
      </>
    );
  }

  if (rank === 2) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-4 mb-3 rounded-lg px-3 py-2 flex items-center gap-2.5 flex-wrap"
          style={{
            background: "oklch(0.75 0.02 260 / 0.08)",
            border: "1px solid oklch(0.75 0.03 260 / 0.25)",
          }}
          data-ocid="distribution.cta.card"
        >
          <Star
            className="h-3.5 w-3.5 shrink-0"
            style={{ color: "oklch(0.85 0.03 260)" }}
          />
          <span
            className="flex-1 text-xs font-ui font-semibold min-w-0"
            style={{ color: "oklch(0.80 0.03 260)" }}
          >
            Your track is trending — Keep climbing!
          </span>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(true);
            }}
            className="font-ui font-bold text-xs h-6 shrink-0"
            style={{
              background: "oklch(0.75 0.02 260 / 0.2)",
              color: "oklch(0.85 0.03 260)",
              border: "1px solid oklch(0.75 0.03 260 / 0.4)",
            }}
            data-ocid="distribution.submit.secondary_button"
          >
            Keep Going
          </Button>
        </motion.div>
        <DistributionModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          trackTitle={trackTitle}
          artistName={artistName}
          rank={rank}
        />
      </>
    );
  }

  if (rank === 3) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-4 mb-3 rounded-md px-3 py-1.5 flex items-center gap-2 flex-wrap"
          style={{
            background: "oklch(0.68 0.13 50 / 0.06)",
            border: "1px solid oklch(0.68 0.13 50 / 0.2)",
          }}
          data-ocid="distribution.cta.card"
        >
          <Flame
            className="h-3.5 w-3.5 shrink-0"
            style={{ color: "oklch(0.78 0.14 50)" }}
          />
          <span
            className="flex-1 text-xs font-ui font-medium min-w-0"
            style={{ color: "oklch(0.75 0.10 50)" }}
          >
            Rising to the top — You're on fire!
          </span>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(true);
            }}
            className="font-ui font-semibold text-xs h-6 shrink-0"
            style={{
              background: "oklch(0.68 0.13 50 / 0.15)",
              color: "oklch(0.78 0.14 50)",
              border: "1px solid oklch(0.68 0.13 50 / 0.35)",
            }}
            data-ocid="distribution.explore.button"
          >
            Let's Go!
          </Button>
        </motion.div>
        <DistributionModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          trackTitle={trackTitle}
          artistName={artistName}
          rank={rank}
        />
      </>
    );
  }

  return null;
}

function TrackCard({
  entry,
  rank,
  index,
  contextQueue,
  isTop3,
}: {
  entry: AverageRating;
  rank: number;
  index: number;
  contextQueue: QueueTrack[];
  isTop3: boolean;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
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
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.035, duration: 0.3 }}
        data-ocid={ocid}
        className={cn(
          "group relative rounded-xl overflow-hidden cursor-pointer",
          "bg-card border transition-all duration-300",
          isTopTrack
            ? "border-gold/40 shadow-[0_0_32px_oklch(0.78_0.17_72/0.18),0_4px_24px_oklch(0_0_0/0.6)]"
            : rank <= 3
              ? "border-border shadow-[0_4px_24px_oklch(0_0_0/0.5)]"
              : "border-border/50",
          isCurrentTrack
            ? "ring-2 ring-gold/50 shadow-[0_0_28px_oklch(0.78_0.17_72/0.25)]"
            : "hover:border-gold/30 hover:shadow-[0_0_24px_oklch(0.78_0.17_72/0.1),0_8px_32px_oklch(0_0_0/0.5)]",
        )}
      >
        {/* ── Cover Art ─────────────────────────────────────── */}
        <button
          type="button"
          className="relative w-full aspect-[2/3] overflow-hidden bg-secondary w-full p-0 border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/50"
          onClick={handlePlayPause}
          aria-label={
            isPlaying ? `Pause ${track.title}` : `Play ${track.title}`
          }
        >
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={`${track.title} cover`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-background">
              <Music2 className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}

          {/* Dark gradient overlay at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* Top-left: Rank badge */}
          <div className="absolute top-2 left-2 z-10">
            <div
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center text-xs font-display font-black shadow-lg",
                rank === 1
                  ? "bg-gradient-to-br from-yellow-400 to-amber-600 text-black shadow-[0_0_12px_oklch(0.78_0.17_72/0.6)]"
                  : rank === 2
                    ? "bg-gradient-to-br from-slate-300 to-slate-500 text-black"
                    : rank === 3
                      ? "bg-gradient-to-br from-orange-400 to-orange-700 text-white"
                      : "bg-black/60 text-white border border-white/20 backdrop-blur-sm",
              )}
            >
              {rank}
            </div>
          </div>

          {/* Top-right: Reward badge icon (top 3 only) */}
          {isTop3 && rank <= 3 && (
            <div className="absolute top-2 right-2 z-10">
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center shadow-lg",
                  rank === 1
                    ? "bg-yellow-500/90 shadow-[0_0_10px_oklch(0.78_0.17_72/0.5)]"
                    : rank === 2
                      ? "bg-slate-400/90"
                      : "bg-orange-500/90",
                )}
              >
                {rank === 1 && <Crown className="h-3.5 w-3.5 text-black" />}
                {rank === 2 && <Star className="h-3.5 w-3.5 text-black" />}
                {rank === 3 && <Flame className="h-3.5 w-3.5 text-white" />}
              </div>
            </div>
          )}

          {/* Bottom-left: Live listeners (when playing) */}
          {isCurrentTrack && (
            <div
              className="absolute bottom-2 left-2 z-10 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-0.5"
              data-ocid="track.live_listeners.panel"
            >
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
              </span>
              <span className="text-[10px] font-ui font-semibold text-green-400 tabular-nums">
                {listenerCount.toLocaleString()}
              </span>
            </div>
          )}

          {/* Center: Play/Pause overlay (on hover or when current track) */}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
              isCurrentTrack
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100",
            )}
          >
            <div className="bg-black/50 backdrop-blur-sm rounded-full p-3 border border-white/20 shadow-xl">
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-white text-white" />
              ) : (
                <Play className="h-5 w-5 fill-white text-white ml-0.5" />
              )}
            </div>
          </div>
        </button>

        {/* ── Below Cover Info ──────────────────────────────── */}
        <button
          type="button"
          className="p-2.5 space-y-1.5 text-left w-full block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          onClick={() => setDetailOpen(true)}
          aria-label={`Open details for ${track.title}`}
        >
          {/* Title */}
          <h3
            className={cn(
              "font-display font-bold text-sm leading-tight truncate",
              isTopTrack ? "text-gold" : "text-foreground",
            )}
          >
            {track.title}
          </h3>

          {/* Artist */}
          <Link
            to="/artist/$principalId"
            params={{ principalId: track.ownerId.toString() }}
            onClick={(e) => e.stopPropagation()}
            data-ocid="track.artist.link"
            className="text-xs text-muted-foreground font-ui truncate hover:text-gold hover:underline cursor-pointer transition-colors duration-150 block"
          >
            {track.artist}
          </Link>

          {/* Rating row */}
          <div className="flex items-center gap-1.5">
            <StarRating value={Math.round(averageRating)} size="sm" readonly />
            <span className="text-[10px] text-muted-foreground/70 font-ui tabular-nums">
              {averageRating.toFixed(1)}
            </span>
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-1 pt-0.5">
            {/* Like */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleLike(e);
              }}
              disabled={likeMutation.isPending || isOwner}
              data-ocid="track.like.button"
              aria-label={hasLiked ? "Unlike track" : "Like track"}
              className={cn(
                "flex items-center gap-0.5 rounded px-1.5 py-1 text-[10px] font-ui font-semibold transition-all duration-200",
                hasLiked
                  ? "text-red-400 bg-red-500/10"
                  : isOwner
                    ? "text-muted-foreground/30 cursor-default"
                    : "text-muted-foreground hover:text-red-400 hover:bg-red-500/10",
              )}
            >
              <Heart
                className={cn(
                  "h-3 w-3 transition-all duration-200",
                  hasLiked ? "fill-red-400 text-red-400" : "",
                  likeMutation.isPending ? "animate-pulse" : "",
                )}
              />
              <span className="tabular-nums">{likeCount}</span>
            </button>

            {/* Comments count */}
            {commentCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailOpen(true);
                }}
                className="flex items-center gap-0.5 rounded px-1.5 py-1 text-[10px] font-ui text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageCircle className="h-3 w-3" />
                <span className="tabular-nums">{commentCount}</span>
              </button>
            )}

            {/* Request */}
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
                aria-label="Request more music"
                className="flex items-center gap-0.5 rounded px-1.5 py-1 text-[10px] font-ui text-muted-foreground hover:text-gold hover:bg-gold/10 transition-all duration-200"
              >
                <Send className="h-3 w-3" />
              </button>
            )}

            {/* Play button (explicit, separate from cover) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause(e);
              }}
              aria-label={isPlaying ? "Pause" : "Play track"}
              data-ocid="track.play.button"
              className={cn(
                "ml-auto flex items-center justify-center h-6 w-6 rounded-full transition-all duration-200",
                isCurrentTrack
                  ? "bg-gold/20 border border-gold/40 text-gold"
                  : "text-muted-foreground hover:text-gold hover:bg-gold/10 border border-transparent",
              )}
            >
              {isPlaying ? (
                <Pause className="h-2.5 w-2.5 fill-current" />
              ) : (
                <Play className="h-2.5 w-2.5 fill-current ml-px" />
              )}
            </button>
          </div>
        </button>

        {/* Top-1 gold glow border */}
        {isTopTrack && (
          <div className="absolute inset-0 rounded-xl pointer-events-none ring-1 ring-gold/20" />
        )}
      </motion.div>

      {/* ── Detail Dialog ─────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent
          className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto p-0"
          data-ocid="track.detail.dialog"
        >
          {/* Cover + gradient header */}
          <div className="relative h-56 w-full overflow-hidden rounded-t-lg">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={`${track.title} cover`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-background">
                <Music2 className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />

            {/* Rank + reward in overlay */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <RankBadge rank={rank} />
              {isTop3 && rank <= 3 && <RewardBadge rank={rank} />}
            </div>
          </div>

          <div className="px-5 pb-5 pt-2 space-y-4">
            {/* Title + artist */}
            <div className="space-y-1">
              <DialogTitle
                className={cn(
                  "font-display font-black text-xl leading-tight",
                  isTopTrack ? "text-gold" : "text-foreground",
                )}
              >
                {track.title}
              </DialogTitle>
              <Link
                to="/artist/$principalId"
                params={{ principalId: track.ownerId.toString() }}
                onClick={() => setDetailOpen(false)}
                data-ocid="track.detail.artist.link"
                className="text-sm text-muted-foreground font-ui hover:text-gold hover:underline transition-colors"
              >
                {track.artist}
              </Link>
              {locationLabel && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                  <span className="text-xs text-muted-foreground/70 font-ui">
                    {locationLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {track.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {track.description}
              </p>
            )}

            {/* Rating + stats row */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
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
              {commentCount > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground/70">
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span className="text-xs font-ui tabular-nums">
                    {commentCount}
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Play/Pause */}
              <Button
                size="sm"
                onClick={(e) => {
                  handlePlayPause(e);
                }}
                className={cn(
                  "gap-2 font-ui font-bold",
                  isCurrentTrack
                    ? "bg-gold/20 text-gold border border-gold/40 hover:bg-gold/30"
                    : "bg-gold/15 text-gold border border-gold/25 hover:bg-gold/25",
                )}
                data-ocid="track.detail.play.button"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-3.5 w-3.5 fill-current" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" /> Play
                  </>
                )}
              </Button>

              {/* Like */}
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => handleLike(e)}
                disabled={likeMutation.isPending || isOwner}
                className={cn(
                  "gap-2 font-ui",
                  hasLiked
                    ? "text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20"
                    : "border-border",
                )}
                data-ocid="track.detail.like.button"
              >
                <Heart
                  className={cn(
                    "h-3.5 w-3.5",
                    hasLiked ? "fill-red-400 text-red-400" : "",
                  )}
                />
                {likeCount}
              </Button>

              {/* Request */}
              {!isOwner && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error("Sign in to request music");
                      return;
                    }
                    setDetailOpen(false);
                    setRequestOpen(true);
                  }}
                  className="gap-2 font-ui border-border"
                  data-ocid="track.detail.request.open_modal_button"
                >
                  <Send className="h-3.5 w-3.5" />
                  Request
                </Button>
              )}

              {/* Live listeners */}
              {isCurrentTrack && (
                <div
                  className="flex items-center gap-1.5 ml-auto"
                  data-ocid="track.live_listeners.panel"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <span className="text-xs font-ui font-semibold text-green-400 tabular-nums">
                    {listenerCount.toLocaleString()} listening
                  </span>
                </div>
              )}
            </div>

            {/* Distribution CTA — only for owner when in top 3 */}
            {isTop3 && rank <= 3 && isOwner && (
              <DistributionCTABar
                rank={rank}
                trackTitle={track.title}
                artistName={track.artist}
              />
            )}

            {/* Rate widget */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3 flex-wrap pt-1">
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
                  className="ml-1 bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30 font-ui font-bold"
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
        </DialogContent>
      </Dialog>

      {/* ── Request Music Dialog ──────────────────────────── */}
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
    </>
  );
}

function TrackSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Cover skeleton — 2/3 aspect ratio */}
      <Skeleton className="w-full aspect-[2/3] rounded-none" />
      {/* Info below */}
      <div className="p-2.5 space-y-2">
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
        <div className="flex gap-1 pt-0.5">
          <Skeleton className="h-5 w-10 rounded" />
          <Skeleton className="h-5 w-8 rounded" />
        </div>
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
  searchQuery,
}: {
  windowType: string;
  locationScope: LocationScope;
  locationValue: string;
  selectedGenre: string | null;
  searchQuery: string;
}) {
  const player = usePlayer();

  // Top 3 global track IDs for reward badges
  const top3Query = useTopThreeTracks();
  const top3Ids = new Set((top3Query.data ?? []).map((e) => e.track.id));

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
  let refetchFn: () => void;

  if (locationScope !== "nationwide") {
    data = locationQuery.data;
    isLoading = locationQuery.isLoading;
    isError = locationQuery.isError && !locationQuery.data;
    refetchFn = locationQuery.refetch;
  } else if (windowType === "alltime") {
    data = allTimeQuery.data;
    isLoading = allTimeQuery.isLoading;
    isError = allTimeQuery.isError && !allTimeQuery.data;
    refetchFn = allTimeQuery.refetch;
  } else {
    data = windowQuery.data;
    isLoading = windowQuery.isLoading;
    isError = windowQuery.isError && !windowQuery.data;
    refetchFn = windowQuery.refetch;
  }

  // Cap at 100
  const charts = (data ?? []).slice(0, 100);

  const genreFiltered =
    selectedGenre == null
      ? charts
      : charts.filter(
          (entry) =>
            entry.track.genre === selectedGenre ||
            (selectedGenre === "Unknown" && entry.track.genre === "Unknown"),
        );

  const q = searchQuery.trim().toLowerCase();
  const filteredCharts = q
    ? genreFiltered.filter(
        (entry) =>
          entry.track.title.toLowerCase().includes(q) ||
          entry.track.artist.toLowerCase().includes(q),
      )
    : genreFiltered;

  const queueTracks = filteredCharts.map(toQueueTrack);

  if (isLoading) {
    return (
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
        data-ocid="charts.loading_state"
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <TrackSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3"
        data-ocid="charts.error_state"
      >
        <p className="text-destructive font-ui font-semibold">
          Could not load charts right now
        </p>
        <p className="text-muted-foreground text-sm font-ui">
          This can happen if the network is slow. Try again in a moment.
        </p>
        <button
          type="button"
          onClick={refetchFn}
          data-ocid="charts.retry.button"
          className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-ui font-semibold text-destructive hover:bg-destructive/20 transition-colors"
        >
          Retry
        </button>
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
          <h3 className="font-display font-bold text-lg">No tracks match</h3>
          <p className="text-muted-foreground text-sm font-ui">
            {q
              ? "Try a different search term, genre, or location"
              : "Try a different genre or location"}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4" data-ocid="charts.list">
      {/* Play All button */}
      <div className="flex justify-end">
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

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
              isTop3={top3Ids.has(entry.track.id)}
            />
          );
        })}
      </div>
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
  const [searchQuery, setSearchQuery] = useState<string>("");

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

      {/* ── Search Bar ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search tracks or artists…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 bg-secondary border-border focus:border-gold/50 font-ui"
            data-ocid="charts.search.input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
              data-ocid="charts.search.clear_button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Chart heading ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
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
          {searchQuery.trim() && (
            <span className="text-muted-foreground font-normal text-base ml-1">
              · "{searchQuery.trim()}"
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
        searchQuery={searchQuery}
      />
    </main>
  );
}
