import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronUp,
  Globe,
  ListMusic,
  Loader2,
  Lock,
  Music2,
  Play,
  Plus,
  Save,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { FaFacebook, FaTelegram, FaTwitter, FaWhatsapp } from "react-icons/fa";
import { toast } from "sonner";
import type { Playlist, Track } from "../backend.d";
import { LoginGate } from "../components/LoginGate";
import { usePlayer } from "../contexts/PlayerContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreatePlaylist,
  useDeletePlaylist,
  useMyPlaylists,
  useUpdatePlaylist,
} from "../hooks/useQueries";

/* ── helpers ─────────────────────────────────────────── */
function formatDate(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ── Share modal ─────────────────────────────────────── */
function SharePlaylistModal({
  playlist,
  open,
  onClose,
}: {
  playlist: Playlist;
  open: boolean;
  onClose: () => void;
}) {
  const shareUrl = `${window.location.origin}/#/playlists/${playlist.id}`;
  const shareText = `Check out "${playlist.name}" playlist on Chosen One!`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const openSocial = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="bg-card border-border max-w-sm"
        data-ocid="playlists.detail.share.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-foreground flex items-center gap-2">
            <Share2 className="h-4 w-4 text-gold" />
            Share Playlist
          </DialogTitle>
        </DialogHeader>

        <div className="mb-3">
          <p className="font-display font-bold text-sm text-foreground truncate leading-snug">
            {playlist.name}
          </p>
          <p className="text-xs font-ui text-muted-foreground mt-0.5">
            {playlist.trackIds.length}{" "}
            {playlist.trackIds.length === 1 ? "track" : "tracks"}
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-4">
          <div className="rounded-xl border border-gold/20 overflow-hidden p-2 bg-[#1a1a1a]">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(shareUrl)}&size=160x160&color=D4AF37&bgcolor=1a1a1a`}
              alt="QR code for playlist"
              width={160}
              height={160}
              className="rounded-lg"
            />
          </div>
        </div>

        {/* Copy link */}
        <div className="flex items-center gap-2 mb-4">
          <Input
            readOnly
            value={shareUrl}
            className="bg-secondary border-border text-muted-foreground text-xs font-ui h-9 flex-1"
          />
          <Button
            size="sm"
            onClick={handleCopy}
            data-ocid="playlists.detail.share.copy.button"
            className="shrink-0 h-9 bg-gold/20 hover:bg-gold/30 text-gold border border-gold/40 font-ui text-xs"
          >
            Copy
          </Button>
        </div>

        {/* Social buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              openSocial(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
              )
            }
            className="gap-2 font-ui text-xs border-border hover:border-[#1DA1F2]/40 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]"
          >
            <FaTwitter className="h-3.5 w-3.5 text-[#1DA1F2]" />
            Twitter / X
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              openSocial(
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
              )
            }
            className="gap-2 font-ui text-xs border-border hover:border-[#1877F2]/40 hover:bg-[#1877F2]/10 hover:text-[#1877F2]"
          >
            <FaFacebook className="h-3.5 w-3.5 text-[#1877F2]" />
            Facebook
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              openSocial(
                `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
              )
            }
            className="gap-2 font-ui text-xs border-border hover:border-[#25D366]/40 hover:bg-[#25D366]/10 hover:text-[#25D366]"
          >
            <FaWhatsapp className="h-3.5 w-3.5 text-[#25D366]" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              openSocial(
                `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
              )
            }
            className="gap-2 font-ui text-xs border-border hover:border-[#26A5E4]/40 hover:bg-[#26A5E4]/10 hover:text-[#26A5E4]"
          >
            <FaTelegram className="h-3.5 w-3.5 text-[#26A5E4]" />
            Telegram
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Create Playlist Dialog ──────────────────────────── */
function CreatePlaylistDialog({
  open,
  onClose,
  initialTrackIds,
}: {
  open: boolean;
  onClose: () => void;
  initialTrackIds?: string[];
}) {
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const createMutation = useCreatePlaylist();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        trackIds: initialTrackIds ?? [],
        isPublic,
      });
      toast.success("Playlist created!");
      setName("");
      setIsPublic(false);
      onClose();
    } catch {
      toast.error("Failed to create playlist");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="bg-card border-border max-w-sm"
        data-ocid="playlists.create.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-foreground flex items-center gap-2">
            <Plus className="h-4 w-4 text-gold" />
            New Playlist
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="font-ui text-xs text-muted-foreground uppercase tracking-wide">
              Playlist Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              placeholder="My Playlist"
              maxLength={60}
              autoFocus
              required
              data-ocid="playlists.create.name.input"
              className="bg-secondary border-border text-foreground font-ui focus:border-gold/50"
            />
            <p className="text-[10px] font-ui text-muted-foreground/60 text-right">
              {name.length}/60
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-4 py-3">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe className="h-4 w-4 text-gold" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-ui text-sm text-foreground">
                {isPublic ? "Public" : "Private"}
              </span>
              <span className="text-xs font-ui text-muted-foreground/60">
                {isPublic ? "Anyone can find and play" : "Only visible to you"}
              </span>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
              data-ocid="playlists.create.visibility.toggle"
              className="data-[state=checked]:bg-gold"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 font-ui border-border text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || createMutation.isPending}
              data-ocid="playlists.create.submit_button"
              className="flex-1 font-ui bg-gold/20 text-gold hover:bg-gold/30 border border-gold/40"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Playlist Track Row ──────────────────────────────── */
function PlaylistTrackRow({
  track,
  index,
  total,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  track: Track;
  index: number;
  total: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const coverUrl = track.coverKey?.getDirectURL();

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ delay: index * 0.03 }}
      data-ocid={`playlists.detail.track.item.${index + 1}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/50 bg-secondary/30 hover:border-gold/20 transition-colors group"
    >
      {/* Cover */}
      <div className="h-10 w-10 rounded-md overflow-hidden shrink-0 bg-secondary border border-border/50">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`${track.title} cover`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Music2 className="h-4 w-4 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-sm text-foreground truncate leading-tight">
          {track.title}
        </p>
        <p className="text-xs font-ui text-muted-foreground truncate">
          {track.artist}
        </p>
      </div>

      {/* Reorder + remove */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          aria-label="Move up"
          className="p-1 rounded text-muted-foreground/40 hover:text-gold hover:bg-gold/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          aria-label="Move down"
          className="p-1 rounded text-muted-foreground/40 hover:text-gold hover:bg-gold/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${track.title}`}
          className="p-1 rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

/* ── Skeleton loader for track rows ──────────────────── */
function TrackRowSkeleton({ index }: { index: number }) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/50 bg-secondary/30"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Skeleton className="h-10 w-10 rounded-md shrink-0" />
      <div className="flex-1 space-y-1.5 min-w-0">
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-2.5 w-2/5" />
      </div>
    </div>
  );
}

