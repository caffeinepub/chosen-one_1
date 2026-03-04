import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MapPin, Star, Trophy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { LocationEntry } from "../hooks/useQueries";
import { useLeaderboardData } from "../hooks/useQueries";

type TimePeriod = "daily" | "weekly" | "monthly" | "alltime";
type LocationTab = "cities" | "states";

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

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="rank-badge-1 h-9 w-9 rounded-full flex items-center justify-center text-sm font-display font-black shrink-0">
        1
      </div>
    );
  if (rank === 2)
    return (
      <div className="rank-badge-2 h-9 w-9 rounded-full flex items-center justify-center text-sm font-display font-black shrink-0">
        2
      </div>
    );
  if (rank === 3)
    return (
      <div className="rank-badge-3 h-9 w-9 rounded-full flex items-center justify-center text-sm font-display font-black shrink-0">
        3
      </div>
    );
  return (
    <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-display font-bold text-muted-foreground border border-border shrink-0">
      {rank}
    </div>
  );
}

function LeaderboardRow({
  entry,
  rank,
  index,
}: {
  entry: LocationEntry;
  rank: number;
  index: number;
}) {
  const isTop = rank === 1;
  const ocid = `leaderboard.item.${index + 1}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      data-ocid={ocid}
      className={cn(
        "relative rounded-xl border bg-card transition-all duration-300 overflow-hidden",
        isTop
          ? "border-gold/30 shadow-[0_0_40px_oklch(0.78_0.17_72/0.12),0_2px_20px_oklch(0_0_0/0.5)]"
          : "border-border hover:border-gold/25 hover:shadow-[0_0_20px_oklch(0.78_0.17_72/0.07),0_2px_16px_oklch(0_0_0/0.3)]",
      )}
    >
      {isTop && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-gold via-gold/80 to-transparent rounded-l-xl" />
      )}

      <div className="flex items-center gap-4 p-4">
        <RankBadge rank={rank} />

        {/* Location icon */}
        <div
          className={cn(
            "h-11 w-11 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-300",
            isTop ? "bg-gold/15 border-gold/40" : "bg-secondary border-border",
          )}
        >
          <MapPin
            className={cn(
              "h-5 w-5",
              isTop ? "text-gold" : "text-muted-foreground",
            )}
          />
        </div>

        {/* Location info */}
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "font-display font-bold text-base leading-tight truncate",
              isTop ? "text-gold" : "text-foreground",
            )}
          >
            {entry.name}
          </h3>
          <p className="text-xs text-muted-foreground font-ui truncate mt-0.5">
            Top: {entry.topTrack.track.title} by {entry.topTrack.track.artist}
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={cn(
              "text-sm font-ui font-bold tabular-nums",
              isTop ? "text-gold" : "text-foreground",
            )}
          >
            {entry.trackCount}{" "}
            <span className="text-muted-foreground font-normal">
              {entry.trackCount === 1 ? "track" : "tracks"}
            </span>
          </span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Star className="h-3 w-3 fill-gold/60 text-gold/60" />
            <span className="text-xs font-ui tabular-nums">
              {entry.avgRating.toFixed(1)} avg
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-3" data-ocid="leaderboard.loading_state">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-card p-4 flex items-center gap-4"
        >
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          <Skeleton className="h-11 w-11 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <div className="space-y-1.5 shrink-0">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LeaderboardPage() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("daily");
  const [locationTab, setLocationTab] = useState<LocationTab>("cities");

  const { data, isLoading, isError } = useLeaderboardData(timePeriod);

  const entries = locationTab === "cities" ? data?.cities : data?.states;

  const periodLabels: Record<TimePeriod, string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    alltime: "All Time",
  };

  return (
    <main className="container py-8 space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden border border-gold/15 bg-card"
      >
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gold/5 blur-3xl -translate-y-1/2 translate-x-1/4" />

        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0 shadow-[0_0_24px_oklch(0.78_0.17_72/0.2)]">
              <Trophy className="h-7 w-7 text-gold" />
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight">
                <span className="text-gold glow-text-gold">Location</span>{" "}
                <span className="text-foreground">Leaderboard</span>
              </h1>
              <p className="mt-1 text-muted-foreground font-ui text-sm sm:text-base">
                See which cities and states dominate the charts
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Time period filter */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="space-y-1"
      >
        <p className="text-xs text-muted-foreground font-ui font-semibold uppercase tracking-wider px-0.5">
          Time Period
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <FilterPill
            active={timePeriod === "daily"}
            onClick={() => setTimePeriod("daily")}
            ocid="leaderboard.daily.tab"
          >
            Daily
          </FilterPill>
          <FilterPill
            active={timePeriod === "weekly"}
            onClick={() => setTimePeriod("weekly")}
            ocid="leaderboard.weekly.tab"
          >
            Weekly
          </FilterPill>
          <FilterPill
            active={timePeriod === "monthly"}
            onClick={() => setTimePeriod("monthly")}
            ocid="leaderboard.monthly.tab"
          >
            Monthly
          </FilterPill>
          <FilterPill
            active={timePeriod === "alltime"}
            onClick={() => setTimePeriod("alltime")}
            ocid="leaderboard.alltime.tab"
          >
            All Time
          </FilterPill>
        </div>
      </motion.div>

      {/* Cities / States tab switcher */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-1"
      >
        <p className="text-xs text-muted-foreground font-ui font-semibold uppercase tracking-wider px-0.5">
          View by
        </p>
        <div className="flex gap-2">
          <FilterPill
            active={locationTab === "cities"}
            onClick={() => setLocationTab("cities")}
            ocid="leaderboard.cities.tab"
          >
            <MapPin className="h-3.5 w-3.5 mr-1.5" />
            Cities
          </FilterPill>
          <FilterPill
            active={locationTab === "states"}
            onClick={() => setLocationTab("states")}
            ocid="leaderboard.states.tab"
          >
            <Trophy className="h-3.5 w-3.5 mr-1.5" />
            States
          </FilterPill>
        </div>
      </motion.div>

      {/* List heading */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.14 }}
        className="flex items-center justify-between"
      >
        <h2 className="font-display font-bold text-lg text-foreground">
          Top {locationTab === "cities" ? "Cities" : "States"} —{" "}
          <span className="text-gold">{periodLabels[timePeriod]}</span>
        </h2>
      </motion.div>

      {/* Leaderboard content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <LeaderboardSkeleton key="loading" />
        ) : isError ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
            data-ocid="leaderboard.error_state"
          >
            <p className="text-destructive font-ui">
              Failed to load leaderboard data
            </p>
          </motion.div>
        ) : !entries || entries.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[30vh] gap-4 rounded-xl border border-border bg-card p-12 text-center"
            data-ocid="leaderboard.empty_state"
          >
            <div className="h-16 w-16 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20">
              <Trophy className="h-7 w-7 text-gold/60" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-xl text-foreground">
                No location data yet
              </h3>
              <p className="text-muted-foreground text-sm font-ui max-w-sm">
                Upload tracks with your city/state to appear here
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`list-${locationTab}-${timePeriod}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
            data-ocid="leaderboard.list"
          >
            {entries.map((entry, idx) => (
              <LeaderboardRow
                key={entry.name}
                entry={entry}
                rank={idx + 1}
                index={idx}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
