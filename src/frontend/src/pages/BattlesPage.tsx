import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Principal } from "@icp-sdk/core/principal";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Crown,
  Loader2,
  Music2,
  Pause,
  Play,
  Search,
  Shield,
  Swords,
  Timer,
  Trophy,
  User,
  UserX,
  XCircle,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Battle, Track } from "../backend.d";
import { BattleSide, BattleStatus } from "../backend.d";
import { type QueueTrack, usePlayer } from "../contexts/PlayerContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useActiveBattles,
  useAllArtists,
  useCreateBattle,
  useFinalizeBattle,
  useMyBattles,
  useOwnTracks,
  usePendingBattlesForMe,
  useRespondToBattle,
  useUserProfile,
  useVoteInBattle,
} from "../hooks/useQueries";

/* ── Battle duration options ──────────────────────────── */
const DURATION_OPTIONS = [
  { hours: 1, label: "1h" },
  { hours: 6, label: "6h" },
  { hours: 12, label: "12h" },
  { hours: 24, label: "24h" },
  { hours: 48, label: "48h" },
  { hours: 72, label: "72h" },
] as const;

/* ── Timestamp conversion ─────────────────────────── */
function nsToDate(ns: bigint): Date {
  return new Date(Number(ns / 1_000_000n));
}

function formatCountdown(expiresAt: bigint): string {
  const diff = nsToDate(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function relativeTime(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/* ── Status Badge ─────────────────────────────────── */
function StatusBadge({ status }: { status: BattleStatus }) {
  const config = {
    [BattleStatus.pending]: {
      label: "PENDING",
      className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    },
    [BattleStatus.active]: {
      label: "LIVE",
      className:
        "bg-green-500/20 text-green-400 border-green-500/30 animate-pulse",
    },
    [BattleStatus.completed]: {
      label: "ENDED",
      className: "bg-secondary text-muted-foreground border-border",
    },
    [BattleStatus.declined]: {
      label: "DECLINED",
      className: "bg-red-500/20 text-red-400 border-red-500/30",
    },
  }[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-ui font-bold tracking-wider border",
        config.className,
      )}
    >
      {status === BattleStatus.active && (
        <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
      )}
      {config.label}
    </span>
  );
}

/* ── Countdown Timer ──────────────────────────────── */
function CountdownTimer({ expiresAt }: { expiresAt: bigint }) {
  const [label, setLabel] = useState(() => formatCountdown(expiresAt));

  useEffect(() => {
    const id = setInterval(() => setLabel(formatCountdown(expiresAt)), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <span className="flex items-center gap-1 text-xs font-ui text-muted-foreground">
      <Clock className="h-3 w-3" />
      {label}
    </span>
  );
}

/* ── Track Side ───────────────────────────────────── */
function TrackSide({
  track,
  label,
  votes,
  totalVotes,
  side,
  isWinner,
  canVote,
  onVote,
  isVoting,
}: {
  track: Track | null | undefined;
  label: string;
  votes: number;
  totalVotes: number;
  side: BattleSide;
  isWinner: boolean;
  canVote: boolean;
  onVote: (side: BattleSide) => void;
  isVoting: boolean;
}) {
  const player = usePlayer();
  const coverUrl = track?.coverKey?.getDirectURL();
  const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

  const queueTrack: QueueTrack | null = track
    ? {
        id: track.id,
        title: track.title,
        artist: track.artist,
        audioUrl: track.audioFileKey.getDirectURL(),
        coverUrl: track.coverKey?.getDirectURL(),
      }
    : null;

  const isCurrentTrack =
    player.currentIndex >= 0 &&
    queueTrack &&
    player.queue[player.currentIndex]?.id === track?.id;
  const isPlaying = isCurrentTrack && player.playing;

  return (
    <div
      className={cn(
        "flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-300",
        side === BattleSide.challenger
          ? "border-amber-500/20 bg-amber-500/5"
          : "border-blue-500/20 bg-blue-500/5",
        isWinner && "ring-2 ring-gold/50 border-gold/40 bg-gold/5",
      )}
    >
      {/* Label */}
      <div
        className={cn(
          "text-[10px] font-ui font-bold tracking-widest uppercase",
          side === BattleSide.challenger ? "text-amber-400" : "text-blue-400",
          isWinner && "text-gold",
        )}
      >
        {label}
        {isWinner && <Crown className="inline h-3 w-3 ml-1 text-gold" />}
      </div>

      {/* Album cover */}
      <div
        className={cn(
          "relative h-20 w-20 rounded-xl overflow-hidden border shrink-0",
          side === BattleSide.challenger
            ? "border-amber-500/30"
            : "border-blue-500/30",
          isWinner &&
            "border-gold/40 shadow-[0_0_16px_oklch(0.78_0.17_72/0.3)]",
        )}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={track?.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-secondary">
            <Music2 className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
        {/* Play overlay */}
        {queueTrack && (
          <button
            type="button"
            onClick={() => {
              if (isCurrentTrack) {
                player.togglePlay();
              } else if (queueTrack) {
                player.playTrack(queueTrack);
              }
            }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-8 w-8 text-white fill-white" />
            ) : (
              <Play className="h-8 w-8 text-white fill-white ml-1" />
            )}
          </button>
        )}
      </div>

      {/* Track info */}
      {track ? (
        <div className="text-center min-w-0 w-full">
          <p className="font-display font-bold text-sm truncate">
            {track.title}
          </p>
          <p className="text-xs text-muted-foreground font-ui truncate">
            {track.artist}
          </p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-ui italic">
            Awaiting response…
          </p>
        </div>
      )}

      {/* Vote bar */}
      {track && totalVotes > 0 && (
        <div className="w-full space-y-1">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ transformOrigin: "left" }}
          >
            <Progress
              value={pct}
              className={cn(
                "h-2 bg-secondary",
                side === BattleSide.challenger
                  ? "[&>div]:bg-amber-400"
                  : "[&>div]:bg-blue-400",
                isWinner && "[&>div]:bg-gold",
              )}
            />
          </motion.div>
          <p className="text-center text-xs font-ui font-bold text-foreground">
            {pct}%{" "}
            <span className="text-muted-foreground font-normal">({votes})</span>
          </p>
        </div>
      )}

      {/* Vote button */}
      {canVote && track && (
        <Button
          size="sm"
          onClick={() => onVote(side)}
          disabled={isVoting}
          className={cn(
            "w-full h-8 font-ui font-bold text-xs gap-1.5 transition-all duration-200",
            side === BattleSide.challenger
              ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
              : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30",
          )}
          data-ocid={`battle.vote_${side}.button`}
        >
          {isVoting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Zap className="h-3 w-3" />
          )}
          Vote {label}
        </Button>
      )}
    </div>
  );
}