/* ── Playlist Detail Panel ───────────────────────────── */
function PlaylistDetail({
  playlist,
  onClose,
}: {
  playlist: Playlist;
  onClose: () => void;
}) {
  const { actor } = useActor();
  const player = usePlayer();

  const updateMutation = useUpdatePlaylist();
  const deleteMutation = useDeletePlaylist();

  // Local state for edits
  const [editName, setEditName] = useState(playlist.name);
  const [isPublic, setIsPublic] = useState(playlist.isPublic);
  const [trackOrder, setTrackOrder] = useState<string[]>(playlist.trackIds);
  const [resolvedTracks, setResolvedTracks] = useState<
    Map<string, Track | null>
  >(new Map());
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [nameInput, setNameInput] = useState(playlist.name);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focus the name input when editing starts
  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus();
    }
  }, [editingName]);

  const hasChanges =
    editName !== playlist.name ||
    isPublic !== playlist.isPublic ||
    JSON.stringify(trackOrder) !== JSON.stringify(playlist.trackIds);

  // Resolve all track IDs on mount
  useEffect(() => {
    if (!actor || playlist.trackIds.length === 0) {
      setLoadingTracks(false);
      return;
    }
    setLoadingTracks(true);
    const ids = playlist.trackIds;
    Promise.all(ids.map((id) => actor.getTrackById(id))).then((tracks) => {
      const map = new Map<string, Track | null>();
      ids.forEach((id, i) => map.set(id, tracks[i] ?? null));
      setResolvedTracks(map);
      setLoadingTracks(false);
    });
  }, [actor, playlist.trackIds]);

  // Keep order in sync if playlist prop changes
  useEffect(() => {
    setTrackOrder(playlist.trackIds);
    setEditName(playlist.name);
    setNameInput(playlist.name);
    setIsPublic(playlist.isPublic);
  }, [playlist.name, playlist.isPublic, playlist.trackIds]);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === editName) {
      setEditingName(false);
      setNameInput(editName);
      return;
    }
    setEditName(trimmed);
    setEditingName(false);
  };

  const moveTrack = (fromIdx: number, toIdx: number) => {
    setTrackOrder((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIdx, 1);
      if (item) next.splice(toIdx, 0, item);
      return next;
    });
  };

  const removeTrack = (trackId: string) => {
    setTrackOrder((prev) => prev.filter((id) => id !== trackId));
  };

  const handleSaveOrder = async () => {
    try {
      await updateMutation.mutateAsync({
        id: playlist.id,
        name: editName,
        trackIds: trackOrder,
        isPublic,
      });
      toast.success("Playlist saved!");
    } catch {
      toast.error("Failed to save playlist");
    }
  };

  const handleLoadQueue = () => {
    const tracks = trackOrder
      .map((id) => resolvedTracks.get(id))
      .filter((t): t is Track => !!t)
      .map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        audioUrl: t.audioFileKey.getDirectURL(),
        coverUrl: t.coverKey?.getDirectURL(),
      }));
    if (tracks.length === 0) {
      toast.error("No playable tracks in this playlist");
      return;
    }
    player.playAll(tracks);
    toast.success(`Playing ${tracks.length} tracks`);
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(playlist.id);
      toast.success("Playlist deleted");
      onClose();
    } catch {
      toast.error("Failed to delete playlist");
    }
  };

  const orderedTracks = trackOrder
    .map((id) => ({ id, track: resolvedTracks.get(id) ?? null }))
    .filter((item) => item.track !== undefined);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      data-ocid="playlists.detail.panel"
      className="rounded-2xl border border-gold/20 bg-card shadow-[0_8px_48px_oklch(0_0_0/0.5),0_0_0_1px_oklch(0.78_0.17_72/0.08)] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-border">
        <div className="h-12 w-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
          <ListMusic className="h-5 w-5 text-gold" />
        </div>
        <div className="flex-1 min-w-0">
          {/* Editable name */}
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                ref={nameInputRef}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value.slice(0, 60))}
                onBlur={handleSaveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") {
                    setEditingName(false);
                    setNameInput(editName);
                  }
                }}
                maxLength={60}
                data-ocid="playlists.detail.name.input"
                className="font-display font-bold text-lg text-foreground bg-transparent border-b border-gold/50 outline-none w-full pb-0.5 focus:border-gold"
              />
              <button
                type="button"
                onClick={handleSaveName}
                className="p-1 rounded text-gold hover:bg-gold/10"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingName(true);
                setNameInput(editName);
              }}
              className="font-display font-bold text-lg text-foreground hover:text-gold transition-colors text-left truncate w-full group"
              title="Click to rename"
            >
              {editName}
              <span className="ml-2 opacity-0 group-hover:opacity-50 text-xs font-ui font-normal text-muted-foreground">
                edit
              </span>
            </button>
          )}

          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-ui text-muted-foreground">
              {trackOrder.length} {trackOrder.length === 1 ? "track" : "tracks"}
            </span>
            <span className="text-muted-foreground/30">·</span>
            <span className="text-xs font-ui text-muted-foreground">
              {formatDate(playlist.createdAt)}
            </span>
          </div>
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
          aria-label="Close detail"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>

      {/* Visibility toggle */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          {isPublic ? (
            <Globe className="h-4 w-4 text-gold" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-ui text-sm text-foreground">
            {isPublic ? "Public" : "Private"}
          </span>
          <span className="text-xs font-ui text-muted-foreground/60">
            {isPublic ? "Visible to everyone" : "Only you can see this"}
          </span>
        </div>
        <Switch
          checked={isPublic}
          onCheckedChange={setIsPublic}
          data-ocid="playlists.detail.visibility.toggle"
          className="data-[state=checked]:bg-gold"
        />
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border/50 flex-wrap">
        <Button
          size="sm"
          onClick={handleLoadQueue}
          data-ocid="playlists.detail.load_queue.button"
          className="gap-2 bg-gold/15 text-gold hover:bg-gold/25 border border-gold/25 font-ui font-bold text-xs h-8"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          Play All
        </Button>

        {hasChanges && (
          <Button
            size="sm"
            onClick={handleSaveOrder}
            disabled={updateMutation.isPending}
            data-ocid="playlists.detail.save_button"
            className="gap-2 bg-secondary text-foreground hover:bg-secondary/80 border border-border font-ui text-xs h-8"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save Changes
          </Button>
        )}

        {isPublic && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShareOpen(true)}
            data-ocid="playlists.detail.share.open_modal_button"
            className="gap-2 text-muted-foreground hover:text-gold hover:bg-gold/10 font-ui text-xs h-8"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
        )}

        <div className="flex-1" />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              data-ocid="playlists.detail.delete_button"
              className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-ui text-xs h-8"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent
            className="bg-card border-border"
            data-ocid="playlists.detail.delete.dialog"
          >
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display font-bold text-foreground">
                Delete playlist?
              </AlertDialogTitle>
              <AlertDialogDescription className="font-ui text-muted-foreground">
                "{playlist.name}" will be permanently deleted. This can't be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                data-ocid="playlists.detail.delete.cancel_button"
                className="font-ui border-border text-muted-foreground hover:text-foreground"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                data-ocid="playlists.detail.delete.confirm_button"
                className="font-ui bg-destructive/20 text-destructive hover:bg-destructive/30 border border-destructive/30"
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
      </div>

      {/* Track list */}
      <ScrollArea className="max-h-[400px]">
        <div className="px-5 py-4 space-y-2">
          {loadingTracks ? (
            Array.from(
              { length: Math.min(playlist.trackIds.length, 4) },
              (_, i) => `skeleton-${i}`,
            ).map((key, i) => <TrackRowSkeleton key={key} index={i} />)
          ) : orderedTracks.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 py-10 text-center"
              data-ocid="playlists.detail.track.empty_state"
            >
              <div className="h-12 w-12 rounded-xl bg-secondary border border-border flex items-center justify-center">
                <Music2 className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-ui text-muted-foreground">
                No tracks in this playlist yet
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {orderedTracks.map(({ id, track }, idx) =>
                track ? (
                  <PlaylistTrackRow
                    key={id}
                    track={track}
                    index={idx}
                    total={orderedTracks.length}
                    onRemove={() => removeTrack(id)}
                    onMoveUp={() => moveTrack(idx, idx - 1)}
                    onMoveDown={() => moveTrack(idx, idx + 1)}
                  />
                ) : (
                  <div
                    key={id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/30 bg-secondary/10 opacity-40"
                  >
                    <div className="h-10 w-10 rounded-md bg-secondary shrink-0" />
                    <p className="text-xs font-ui text-muted-foreground">
                      Track unavailable
                    </p>
                  </div>
                ),
              )}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>

      {/* Share modal */}
      <SharePlaylistModal
        playlist={playlist}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </motion.div>
  );
}

/* ── Playlist Card ───────────────────────────────────── */
function PlaylistCard({
  playlist,
  isSelected,
  onClick,
}: {
  playlist: Playlist;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      data-ocid="playlists.card"
      className={cn(
        "w-full text-left rounded-2xl border bg-card p-4 transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
        isSelected
          ? "border-gold/40 shadow-[0_0_24px_oklch(0.78_0.17_72/0.12),0_4px_24px_oklch(0_0_0/0.4)]"
          : "border-border hover:border-gold/20 hover:shadow-[0_4px_24px_oklch(0_0_0/0.3)]",
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center mb-3 transition-colors",
          isSelected
            ? "bg-gold/15 border border-gold/30"
            : "bg-secondary border border-border",
        )}
      >
        <ListMusic
          className={cn(
            "h-5 w-5 transition-colors",
            isSelected ? "text-gold" : "text-muted-foreground",
          )}
        />
      </div>

      {/* Name */}
      <h3 className="font-display font-bold text-sm text-foreground truncate leading-tight mb-1.5">
        {playlist.name}
      </h3>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-ui text-muted-foreground tabular-nums">
          {playlist.trackIds.length}{" "}
          {playlist.trackIds.length === 1 ? "track" : "tracks"}
        </span>
        <span className="text-muted-foreground/30 text-xs">·</span>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] px-1.5 py-0 font-ui font-medium",
            playlist.isPublic
              ? "border-gold/25 text-gold/70 bg-gold/5"
              : "border-border text-muted-foreground/60",
          )}
        >
          {playlist.isPublic ? (
            <Globe className="h-2.5 w-2.5 mr-1" />
          ) : (
            <Lock className="h-2.5 w-2.5 mr-1" />
          )}
          {playlist.isPublic ? "Public" : "Private"}
        </Badge>
      </div>

      <p className="text-[10px] font-ui text-muted-foreground/50 mt-2 font-mono">
        {formatDate(playlist.createdAt)}
      </p>
    </motion.button>
  );
}

