import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  Image,
  Loader2,
  Music2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { LoginGate } from "../components/LoginGate";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUploadTrack } from "../hooks/useQueries";

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
] as const;

function generateId() {
  return crypto.randomUUID();
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadPage() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching: isActorFetching } = useActor();
  // After 20 seconds of waiting for the actor, show a refresh prompt
  // so the user isn't stuck with an infinite spinner.
  const [actorTimedOut, setActorTimedOut] = useState(false);
  const navigate = useNavigate();
  const uploadMutation = useUploadTrack();

  useEffect(() => {
    if (actor && !isActorFetching) {
      setActorTimedOut(false);
      return;
    }
    const t = setTimeout(() => setActorTimedOut(true), 20000);
    return () => clearTimeout(t);
  }, [actor, isActorFetching]);

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [region, setRegion] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleAudioDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (
      !["audio/mpeg", "audio/wav", "audio/x-wav"].includes(file.type) &&
      !file.name.match(/\.(mp3|wav)$/i)
    ) {
      toast.error("Only MP3 and WAV files are supported");
      return;
    }
    setAudioFile(file);
  }, []);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
      toast.error("Please select an audio file");
      return;
    }

    setStatus("uploading");
    setProgress(0);
    setErrorMsg("");

    try {
      const audioBytes = new Uint8Array(await audioFile.arrayBuffer());
      const audioBlob = ExternalBlob.fromBytes(audioBytes);

      let coverBlob: ExternalBlob | null = null;
      if (coverFile) {
        const coverBytes = new Uint8Array(await coverFile.arrayBuffer());
        coverBlob = ExternalBlob.fromBytes(coverBytes);
      }

      await uploadMutation.mutateAsync({
        id: generateId(),
        title,
        artist,
        description,
        genre,
        audioBlob,
        coverBlob,
        city,
        state,
        region,
        onProgress: (pct) => setProgress(pct),
      });

      setStatus("success");
      toast.success("Track uploaded successfully!");
      setTimeout(() => {
        void navigate({ to: "/" });
      }, 1500);
    } catch (err) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Upload failed";
      setErrorMsg(msg);
      toast.error("Upload failed");
    }
  };

  const isIdentityAuthenticated =
    !!identity && !identity.getPrincipal().isAnonymous();

  // Wait for auth client to finish initializing before deciding to show login gate
  if (isInitializing) {
    return (
      <main className="container py-8 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </main>
    );
  }

  if (!isIdentityAuthenticated) {
    return (
      <main className="container py-8">
        <LoginGate message="Sign in to upload your AI music to the charts" />
      </main>
    );
  }

  // Wait for the authenticated actor to be ready.
  // The actor starts as an anonymous actor and is replaced once login is confirmed --
  // we must wait for isFetching=false AND actor present AND identity is authenticated.
  const isActorAuthenticated =
    !!actor && !isActorFetching && isIdentityAuthenticated;

  if (!isActorAuthenticated) {
    if (actorTimedOut) {
      return (
        <main className="container py-8 flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center gap-4 text-center max-w-sm">
            <p className="text-sm text-muted-foreground font-ui">
              Having trouble connecting to your account. Please refresh the page
              and sign in again.
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="font-ui border-gold/30 text-gold hover:bg-gold/10"
            >
              Refresh Page
            </Button>
          </div>
        </main>
      );
    }
    return (
      <main className="container py-8 flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
          <p className="text-sm text-muted-foreground font-ui">
            Connecting to your account…
          </p>
        </div>
      </main>
    );
  }

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
            <span className="text-gold">Upload</span> Your Track
          </h1>
          <p className="text-muted-foreground font-ui mt-1">
            Share your AI-generated music with the community
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="font-ui font-semibold">
              Track Title <span className="text-gold">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. Neural Bloom"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-secondary border-border focus:border-gold/50 font-ui"
              data-ocid="upload.title.input"
            />
          </div>

          {/* Artist */}
          <div className="space-y-1.5">
            <Label htmlFor="artist" className="font-ui font-semibold">
              Artist Name <span className="text-gold">*</span>
            </Label>
            <Input
              id="artist"
              placeholder="e.g. Synth Dreamer AI"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              required
              className="bg-secondary border-border focus:border-gold/50 font-ui"
              data-ocid="upload.artist.input"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="font-ui font-semibold">
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="description"
              placeholder="What inspired this track? What AI model or technique did you use?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="bg-secondary border-border focus:border-gold/50 font-ui resize-none"
              data-ocid="upload.description.textarea"
            />
          </div>

          {/* Genre */}
          <div className="space-y-1.5">
            <Label htmlFor="genre" className="font-ui font-semibold">
              Genre <span className="text-gold">*</span>
            </Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger
                id="genre"
                className="bg-secondary border-border focus:border-gold/50 font-ui"
                data-ocid="upload.genre.select"
              >
                <SelectValue placeholder="Select a genre…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hip-Hop">Hip-Hop</SelectItem>
                <SelectItem value="Electronic">Electronic</SelectItem>
                <SelectItem value="Pop">Pop</SelectItem>
                <SelectItem value="Ambient">Ambient</SelectItem>
                <SelectItem value="Classical">Classical</SelectItem>
                <SelectItem value="Jazz">Jazz</SelectItem>
                <SelectItem value="Rock">Rock</SelectItem>
                <SelectItem value="R&B">R&amp;B</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div className="space-y-1.5">
            <Label htmlFor="city" className="font-ui font-semibold">
              City <span className="text-gold">*</span>
            </Label>
            <Input
              id="city"
              placeholder="e.g. Atlanta"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="bg-secondary border-border focus:border-gold/50 font-ui"
              data-ocid="upload.city.input"
            />
          </div>

          {/* State */}
          <div className="space-y-1.5">
            <Label htmlFor="state" className="font-ui font-semibold">
              State <span className="text-gold">*</span>
            </Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger
                id="state"
                className="bg-secondary border-border focus:border-gold/50 font-ui"
                data-ocid="upload.state.select"
              >
                <SelectValue placeholder="Select a state…" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {US_STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Region */}
          <div className="space-y-1.5">
            <Label htmlFor="region" className="font-ui font-semibold">
              Region <span className="text-gold">*</span>
            </Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger
                id="region"
                className="bg-secondary border-border focus:border-gold/50 font-ui"
                data-ocid="upload.region.select"
              >
                <SelectValue placeholder="Select a region…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Northeast">Northeast</SelectItem>
                <SelectItem value="Southeast">Southeast</SelectItem>
                <SelectItem value="Midwest">Midwest</SelectItem>
                <SelectItem value="Southwest">Southwest</SelectItem>
                <SelectItem value="West">West</SelectItem>
                <SelectItem value="Mid-Atlantic">Mid-Atlantic</SelectItem>
                <SelectItem value="Pacific Northwest">
                  Pacific Northwest
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Audio file dropzone */}
          <div className="space-y-1.5">
            <Label className="font-ui font-semibold">
              Audio File <span className="text-gold">*</span>{" "}
              <span className="text-muted-foreground font-normal">
                (MP3 or WAV)
              </span>
            </Label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleAudioDrop}
              data-ocid="upload.audio.dropzone"
              className={cn(
                "relative rounded-xl border-2 border-dashed transition-all duration-200",
                isDragOver
                  ? "border-gold/60 bg-gold/5"
                  : audioFile
                    ? "border-gold/30 bg-gold/5"
                    : "border-border",
              )}
            >
              <input
                ref={audioInputRef}
                type="file"
                accept=".mp3,.wav,audio/mpeg,audio/wav"
                onChange={handleAudioChange}
                className="sr-only"
                id="audio-file-input"
              />
              {audioFile ? (
                <div className="flex items-center justify-center gap-3 p-6">
                  <Music2 className="h-5 w-5 text-gold" />
                  <div className="text-left">
                    <p className="font-ui font-semibold text-foreground text-sm">
                      {audioFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(audioFile.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAudioFile(null)}
                    className="ml-auto text-muted-foreground hover:text-foreground"
                    aria-label="Remove audio file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="audio-file-input"
                  className="flex flex-col items-center gap-2 p-8 text-center cursor-pointer hover:bg-secondary/30 transition-colors rounded-xl"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-ui font-semibold text-foreground">
                      Drop your audio file here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse — MP3 or WAV
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Album cover */}
          <div className="space-y-1.5">
            <Label className="font-ui font-semibold">
              Album Cover{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="h-20 w-20 rounded-xl overflow-hidden border border-border bg-secondary flex items-center justify-center shrink-0">
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => coverInputRef.current?.click()}
                  className="gap-2 font-ui border-border hover:border-gold/40"
                  data-ocid="upload.cover.upload_button"
                >
                  <Image className="h-4 w-4" />
                  {coverFile ? "Change Image" : "Upload Cover"}
                </Button>
                {coverFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setCoverFile(null);
                      setCoverPreview(null);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground font-ui text-left"
                  >
                    Remove
                  </button>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="sr-only"
                />
              </div>
            </div>
          </div>

          {/* Progress */}
          {status === "uploading" && (
            <div
              className="space-y-2 rounded-xl border border-gold/20 bg-gold/5 p-4"
              data-ocid="upload.loading_state"
            >
              <div className="flex items-center justify-between text-sm font-ui">
                <span className="text-gold font-semibold">Uploading…</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <Progress
                value={progress}
                className="h-1.5 bg-secondary [&>div]:bg-gold"
              />
            </div>
          )}

          {/* Success */}
          {status === "success" && (
            <div
              className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/5 p-4"
              data-ocid="upload.success_state"
            >
              <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
              <p className="text-green-300 font-ui font-semibold text-sm">
                Track uploaded! Redirecting to charts…
              </p>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div
              className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
              data-ocid="upload.error_state"
            >
              <XCircle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-destructive font-ui font-semibold text-sm">
                {errorMsg || "Upload failed. Please try again."}
              </p>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={
              status === "uploading" ||
              status === "success" ||
              !title ||
              !artist ||
              !genre ||
              !city ||
              !state ||
              !region ||
              !audioFile
            }
            className="w-full gap-2 bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30 font-ui font-bold h-11"
            data-ocid="upload.submit_button"
          >
            {status === "uploading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Submit to Charts
              </>
            )}
          </Button>
        </form>
      </motion.div>
    </main>
  );
}