/* ── Battle Card ──────────────────────────────────── */
function BattleCard({
  battle,
  index,
  myPrincipalStr,
  allTracks,
}: {
  battle: Battle;
  index: number;
  myPrincipalStr: string | undefined;
  allTracks: Track[];
}) {
  const challengerStr = battle.challengerId.toString();
  const defenderStr = battle.defenderId.toString();
  const isParticipant =
    myPrincipalStr === challengerStr || myPrincipalStr === defenderStr;
  const isWinner = battle.winnerId
    ? battle.winnerId.toString() === myPrincipalStr
    : false;

  const { data: challengerProfile } = useUserProfile(
    battle.challengerId as Principal,
  );
  const { data: defenderProfile } = useUserProfile(
    battle.defenderId as Principal,
  );

  const challengerTrack =
    allTracks.find((t) => t.id === battle.challengerTrackId) ?? null;
  const defenderTrack = battle.defenderTrackId
    ? (allTracks.find((t) => t.id === battle.defenderTrackId) ?? null)
    : null;

  const challengerVotes = battle.votes.filter(
    (v) => v.side === BattleSide.challenger,
  ).length;
  const defenderVotes = battle.votes.filter(
    (v) => v.side === BattleSide.defender,
  ).length;
  const totalVotes = battle.votes.length;

  const hasVoted = myPrincipalStr
    ? battle.votes.some((v) => v.voterId.toString() === myPrincipalStr)
    : false;
  const canVote =
    !!myPrincipalStr &&
    !isParticipant &&
    !hasVoted &&
    battle.status === BattleStatus.active &&
    !!defenderTrack;

  const voteMutation = useVoteInBattle();
  const finalizeMutation = useFinalizeBattle();

  const isExpired =
    battle.expiresAt && nsToDate(battle.expiresAt).getTime() < Date.now();

  const challengerWon =
    battle.status === BattleStatus.completed &&
    battle.winnerId?.toString() === challengerStr;
  const defenderWon =
    battle.status === BattleStatus.completed &&
    battle.winnerId?.toString() === defenderStr;

  function handleVote(side: BattleSide) {
    voteMutation.mutate(
      { battleId: battle.id, side },
      {
        onSuccess: () => toast.success("Vote cast!"),
        onError: () => toast.error("Failed to vote"),
      },
    );
  }

  function handleFinalize() {
    finalizeMutation.mutate(battle.id, {
      onSuccess: () => toast.success("Battle finalized!"),
      onError: () => toast.error("Failed to finalize battle"),
    });
  }

  const challengerName =
    challengerProfile?.username ?? `${challengerStr.slice(0, 8)}…`;
  const defenderName =
    defenderProfile?.username ?? `${defenderStr.slice(0, 8)}…`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      data-ocid={`battle.item.${index + 1}`}
      className={cn(
        "rounded-2xl border overflow-hidden",
        "bg-gradient-to-br from-card to-background",
        battle.status === BattleStatus.active
          ? "border-amber-500/20 shadow-[0_0_30px_oklch(0.78_0.17_72/0.08)]"
          : "border-border",
        battle.status === BattleStatus.completed && "border-gold/20",
        battle.status === BattleStatus.declined && "border-border opacity-70",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-2.5 border-b",
          battle.status === BattleStatus.active
            ? "border-amber-500/15 bg-amber-500/5"
            : "border-border bg-secondary/20",
          battle.status === BattleStatus.completed &&
            "bg-gold/5 border-gold/15",
        )}
      >
        <div className="flex items-center gap-2">
          <Swords
            className={cn(
              "h-4 w-4",
              battle.status === BattleStatus.active
                ? "text-amber-400"
                : "text-muted-foreground",
              battle.status === BattleStatus.completed && "text-gold",
            )}
          />
          <span className="text-xs font-ui text-muted-foreground">
            {challengerName}{" "}
            <span className="text-foreground font-semibold">vs</span>{" "}
            {defenderName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {battle.expiresAt && battle.status === BattleStatus.active && (
            <CountdownTimer expiresAt={battle.expiresAt} />
          )}
          <StatusBadge status={battle.status} />
        </div>
      </div>

      {/* VS area */}
      <div className="p-4">
        {battle.status === BattleStatus.declined ? (
          <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
            <XCircle className="h-5 w-5 text-red-400" />
            <span className="font-ui text-sm">
              {defenderName} declined this battle
            </span>
          </div>
        ) : (
          <div className="flex items-stretch gap-0">
            {/* Challenger side */}
            <TrackSide
              track={challengerTrack}
              label="Challenger"
              votes={challengerVotes}
              totalVotes={totalVotes}
              side={BattleSide.challenger}
              isWinner={challengerWon}
              canVote={canVote}
              onVote={handleVote}
              isVoting={voteMutation.isPending}
            />

            {/* VS divider */}
            <div className="flex flex-col items-center justify-center px-3 shrink-0 gap-1">
              <div className="h-full w-px bg-gradient-to-b from-transparent via-border to-transparent" />
              <div
                className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center border text-sm font-display font-black shrink-0",
                  battle.status === BattleStatus.active
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-[0_0_12px_oklch(0.82_0.19_72/0.25)]"
                    : "border-border bg-secondary text-muted-foreground",
                  battle.status === BattleStatus.completed &&
                    "border-gold/40 bg-gold/10 text-gold",
                )}
              >
                VS
              </div>
              <div className="h-full w-px bg-gradient-to-b from-transparent via-border to-transparent" />
            </div>

            {/* Defender side */}
            {battle.defenderTrackId ? (
              <TrackSide
                track={defenderTrack}
                label="Defender"
                votes={defenderVotes}
                totalVotes={totalVotes}
                side={BattleSide.defender}
                isWinner={defenderWon}
                canVote={canVote}
                onVote={handleVote}
                isVoting={voteMutation.isPending}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-border/50 bg-secondary/20">
                <Shield className="h-7 w-7 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground font-ui text-center">
                  Awaiting {defenderName}'s response
                </p>
              </div>
            )}
          </div>
        )}

        {/* Winner banner */}
        {battle.status === BattleStatus.completed && battle.winnerId && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center justify-center gap-2 py-2 rounded-lg bg-gold/10 border border-gold/25"
          >
            <Trophy className="h-4 w-4 text-gold" />
            <span className="text-sm font-display font-bold text-gold">
              {battle.winnerId.toString() === challengerStr
                ? challengerName
                : defenderName}{" "}
              wins!
            </span>
            {isWinner && (
              <span className="text-xs font-ui text-gold/70 ml-1">
                (That's you!)
              </span>
            )}
          </motion.div>
        )}

        {/* Participant note */}
        {isParticipant && battle.status === BattleStatus.active && (
          <div className="mt-3 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-secondary/50 border border-border/50">
            <Swords className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-ui text-muted-foreground">
              You are in this battle
            </span>
          </div>
        )}

        {/* Finalize button for expired active battles */}
        {battle.status === BattleStatus.active && isExpired && (
          <div className="mt-3 flex justify-center">
            <Button
              size="sm"
              onClick={handleFinalize}
              disabled={finalizeMutation.isPending}
              className="gap-1.5 font-ui font-semibold text-xs h-7 bg-gold/15 text-gold hover:bg-gold/25 border border-gold/30"
              data-ocid="battle.finalize.button"
            >
              {finalizeMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle className="h-3 w-3" />
              )}
              Finalize Battle
            </Button>
          </div>
        )}

        {/* Timestamp */}
        <p className="mt-2 text-center text-[10px] font-ui text-muted-foreground/50">
          Started {relativeTime(battle.createdAt)}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Battle Card Skeleton ─────────────────────────── */
