import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExternalBlob } from "../backend";
import type {
  AverageRating,
  Comment,
  MusicRequest,
  Notification,
  Track,
  UserProfile,
} from "../backend.d";
import { useActor } from "./useActor";

/* ── Charts ──────────────────────────────────────────── */
export function useCharts() {
  const { actor, isFetching } = useActor();
  return useQuery<AverageRating[]>({
    queryKey: ["charts"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getTracksSortedByRating();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    retryDelay: (attempt) => attempt * 1000,
  });
}

/* ── Charts in Time Window ───────────────────────────── */
export function useChartsInWindow(windowType: string) {
  const { actor, isFetching } = useActor();
  return useQuery<AverageRating[]>({
    queryKey: ["charts", windowType],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getTracksSortedByRatingInWindow(windowType);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    retryDelay: (attempt) => attempt * 1000,
  });
}

/* ── Charts Filtered by Location ─────────────────────── */
export function useChartsFilteredByLocation(
  windowType: string,
  locationType: string,
  locationValue: string,
) {
  const { actor, isFetching } = useActor();
  const isNationwideNoValue = locationType === "nationwide" && !locationValue;
  return useQuery<AverageRating[]>({
    queryKey: ["charts", windowType, locationType, locationValue],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getTracksFilteredByLocation(
          windowType,
          locationType,
          locationValue,
        );
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && !isNationwideNoValue,
    retry: 3,
    retryDelay: (attempt) => attempt * 1000,
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
      genre,
      audioBlob,
      coverBlob,
      city,
      state,
      region,
      onProgress,
    }: {
      id: string;
      title: string;
      artist: string;
      description: string;
      genre: string;
      audioBlob: ExternalBlob;
      coverBlob: ExternalBlob | null;
      city: string;
      state: string;
      region: string;
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
        genre,
        audioWithProgress,
        coverBlob,
        city,
        state,
        region,
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

/* ── Comments ────────────────────────────────────────── */
export function useComments(trackId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Comment[]>({
    queryKey: ["comments", trackId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCommentsForTrack(trackId);
    },
    enabled: !!actor && !isFetching && !!trackId,
  });
}

export function useCommentCount(trackId: string) {
  const { actor, isFetching } = useActor();
  const { data } = useQuery<Comment[]>({
    queryKey: ["comments", trackId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCommentsForTrack(trackId);
    },
    enabled: !!actor && !isFetching && !!trackId,
  });
  return data?.length ?? 0;
}

export function useUserProfile(principal: Principal | undefined) {
  const { actor, isFetching } = useActor();
  const principalStr = principal?.toString();
  return useQuery<UserProfile | null>({
    queryKey: ["user-profile", principalStr],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
    staleTime: 5 * 60 * 1000, // cache profiles for 5 minutes
  });
}

export function useAddComment(trackId: string) {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.addComment(trackId, text);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["comments", trackId] });
    },
  });
}

export function useDeleteComment(trackId: string) {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.deleteComment(commentId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["comments", trackId] });
    },
  });
}

/* ── Leaderboard ─────────────────────────────────────── */
export type LocationEntry = {
  name: string;
  trackCount: number;
  avgRating: number;
  topTrack: AverageRating;
};

export function useLeaderboardData(windowType: string) {
  const { actor, isFetching } = useActor();
  return useQuery<{ cities: LocationEntry[]; states: LocationEntry[] }>({
    queryKey: ["leaderboard", windowType],
    queryFn: async () => {
      if (!actor) return { cities: [], states: [] };

      const data =
        windowType === "alltime"
          ? await actor.getTracksSortedByRating()
          : await actor.getTracksSortedByRatingInWindow(windowType);

      // Aggregate by city
      const cityMap = new Map<string, AverageRating[]>();
      const stateMap = new Map<string, AverageRating[]>();

      for (const entry of data) {
        if (entry.track.ratings.length === 0) continue;
        const city = entry.track.city?.trim();
        const state = entry.track.state?.trim();
        if (city) {
          if (!cityMap.has(city)) cityMap.set(city, []);
          cityMap.get(city)!.push(entry);
        }
        if (state) {
          if (!stateMap.has(state)) stateMap.set(state, []);
          stateMap.get(state)!.push(entry);
        }
      }

      const toLocationEntries = (
        map: Map<string, AverageRating[]>,
      ): LocationEntry[] => {
        return Array.from(map.entries())
          .map(([name, entries]) => {
            const trackCount = entries.length;
            const avgRating =
              entries.reduce((sum, e) => sum + e.averageRating, 0) / trackCount;
            const topTrack = entries.reduce((best, e) =>
              e.averageRating > best.averageRating ? e : best,
            );
            return { name, trackCount, avgRating, topTrack };
          })
          .sort((a, b) => {
            if (b.trackCount !== a.trackCount)
              return b.trackCount - a.trackCount;
            return b.avgRating - a.avgRating;
          });
      };

      return {
        cities: toLocationEntries(cityMap),
        states: toLocationEntries(stateMap),
      };
    },
    enabled: !!actor && !isFetching,
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
      bannerBlob,
      bgStyle,
    }: {
      username: string;
      picBlob: ExternalBlob | null;
      bannerBlob: ExternalBlob | null;
      bgStyle: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.createOrUpdateProfile(username, picBlob, bannerBlob, bgStyle);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["caller-profile"] });
    },
  });
}

