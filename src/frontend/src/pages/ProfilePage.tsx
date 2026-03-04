import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Image, Loader2, User } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { LoginGate } from "../components/LoginGate";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCallerProfile, useSaveProfile } from "../hooks/useQueries";

export function ProfilePage() {
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading } = useCallerProfile();
  const saveMutation = useSaveProfile();
  const picInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [picFile, setPicFile] = useState<File | null>(null);
  const [picPreview, setPicPreview] = useState<string | null>(null);
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
    }
  }, [profile]);

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPicFile(file);
    const url = URL.createObjectURL(file);
    setPicPreview(url);
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

      await saveMutation.mutateAsync({ username, picBlob });
      setSaveStatus("success");
      setPicFile(null);
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
    <main className="container py-8 max-w-lg">
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
            Set your artist name and picture
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4" data-ocid="profile.loading_state">
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
          <form onSubmit={handleSave} className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <Avatar className="h-20 w-20 border-2 border-gold/20">
                <AvatarImage src={picPreview ?? undefined} />
                <AvatarFallback className="bg-secondary text-gold text-2xl font-display font-bold">
                  {username ? username.slice(0, 1).toUpperCase() : <User />}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1.5">
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
                <input
                  ref={picInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePicChange}
                  className="sr-only"
                />
              </div>
            </div>

            {/* Username */}
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
