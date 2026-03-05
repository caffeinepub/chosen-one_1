import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { LoginGate } from "../components/LoginGate";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useClaimAdmin, useIsCallerAdmin } from "../hooks/useQueries";

/* ── Loading skeleton ────────────────────────────────── */
function AdminSetupLoading() {
  return (
    <div
      data-ocid="admin_setup.loading_state"
      className="flex flex-col items-center justify-center gap-4 py-20"
    >
      <Loader2 className="h-8 w-8 animate-spin text-gold/60" />
      <p className="text-sm font-ui text-muted-foreground">
        Checking your role…
      </p>
    </div>
  );
}

/* ── Already admin panel ─────────────────────────────── */
function AlreadyAdminPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center gap-6 py-10 text-center"
      data-ocid="admin_setup.success_state"
    >
      {/* Icon */}
      <div className="relative">
        <div className="h-20 w-20 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center glow-gold">
          <ShieldCheck className="h-10 w-10 text-gold" />
        </div>
        <div className="absolute -inset-3 rounded-3xl bg-gold/5 -z-10 blur-xl" />
      </div>

      {/* Text */}
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-black text-foreground">
          You&apos;re Already the Admin
        </h2>
        <p className="text-sm font-ui text-muted-foreground max-w-sm">
          Your account has full administrator privileges on Chosen One. Head to
          the Admin dashboard to manage subscribers.
        </p>
      </div>

      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/30">
        <div className="h-2 w-2 rounded-full bg-gold animate-pulse" />
        <span className="text-xs font-ui font-bold text-gold uppercase tracking-widest">
          Admin
        </span>
      </div>

      {/* CTA */}
      <Link to="/" data-ocid="admin_setup.home.link">
        <Button className="gap-2 bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30 font-ui font-bold">
          <Shield className="h-4 w-4" />
          Go to Charts
        </Button>
      </Link>
    </motion.div>
  );
}

/* ── Claim form ──────────────────────────────────────── */
function ClaimAdminForm() {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const claimAdmin = useClaimAdmin();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) return;
    claimAdmin.mutate(token.trim(), {
      onSuccess: () => setClaimSuccess(true),
    });
  }

  if (claimSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center gap-6 py-8 text-center"
        data-ocid="admin_setup.claim.success_state"
      >
        {/* Celebration icon */}
        <div className="relative">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="h-20 w-20 rounded-2xl bg-gold/15 border border-gold/40 flex items-center justify-center"
          >
            <CheckCircle2 className="h-10 w-10 text-gold" />
          </motion.div>

          {/* Sparkle rings */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-2xl border border-gold/30"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.8 + i * 0.5, opacity: 0 }}
              transition={{
                duration: 1.2,
                delay: i * 0.15,
                ease: "easeOut",
                repeat: Number.POSITIVE_INFINITY,
                repeatDelay: 1.5,
              }}
            />
          ))}
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-2xl font-black text-foreground">
            You are now the Admin!
          </h3>
          <p className="text-sm font-ui text-muted-foreground max-w-xs">
            Your account has been permanently assigned the admin role. You can
            now access the full Admin dashboard.
          </p>
        </div>

        <Link to="/" data-ocid="admin_setup.home.link">
          <Button className="gap-2 bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30 font-ui font-bold">
            <Shield className="h-4 w-4" />
            Go to Charts
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-8"
    >
      {/* Role info card */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/40 border border-border">
        <div className="h-9 w-9 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs font-ui text-muted-foreground uppercase tracking-widest mb-0.5">
            Current Role
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-ui font-bold bg-secondary border border-border text-muted-foreground">
              User / Guest
            </span>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="rounded-xl border border-gold/15 bg-gold/5 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-gold/70 shrink-0" />
          <p className="text-xs font-ui font-bold text-gold/80 uppercase tracking-widest">
            How it works
          </p>
        </div>
        <p className="text-sm font-ui text-muted-foreground leading-relaxed">
          Enter your{" "}
          <span className="text-foreground font-semibold">
            CAFFEINE_ADMIN_TOKEN
          </span>{" "}
          to claim the admin role. This token is available in your Caffeine
          dashboard under{" "}
          <span className="text-foreground font-semibold">
            Settings → Secrets
          </span>
          . The first user to enter the correct token becomes the permanent
          admin.
        </p>
      </div>

      {/* Claim form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label
            htmlFor="admin-token"
            className="text-sm font-ui font-semibold text-foreground"
          >
            Admin Token
          </Label>
          <div className="relative">
            <Input
              id="admin-token"
              type={showToken ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your admin token here"
              className={cn(
                "font-mono text-sm pr-10 bg-secondary/40 border-border focus:border-gold/50 focus:ring-gold/30 transition-colors",
                claimAdmin.isError &&
                  "border-destructive/60 focus:border-destructive/60",
              )}
              data-ocid="admin_setup.token.input"
              autoComplete="off"
              spellCheck={false}
              aria-describedby={claimAdmin.isError ? "token-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowToken((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showToken ? "Hide token" : "Show token"}
              data-ocid="admin_setup.token.toggle"
            >
              {showToken ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Error message */}
          {claimAdmin.isError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              id="token-error"
              className="text-xs font-ui text-destructive flex items-center gap-1.5 mt-1"
              data-ocid="admin_setup.token.error_state"
              role="alert"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
              Incorrect token or admin has already been claimed by another user.
            </motion.p>
          )}
        </div>

        <Button
          type="submit"
          disabled={claimAdmin.isPending || !token.trim()}
          className="w-full gap-2 bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30 font-ui font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          data-ocid="admin_setup.claim.button"
        >
          {claimAdmin.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Claiming…
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              Claim Admin Role
            </>
          )}
        </Button>
      </form>
    </motion.div>
  );
}

/* ── Main content (gated) ────────────────────────────── */
function AdminSetupContent() {
  const { data: isAdmin, isLoading } = useIsCallerAdmin();

  return (
    <main className="container py-8 max-w-lg">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-3 mb-8"
      >
        <div className="h-10 w-10 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center">
          <KeyRound className="h-5 w-5 text-gold" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-black text-foreground leading-none">
            Admin Setup
          </h1>
          <p className="text-xs font-ui text-muted-foreground mt-0.5">
            Claim your administrator role
          </p>
        </div>
      </motion.div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden"
      >
        {/* Gold accent line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        <div className="p-6 sm:p-8">
          {isLoading ? (
            <AdminSetupLoading />
          ) : isAdmin ? (
            <AlreadyAdminPanel />
          ) : (
            <ClaimAdminForm />
          )}
        </div>
      </motion.div>

      {/* Security note */}
      {!isAdmin && !isLoading && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs font-ui text-muted-foreground/50 mt-5"
        >
          Your token is transmitted directly to the blockchain canister and
          never stored in this browser.
        </motion.p>
      )}
    </main>
  );
}

/* ── Export ──────────────────────────────────────────── */
export function AdminSetupPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  if (!isAuthenticated) {
    return (
      <main className="container py-8 max-w-lg">
        <LoginGate message="Sign in to access admin setup" />
      </main>
    );
  }

  return <AdminSetupContent />;
}
