import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { Principal } from "@icp-sdk/core/principal";
import {
  CheckCircle2,
  ChevronDown,
  CornerDownRight,
  Image,
  ImagePlus,
  Loader2,
  MessageSquare,
  User,
  UserX,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { MusicRequest } from "../backend.d";
import { LoginGate } from "../components/LoginGate";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCallerFollowerCount,
  useCallerFollowingList,
  useCallerProfile,
  useMyMusicRequests,
  useReplyToRequest,
  useRequestReply,
  useSaveProfile,
  useUnfollowArtist,
  useUserProfile,
} from "../hooks/useQueries";

type BgStyle = "dark" | "purple" | "blue" | "gold" | "neon" | "sunset";

const BG_STYLES: { id: BgStyle; label: string; css: string; swatch: string }[] =
  [
    {
      id: "dark",
      label: "Void",
      css: "background: oklch(0.12 0.01 260)",
      swatch: "oklch(0.12 0.01 260)",
    },
    {
      id: "purple",
      label: "Purple",
      css: "background: linear-gradient(135deg, oklch(0.15 0.08 290), oklch(0.22 0.12 280))",
      swatch: "oklch(0.18 0.1 285)",
    },
    {
      id: "blue",
      label: "Blue",
      css: "background: linear-gradient(135deg, oklch(0.14 0.07 250), oklch(0.2 0.1 240))",
      swatch: "oklch(0.17 0.085 245)",
    },
    {
      id: "gold",
      label: "Gold",
      css: "background: linear-gradient(135deg, oklch(0.16 0.08 70), oklch(0.22 0.12 60))",
      swatch: "oklch(0.19 0.1 65)",
    },
    {
      id: "neon",
      label: "Neon",
      css: "background: linear-gradient(135deg, oklch(0.13 0.07 160), oklch(0.18 0.1 150))",
      swatch: "oklch(0.155 0.085 155)",
    },
    {
      id: "sunset",
      label: "Sunset",
      css: "background: linear-gradient(135deg, oklch(0.18 0.1 30), oklch(0.22 0.12 350))",
      swatch: "oklch(0.2 0.11 10)",
    },
  ];

function getBgStyle(id: BgStyle): React.CSSProperties {
  const found = BG_STYLES.find((s) => s.id === id);
  if (!found) return {};
  const css = found.css;
  if (css.startsWith("background: linear-gradient")) {
    return { background: css.replace("background: ", "") };
  }
  return { background: css.replace("background: ", "") };
}

/* ── Relative time helper ─────────────────────────── */
function timeAgo(timestampNs: bigint): string {
  const ms = Number(timestampNs / 1_000_000n);
  const diff = Date.now() - ms;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

/* ── Following Row ────────────────────────────────── */
function FollowingRow({
  artistId,
  index,
}: {
  artistId: Principal;
  index: number;
}) {
  const { data: profile } = useUserProfile(artistId);
  const unfollowMutation = useUnfollowArtist();

  const handleUnfollow = async () => {
    try {
      await unfollowMutation.mutateAsync(artistId);
      toast.success(`Unfollowed ${profile?.username ?? "artist"}`);
    } catch {
      toast.error("Failed to unfollow");
    }
  };

  const picUrl = profile?.profilePicKey?.getDirectURL();
  const initials = profile?.username
    ? profile.username.slice(0, 1).toUpperCase()
    : "?";

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3"
    >
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={picUrl} />
        <AvatarFallback className="bg-secondary text-gold text-sm font-display font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-ui font-semibold text-sm text-foreground truncate">
          {profile?.username ?? (
            <span className="text-muted-foreground font-mono text-xs">
              {artistId.toString().slice(0, 12)}…
            </span>
          )}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleUnfollow}
        disabled={unfollowMutation.isPending}
        data-ocid={`profile.unfollow.button.${index + 1}`}
        className="shrink-0 gap-1.5 font-ui text-xs border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 h-7 px-2.5"
      >
        {unfollowMutation.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <UserX className="h-3 w-3" />
        )}
        Unfollow
      </Button>
    </motion.div>
  );
}

