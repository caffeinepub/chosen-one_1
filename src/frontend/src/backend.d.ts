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
export interface AverageRating {
    track: Track;
    averageRating: number;
}
export interface Track {
    id: string;
    audioFileKey: ExternalBlob;
    title: string;
    ownerId: Principal;
    ratings: Array<Rating>;
    description: string;
    uploadTimestamp: bigint;
    artist: string;
    coverKey?: ExternalBlob;
}
export interface Rating {
    raterUserId: Principal;
    score: bigint;
}
export interface UserProfile {
    profilePicKey?: ExternalBlob;
    username: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createOrUpdateProfile(username: string, profilePicKey: ExternalBlob | null): Promise<void>;
    deleteTrack(id: string): Promise<void>;
    getCallerProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getOwnTracks(): Promise<Array<Track>>;
    getTrackAverageRating(id: string): Promise<number>;
    getTrackById(id: string): Promise<Track | null>;
    getTracksSortedByRating(): Promise<Array<AverageRating>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    rateTrack(trackId: string, score: bigint): Promise<void>;
    uploadTrack(id: string, title: string, artist: string, description: string, audioFileKey: ExternalBlob, coverKey: ExternalBlob | null): Promise<void>;
}
