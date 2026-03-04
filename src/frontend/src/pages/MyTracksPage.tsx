import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  Heart,
  Loader2,
  MessageSquare,
  Music2,
  Star,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { MusicRequest, Track } from "../backend.d";
import { LoginGate } from "../components/LoginGate";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDeleteTrack,
  useLikeTrack,
  useMyMusicRequests,
  useOwnTracks,
} from "../hooks/useQueries";

/** Format a bigint nanosecond timestamp as a relative date string */
function formatRelativeTime(timestampNs: bigint): string {
  const ms = Number(timestampNs / BigInt(1_000_000));
  const diff = Date.now() - ms;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ms).toLocaleDateString();
}

function FanRequestCard({
  request,
  index,
}: {
  request: MusicRequest;
  index: number;
}) {
  const fromStr = request.fromUserId.toString();
  const shortPrincipal = `${fromStr.slice(0, 8)}…${fromStr.slice(-4)}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      data-ocid={`my_tracks.requests.item.${index + 1}`}
      className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
            <MessageSquare className="h-3.5 w-3.5 text-gold" />
          </div>
          <span className="text-xs font-ui text-muted-foreground font-mono">
            {shortPrincipal}
          </span>
        </div>
        <span className="text-xs text-muted-foreground/60 font-ui shrink-0">
          {formatRelativeTime(request.timestamp)}
        </span>
      </div>
      <p className="text-sm font-ui text-foreground/90 leading-relaxed pl-9">
        {request.message}
      </p>
    </motion.div>
  );
}

function FanRequestsPanel() {
  const [open, setOpen] = useState(false);
  const { data: requests, isLoading } = useMyMusicRequests();
  const count = requests?.length ?? 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          data-ocid="my_tracks.requests.panel"
          className="w-full flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:border-gold/20 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
              <MessageSquare className="h-4 w-4 text-gold" />
            </div>
            <div className="text-left">
              <p className="font-display font-bold text-sm text-foreground">
                Fan Requests
              </p>
              <p className="text-xs text-muted-foreground font-ui">
                Music requests from your fans
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {count > 0 && (
              <Badge className="bg-gold/20 text-gold border-gold/30 font-ui font-semibold text-xs">
                {count}
              </Badge>
            )}
            <ChevronDown
              className="h-4 w-4 text-muted-foreground transition-transform duration-200"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-3 space-y-3">
          {isLoading ? (
            <div
              className="space-y-3"
              data-ocid="my_tracks.requests.loading_state"
            >
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-full ml-9" />
                </div>
              ))}
            </div>
          ) : !requests || requests.length === 0 ? (
            <div
              className="rounded-xl border border-border bg-card p-8 text-center"
              data-ocid="my_tracks.requests.empty_state"
            >
              <div className="h-12 w-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-5 w-5 text-gold" />
              </div>
              <p className="font-display font-bold text-base">
                No fan requests yet
              </p>
              <p className="text-sm text-muted-foreground font-ui mt-1">
                When fans request music from you, it'll show up here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map((req, i) => (
                <FanRequestCard key={req.id} request={req} index={i} />
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function TrackItem({
  track,
  index,
  onDelete,
  callerPrincipal,
}: {
  track: Track;
  index: number;
  onDelete: (id: string, title: string) => void;
  callerPrincipal: string | undefined;
}) {
  const coverUrl = track.coverKey?.getDirectURL();
  const avgRating =
    track.ratings.length > 0
      ? track.ratings.reduce((s, r) => s + Number(r.score), 0) /
        track.ratings.length
      : 0;

  const likeCount = track.likes.length;
  const hasLiked = callerPrincipal
    ? track.likes.some((p) => p.toString() === callerPrincipal)
    : false;
  const isOwner = callerPrincipal
    ? track.ownerId.toString() === callerPrincipal
    : false;

  const likeMutation = useLikeTrack();

  const handleLike = () => {
    if (!callerPrincipal) {
      toast.error("Sign in to like tracks");
      return;
    }
    if (isOwner) return;
    likeMutation.mutate({ trackId: track.id, liked: hasLiked });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      data-ocid={`my_tracks.item.${index + 1}`}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-gold/20 transition-all duration-200"
    >
      {/* Album art */}
      <div className="h-14 w-14 rounded-lg overflow-hidden shrink-0 bg-secondary border border-border">
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

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-bold text-foreground truncate">
          {track.title}
        </h3>
        <p className="text-sm text-muted-foreground font-ui truncate">
          {track.artist}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          <div className="flex items-center gap-1">
            <Star
              className={`h-3 w-3 ${avgRating > 0 ? "fill-gold text-gold" : "text-muted-foreground"}`}
            />
            <span className="text-xs text-muted-foreground font-ui">
              {avgRating > 0 ? avgRating.toFixed(1) : "No ratings"} ·{" "}
              {track.ratings.length}{" "}
              {track.ratings.length === 1 ? "rating" : "ratings"}
            </span>
          </div>
          {/* Like count for own tracks */}
          <div className="flex items-center gap-1">
            <Heart
              className={`h-3 w-3 ${likeCount > 0 ? "fill-red-400 text-red-400" : "text-muted-foreground"}`}
            />
            <span className="text-xs text-muted-foreground font-ui tabular-nums">
              {likeCount} {likeCount === 1 ? "like" : "likes"}
            </span>
          </div>
        </div>
      </div>

      {/* Like button (for non-owners viewing their track — rare, but included for consistency) */}
      {!isOwner && (
        <button
          type="button"
          onClick={handleLike}
          disabled={likeMutation.isPending}
          data-ocid="track.like.button"
          aria-label={hasLiked ? "Unlike track" : "Like track"}
          className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-ui font-semibold transition-all duration-200 ${
            hasLiked
              ? "text-red-400 bg-red-500/10 hover:bg-red-500/20"
              : "text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
          }`}
        >
          <Heart
            className={`h-3.5 w-3.5 ${hasLiked ? "fill-red-400 text-red-400" : ""} ${likeMutation.isPending ? "animate-pulse" : ""}`}
          />
          <span>{likeCount}</span>
        </button>
      )}

      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(track.id, track.title)}
        className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        data-ocid={`my_tracks.delete_button.${index + 1}`}
        aria-label={`Delete ${track.title}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}

export function MyTracksPage() {
  const { identity } = useInternetIdentity();
  const { data: tracks, isLoading, isError } = useOwnTracks();
  const deleteMutation = useDeleteTrack();
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const callerPrincipal = identity?.getPrincipal().toString();

  const handleDeleteRequest = (id: string, title: string) => {
    setDeleteTarget({ id, title });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`"${deleteTarget.title}" deleted`);
    } catch {
      toast.error("Failed to delete track");
    } finally {
      setDeleteTarget(null);
    }
  };

  if (!identity) {
    return (
      <main className="container py-8">
        <LoginGate message="Sign in to manage your uploaded tracks" />
      </main>
    );
  }

  return (
    <main className="container py-8 space-y-6 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-black">
          <span className="text-gold">My</span> Tracks
        </h1>
        <p className="text-muted-foreground font-ui mt-1">
          Your uploaded AI music
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3" data-ocid="my_tracks.loading_state">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
            >
              <Skeleton className="h-14 w-14 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
          data-ocid="my_tracks.error_state"
        >
          <p className="text-destructive font-ui">Failed to load your tracks</p>
        </div>
      ) : !tracks || tracks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-[30vh] gap-4 rounded-xl border border-border bg-card p-12 text-center"
          data-ocid="my_tracks.empty_state"
        >
          <div className="h-16 w-16 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20">
            <Music2 className="h-7 w-7 text-gold" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-xl">No tracks yet</h3>
            <p className="text-muted-foreground text-sm font-ui">
              Upload your first AI track to see it here
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-3" data-ocid="my_tracks.list">
          {tracks.map((track, i) => (
            <TrackItem
              key={track.id}
              track={track}
              index={i}
              onDelete={handleDeleteRequest}
              callerPrincipal={callerPrincipal}
            />
          ))}
        </div>
      )}

      {/* Fan Requests Section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <FanRequestsPanel />
      </motion.div>

      {/* Delete confirm dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent
          className="bg-card border-border"
          data-ocid="delete.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-bold">
              Delete Track
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-ui">
              Are you sure you want to delete{" "}
              <span className="text-foreground font-semibold">
                "{deleteTarget?.title}"
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="font-ui border-border"
              data-ocid="delete.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-ui font-semibold"
              data-ocid="delete.confirm_button"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
