import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  ListMusic,
  Music2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { FaFacebook, FaTelegram, FaTwitter, FaWhatsapp } from "react-icons/fa";
import { toast } from "sonner";
import { type RepeatMode, usePlayer } from "../contexts/PlayerContext";
import { useLiveListeners } from "../hooks/useLiveListeners";

function formatTime(secs: number) {
  if (!Number.isFinite(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function RepeatIcon({ mode }: { mode: RepeatMode }) {
  if (mode === "one") return <Repeat1 className="h-4 w-4" />;
  return <Repeat className="h-4 w-4" />;
}

export function GlobalPlayerBar() {
  const {
    queue,
    currentIndex,
    playing,
    repeatMode,
    shuffle,
    currentTime,
    duration,
    volume,
    next,
    prev,
    togglePlay,
    seek,
    setVolume,
    setRepeat,
    toggleShuffle,
    removeFromQueue,
    jumpTo,
  } = usePlayer();

  const [queueOpen, setQueueOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;
  const listenerCount = useLiveListeners(currentTrack?.id ?? "");

  const shareUrl = currentTrack
    ? `${window.location.origin}/#/track/${currentTrack.id}`
    : "";
  const shareText = currentTrack
    ? `Check out '${currentTrack.title}' by ${currentTrack.artist} on Chosen One!`
    : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const openSocial = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  if (queue.length === 0) return null;

  const progress = duration > 0 ? currentTime : 0;

  const cycleRepeat = () => {
    const next: RepeatMode =
      repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
    setRepeat(next);
  };

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-card border-t border-border shadow-[0_-4px_32px_oklch(0_0_0/0.5)]"
      data-ocid="player.panel"
    >
      {/* Seek bar — full width at very top of bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-border/40 group cursor-pointer">
        <Slider
          min={0}
          max={duration || 1}
          step={0.5}
          value={[progress]}
          onValueChange={([v]) => seek(v ?? 0)}
          aria-label="Seek"
          data-ocid="player.seek.input"
          className="absolute inset-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity h-full"
        />
        <div
          className="h-full bg-gradient-to-r from-gold/80 to-gold transition-all duration-150"
          style={{
            width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
          }}
        />
      </div>

      <div className="h-full flex items-center px-4 gap-4">
        {/* ── Left: Track info ─────────────────────────────── */}
        <div className="flex items-center gap-3 min-w-0 w-48 shrink-0">
          {/* Cover art */}
          <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 bg-secondary border border-gold/20 shadow-[0_0_8px_oklch(0.78_0.17_72/0.15)]">
            {currentTrack?.coverUrl ? (
              <img
                src={currentTrack.coverUrl}
                alt={`${currentTrack.title} cover`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gold/10 via-secondary to-secondary">
                <Music2 className="h-5 w-5 text-gold/50" />
              </div>
            )}
          </div>

          {/* Track name + artist */}
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold text-sm text-foreground truncate leading-tight">
              {currentTrack?.title ?? "No track"}
            </p>
            <p className="text-xs text-muted-foreground font-ui truncate mt-0.5">
              {currentTrack?.artist ?? ""}
            </p>
            {currentTrack && playing && (
              <div
                className="flex items-center gap-1 mt-0.5"
                data-ocid="player.live_listeners.panel"
              >
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                </span>
                <span className="text-xs font-ui text-green-400/90 tabular-nums">
                  {listenerCount.toLocaleString()} listening
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Center: Controls ─────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center gap-1">
          {/* Playback buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous track"
              data-ocid="player.prev_button"
              className="text-muted-foreground hover:text-foreground transition-colors duration-150 p-1.5 rounded-lg hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Play"}
              data-ocid={playing ? "player.pause_button" : "player.play_button"}
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                "bg-gold/20 border border-gold/40 text-gold",
                "transition-all duration-200 hover:bg-gold/30 hover:border-gold/60",
                "hover:shadow-[0_0_16px_oklch(0.78_0.17_72/0.4)] active:scale-95",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
                playing && "shadow-[0_0_12px_oklch(0.78_0.17_72/0.3)]",
              )}
            >
              {playing ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={next}
              aria-label="Next track"
              data-ocid="player.next_button"
              className="text-muted-foreground hover:text-foreground transition-colors duration-150 p-1.5 rounded-lg hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          {/* Time display */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-ui tabular-nums hidden sm:flex">
            <span>{formatTime(currentTime)}</span>
            <span className="text-muted-foreground/40">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* ── Right: Shuffle, Repeat, Volume, Queue ────────── */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Shuffle */}
          <button
            type="button"
            onClick={toggleShuffle}
            aria-label={shuffle ? "Disable shuffle" : "Enable shuffle"}
            aria-pressed={shuffle}
            data-ocid="player.shuffle.toggle"
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
              shuffle
                ? "text-gold bg-gold/10 hover:bg-gold/20"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            <Shuffle className="h-4 w-4" />
          </button>

          {/* Repeat */}
          <button
            type="button"
            onClick={cycleRepeat}
            aria-label={
              repeatMode === "off"
                ? "Enable repeat all"
                : repeatMode === "all"
                  ? "Enable repeat one"
                  : "Disable repeat"
            }
            aria-pressed={repeatMode !== "off"}
            data-ocid="player.repeat.toggle"
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
              repeatMode !== "off"
                ? "text-gold bg-gold/10 hover:bg-gold/20"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )}
          >
            <RepeatIcon mode={repeatMode} />
          </button>

          {/* Volume — hidden on mobile */}
          <div className="hidden md:flex items-center gap-2">
            <Volume2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[volume]}
              onValueChange={([v]) => setVolume(v ?? 0.8)}
              aria-label="Volume"
              data-ocid="player.volume.input"
              className="w-20"
            />
          </div>

          {/* Queue panel */}
          <Sheet open={queueOpen} onOpenChange={setQueueOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Open queue"
                data-ocid="player.queue.open_modal_button"
                className={cn(
                  "gap-1.5 font-ui text-xs h-8 px-2",
                  "text-muted-foreground hover:text-gold hover:bg-gold/10",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
                  queueOpen && "text-gold bg-gold/10",
                )}
              >
                <ListMusic className="h-4 w-4" />
                <span className="hidden sm:inline">{queue.length}</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-80 sm:w-96 bg-card border-border p-0 flex flex-col"
              data-ocid="player.queue.panel"
            >
              <SheetHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
                <SheetTitle className="font-display font-bold text-foreground flex items-center gap-2">
                  <ListMusic className="h-4 w-4 text-gold" />
                  Queue
                  <span className="text-gold font-ui font-semibold text-sm ml-1">
                    ({queue.length} {queue.length === 1 ? "track" : "tracks"})
                  </span>
                </SheetTitle>
              </SheetHeader>

              <ScrollArea className="flex-1">
                <div className="py-2">
                  {queue.map((track, idx) => {
                    const isActive = idx === currentIndex;
                    const ocidItem = `player.queue.item.${idx + 1}` as const;
                    const ocidDel =
                      `player.queue.item.delete_button.${idx + 1}` as const;

                    return (
                      <div
                        key={`${track.id}-${idx}`}
                        data-ocid={ocidItem}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 group transition-colors duration-150",
                          isActive
                            ? "bg-gold/10 border-r-2 border-gold"
                            : "hover:bg-secondary/60",
                        )}
                      >
                        {/* Clickable row area */}
                        <button
                          type="button"
                          onClick={() => jumpTo(idx)}
                          aria-label={`Play ${track.title}`}
                          aria-current={isActive ? "true" : undefined}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 rounded"
                        >
                          {/* Cover */}
                          <div className="h-10 w-10 rounded-md overflow-hidden shrink-0 bg-secondary border border-border">
                            {track.coverUrl ? (
                              <img
                                src={track.coverUrl}
                                alt={`${track.title} cover`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Music2 className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Track info */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "font-display font-bold text-sm truncate leading-tight",
                                isActive ? "text-gold" : "text-foreground",
                              )}
                            >
                              {track.title}
                            </p>
                            <p className="text-xs text-muted-foreground font-ui truncate">
                              {track.artist}
                            </p>
                          </div>
                        </button>

                        {/* Playing indicator or track number */}
                        {isActive ? (
                          <div className="flex items-center gap-0.5 shrink-0">
                            {[0, 1, 2].map((b) => (
                              <div
                                key={b}
                                className="w-0.5 bg-gold rounded-full animate-pulse"
                                style={{
                                  height: `${10 + b * 4}px`,
                                  animationDelay: `${b * 0.15}s`,
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50 font-ui tabular-nums shrink-0 w-5 text-right group-hover:hidden">
                            {idx + 1}
                          </span>
                        )}

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeFromQueue(idx)}
                          aria-label={`Remove ${track.title} from queue`}
                          data-ocid={ocidDel}
                          className={cn(
                            "p-1 rounded-md transition-all duration-150 shrink-0",
                            "text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10",
                            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive/50",
                            isActive
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100",
                          )}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* Share button */}
          {currentTrack && (
            <>
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                aria-label="Share current track"
                data-ocid="player.share.open_modal_button"
                className={cn(
                  "p-1.5 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
                  "text-muted-foreground hover:text-gold hover:bg-gold/10",
                )}
              >
                <Share2 className="h-4 w-4" />
              </button>

              <Dialog open={shareOpen} onOpenChange={setShareOpen}>
                <DialogContent
                  className="bg-card border-border max-w-sm"
                  data-ocid="player.share.dialog"
                >
                  <DialogHeader>
                    <DialogTitle className="font-display font-bold text-foreground">
                      Share Track
                    </DialogTitle>
                  </DialogHeader>

                  {/* Track info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 bg-secondary border border-gold/20">
                      {currentTrack.coverUrl ? (
                        <img
                          src={currentTrack.coverUrl}
                          alt={`${currentTrack.title} cover`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-gold/10 via-secondary to-secondary">
                          <Music2 className="h-5 w-5 text-gold/50" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-bold text-sm text-foreground truncate leading-tight">
                        {currentTrack.title}
                      </p>
                      <p className="text-xs text-muted-foreground font-ui truncate mt-0.5">
                        {currentTrack.artist}
                      </p>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center mb-4">
                    <div className="rounded-xl border border-gold/20 overflow-hidden p-2 bg-[#1a1a1a]">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(shareUrl)}&size=180x180&color=D4AF37&bgcolor=1a1a1a`}
                        alt="QR code for track"
                        width={180}
                        height={180}
                        className="rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Copy link */}
                  <div className="flex items-center gap-2 mb-4">
                    <Input
                      readOnly
                      value={shareUrl}
                      data-ocid="player.share.copy_link.input"
                      className="bg-secondary border-border text-muted-foreground text-xs font-ui h-9 flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleCopyLink}
                      data-ocid="player.share.copy_link.button"
                      className="shrink-0 h-9 bg-gold/20 hover:bg-gold/30 text-gold border border-gold/40 hover:border-gold/60 font-ui text-xs"
                    >
                      Copy
                    </Button>
                  </div>

                  {/* Social share buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        openSocial(
                          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
                        )
                      }
                      data-ocid="player.share.twitter.button"
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
                      data-ocid="player.share.facebook.button"
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
                      data-ocid="player.share.whatsapp.button"
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
                      data-ocid="player.share.telegram.button"
                      className="gap-2 font-ui text-xs border-border hover:border-[#26A5E4]/40 hover:bg-[#26A5E4]/10 hover:text-[#26A5E4]"
                    >
                      <FaTelegram className="h-3.5 w-3.5 text-[#26A5E4]" />
                      Telegram
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