/* ── Like / Unlike Track ─────────────────────────────── */
export function useLikeTrack() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      trackId,
      liked,
    }: {
      trackId: string;
      liked: boolean;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      if (liked) {
        await actor.unlikeTrack(trackId);
      } else {
        await actor.likeTrack(trackId);
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["charts"] });
      void qc.invalidateQueries({ queryKey: ["own-tracks"] });
    },
  });
}

/* ── My Music Requests (inbox) ───────────────────────── */
export function useMyMusicRequests() {
  const { actor, isFetching } = useActor();
  return useQuery<MusicRequest[]>({
    queryKey: ["my-music-requests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyMusicRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

/* ── Tracks By Owner ─────────────────────────────────── */
export function useTracksByOwner(principal: Principal | undefined) {
  const { actor, isFetching } = useActor();
  const principalStr = principal?.toString();
  return useQuery<Track[]>({
    queryKey: ["tracks-by-owner", principalStr],
    queryFn: async () => {
      if (!actor || !principal) return [];
      return actor.getTracksByOwner(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

/* ── Send Music Request ──────────────────────────────── */
export function useSendMusicRequest() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      toArtistId,
      message,
    }: {
      toArtistId: Principal;
      message: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.sendMusicRequest(toArtistId, message);
    },
  });
}

/* ── Follow / Unfollow Artist ────────────────────────── */
export function useIsFollowing(artistId: Principal | undefined) {
  const { actor, isFetching } = useActor();
  const principalStr = artistId?.toString();
  return useQuery<boolean>({
    queryKey: ["is-following", principalStr],
    queryFn: async () => {
      if (!actor || !artistId) return false;
      return actor.isFollowing(artistId);
    },
    enabled: !!actor && !isFetching && !!artistId,
  });
}

export function useFollowerCount(artistId: Principal | undefined) {
  const { actor, isFetching } = useActor();
  const principalStr = artistId?.toString();
  return useQuery<bigint>({
    queryKey: ["follower-count", principalStr],
    queryFn: async () => {
      if (!actor || !artistId) return BigInt(0);
      return actor.getFollowerCount(artistId);
    },
    enabled: !!actor && !isFetching && !!artistId,
  });
}

export function useFollowArtist() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (artistId: Principal) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.followArtist(artistId);
    },
    onSuccess: (_data, artistId) => {
      const principalStr = artistId.toString();
      void qc.invalidateQueries({ queryKey: ["is-following", principalStr] });
      void qc.invalidateQueries({ queryKey: ["follower-count", principalStr] });
    },
  });
}

export function useUnfollowArtist() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (artistId: Principal) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.unfollowArtist(artistId);
    },
    onSuccess: (_data, artistId) => {
      const principalStr = artistId.toString();
      void qc.invalidateQueries({ queryKey: ["is-following", principalStr] });
      void qc.invalidateQueries({ queryKey: ["follower-count", principalStr] });
    },
  });
}

/* ── Followed Artists ────────────────────────────────── */
export function useFollowedArtists() {
  const { actor, isFetching } = useActor();
  return useQuery<Principal[]>({
    queryKey: ["followed-artists"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFollowedArtists();
    },
    enabled: !!actor && !isFetching,
  });
}

/* ── Notifications ───────────────────────────────────── */
export function useMyNotifications() {
  const { actor, isFetching } = useActor();
  return useQuery<Notification[]>({
    queryKey: ["my-notifications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyNotifications();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000, // poll every 30s for new notifications
  });
}

export function useMarkNotificationsRead() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not authenticated");
      await actor.markNotificationsRead();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-notifications"] });
    },
  });
}
