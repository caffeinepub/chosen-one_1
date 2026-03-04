import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExternalBlob } from "../backend";
import type { AverageRating, Track, UserProfile } from "../backend.d";
import { useActor } from "./useActor";

/* ── Charts ──────────────────────────────────────────── */
export function useCharts() {
  const { actor, isFetching } = useActor();
  return useQuery<AverageRating[]>({
    queryKey: ["charts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTracksSortedByRating();
    },
    enabled: !!actor && !isFetching,
  });
}

/* ── Own Tracks ──────────────────────────────────────── */
export function useOwnTracks() {
  const { actor, isFetching } = useActor();
  return useQuery<Track[]>({
    queryKey: ["own-tracks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOwnTracks();
    },
    enabled: !!actor && !isFetching,
  });
}

/* ── Caller Profile ──────────────────────────────────── */
export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["caller-profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

/* ── Upload Track ────────────────────────────────────── */
export function useUploadTrack() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      title,
      artist,
      description,
      audioBlob,
      coverBlob,
      onProgress,
    }: {
      id: string;
      title: string;
      artist: string;
      description: string;
      audioBlob: ExternalBlob;
      coverBlob: ExternalBlob | null;
      onProgress?: (pct: number) => void;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      const audioWithProgress = onProgress
        ? audioBlob.withUploadProgress(onProgress)
        : audioBlob;
      await actor.uploadTrack(
        id,
        title,
        artist,
        description,
        audioWithProgress,
        coverBlob,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["charts"] });
      void qc.invalidateQueries({ queryKey: ["own-tracks"] });
    },
  });
}

/* ── Delete Track ────────────────────────────────────── */
export function useDeleteTrack() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.deleteTrack(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["charts"] });
      void qc.invalidateQueries({ queryKey: ["own-tracks"] });
    },
  });
}

/* ── Rate Track ──────────────────────────────────────── */
export function useRateTrack() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      trackId,
      score,
    }: {
      trackId: string;
      score: number;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.rateTrack(trackId, BigInt(score));
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["charts"] });
      void qc.invalidateQueries({ queryKey: ["own-tracks"] });
    },
  });
}

/* ── Save Profile ────────────────────────────────────── */
export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      username,
      picBlob,
    }: {
      username: string;
      picBlob: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.createOrUpdateProfile(username, picBlob);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["caller-profile"] });
    },
  });
}
