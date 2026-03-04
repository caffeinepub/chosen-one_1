import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Image, ImagePlus, Loader2, User } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { LoginGate } from "../components/LoginGate";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCallerProfile, useSaveProfile } from "../hooks/useQueries";

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
  // Parse the CSS string into a style prop
  const css = found.css;
  if (css.startsWith("background: linear-gradient")) {
    return { background: css.replace("background: ", "") };
  }
  return { background: css.replace("background: ", "") };
}

export function ProfilePage() {
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading } = useCallerProfile();
  const saveMutation = useSaveProfile();
  const picInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
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
      if (profile.bgStyle && BG_STYLES.some((s) => s.id === profile.bgStyle)) {
        setBgStyle(profile.bgStyle as BgStyle);
      }
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
        bgStyle,
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
      </motion.div>
    </main>
  );
}