function BattleCardSkeleton({ index: _index }: { index: number }) {
  return (
    <div
      className="rounded-2xl border border-border overflow-hidden"
      data-ocid="battle.loading_state"
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/20">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="p-4 flex items-stretch gap-4">
        <div className="flex-1 space-y-3 flex flex-col items-center">
          <Skeleton className="h-20 w-20 rounded-xl" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="flex items-center justify-center px-4">
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
        <div className="flex-1 space-y-3 flex flex-col items-center">
          <Skeleton className="h-20 w-20 rounded-xl" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-2 w-full" />
        </div>
      </div>
    </div>
  );
}

/* ── Pending Battle Item ──────────────────────────── */
function PendingBattleItem({
  battle,
  index,
  ownTracks,
}: {
  battle: Battle;
  index: number;
  ownTracks: Track[];
}) {
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");

  const { data: challengerProfile } = useUserProfile(
    battle.challengerId as Principal,
  );
  const respondMutation = useRespondToBattle();

  const challengerName =
    challengerProfile?.username ??
    `${battle.challengerId.toString().slice(0, 8)}…`;

  function handleAccept() {
    if (!selectedTrackId) {
      toast.error("Please select a track");
      return;
    }
    respondMutation.mutate(
      { battleId: battle.id, defenderTrackId: selectedTrackId, accept: true },
      {
        onSuccess: () => {
          toast.success("Battle accepted! The arena awaits.");
          setShowAcceptDialog(false);
        },
        onError: () => toast.error("Failed to accept battle"),
      },
    );
  }

  function handleDecline() {
    respondMutation.mutate(
      { battleId: battle.id, defenderTrackId: "", accept: false },
      {
        onSuccess: () => {
          toast.success("Battle declined");
          setShowDeclineDialog(false);
        },
        onError: () => toast.error("Failed to decline battle"),
      },
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
      data-ocid={`battle.challenge.item.${index + 1}`}
    >
      {/* Challenge info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="h-10 w-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Swords className="h-5 w-5 text-amber-400" />
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold text-sm text-foreground">
            Challenge from{" "}
            <span className="text-amber-400">{challengerName}</span>
          </p>
          <p className="text-xs text-muted-foreground font-ui mt-0.5">
            Track ID: {battle.challengerTrackId.slice(0, 16)}…
          </p>
          <p className="text-[10px] text-muted-foreground/60 font-ui mt-0.5">
            {relativeTime(battle.createdAt)}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          onClick={() => setShowDeclineDialog(true)}
          variant="outline"
          className="h-8 font-ui font-semibold text-xs gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/40"
          data-ocid={`battle.challenge.decline_button.${index + 1}`}
        >
          <XCircle className="h-3.5 w-3.5" />
          Decline
        </Button>
        <Button
          size="sm"
          onClick={() => setShowAcceptDialog(true)}
          className="h-8 font-ui font-bold text-xs gap-1.5 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
          data-ocid={`battle.challenge.accept_button.${index + 1}`}
        >
          <Swords className="h-3.5 w-3.5" />
          Accept
        </Button>
      </div>

      {/* Accept dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent
          className="border-border bg-card sm:max-w-md"
          data-ocid="battle.accept.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg flex items-center gap-2">
              <Swords className="h-5 w-5 text-amber-400" />
              Accept the Challenge
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground font-ui">
            Pick one of your tracks to defend against{" "}
            <span className="text-amber-400 font-semibold">
              {challengerName}
            </span>
            .
          </p>

          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {ownTracks.length === 0 ? (
                <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground">
                  <Music2 className="h-5 w-5" />
                  <span className="text-sm font-ui">
                    No tracks uploaded yet
                  </span>
                </div>
              ) : (
                ownTracks.map((track) => {
                  const coverUrl = track.coverKey?.getDirectURL();
                  const isSelected = selectedTrackId === track.id;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => setSelectedTrackId(track.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-200",
                        isSelected
                          ? "border-amber-500/50 bg-amber-500/10"
                          : "border-border hover:border-border/80 hover:bg-secondary/50",
                      )}
                    >
                      <div className="h-10 w-10 rounded-md overflow-hidden bg-secondary border border-border shrink-0">
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt={track.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Music2 className="h-4 w-4 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-sm truncate">
                          {track.title}
                        </p>
                        <p className="text-xs text-muted-foreground font-ui truncate">
                          {track.genre}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle className="h-4 w-4 text-amber-400 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAcceptDialog(false)}
              className="font-ui border-border text-muted-foreground"
              data-ocid="battle.accept.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!selectedTrackId || respondMutation.isPending}
              className="font-ui font-bold bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
              data-ocid="battle.accept.confirm_button"
            >
              {respondMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Swords className="mr-2 h-4 w-4" />
              )}
              Enter the Arena
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline confirm dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent
          className="border-border bg-card sm:max-w-sm"
          data-ocid="battle.decline.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-lg flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-400" />
              Decline Battle
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground font-ui">
            Are you sure you want to decline this challenge from{" "}
            <span className="text-foreground font-semibold">
              {challengerName}
            </span>
            ?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeclineDialog(false)}
              className="font-ui border-border text-muted-foreground"
              data-ocid="battle.decline.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDecline}
              disabled={respondMutation.isPending}
              className="font-ui font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
              data-ocid="battle.decline.confirm_button"
            >
              {respondMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

/* ── Challenge Flow Modal ─────────────────────────── */
function ChallengeModal({
  open,
  onClose,
  prefilledDefenderId,
}: {
  open: boolean;
  onClose: () => void;
  prefilledDefenderId?: string;
}) {
  const { identity } = useInternetIdentity();
  const myPrincipalStr = identity?.getPrincipal().toString();

  const { data: ownTracks = [], isLoading: tracksLoading } = useOwnTracks();
  const { data: allArtists = [], isLoading: artistsLoading } = useAllArtists();
  const createBattle = useCreateBattle();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const [defenderIdInput, setDefenderIdInput] = useState(
    prefilledDefenderId ?? "",
  );
  const [idError, setIdError] = useState("");
  const [artistSearch, setArtistSearch] = useState("");
  const [selectedArtistName, setSelectedArtistName] = useState("");
  const [showDirectInput, setShowDirectInput] = useState(false);
  const [durationHours, setDurationHours] = useState<number>(24);

  // Reset when opened
  const prevOpen = useRef(open);
  useEffect(() => {
    if (open && !prevOpen.current) {
      setStep(1);
      setSelectedTrackId("");
      setDefenderIdInput(prefilledDefenderId ?? "");
      setIdError("");
      setArtistSearch("");
      setSelectedArtistName(prefilledDefenderId ? "Selected artist" : "");
      setShowDirectInput(!!prefilledDefenderId);
      setDurationHours(24);
    }
    prevOpen.current = open;
  }, [open, prefilledDefenderId]);

  // Filter artists: exclude self, apply search
  const filteredArtists = allArtists.filter((a) => {
    if (myPrincipalStr && a.ownerId.toString() === myPrincipalStr) return false;
    if (!artistSearch.trim()) return true;
    return a.artistName.toLowerCase().includes(artistSearch.toLowerCase());
  });

  function handleSelectArtist(ownerId: string, artistName: string) {
    setDefenderIdInput(ownerId);
    setSelectedArtistName(artistName);
    setIdError("");
  }

  function validateAndGoStep2() {
    if (!selectedTrackId) {
      toast.error("Please pick a track first");
      return;
    }
    setStep(2);
  }

  function validateAndGoStep3() {
    if (!defenderIdInput.trim()) {
      setIdError("Please select an artist or enter a Principal ID");
      return;
    }
    try {
      Principal.fromText(defenderIdInput.trim());
    } catch {
      setIdError("Invalid Principal ID format");
      return;
    }
    if (defenderIdInput.trim() === myPrincipalStr) {
      setIdError("You cannot battle yourself");
      return;
    }
    setIdError("");
    setStep(3);
  }

  function handleSend() {
    let defenderPrincipal: Principal;
    try {
      defenderPrincipal = Principal.fromText(defenderIdInput.trim());
    } catch {
      toast.error("Invalid Principal ID");
      return;
    }
    createBattle.mutate(
      {
        defenderArtistId: defenderPrincipal,
        challengerTrackId: selectedTrackId,
      },
      {
        onSuccess: () => {
          toast.success("Challenge sent! Waiting for their response.");
          onClose();
        },
        onError: () => toast.error("Failed to send challenge. Try again."),
      },
    );
  }

  const selectedTrack = ownTracks.find((t) => t.id === selectedTrackId);

  // Derive display name for defender on step 3
  const defenderDisplayName =
    selectedArtistName ||
    (defenderIdInput ? `${defenderIdInput.slice(0, 20)}…` : "—");

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        className="border-border bg-card sm:max-w-lg"
        data-ocid="battle.challenge.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-xl flex items-center gap-2">
            <Swords className="h-5 w-5 text-amber-400" />
            Challenge an Artist
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-2">
          {([1, 2, 3] as const).map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                step >= s ? "bg-amber-400" : "bg-secondary",
              )}
            />
          ))}
        </div>

        {/* Step 1: Pick your track */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm font-ui text-muted-foreground">
              <span className="font-semibold text-foreground">Step 1:</span>{" "}
              Pick your battle track
            </p>
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {tracksLoading ? (
                  [1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))
                ) : ownTracks.length === 0 ? (
                  <div
                    className="flex flex-col items-center gap-3 py-8 text-center"
                    data-ocid="battle.challenge.empty_state"
                  >
                    <Music2 className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-ui text-muted-foreground">
                      Upload a track first to battle
                    </p>
                  </div>
                ) : (
                  ownTracks.map((track) => {
                    const coverUrl = track.coverKey?.getDirectURL();
                    const isSelected = selectedTrackId === track.id;
                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => setSelectedTrackId(track.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-200",
                          isSelected
                            ? "border-amber-500/50 bg-amber-500/10"
                            : "border-border hover:border-border/80 hover:bg-secondary/50",
                        )}
                        data-ocid="battle.challenge.track.select"
                      >
                        <div className="h-10 w-10 rounded-md overflow-hidden bg-secondary border border-border shrink-0">
                          {coverUrl ? (
                            <img
                              src={coverUrl}
                              alt={track.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Music2 className="h-4 w-4 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-bold text-sm truncate">
                            {track.title}
                          </p>
                          <p className="text-xs text-muted-foreground font-ui">
                            {track.genre}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-4 w-4 text-amber-400 shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Step 2: Find opponent via search */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm font-ui text-muted-foreground">
              <span className="font-semibold text-foreground">Step 2:</span>{" "}
              Find the artist to battle
            </p>

            {/* Selected track preview */}
            {selectedTrack && (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/25 bg-amber-500/5">
                <div className="h-9 w-9 rounded-md overflow-hidden bg-secondary border border-border shrink-0">
                  {selectedTrack.coverKey ? (
                    <img
                      src={selectedTrack.coverKey.getDirectURL()}
                      alt={selectedTrack.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Music2 className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-ui text-muted-foreground">
                    Your track:
                  </p>
                  <p className="font-display font-bold text-sm truncate text-amber-400">
                    {selectedTrack.title}
                  </p>
                </div>
              </div>
            )}

            {/* Currently selected artist indicator */}
            {defenderIdInput && selectedArtistName && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/25">
                <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                <span className="text-sm font-ui text-green-400 font-semibold truncate">
                  {selectedArtistName}
                </span>
                <span className="text-xs text-muted-foreground font-ui ml-auto">
                  selected
                </span>
              </div>
            )}

            {/* Artist search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                value={artistSearch}
                onChange={(e) => setArtistSearch(e.target.value)}
                placeholder="Search by artist name..."
                className="pl-9 border-border bg-input focus:border-amber-500/40 focus:ring-amber-500/20 font-ui text-sm"
                data-ocid="battle.challenge.search_input"
                disabled={!!prefilledDefenderId}
              />
            </div>

            {/* Artist results */}
            {!prefilledDefenderId && (
              <ScrollArea className="max-h-52">
                <div className="space-y-1.5 pr-1">
                  {artistsLoading ? (
                    <div
                      className="flex items-center justify-center py-6 gap-2 text-muted-foreground"
                      data-ocid="battle.challenge.loading_state"
                    >
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm font-ui">Loading artists…</span>
                    </div>
                  ) : filteredArtists.length === 0 ? (
                    <div
                      className="flex flex-col items-center gap-2 py-8 text-center"
                      data-ocid="battle.challenge.artist.empty_state"
                    >
                      <User className="h-7 w-7 text-muted-foreground/40" />
                      <p className="text-sm font-ui text-muted-foreground">
                        {artistSearch
                          ? `No artists found for "${artistSearch}"`
                          : "No other artists available to battle"}
                      </p>
                    </div>
                  ) : (
                    filteredArtists.map((artist, idx) => {
                      const isSelected =
                        defenderIdInput === artist.ownerId.toString();
                      return (
                        <motion.button
                          key={artist.ownerId.toString()}
                          type="button"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() =>
                            handleSelectArtist(
                              artist.ownerId.toString(),
                              artist.artistName,
                            )
                          }
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all duration-200",
                            isSelected
                              ? "border-amber-500/50 bg-amber-500/10"
                              : "border-border/50 hover:border-amber-500/30 hover:bg-amber-500/5",
                          )}
                          data-ocid={`battle.challenge.artist.item.${idx + 1}`}
                        >
                          {/* Avatar */}
                          <div
                            className={cn(
                              "h-9 w-9 rounded-full flex items-center justify-center border shrink-0 text-sm font-display font-black",
                              isSelected
                                ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                                : "bg-secondary border-border text-muted-foreground",
                            )}
                          >
                            {artist.artistName.charAt(0).toUpperCase()}
                          </div>

                          {/* Name */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "font-display font-bold text-sm truncate",
                                isSelected
                                  ? "text-amber-400"
                                  : "text-foreground",
                              )}
                            >
                              {artist.artistName}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono truncate">
                              {artist.ownerId.toString().slice(0, 18)}…
                            </p>
                          </div>

                          {isSelected && (
                            <CheckCircle className="h-4 w-4 text-amber-400 shrink-0" />
                          )}
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            )}

            {/* Collapsible direct Principal ID input */}
            <div className="border border-border/50 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowDirectInput((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-ui text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <span>Enter Principal ID directly</span>
                {showDirectInput ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
              <AnimatePresence>
                {showDirectInput && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-1 space-y-1.5">
                      <input
                        id="defender-id-direct-input"
                        type="text"
                        value={defenderIdInput}
                        onChange={(e) => {
                          setDefenderIdInput(e.target.value);
                          setSelectedArtistName("");
                          setIdError("");
                        }}
                        placeholder="e.g. aaaaa-aa or a4gq6-..."
                        className={cn(
                          "w-full px-3 py-2 rounded-lg border bg-input text-foreground text-sm font-mono",
                          "focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40",
                          "placeholder:text-muted-foreground/50 transition-all",
                          idError ? "border-red-500/50" : "border-border",
                        )}
                        readOnly={!!prefilledDefenderId}
                        data-ocid="battle.challenge.direct_id_input"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {idError && (
              <p
                className="text-xs text-red-400 font-ui"
                data-ocid="battle.challenge.error_state"
              >
                {idError}
              </p>
            )}
          </div>
        )}

        {/* Step 3: Pick duration + Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm font-ui text-muted-foreground">
              <span className="font-semibold text-foreground">Step 3:</span> Set
              duration & confirm your challenge
            </p>

            {/* Duration picker */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-xs font-ui font-semibold text-muted-foreground uppercase tracking-wider">
                  Battle Duration
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map((opt, idx) => (
                  <button
                    key={opt.hours}
                    type="button"
                    onClick={() => setDurationHours(opt.hours)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-ui font-bold border transition-all duration-200",
                      durationHours === opt.hours
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_8px_oklch(0.82_0.19_72/0.2)]"
                        : "border-border text-muted-foreground hover:border-amber-500/30 hover:text-foreground hover:bg-secondary/50",
                    )}
                    data-ocid={`battle.duration.${idx + 1}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Battle summary */}
            <div
              className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-3"
              data-ocid="battle.challenge.confirm_panel"
            >
              <div className="flex items-center gap-2">
                <Swords className="h-4 w-4 text-amber-400 shrink-0" />
                <p className="text-sm font-ui text-foreground font-semibold">
                  Battle Summary
                </p>
              </div>
              <Separator className="bg-amber-500/15" />
              <div className="space-y-2 text-sm font-ui">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your track:</span>
                  <span className="text-amber-400 font-semibold truncate max-w-[180px]">
                    {selectedTrack?.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Opponent:</span>
                  <span
                    className={cn(
                      "font-semibold truncate max-w-[180px]",
                      selectedArtistName
                        ? "text-foreground"
                        : "text-foreground font-mono text-xs",
                    )}
                  >
                    {defenderDisplayName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="text-amber-400 font-bold">
                    {durationHours === 1 ? "1 hour" : `${durationHours} hours`}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs font-ui text-muted-foreground/70 text-center">
              The opponent has 48 hours to accept or decline. If they accept,
              the battle goes live for{" "}
              <span className="text-amber-400 font-semibold">
                {durationHours === 1 ? "1 hour" : `${durationHours} hours`}
              </span>{" "}
              of public voting.
            </p>
          </div>
        )}

        <DialogFooter>
          {step > 1 && (
            <Button
              variant="ghost"
              onClick={() => setStep((s) => (s === 3 ? 2 : 1) as 1 | 2 | 3)}
              className="font-ui text-muted-foreground mr-auto"
              data-ocid="battle.challenge.back_button"
            >
              Back
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            className="font-ui border-border text-muted-foreground"
            data-ocid="battle.challenge.cancel_button"
          >
            Cancel
          </Button>
          {step === 1 && (
            <Button
              onClick={validateAndGoStep2}
              disabled={!selectedTrackId}
              className="font-ui font-bold bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
              data-ocid="battle.challenge.next_button"
            >
              Next →
            </Button>
          )}
          {step === 2 && (
            <Button
              onClick={validateAndGoStep3}
              disabled={!defenderIdInput.trim()}
              className="font-ui font-bold bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
              data-ocid="battle.challenge.next_button"
            >
              Set Duration →
            </Button>
          )}
          {step === 3 && (
            <Button
              onClick={handleSend}
              disabled={createBattle.isPending}
              className="font-ui font-bold bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
              data-ocid="battle.challenge.submit_button"
            >
              {createBattle.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Swords className="mr-2 h-4 w-4" />
              )}
              Send Challenge
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main BattlesPage ─────────────────────────────── */
export function BattlesPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const myPrincipalStr = identity?.getPrincipal().toString();

  const [challengeOpen, setChallengeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("arena");

  const { data: activeBattles = [], isLoading: activeLoading } =
    useActiveBattles();
  const { data: pendingBattles = [], isLoading: pendingLoading } =
    usePendingBattlesForMe();
  const { data: myBattles = [], isLoading: myBattlesLoading } = useMyBattles();
  const { data: ownTracks = [] } = useOwnTracks();

  // Collect all track IDs referenced in battles so we can look them up
  // We use charts data + own tracks to resolve track info
  // Build a merged track lookup from own tracks (tracks of authenticated user)
  // For other users' tracks, we use minimal info from TrackSide (via getDirectURL)

  // We need all tracks for battle cards. We fetch own tracks + use charts data.
  // Since we can't fetch all tracks directly, we'll pass ownTracks and allTracks
  // fetched from all battles participants.
  // For now pass ownTracks as the all-tracks reference; TrackSide handles null gracefully.
  const allTracks: Track[] = ownTracks;

  const sortedMyBattles = [...myBattles].sort((a, b) =>
    Number(b.createdAt - a.createdAt),
  );

  return (
    <main className="container py-8 max-w-4xl" data-ocid="battles.page">
      {/* Hero header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/8 via-card to-background p-6"
      >
        {/* Decorative */}
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Swords className="h-6 w-6 text-amber-400" />
              <h1 className="font-display font-black text-2xl sm:text-3xl">
                <span className="text-amber-400">Battle</span>{" "}
                <span className="text-foreground">Arena</span>
              </h1>
            </div>
            <p className="text-sm text-muted-foreground font-ui">
              Challenge artists, vote on battles, claim supremacy
            </p>
          </div>
          {isAuthenticated && (
            <Button
              onClick={() => setChallengeOpen(true)}
              className="font-ui font-bold gap-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 shadow-[0_0_16px_oklch(0.82_0.19_72/0.15)]"
              data-ocid="battle.challenge.open_modal_button"
            >
              <Swords className="h-4 w-4" />
              Challenge Artist
            </Button>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList
          className="bg-secondary border border-border w-full sm:w-auto h-auto flex-wrap gap-1 p-1"
          data-ocid="battles.tab"
        >
          <TabsTrigger
            value="arena"
            className="font-ui font-semibold text-sm data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 gap-1.5"
            data-ocid="battles.arena.tab"
          >
            <Swords className="h-3.5 w-3.5" />
            Arena
            {activeBattles.length > 0 && (
              <span className="ml-1 h-4 min-w-4 px-1 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center tabular-nums">
                {activeBattles.length}
              </span>
            )}
          </TabsTrigger>

          {isAuthenticated && (
            <TabsTrigger
              value="challenges"
              className="font-ui font-semibold text-sm data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 gap-1.5"
              data-ocid="battles.challenges.tab"
            >
              <Shield className="h-3.5 w-3.5" />
              Challenges
              {pendingBattles.length > 0 && (
                <span className="ml-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {pendingBattles.length}
                </span>
              )}
            </TabsTrigger>
          )}

          {isAuthenticated && (
            <TabsTrigger
              value="my-battles"
              className="font-ui font-semibold text-sm data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 gap-1.5"
              data-ocid="battles.my_battles.tab"
            >
              <Trophy className="h-3.5 w-3.5" />
              My Battles
            </TabsTrigger>
          )}
        </TabsList>

        {/* Arena tab */}
        <TabsContent
          value="arena"
          className="mt-0 space-y-4"
          data-ocid="battles.arena.panel"
        >
          {activeLoading ? (
            <div className="space-y-4" data-ocid="battles.arena.loading_state">
              {[1, 2, 3].map((i) => (
                <BattleCardSkeleton key={i} index={i} />
              ))}
            </div>
          ) : activeBattles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-14 text-center"
              data-ocid="battles.arena.empty_state"
            >
              <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Swords className="h-7 w-7 text-amber-400/60" />
              </div>
              <div className="space-y-1">
                <p className="font-display font-bold text-lg">
                  No active battles
                </p>
                <p className="text-sm text-muted-foreground font-ui">
                  Be the first to challenge an artist to battle
                </p>
              </div>
              {isAuthenticated && (
                <Button
                  onClick={() => setChallengeOpen(true)}
                  className="font-ui font-bold gap-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 mt-2"
                  data-ocid="battles.challenge.primary_button"
                >
                  <Swords className="h-4 w-4" />
                  Start a Battle
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-4" data-ocid="battles.arena.list">
              {activeBattles.map((battle, idx) => (
                <BattleCard
                  key={battle.id}
                  battle={battle}
                  index={idx}
                  myPrincipalStr={myPrincipalStr}
                  allTracks={allTracks}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Challenges tab */}
        <TabsContent
          value="challenges"
          className="mt-0 space-y-4"
          data-ocid="battles.challenges.panel"
        >
          {pendingLoading ? (
            <div
              className="space-y-3"
              data-ocid="battles.challenges.loading_state"
            >
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : pendingBattles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-14 text-center"
              data-ocid="battles.challenges.empty_state"
            >
              <div className="h-16 w-16 rounded-2xl bg-secondary border border-border flex items-center justify-center">
                <Shield className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <div className="space-y-1">
                <p className="font-display font-bold text-lg">
                  No pending challenges
                </p>
                <p className="text-sm text-muted-foreground font-ui">
                  When artists challenge you, they'll appear here
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3" data-ocid="battles.challenges.list">
              {pendingBattles.map((battle, idx) => (
                <PendingBattleItem
                  key={battle.id}
                  battle={battle}
                  index={idx}
                  ownTracks={ownTracks}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Battles tab */}
        <TabsContent
          value="my-battles"
          className="mt-0 space-y-4"
          data-ocid="battles.my_battles.panel"
        >
          {myBattlesLoading ? (
            <div
              className="space-y-4"
              data-ocid="battles.my_battles.loading_state"
            >
              {[1, 2].map((i) => (
                <BattleCardSkeleton key={i} index={i} />
              ))}
            </div>
          ) : sortedMyBattles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-14 text-center"
              data-ocid="battles.my_battles.empty_state"
            >
              <div className="h-16 w-16 rounded-2xl bg-secondary border border-border flex items-center justify-center">
                <Trophy className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <div className="space-y-1">
                <p className="font-display font-bold text-lg">No battles yet</p>
                <p className="text-sm text-muted-foreground font-ui">
                  Challenge an artist to get your first battle going
                </p>
              </div>
              <Button
                onClick={() => {
                  setActiveTab("arena");
                  setChallengeOpen(true);
                }}
                className="font-ui font-bold gap-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 mt-2"
                data-ocid="battles.my_battles.challenge_button"
              >
                <Swords className="h-4 w-4" />
                Start a Battle
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4" data-ocid="battles.my_battles.list">
              {sortedMyBattles.map((battle, idx) => (
                <BattleCard
                  key={battle.id}
                  battle={battle}
                  index={idx}
                  myPrincipalStr={myPrincipalStr}
                  allTracks={allTracks}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Challenge modal */}
      <AnimatePresence>
        {challengeOpen && (
          <ChallengeModal
            open={challengeOpen}
            onClose={() => setChallengeOpen(false)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/* ── Challenge button for external use (Artist Profile) ── */
export function ChallengeArtistButton({
  defenderPrincipalId,
}: {
  defenderPrincipalId: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 font-ui font-semibold text-xs h-8 px-3 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
        data-ocid="artist.challenge.open_modal_button"
      >
        <Swords className="h-3.5 w-3.5" />
        Challenge
      </Button>
      <ChallengeModal
        open={open}
        onClose={() => setOpen(false)}
        prefilledDefenderId={defenderPrincipalId}
      />
    </>
  );
}
