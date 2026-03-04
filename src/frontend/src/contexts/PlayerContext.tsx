import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type QueueTrack = {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl?: string;
};

export type RepeatMode = "off" | "all" | "one";

interface PlayerContextValue {
  queue: QueueTrack[];
  currentIndex: number;
  playing: boolean;
  repeatMode: RepeatMode;
  shuffle: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  // Actions
  playTrack: (track: QueueTrack, contextQueue?: QueueTrack[]) => void;
  playAll: (tracks: QueueTrack[]) => void;
  enqueue: (track: QueueTrack) => void;
  next: () => void;
  prev: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  setRepeat: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  removeFromQueue: (idx: number) => void;
  jumpTo: (idx: number) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return ctx;
}

function formatShuffledQueue(
  tracks: QueueTrack[],
  activeTrack: QueueTrack,
): QueueTrack[] {
  const others = tracks.filter((t) => t.id !== activeTrack.id);
  const shuffled = [...others].sort(() => Math.random() - 0.5);
  return [activeTrack, ...shuffled];
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<QueueTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [repeatMode, setRepeatModeState] = useState<RepeatMode>("off");
  const [shuffle, setShuffle] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);

  // Create audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.8;
    audio.preload = "metadata";
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => {
      // handled via state in a separate effect
      setPlaying(false);
      setCurrentTime(0);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("loadedmetadata", onDurationChange);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("loadedmetadata", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Advance logic when a track ends
  const repeatModeRef = useRef(repeatMode);
  repeatModeRef.current = repeatMode;
  const queueRef = useRef(queue);
  queueRef.current = queue;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  // When audio ends, determine what to do
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      const rMode = repeatModeRef.current;
      const q = queueRef.current;
      const idx = currentIndexRef.current;

      if (rMode === "one") {
        // Replay the current track
        audio.currentTime = 0;
        audio.play().catch(() => {});
        setPlaying(true);
        setCurrentTime(0);
      } else if (idx < q.length - 1) {
        // Advance to next
        const nextIdx = idx + 1;
        setCurrentIndex(nextIdx);
        audio.src = q[nextIdx]!.audioUrl;
        audio.currentTime = 0;
        setCurrentTime(0);
        setDuration(0);
        audio.play().catch(() => {});
        setPlaying(true);
      } else if (rMode === "all" && q.length > 0) {
        // Loop back to start
        setCurrentIndex(0);
        audio.src = q[0]!.audioUrl;
        audio.currentTime = 0;
        setCurrentTime(0);
        setDuration(0);
        audio.play().catch(() => {});
        setPlaying(true);
      } else {
        // Stop
        setPlaying(false);
        setCurrentTime(0);
      }
    };

    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, []);

  // Load track when index/queue changes
  const loadAndPlay = useCallback(
    (trackList: QueueTrack[], idx: number, autoplay = true) => {
      const audio = audioRef.current;
      if (!audio || idx < 0 || idx >= trackList.length) return;
      const track = trackList[idx]!;
      audio.pause();
      audio.src = track.audioUrl;
      audio.currentTime = 0;
      setCurrentTime(0);
      setDuration(0);
      if (autoplay) {
        audio.play().catch(() => {});
        setPlaying(true);
      } else {
        setPlaying(false);
      }
    },
    [],
  );

  const playTrack = useCallback(
    (track: QueueTrack, contextQueue?: QueueTrack[]) => {
      const baseQueue =
        contextQueue && contextQueue.length > 0 ? contextQueue : [track];
      let newQueue: QueueTrack[];
      let targetIdx: number;

      if (shuffle) {
        newQueue = formatShuffledQueue(baseQueue, track);
        targetIdx = 0;
      } else {
        newQueue = baseQueue;
        targetIdx = newQueue.findIndex((t) => t.id === track.id);
        if (targetIdx === -1) {
          newQueue = [track, ...baseQueue];
          targetIdx = 0;
        }
      }

      setQueue(newQueue);
      setCurrentIndex(targetIdx);
      loadAndPlay(newQueue, targetIdx, true);
    },
    [shuffle, loadAndPlay],
  );

  const playAll = useCallback(
    (tracks: QueueTrack[]) => {
      if (tracks.length === 0) return;
      let newQueue: QueueTrack[];
      if (shuffle) {
        newQueue = [...tracks].sort(() => Math.random() - 0.5);
      } else {
        newQueue = tracks;
      }
      setQueue(newQueue);
      setCurrentIndex(0);
      loadAndPlay(newQueue, 0, true);
    },
    [shuffle, loadAndPlay],
  );

  const enqueue = useCallback((track: QueueTrack) => {
    setQueue((prev) => {
      // Don't add duplicates
      if (prev.some((t) => t.id === track.id)) return prev;
      return [...prev, track];
    });
  }, []);

  const next = useCallback(() => {
    const q = queueRef.current;
    const idx = currentIndexRef.current;
    const audio = audioRef.current;
    if (!audio || q.length === 0) return;

    let nextIdx: number;
    if (idx < q.length - 1) {
      nextIdx = idx + 1;
    } else if (repeatModeRef.current === "all") {
      nextIdx = 0;
    } else {
      return;
    }

    setCurrentIndex(nextIdx);
    loadAndPlay(q, nextIdx, true);
  }, [loadAndPlay]);

  const prev = useCallback(() => {
    const q = queueRef.current;
    const idx = currentIndexRef.current;
    const audio = audioRef.current;
    if (!audio || q.length === 0) return;

    // If more than 3 seconds in, restart current track
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    const prevIdx =
      idx > 0 ? idx - 1 : repeatModeRef.current === "all" ? q.length - 1 : 0;
    setCurrentIndex(prevIdx);
    loadAndPlay(q, prevIdx, true);
  }, [loadAndPlay]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || queue.length === 0) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [playing, queue.length]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((v: number) => {
    const audio = audioRef.current;
    if (audio) audio.volume = v;
    setVolumeState(v);
  }, []);

  const setRepeat = useCallback((mode: RepeatMode) => {
    setRepeatModeState(mode);
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => {
      const newShuffle = !prev;
      if (newShuffle && queueRef.current.length > 0) {
        const idx = currentIndexRef.current;
        const currentTrack = queueRef.current[idx];
        if (currentTrack) {
          const shuffled = formatShuffledQueue(queueRef.current, currentTrack);
          setQueue(shuffled);
          setCurrentIndex(0);
        }
      }
      return newShuffle;
    });
  }, []);

  const removeFromQueue = useCallback((idx: number) => {
    setQueue((prev) => {
      const newQueue = prev.filter((_, i) => i !== idx);
      const curIdx = currentIndexRef.current;
      if (idx < curIdx) {
        setCurrentIndex(curIdx - 1);
      } else if (idx === curIdx) {
        // If removing current track, load next (or prev if last)
        const audio = audioRef.current;
        if (audio) {
          if (newQueue.length === 0) {
            audio.pause();
            audio.src = "";
            setPlaying(false);
            setCurrentIndex(-1);
          } else {
            const nextIdx = Math.min(curIdx, newQueue.length - 1);
            setCurrentIndex(nextIdx);
            audio.src = newQueue[nextIdx]!.audioUrl;
            audio.currentTime = 0;
            audio.play().catch(() => {});
            setPlaying(true);
          }
        }
      }
      return newQueue;
    });
  }, []);

  const jumpTo = useCallback(
    (idx: number) => {
      const q = queueRef.current;
      if (idx < 0 || idx >= q.length) return;
      setCurrentIndex(idx);
      loadAndPlay(q, idx, true);
    },
    [loadAndPlay],
  );

  return (
    <PlayerContext.Provider
      value={{
        queue,
        currentIndex,
        playing,
        repeatMode,
        shuffle,
        currentTime,
        duration,
        volume,
        playTrack,
        playAll,
        enqueue,
        next,
        prev,
        togglePlay,
        seek,
        setVolume,
        setRepeat,
        toggleShuffle,
        removeFromQueue,
        jumpTo,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
