import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2, Music2, TrendingUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { AverageRating } from "../backend.d";
import { AudioPlayer } from "../components/AudioPlayer";
import { StarRating } from "../components/StarRating";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCharts } from "../hooks/useQueries";
import { useRateTrack } from "../hooks/useQueries";

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
}: {
  entry: AverageRating;
  rank: number;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const rateMutation = useRateTrack();

  const { track, averageRating } = entry;
  const coverUrl = track.coverKey?.getDirectURL();
  const audioUrl = track.audioFileKey.getDirectURL();
  const ratingCount = track.ratings.length;
  const isTopTrack = rank === 1;

  const ocid = `charts.item.${index + 1}`;

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
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
        {/* #1 track: thin gold top bar instead of a top-edge stripe — using left accent */}
        {isTopTrack && (
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-gold via-gold/80 to-transparent rounded-l-xl" />
        )}

        {/* Header row */}
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="w-full flex items-center gap-3 p-4 text-left"
          aria-expanded={expanded}
        >
          <RankBadge rank={rank} />

          {/* Album art — 56×56 for musical presence */}
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

          {/* Title & artist */}
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                "font-display font-bold truncate text-base leading-tight",
                isTopTrack ? "text-gold" : "text-foreground",
              )}
            >
              {track.title}
            </h3>
            <p className="text-sm text-muted-foreground font-ui truncate mt-0.5">
              {track.artist}
            </p>
          </div>

          {/* Rating */}
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <StarRating value={Math.round(averageRating)} size="sm" readonly />
            <span className="text-xs text-muted-foreground font-ui tabular-nums">
              {averageRating.toFixed(1)} · {ratingCount}{" "}
              {ratingCount === 1 ? "rating" : "ratings"}
            </span>
          </div>

          {/* Expand icon */}
          <div
            className="text-muted-foreground ml-1 shrink-0 transition-transform duration-200"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <ChevronDown className="h-4 w-4" />
          </div>
        </button>

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
                {/* Audio player */}
                <AudioPlayer src={audioUrl} />

                {/* Description */}
                {track.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {track.description}
                  </p>
                )}

                {/* Rating widget */}
                {isAuthenticated ? (
                  <div className="flex items-center gap-3 pt-1">
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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

export function ChartsPage() {
  const { data: charts, isLoading, isError } = useCharts();

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
            className="flex items-center gap-2 mb-3"
          >
            <Badge className="bg-gold/20 text-gold border-gold/30 font-ui font-semibold">
              <TrendingUp className="h-3 w-3 mr-1" />
              Live Charts
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
        </div>
      </div>

      {/* Charts list */}
      {isLoading ? (
        <div className="space-y-3" data-ocid="charts.loading_state">
          {[1, 2, 3, 4, 5].map((i) => (
            <TrackSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
          data-ocid="charts.error_state"
        >
          <p className="text-destructive font-ui">Failed to load charts</p>
        </div>
      ) : !charts || charts.length === 0 ? (
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
      ) : (
        <div className="space-y-3" data-ocid="charts.list">
          {charts.map((entry, i) => (
            <TrackCard
              key={entry.track.id}
              entry={entry}
              rank={i + 1}
              index={i}
            />
          ))}
        </div>
      )}
    </main>
  );
}
