import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import type { ExternalBlob } from "../backend";
import type { backendInterface } from "../backend";
import type {
  AverageRating,
  Battle,
  BattleSide,
  Comment,
  CommentReply,
  MusicRequest,
  Notification,
  Playlist,
  RequestReply,
  Track,
  UserProfile,
} from "../backend.d";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

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
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
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
        // Fallback to all-time data if windowed query fails
        return actor.getTracksSortedByRating();
      }
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
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
        // Fallback to all-time data if location-filtered query fails
        return actor.getTracksSortedByRating();
      }
    },
    enabled: !!actor && !isFetching && !isNationwideNoValue,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
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
  const actorRef = useActor();
  const identityRef = useInternetIdentity();
  // Keep mutable refs so the mutationFn closure can read the latest values
  // without capturing stale state at the time the mutation was created.
  const actorStateRef = React.useRef(actorRef);
  actorStateRef.current = actorRef;
  const identityStateRef = React.useRef(identityRef);
  identityStateRef.current = identityRef;

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
      // Poll until we have a fully authenticated actor (up to 30 seconds).
      // This handles the race where login completes but the actor is still
      // being recreated with the authenticated identity.
      const POLL_INTERVAL = 500;
      const POLL_TIMEOUT = 30000;
      let elapsed = 0;

      const waitForAuthenticatedActor = (): Promise<backendInterface> =>
        new Promise((resolve, reject) => {
          const check = () => {
            const { actor, isFetching } = actorStateRef.current;
            const { identity, isInitializing } = identityStateRef.current;
            const isPrincipalAuthenticated =
              !!identity && !identity.getPrincipal().isAnonymous();

            // Still initializing auth -- keep waiting
            if (isInitializing) {
              elapsed += POLL_INTERVAL;
              if (elapsed >= POLL_TIMEOUT) {
                reject(
                  new Error(
                    "Sign-in is taking too long. Please refresh the page and try again.",
                  ),
                );
                return;
              }
              setTimeout(check, POLL_INTERVAL);
              return;
            }

            // Auth is done but user is not signed in
            if (!isPrincipalAuthenticated) {
              reject(
                new Error(
                  "Not authenticated. Please sign in before uploading.",
                ),
              );
              return;
            }

            // Authenticated identity confirmed -- now wait for actor
            if (!isFetching && actor) {
              // Verify the actor principal matches the identity (not stale anon actor)
              const actorPrincipalStr = identity.getPrincipal().toString();
              const isAnonymousActor = actorPrincipalStr === "2vxsx-fae";
              if (!isAnonymousActor) {
                resolve(actor as backendInterface);
                return;
              }
              // Actor is still anonymous even though identity changed -- keep waiting
            }

            elapsed += POLL_INTERVAL;
            if (elapsed >= POLL_TIMEOUT) {
              reject(
                new Error(
                  "Upload service is taking too long to connect. Please refresh the page and sign in again.",
                ),
              );
              return;
            }
            setTimeout(check, POLL_INTERVAL);
          };
          check();
        });

      const actor = await waitForAuthenticatedActor();

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

/* ── All Artists (from charts data) ─────────────────── */
export type ArtistEntry = {
  ownerId: Principal;
  artistName: string;
};

export function useAllArtists() {
  const { actor, isFetching } = useActor();
  return useQuery<ArtistEntry[]>({
    queryKey: ["all-artists"],
    queryFn: async () => {
      if (!actor) return [];
      const ratings = await actor.getTracksSortedByRating();
      const seen = new Set<string>();
      const artists: ArtistEntry[] = [];
      for (const entry of ratings) {
        const idStr = entry.track.ownerId.toString();
        if (!seen.has(idStr)) {
          seen.add(idStr);
          artists.push({
            ownerId: entry.track.ownerId,
            artistName: entry.track.artist,
          });
        }
      }
      return artists;
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

/* ── Battle Queries ──────────────────────────────────── */

export function useActiveBattles() {
  const { actor, isFetching } = useActor();
  return useQuery<Battle[]>({
    queryKey: ["active-battles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getActiveBattles();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function usePendingBattlesForMe() {
  const { actor, isFetching } = useActor();
  return useQuery<Battle[]>({
    queryKey: ["pending-battles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingBattlesForMe();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useMyBattles() {
  const { actor, isFetching } = useActor();
  return useQuery<Battle[]>({
    queryKey: ["my-battles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyBattles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateBattle() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      defenderArtistId,
      challengerTrackId,
    }: {
      defenderArtistId: Principal;
      challengerTrackId: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createBattle(defenderArtistId, challengerTrackId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["active-battles"] });
      void qc.invalidateQueries({ queryKey: ["pending-battles"] });
      void qc.invalidateQueries({ queryKey: ["my-battles"] });
    },
  });
}

export function useRespondToBattle() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      battleId,
      defenderTrackId,
      accept,
    }: {
      battleId: string;
      defenderTrackId: string;
      accept: boolean;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.respondToBattle(battleId, defenderTrackId, accept);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["active-battles"] });
      void qc.invalidateQueries({ queryKey: ["pending-battles"] });
      void qc.invalidateQueries({ queryKey: ["my-battles"] });
    },
  });
}

export function useVoteInBattle() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      battleId,
      side,
    }: {
      battleId: string;
      side: BattleSide;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.voteInBattle(battleId, side);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["active-battles"] });
      void qc.invalidateQueries({ queryKey: ["my-battles"] });
    },
  });
}