/* ── Fan Request Card (with reply) ───────────────── */
function FanRequestCard({
  request,
  index,
}: {
  request: MusicRequest;
  index: number;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const replyMutation = useReplyToRequest();
  const { data: existingReply } = useRequestReply(request.id);

  const fromStr = request.fromUserId.toString();
  const shortPrincipal = `${fromStr.slice(0, 8)}…${fromStr.slice(-4)}`;

  const handleSendReply = async () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    try {
      await replyMutation.mutateAsync({
        requestId: request.id,
        replyText: trimmed,
      });
      toast.success("Reply sent!");
      setReplyText("");
      setReplyOpen(false);
    } catch {
      toast.error("Failed to send reply");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      data-ocid={`profile.fan_requests.item.${index + 1}`}
      className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
            <MessageSquare className="h-3.5 w-3.5 text-gold" />
          </div>
          <span className="text-xs font-ui text-muted-foreground font-mono">
            {shortPrincipal}
          </span>
        </div>
        <span className="text-xs text-muted-foreground/60 font-ui shrink-0">
          {timeAgo(request.timestamp)}
        </span>
      </div>

      {/* Message */}
      <p className="text-sm font-ui text-foreground/90 leading-relaxed pl-9">
        {request.message}
      </p>

      {/* Existing reply display */}
      {existingReply && (
        <div className="ml-9 rounded-lg border border-gold/20 bg-gold/5 px-3 py-2.5 space-y-1">
          <div className="flex items-center gap-1.5">
            <CornerDownRight className="h-3 w-3 text-gold shrink-0" />
            <span className="text-xs text-gold font-ui font-semibold">
              Your Reply · {timeAgo(existingReply.timestamp)}
            </span>
          </div>
          <p className="text-sm text-foreground/80 font-ui leading-relaxed">
            {existingReply.replyText}
          </p>
        </div>
      )}

      {/* Reply form */}
      {replyOpen && (
        <div className="ml-9 space-y-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write your reply…"
            rows={2}
            maxLength={500}
            data-ocid={`profile.reply.textarea.${index + 1}`}
            className="resize-none bg-secondary/50 border-border text-sm font-ui placeholder:text-muted-foreground/50 focus-visible:ring-gold/40 focus-visible:border-gold/30"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!replyText.trim() || replyMutation.isPending}
              onClick={handleSendReply}
              data-ocid={`profile.reply.submit_button.${index + 1}`}
              className="bg-gold/15 text-gold hover:bg-gold/25 border border-gold/25 font-ui font-semibold h-7 px-3 text-xs"
            >
              {replyMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Send Reply"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setReplyOpen(false);
                setReplyText("");
              }}
              className="h-7 px-2 text-xs text-muted-foreground font-ui hover:text-foreground"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Reply button */}
      {!replyOpen && (
        <div className="flex justify-end pl-9">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setReplyOpen(true)}
            data-ocid={`profile.fan_requests.reply.button.${index + 1}`}
            className="h-7 px-2.5 gap-1.5 text-xs font-ui text-muted-foreground hover:text-gold hover:bg-gold/10"
          >
            <CornerDownRight className="h-3 w-3" />
            {existingReply ? "Edit Reply" : "Reply"}
          </Button>
        </div>
      )}
    </motion.div>
  );
}