/* ── Loading skeletons ───────────────────────────────── */
function PlaylistCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <Skeleton className="h-12 w-12 rounded-xl" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────── */
export function PlaylistsPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: playlists, isLoading } = useMyPlaylists();

  const selectedPlaylist = playlists?.find((p) => p.id === selectedId) ?? null;

  if (!isAuthenticated) {
    return (
      <main className="container py-16">
        <LoginGate message="Sign in to create and manage your playlists." />
      </main>
    );
  }

  const handleSelectPlaylist = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  return (
    <main className="container py-8 max-w-5xl" data-ocid="playlists.page">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="font-display text-3xl font-black text-foreground leading-tight">
            <span className="text-gold">My</span> Playlists
          </h1>
          {playlists && playlists.length > 0 && (
            <p className="text-sm font-ui text-muted-foreground mt-1">
              {playlists.length}{" "}
              {playlists.length === 1 ? "playlist" : "playlists"}
            </p>
          )}
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          data-ocid="playlists.create.open_modal_button"
          className="gap-2 bg-gold/20 text-gold hover:bg-gold/30 border border-gold/40 font-ui font-bold"
        >
          <Plus className="h-4 w-4" />
          New Playlist
        </Button>
      </motion.div>

      {/* Grid + detail */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {["s1", "s2", "s3", "s4"].map((key) => (
            <PlaylistCardSkeleton key={key} />
          ))}
        </div>
      ) : !playlists || playlists.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card py-16 px-6 text-center"
          data-ocid="playlists.empty_state"
        >
          <div className="h-16 w-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
            <ListMusic className="h-7 w-7 text-gold/60" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-display font-bold text-xl text-foreground">
              No playlists yet
            </h2>
            <p className="text-sm font-ui text-muted-foreground max-w-xs">
              Create a playlist to save your queue and share your favorite
              tracks.
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            data-ocid="playlists.create.open_modal_button"
            className="gap-2 bg-gold/20 text-gold hover:bg-gold/30 border border-gold/40 font-ui font-bold"
          >
            <Plus className="h-4 w-4" />
            Create Your First Playlist
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Card grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                isSelected={selectedId === playlist.id}
                onClick={() => handleSelectPlaylist(playlist.id)}
              />
            ))}
          </div>

          {/* Detail panel */}
          <AnimatePresence mode="wait">
            {selectedPlaylist && (
              <PlaylistDetail
                key={selectedPlaylist.id}
                playlist={selectedPlaylist}
                onClose={() => setSelectedId(null)}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Create dialog */}
      <CreatePlaylistDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </main>
  );
}

