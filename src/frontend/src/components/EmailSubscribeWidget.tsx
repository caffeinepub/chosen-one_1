import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";

export function EmailSubscribeWidget() {
  const { actor } = useActor();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic client-side validation
    if (!email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      setStatus("error");
      return;
    }

    if (!actor) {
      setErrorMessage("Unable to connect. Please try again.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      await actor.subscribeToEmailList(email.trim().toLowerCase());
      setStatus("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setErrorMessage(
        msg.includes("already")
          ? "You're already subscribed!"
          : "Failed to subscribe. Please try again.",
      );
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div
        data-ocid="email_subscribe.success_state"
        className="flex items-center gap-2.5 rounded-lg border border-gold/20 bg-gold/5 px-4 py-2.5"
      >
        <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
        <p className="text-sm font-ui font-semibold text-gold">
          You're on the list! We'll keep you posted.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          data-ocid="email_subscribe.input"
          className="h-9 bg-background/50 border-border/60 focus:border-gold/40 focus-visible:ring-gold/20 font-ui text-sm placeholder:text-muted-foreground/50 min-w-0 flex-1"
          disabled={status === "loading"}
          aria-label="Email address for updates"
        />
        <Button
          type="submit"
          disabled={status === "loading" || !email}
          data-ocid="email_subscribe.submit_button"
          size="sm"
          className="shrink-0 gap-1.5 bg-gold/15 text-gold hover:bg-gold/25 border border-gold/25 font-ui font-semibold h-9 px-3.5 text-sm"
        >
          {status === "loading" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Mail className="h-3.5 w-3.5" />
          )}
          {status === "loading" ? "Subscribing…" : "Subscribe"}
        </Button>
      </div>

      {status === "error" && (
        <div
          data-ocid="email_subscribe.error_state"
          className="flex items-center gap-1.5"
        >
          <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
          <p className="text-xs text-destructive font-ui">{errorMessage}</p>
        </div>
      )}
    </form>
  );
}