export function useFinalizeBattle() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (battleId: string) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.finalizeBattle(battleId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["active-battles"] });
      void qc.invalidateQueries({ queryKey: ["my-battles"] });
    },
  });
}

/* ── Comment Replies ─────────────────────────────────── */
export function useCommentReplies(commentId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<CommentReply[]>({
    queryKey: ["comment-replies", commentId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRepliesForComment(commentId);
    },
    enabled: !!actor && !isFetching && !!commentId,
  });
}

export function useReplyToComment(commentId: string, trackId: string) {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.replyToComment(commentId, text);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["comment-replies", commentId] });
      void qc.invalidateQueries({ queryKey: ["comments", trackId] });
    },
  });
}

/* ── Request Replies ─────────────────────────────────── */
export function useReplyToRequest() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      replyText,
    }: {
      requestId: string;
      replyText: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.replyToMusicRequest(requestId, replyText);
    },
    onSuccess: (_data, { requestId }) => {
      void qc.invalidateQueries({ queryKey: ["my-music-requests"] });
      void qc.invalidateQueries({ queryKey: ["request-reply", requestId] });
      void qc.invalidateQueries({ queryKey: ["my-request-replies"] });
    },
  });
}

export function useRequestReply(requestId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<RequestReply | null>({
    queryKey: ["request-reply", requestId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getReplyForRequest(requestId);
    },
    enabled: !!actor && !isFetching && !!requestId,
  });
}

export function useMyRequestReplies() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[MusicRequest, RequestReply | null]>>({
    queryKey: ["my-request-replies"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyRequestReplies();
    },
    enabled: !!actor && !isFetching,
  });
}

/* ── Caller Follower Count ───────────────────────────── */
export function useCallerFollowerCount() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const callerPrincipal = identity?.getPrincipal();
  return useQuery<bigint>({
    queryKey: ["follower-count", callerPrincipal?.toString()],
    queryFn: async () => {
      if (!actor || !callerPrincipal) return BigInt(0);
      return actor.getFollowerCount(callerPrincipal);
    },
    enabled: !!actor && !isFetching && !!callerPrincipal,
  });
}

/* ── Top Three Tracks ────────────────────────────────── */
export function useTopThreeTracks() {
  const { actor, isFetching } = useActor();
  return useQuery<AverageRating[]>({
    queryKey: ["topThreeTracks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTopThreeTracks();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

/* ── Caller Following List ───────────────────────────── */
export function useCallerFollowingList() {
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

/* ── Email Subscriber Count ──────────────────────────── */
export function useEmailSubscriberCount() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["email-subscriber-count"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getEmailSubscriberCount();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

/* ── Is Caller Admin ─────────────────────────────────── */
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["is-caller-admin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
    staleTime: 300_000,
  });
}

/* ── Email Subscribers List ──────────────────────────── */
export function useEmailSubscribers() {
  const { actor, isFetching } = useActor();
  return useQuery<import("../backend.d").EmailSubscriber[]>({
    queryKey: ["email-subscribers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEmailSubscribers();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

/* ── Playlists ───────────────────────────────────────── */
export function useMyPlaylists() {
  const { actor, isFetching } = useActor();
  return useQuery<Playlist[]>({
    queryKey: ["my-playlists"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyPlaylists();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePlaylistById(id: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Playlist | null>({
    queryKey: ["playlist", id],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getPlaylistById(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function usePublicPlaylistsByOwner(owner: Principal | undefined) {
  const { actor, isFetching } = useActor();
  const principalStr = owner?.toString();
  return useQuery<Playlist[]>({
    queryKey: ["public-playlists", principalStr],
    queryFn: async () => {
      if (!actor || !owner) return [];
      return actor.getPublicPlaylistsByOwner(owner);
    },
    enabled: !!actor && !isFetching && !!owner,
  });
}

export function useTrackById(id: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Track | null>({
    queryKey: ["track", id],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getTrackById(id);
    },
    enabled: !!actor && !isFetching && !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePlaylist() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      trackIds,
      isPublic,
    }: {
      name: string;
      trackIds: string[];
      isPublic: boolean;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createPlaylist(name, trackIds, isPublic);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-playlists"] });
    },
  });
}

export function useUpdatePlaylist() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      trackIds,
      isPublic,
    }: {
      id: string;
      name: string;
      trackIds: string[];
      isPublic: boolean;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.updatePlaylist(id, name, trackIds, isPublic);
    },
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: ["my-playlists"] });
      void qc.invalidateQueries({ queryKey: ["playlist", id] });
    },
  });
}

export function useDeletePlaylist() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not authenticated");
      await actor.deletePlaylist(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-playlists"] });
    },
  });
}

/* ── Claim Admin Role ────────────────────────────────── */
export function useClaimAdmin() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      if (!actor) throw new Error("Not authenticated");
      // _initializeAccessControlWithSecret is available on the raw actor
      await (
        actor as unknown as {
          _initializeAccessControlWithSecret: (token: string) => Promise<void>;
        }
      )._initializeAccessControlWithSecret(token);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["is-caller-admin"] });
      void qc.invalidateQueries({ queryKey: ["caller-role"] });
    },
  });
}
