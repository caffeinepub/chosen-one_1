import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AudioPlayerProps {
  src: string;
  className?: string;
}

// Static decorative waveform bars — generated once, stable keys
const WAVE_BARS = Array.from({ length: 48 }, (_, i) => ({
  key: i,
  h: Math.sin(i * 0.4) * 0.5 + 0.5,
}));

function formatTime(secs: number) {
  if (!Number.isFinite(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ src, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("loadedmetadata", onDurationChange);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("loadedmetadata", onDurationChange);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Reset when src changes — src is a stable string key, safe to use here
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional src reset
  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [src]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      await audio.play();
      setPlaying(true);
    }
  };

  const seek = (vals: number[]) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(duration)) return;
    audio.currentTime = vals[0]!;
    setCurrentTime(vals[0]!);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl p-4",
        "border border-gold/15 bg-gradient-to-br from-secondary/80 to-card/60",
        "shadow-[0_4px_24px_oklch(0_0_0/0.4),inset_0_1px_0_oklch(1_0_0/0.05)]",
        "backdrop-blur-sm",
        className,
      )}
    >
      {/* biome-ignore lint/a11y/useMediaCaption: audio player for music, captions not applicable */}
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Controls row */}
      <div className="flex items-center gap-4">
        {/* Larger play button with glow */}
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
          className={cn(
            "h-12 w-12 shrink-0 rounded-full flex items-center justify-center",
            "bg-gold/15 border border-gold/35 text-gold",
            "transition-all duration-200",
            "hover:bg-gold/25 hover:border-gold/60 hover:shadow-[0_0_16px_oklch(0.78_0.17_72/0.4)]",
            "active:scale-95",
            playing &&
              "bg-gold/20 border-gold/50 shadow-[0_0_12px_oklch(0.78_0.17_72/0.3)]",
          )}
        >
          {playing ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="h-5 w-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Waveform + seek overlay */}
        <div className="flex-1 flex flex-col gap-1.5">
          {/* Waveform (decorative, sits behind seek) */}
          <div className="relative">
            <div
              className="flex items-end gap-[2px] h-8 overflow-hidden rounded-sm"
              aria-hidden
            >
              {WAVE_BARS.map(({ key, h }) => {
                const barProgress = (key / 48) * 100;
                const isPast = barProgress <= progress;
                return (
                  <div
                    key={key}
                    className={cn(
                      "flex-1 rounded-full transition-colors duration-75",
                      isPast ? "bg-gold/60" : "bg-white/8",
                    )}
                    style={{ height: `${Math.max(0.15, h) * 100}%` }}
                  />
                );
              })}
            </div>
            {/* Seek slider overlaid on waveform */}
            <div className="absolute inset-x-0 bottom-0 top-0 flex items-end pb-0">
              <Slider
                min={0}
                max={duration || 1}
                step={0.1}
                value={[currentTime]}
                onValueChange={seek}
                aria-label="Seek"
                className="w-full opacity-0 hover:opacity-100 focus-within:opacity-100 h-full cursor-pointer"
              />
            </div>
          </div>

          {/* Time display */}
          <div className="flex justify-between text-xs text-muted-foreground font-ui tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={[volume]}
            onValueChange={(v) => setVolume(v[0] ?? 0.8)}
            className="w-16"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}