/* ── Following Panel ──────────────────────────────── */
function FollowingPanel() {
  const [open, setOpen] = useState(false);
  const { data: followedArtists, isLoading } = useCallerFollowingList();
  const count = followedArtists?.length ?? 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          data-ocid="profile.following.panel"
          className="w-full flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:border-gold/20 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 text-gold" />
            </div>
            <div className="text-left">
              <p className="font-display font-bold text-sm text-foreground">
                Following
              </p>
              <p className="text-xs text-muted-foreground font-ui">
                Artists you follow
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {count > 0 && (
              <span className="text-xs font-ui font-semibold text-gold bg-gold/10 border border-gold/20 rounded-full px-2 py-0.5">
                {count}
              </span>
            )}
            <ChevronDown
              className="h-4 w-4 text-muted-foreground transition-transform duration-200"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-3 space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3"
                >
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-32 flex-1" />
                  <Skeleton className="h-7 w-20 shrink-0" />
                </div>
              ))}
            </div>
          ) : !followedArtists || followedArtists.length === 0 ? (
            <div
              className="rounded-xl border border-border bg-card p-6 text-center"
              data-ocid="profile.following.empty_state"
            >
              <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-ui text-muted-foreground">
                You're not following anyone yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {followedArtists.map((artistId, i) => (
                <FollowingRow
                  key={artistId.toString()}
                  artistId={artistId}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ── Fan Requests Panel (profile version) ─────────── */
function ProfileFanRequestsPanel() {
  const [open, setOpen] = useState(false);
  const { data: requests, isLoading } = useMyMusicRequests();
  const count = requests?.length ?? 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          data-ocid="profile.fan_requests.panel"
          className="w-full flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:border-gold/20 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
              <MessageSquare className="h-4 w-4 text-gold" />
            </div>
            <div className="text-left">
              <p className="font-display font-bold text-sm text-foreground">
                Fan Requests
              </p>
              <p className="text-xs text-muted-foreground font-ui">
                Music requests from your fans — reply directly
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {count > 0 && (
              <span className="text-xs font-ui font-semibold text-gold bg-gold/10 border border-gold/20 rounded-full px-2 py-0.5">
                {count}
              </span>
            )}
            <ChevronDown
              className="h-4 w-4 text-muted-foreground transition-transform duration-200"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-3 space-y-2">
          {isLoading ? (
            <div
              className="space-y-2"
              data-ocid="profile.fan_requests.loading_state"
            >
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-full ml-9" />
                </div>
              ))}
            </div>
          ) : !requests || requests.length === 0 ? (
            <div
              className="rounded-xl border border-border bg-card p-8 text-center"
              data-ocid="profile.fan_requests.empty_state"
            >
              <div className="h-12 w-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-5 w-5 text-gold" />
              </div>
              <p className="font-display font-bold text-base">
                No fan requests yet
              </p>
              <p className="text-sm text-muted-foreground font-ui mt-1">
                When fans request music from you, it'll show up here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map((req, i) => (
                <FanRequestCard key={req.id} request={req} index={i} />
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ── Main Profile Page ────────────────────────────── */
export function ProfilePage() {
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading } = useCallerProfile();
  const saveMutation = useSaveProfile();
  const picInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Stats
  const { data: followerCount } = useCallerFollowerCount();
  const { data: followedArtists } = useCallerFollowingList();
  const followingCount = followedArtists?.length ?? 0;
  const followerNum = followerCount ? Number(followerCount) : 0;

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [picFile, setPicFile] = useState<File | null>(null);
  const [picPreview, setPicPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bgStyle, setBgStyle] = useState<BgStyle>("dark");
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  // Prefill from loaded profile
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      if (profile.profilePicKey) {
        setPicPreview(profile.profilePicKey.getDirectURL());
      }
      if (profile.bannerKey) {
        setBannerPreview(profile.bannerKey.getDirectURL());
      }
      const [rawBg, rawBio] = (profile.bgStyle ?? "").split("||");
      if (rawBg && BG_STYLES.some((s) => s.id === rawBg)) {
        setBgStyle(rawBg as BgStyle);
      }
      setBio(rawBio ?? "");
    }
  }, [profile]);

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPicFile(file);
    const url = URL.createObjectURL(file);
    setPicPreview(url);
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    const url = URL.createObjectURL(file);
    setBannerPreview(url);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus("idle");

    try {
      let picBlob: ExternalBlob | null = null;
      if (picFile) {
        const bytes = new Uint8Array(await picFile.arrayBuffer());
        picBlob = ExternalBlob.fromBytes(bytes);
      }

      let bannerBlob: ExternalBlob | null = null;
      if (bannerFile) {
        const bytes = new Uint8Array(await bannerFile.arrayBuffer());
        bannerBlob = ExternalBlob.fromBytes(bytes);
      }

      await saveMutation.mutateAsync({
        username,
        picBlob,
        bannerBlob,
        bgStyle: bgStyle + (bio.trim() ? `||${bio.trim()}` : ""),
      });
      setSaveStatus("success");
      setPicFile(null);
      setBannerFile(null);
      toast.success("Profile saved!");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      toast.error("Failed to save profile");
    }
  };

  if (!identity) {
    return (
      <main className="container py-8">
        <LoginGate message="Sign in to set up your artist profile" />
      </main>
    );
  }

  const principalShort = identity
    ? `${identity.getPrincipal().toString().slice(0, 12)}…`
    : "";

  return (
    <main className="container py-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-black">
            <span className="text-gold">Your</span> Profile
          </h1>
          <p className="text-muted-foreground font-ui mt-1">
            Customize your artist profile with a banner and background theme
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4" data-ocid="profile.loading_state">
            <Skeleton
              className="w-full rounded-xl"
              style={{ aspectRatio: "16/5" }}
            />
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-9 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* ── Live Preview Wrapper ───────────────────── */}
            <div
              className="rounded-2xl overflow-hidden border border-border transition-all duration-500"
              style={getBgStyle(bgStyle)}
            >
              {/* Banner upload zone */}
              <button
                type="button"
                className="relative w-full cursor-pointer group"
                style={{ aspectRatio: "16/5" }}
                onClick={() => bannerInputRef.current?.click()}
                aria-label="Upload banner image"
                data-ocid="profile.banner.upload_button"
              >
                {bannerPreview ? (
                  <>
                    <img
                      src={bannerPreview}
                      alt="Profile banner"
                      className="w-full h-full object-cover"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                      <ImagePlus className="h-5 w-5 text-white" />
                      <span className="text-white font-ui font-semibold text-sm">
                        Change Banner
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border/50 group-hover:border-gold/40 transition-colors duration-200 bg-secondary/30">
                    <div className="h-10 w-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/15 transition-colors duration-200">
                      <ImagePlus className="h-5 w-5 text-gold" />
                    </div>
                    <p className="text-sm text-muted-foreground font-ui group-hover:text-foreground transition-colors duration-200">
                      Upload Banner
                    </p>
                    <p className="text-xs text-muted-foreground/60 font-ui">
                      Recommended: 1600×500px
                    </p>
                  </div>
                )}
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="sr-only"
                />
              </button>

              {/* Profile info area within preview */}
              <div className="px-6 py-5">
                <div className="flex items-end gap-4 -mt-10 mb-4">
                  {/* Avatar — overlaps banner */}
                  <div className="relative shrink-0">
                    <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                      <AvatarImage src={picPreview ?? undefined} />
                      <AvatarFallback className="bg-secondary text-gold text-2xl font-display font-bold">
                        {username ? (
                          username.slice(0, 1).toUpperCase()
                        ) : (
                          <User />
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="mb-1 flex-1 min-w-0">
                    <p className="font-display font-bold text-lg text-foreground truncate">
                      {username || (
                        <span className="text-muted-foreground italic">
                          Artist Name
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground font-ui truncate">
                      {principalShort}
                    </p>
                  </div>
                </div>
                {bio && (
                  <p className="text-sm text-foreground/70 font-ui leading-relaxed mt-2">
                    {bio}
                  </p>
                )}
              </div>
            </div>

            {/* ── Avatar Upload ──────────────────────────── */}
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => picInputRef.current?.click()}
                className="gap-2 font-ui border-border hover:border-gold/40"
                data-ocid="profile.pic.upload_button"
              >
                <Image className="h-4 w-4" />
                {picPreview ? "Change Picture" : "Upload Picture"}
              </Button>
              {picFile && (
                <p className="text-xs text-muted-foreground font-ui">
                  {picFile.name}
                </p>
              )}
              {bannerFile && (
                <p className="text-xs text-muted-foreground font-ui">
                  Banner: {bannerFile.name}
                </p>
              )}
              <input
                ref={picInputRef}
                type="file"
                accept="image/*"
                onChange={handlePicChange}
                className="sr-only"
              />
            </div>

            {/* ── Background Style Picker ────────────────── */}
            <div className="space-y-2">
              <Label className="font-ui font-semibold">Background Theme</Label>
              <div
                className="flex items-center gap-3 flex-wrap"
                data-ocid="profile.bg.panel"
              >
                {BG_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setBgStyle(style.id)}
                    title={style.label}
                    aria-label={`Set background to ${style.label}`}
                    aria-pressed={bgStyle === style.id}
                    data-ocid="profile.bg.toggle"
                    className="relative h-9 w-9 rounded-full border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 hover:scale-110"
                    style={{
                      background: style.swatch,
                      borderColor:
                        bgStyle === style.id
                          ? "oklch(0.78 0.17 72)"
                          : "oklch(0.2 0.015 285)",
                      boxShadow:
                        bgStyle === style.id
                          ? "0 0 0 2px oklch(0.78 0.17 72 / 0.4), 0 0 12px oklch(0.78 0.17 72 / 0.3)"
                          : "none",
                    }}
                  >
                    {bgStyle === style.id && (
                      <div className="absolute inset-0 rounded-full flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white/80 shadow" />
                      </div>
                    )}
                  </button>
                ))}
                <span className="text-xs text-muted-foreground font-ui ml-1">
                  {BG_STYLES.find((s) => s.id === bgStyle)?.label ?? "Dark"}
                </span>
              </div>
            </div>

            {/* ── Username ───────────────────────────────── */}
            <div className="space-y-1.5">
              <Label htmlFor="username" className="font-ui font-semibold">
                Username <span className="text-gold">*</span>
              </Label>
              <Input
                id="username"
                placeholder="Your artist name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-secondary border-border focus:border-gold/50 font-ui"
                data-ocid="profile.username.input"
              />
            </div>

            {/* ── Bio ────────────────────────────────────── */}
            <div className="space-y-1.5">
              <Label htmlFor="bio" className="font-ui font-semibold">
                Bio
              </Label>
              <Textarea
                id="bio"
                placeholder="Tell fans about yourself…"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                rows={3}
                className="resize-none bg-secondary border-border focus-visible:border-gold/50 focus-visible:ring-gold/20 font-ui placeholder:text-muted-foreground/50"
                data-ocid="profile.bio.textarea"
              />
              <p className="text-xs text-muted-foreground font-ui text-right">
                {bio.length}/300
              </p>
            </div>

            {/* Principal (read-only info) */}
            <div className="rounded-lg bg-secondary/50 border border-border px-4 py-3">
              <p className="text-xs text-muted-foreground font-ui mb-1">
                Principal ID
              </p>
              <p className="text-sm font-ui text-foreground/80 font-mono break-all">
                {principalShort}
              </p>
            </div>

            {/* Success state */}
            {saveStatus === "success" && (
              <div
                className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/5 p-3"
                data-ocid="profile.success_state"
              >
                <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                <p className="text-green-300 font-ui font-semibold text-sm">
                  Profile saved successfully!
                </p>
              </div>
            )}

            {/* Save */}
            <Button
              type="submit"
              disabled={saveMutation.isPending || !username}
              className="w-full gap-2 bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30 font-ui font-bold h-11"
              data-ocid="profile.save.submit_button"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </form>
        )}

        {/* ── Stats Bar ─────────────────────────────────── */}
        <div
          className="grid grid-cols-2 gap-3"
          data-ocid="profile.followers.panel"
        >
          <div className="rounded-xl border border-border bg-card px-4 py-3 flex flex-col items-center gap-1">
            <span className="text-2xl font-display font-black text-gold">
              {followerNum.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground font-ui font-semibold uppercase tracking-wider">
              Followers
            </span>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3 flex flex-col items-center gap-1">
            <span className="text-2xl font-display font-black text-foreground">
              {followingCount.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground font-ui font-semibold uppercase tracking-wider">
              Following
            </span>
          </div>
        </div>

        {/* ── Following Section ──────────────────────────── */}
        <FollowingPanel />

        {/* ── Fan Requests Section ───────────────────────── */}
        <ProfileFanRequestsPanel />
      </motion.div>
    </main>
  );
}
