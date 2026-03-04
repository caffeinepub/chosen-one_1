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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Music2, Star, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Track } from "../backend.d";
import { LoginGate } from "../components/LoginGate";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useDeleteTrack, useOwnTracks } from "../hooks/useQueries";

function TrackItem({
  track,
  index,
  onDelete,
}: {
  track: Track;
  index: number;
  onDelete: (id: string, title: string) => void;
}) {
  const coverUrl = track.coverKey?.getDirectURL();
  const avgRating =
    track.ratings.length > 0
      ? track.ratings.reduce((s, r) => s + Number(r.score), 0) /
        track.ratings.length
      : 0;

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
        <div className="flex items-center gap-1 mt-0.5">
          <Star
            className={`h-3 w-3 ${avgRating > 0 ? "fill-gold text-gold" : "text-muted-foreground"}`}
          />
          <span className="text-xs text-muted-foreground font-ui">
            {avgRating > 0 ? avgRating.toFixed(1) : "No ratings"} ·{" "}
            {track.ratings.length}{" "}
            {track.ratings.length === 1 ? "rating" : "ratings"}
          </span>
        </div>
      </div>

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
            />
          ))}
        </div>
      )}

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
