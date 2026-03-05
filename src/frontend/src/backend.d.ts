import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface BattleVote {
    side: BattleSide;
    voterId: Principal;
}
export interface Track {
    id: string;
    region: string;
    audioFileKey: ExternalBlob;
    title: string;
    ownerId: Principal;
    city: string;
    ratings: Array<Rating>;
    description: string;
    uploadTimestamp: bigint;
    likes: Array<Principal>;
    state: string;
    genre: string;
    artist: string;
    coverKey?: ExternalBlob;
}
export interface Rating {
    raterUserId: Principal;
    score: bigint;
}
export interface Comment {
    id: string;
    authorId: Principal;
    text: string;
    trackId: string;
    timestamp: bigint;
}
export interface Playlist {
    id: string;
    ownerId: Principal;
    name: string;
    createdAt: bigint;
    trackIds: Array<string>;
    isPublic: boolean;
}
export interface MusicRequest {
    id: string;
    fromUserId: Principal;
    message: string;
    timestamp: bigint;
    toArtistId: Principal;
}
export interface AverageRating {
    track: Track;
    averageRating: number;
}
export interface RequestReply {
    requestId: string;
    artistId: Principal;
    timestamp: bigint;
    replyText: string;
}
export interface CommentReply {
    id: string;
    commentId: string;
    authorId: Principal;
    text: string;
    timestamp: bigint;
}
export interface Notification {
    id: string;
    requestId?: string;
    notifType: Variant_newTrack_requestReply;
    trackTitle: string;
    trackId: string;
    timestamp: bigint;
    replyText?: string;
    fromArtistId: Principal;
}
export interface EmailSubscriber {
    subscribedAt: bigint;
    email: string;
}
export interface Battle {
    id: string;
    status: BattleStatus;
    expiresAt?: bigint;
    winnerId?: Principal;
    votes: Array<BattleVote>;
    defenderTrackId?: string;
    challengerTrackId: string;
    createdAt: bigint;
    defenderId: Principal;
    challengerId: Principal;
    acceptedAt?: bigint;
}
export interface UserProfile {
    profilePicKey?: ExternalBlob;
    username: string;
    bgStyle: string;
    bannerKey?: ExternalBlob;
}
export enum BattleSide {
    challenger = "challenger",
    defender = "defender"
}
export enum BattleStatus {
    active = "active",
    pending = "pending",
    completed = "completed",
    declined = "declined"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_newTrack_requestReply {
    newTrack = "newTrack",
    requestReply = "requestReply"
}
export interface backendInterface {
    addComment(trackId: string, text: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createBattle(defenderArtistId: Principal, challengerTrackId: string): Promise<string>;
    createOrUpdateProfile(username: string, profilePicKey: ExternalBlob | null, bannerKey: ExternalBlob | null, bgStyle: string): Promise<void>;
    createPlaylist(name: string, trackIds: Array<string>, isPublic: boolean): Promise<string>;
    deleteComment(commentId: string): Promise<void>;
    deletePlaylist(id: string): Promise<void>;
    deleteTrack(id: string): Promise<void>;
    finalizeBattle(battleId: string): Promise<void>;
    followArtist(artistId: Principal): Promise<void>;
    getActiveBattles(): Promise<Array<Battle>>;
    getBattleById(battleId: string): Promise<Battle | null>;
    getCallerProfile(): Promise<UserProfile | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCommentsForTrack(trackId: string): Promise<Array<Comment>>;
    getEmailSubscriberCount(): Promise<bigint>;
    getEmailSubscribers(): Promise<Array<EmailSubscriber>>;
    getFollowedArtists(): Promise<Array<Principal>>;
    getFollowerCount(artistId: Principal): Promise<bigint>;
    getMusicRequestsSentByMe(): Promise<Array<MusicRequest>>;
    getMyBattles(): Promise<Array<Battle>>;
    getMyMusicRequests(): Promise<Array<MusicRequest>>;
    getMyNotifications(): Promise<Array<Notification>>;
    getMyPlaylists(): Promise<Array<Playlist>>;
    getMyRequestReplies(): Promise<Array<[MusicRequest, RequestReply | null]>>;
    getOwnTracks(): Promise<Array<Track>>;
    getPendingBattlesForMe(): Promise<Array<Battle>>;
    getPlaylistById(id: string): Promise<Playlist | null>;
    getPublicPlaylistsByOwner(owner: Principal): Promise<Array<Playlist>>;
    getRepliesForComment(commentId: string): Promise<Array<CommentReply>>;
    getReplyForRequest(requestId: string): Promise<RequestReply | null>;
    getTopThreeTracks(): Promise<Array<AverageRating>>;
    getTrackAverageRating(id: string): Promise<number>;
    getTrackById(id: string): Promise<Track | null>;
    getTracksByOwner(owner: Principal): Promise<Array<Track>>;
    getTracksFilteredByLocation(windowType: string, locationType: string, locationValue: string): Promise<Array<AverageRating>>;
    getTracksSortedByRating(): Promise<Array<AverageRating>>;
    getTracksSortedByRatingInWindow(windowType: string): Promise<Array<AverageRating>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isFollowing(artistId: Principal): Promise<boolean>;
    likeTrack(trackId: string): Promise<void>;
    markNotificationsRead(): Promise<void>;
    rateTrack(trackId: string, score: bigint): Promise<void>;
    replyToComment(commentId: string, text: string): Promise<void>;
    replyToMusicRequest(requestId: string, replyText: string): Promise<void>;
    respondToBattle(battleId: string, defenderTrackId: string, accept: boolean): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMusicRequest(toArtistId: Principal, message: string): Promise<void>;
    subscribeToEmailList(email: string): Promise<void>;
    unfollowArtist(artistId: Principal): Promise<void>;
    unlikeTrack(trackId: string): Promise<void>;
    updatePlaylist(id: string, name: string, trackIds: Array<string>, isPublic: boolean): Promise<void>;
    uploadTrack(id: string, title: string, artist: string, description: string, genre: string, audioFileKey: ExternalBlob, coverKey: ExternalBlob | null, city: string, state: string, region: string): Promise<void>;
    voteInBattle(battleId: string, side: BattleSide): Promise<void>;
}
