import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, Copy, Lock, Mail, Shield, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { EmailSubscriber } from "../backend.d";
import { LoginGate } from "../components/LoginGate";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useEmailSubscribers, useIsCallerAdmin } from "../hooks/useQueries";

/* ── Helpers ─────────────────────────────────────────── */
function formatDate(subscribedAt: bigint): string {
  const ms = Number(subscribedAt / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Copy button with checkmark feedback ─────────────── */
function CopyButton({ text, ocid }: { text: string; ocid: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-7 w-7 p-0 text-muted-foreground hover:text-gold hover:bg-gold/10 transition-colors"
      data-ocid={ocid}
      aria-label={`Copy ${text}`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

/* ── Loading skeleton ────────────────────────────────── */
function AdminSubscribersLoading() {
  return (
    <div data-ocid="admin.subscribers.loading_state" className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40 rounded-lg bg-secondary/60" />
        <Skeleton className="h-9 w-36 rounded-lg bg-secondary/60" />
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        {["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"].map((k) => (
          <div
            key={k}
            className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0"
          >
            <Skeleton className="h-4 w-48 rounded bg-secondary/60" />
            <Skeleton className="h-4 w-32 rounded bg-secondary/60 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Access denied ────────────────────────────────────── */
function AccessDenied() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center gap-4 py-24 text-center"
      data-ocid="admin.access_denied.panel"
    >
      <div className="h-16 w-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
        <Lock className="h-8 w-8 text-destructive/70" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-1">
          Access Denied
        </h2>
        <p className="text-sm font-ui text-muted-foreground max-w-xs">
          This page is restricted to administrators only. You don't have
          permission to view it.
        </p>
      </div>
    </motion.div>
  );
}

/* ── Main page ───────────────────────────────────────── */
function AdminSubscribersContent() {
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  const { data: subscribers, isLoading: isSubsLoading } = useEmailSubscribers();
  const [copiedAll, setCopiedAll] = useState(false);

  const isLoading = isAdminLoading || (isAdmin && isSubsLoading);

  if (isLoading) {
    return <AdminSubscribersLoading />;
  }

  if (!isAdmin) {
    return <AccessDenied />;
  }

  const sorted = [...(subscribers ?? [])].sort((a, b) =>
    Number(b.subscribedAt - a.subscribedAt),
  );

  function handleCopyAll() {
    const emails = sorted.map((s) => s.email).join(", ");
    navigator.clipboard.writeText(emails).then(() => {
      setCopiedAll(true);
      toast.success(
        `Copied ${sorted.length} email${sorted.length !== 1 ? "s" : ""} to clipboard`,
      );
      setTimeout(() => setCopiedAll(false), 2000);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Stat badge */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center">
            <Users className="h-5 w-5 text-gold" />
          </div>
          <div>
            <p className="text-xs font-ui text-muted-foreground uppercase tracking-widest">
              Total Subscribers
            </p>
            <p className="font-display text-2xl font-black text-foreground leading-none">
              {sorted.length.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Copy all button */}
        {sorted.length > 0 && (
          <Button
            onClick={handleCopyAll}
            size="sm"
            className="gap-2 font-ui font-semibold bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30"
            data-ocid="admin.subscribers.copy_all.button"
          >
            {copiedAll ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copiedAll ? "Copied!" : "Copy All Emails"}
          </Button>
        )}
      </div>

      {/* Table / empty state */}
      {sorted.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center justify-center gap-3 py-20 rounded-xl border border-border bg-card/50"
          data-ocid="admin.subscribers.empty_state"
        >
          <div className="h-12 w-12 rounded-2xl bg-secondary/60 border border-border flex items-center justify-center">
            <Mail className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <p className="font-ui font-semibold text-muted-foreground">
            No subscribers yet
          </p>
          <p className="text-xs font-ui text-muted-foreground/60 text-center max-w-xs">
            When users sign up for updates in the footer, their emails will
            appear here.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="rounded-xl border border-border overflow-hidden bg-card/40"
          data-ocid="admin.subscribers.table"
        >
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-ui font-bold text-xs uppercase tracking-widest text-muted-foreground pl-4">
                  Email Address
                </TableHead>
                <TableHead className="font-ui font-bold text-xs uppercase tracking-widest text-muted-foreground text-right pr-2">
                  Signed Up
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((sub: EmailSubscriber, idx) => (
                <TableRow
                  key={sub.email}
                  className="border-border hover:bg-secondary/30 transition-colors"
                  data-ocid={`admin.subscribers.item.${idx + 1}`}
                >
                  <TableCell className="pl-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                        <Mail className="h-3 w-3 text-gold/70" />
                      </div>
                      <span className="font-ui text-sm text-foreground font-medium truncate max-w-[240px]">
                        {sub.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-2 py-3">
                    <span className="font-ui text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(sub.subscribedAt)}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 pr-3">
                    <CopyButton
                      text={sub.email}
                      ocid={`admin.subscribers.copy.button.${idx + 1}`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ── Export ──────────────────────────────────────────── */
export function AdminSubscribersPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  if (!isAuthenticated) {
    return (
      <main className="container py-8 max-w-3xl">
        <LoginGate message="Sign in to access the admin area" />
      </main>
    );
  }

  return (
    <main className="container py-8 max-w-3xl">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-3 mb-8"
      >
        <div className="h-10 w-10 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center">
          <Shield className="h-5 w-5 text-gold" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-black text-foreground leading-none">
            Admin
          </h1>
          <p className="text-xs font-ui text-muted-foreground mt-0.5">
            Email Subscribers
          </p>
        </div>
      </motion.div>

      <AdminSubscribersContent />
    </main>
  );
}