/* ── Save Queue as Playlist Dialog (exported for GlobalPlayerBar) ── */
export function SaveQueueAsPlaylistDialog({
  open,
  onClose,
  queueTrackIds,
}: {
  open: boolean;
  onClose: () => void;
  queueTrackIds: string[];
}) {
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const createMutation = useCreatePlaylist();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        trackIds: queueTrackIds,
        isPublic,
      });
      toast.success(`Playlist "${name.trim()}" saved!`);
      setName("");
      setIsPublic(false);
      onClose();
    } catch {
      toast.error("Failed to save playlist");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="bg-card border-border max-w-sm"
        data-ocid="player.queue.save_playlist.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-foreground flex items-center gap-2">
            <Save className="h-4 w-4 text-gold" />
            Save as Playlist
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="font-ui text-xs text-muted-foreground uppercase tracking-wide">
              Playlist Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              placeholder="My Playlist"
              maxLength={60}
              autoFocus
              required
              data-ocid="player.queue.save_playlist.name.input"
              className="bg-secondary border-border text-foreground font-ui focus:border-gold/50"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-4 py-3">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe className="h-4 w-4 text-gold" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-ui text-sm text-foreground">
                {isPublic ? "Public" : "Private"}
              </span>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
              className="data-[state=checked]:bg-gold"
            />
          </div>

          <p className="text-xs font-ui text-muted-foreground/60">
            {queueTrackIds.length}{" "}
            {queueTrackIds.length === 1 ? "track" : "tracks"} will be saved
          </p>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 font-ui border-border text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || createMutation.isPending}
              data-ocid="player.queue.save_playlist.submit_button"
              className="flex-1 font-ui bg-gold/20 text-gold hover:bg-gold/30 border border-gold/40"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
