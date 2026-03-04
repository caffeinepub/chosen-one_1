import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { Principal } from "@icp-sdk/core/principal";
import { Loader2, LogIn, MessageCircle, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Comment } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddComment,
  useComments,
  useDeleteComment,
  useUserProfile,
} from "../hooks/useQueries";

/* ── Relative time helper ───────────────────────────── */
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
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/* ── Single comment row ─────────────────────────────── */
function CommentRow({
  comment,
  index,
  currentPrincipal,
  trackId,
}: {
  comment: Comment;
  index: number;
  currentPrincipal: string | undefined;
  trackId: string;
}) {
  const { data: profile } = useUserProfile(comment.authorId as Principal);
  const deleteMutation = useDeleteComment(trackId);
  const isOwner = currentPrincipal === comment.authorId.toString();
  const ocidIndex = index + 1;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(comment.id);
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      data-ocid={`comments.item.${ocidIndex}`}
      className="flex gap-3 group/comment"
    >
      {/* Avatar */}
      <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 text-xs font-display font-bold text-muted-foreground">
        {profile?.username ? profile.username[0]?.toUpperCase() : "?"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-ui font-semibold text-foreground">
            {profile?.username ?? "Anonymous"}
          </span>
          <span className="text-xs text-muted-foreground font-ui">
            {timeAgo(comment.timestamp)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed break-words">
          {comment.text}
        </p>
      </div>

      {/* Delete button */}
      {isOwner && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          aria-label="Delete comment"
          data-ocid={`comments.delete_button.${ocidIndex}`}
          className="shrink-0 opacity-0 group-hover/comment:opacity-100 transition-opacity duration-150 h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-40"
        >
          {deleteMutation.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
        </button>
      )}
    </motion.div>
  );
}

/* ── Main CommentsSection ───────────────────────────── */
interface CommentsSectionProps {
  trackId: string;
}

export function CommentsSection({ trackId }: CommentsSectionProps) {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const currentPrincipal = identity?.getPrincipal().toString();

  const { data: comments, isLoading, isError } = useComments(trackId);
  const addMutation = useAddComment(trackId);

  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      await addMutation.mutateAsync(trimmed);
      setText("");
      textareaRef.current?.focus();
    } catch {
      toast.error("Failed to post comment");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      void handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="space-y-4 pt-1">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-ui font-semibold text-muted-foreground uppercase tracking-widest">
          Comments
          {comments && comments.length > 0 && (
            <span className="ml-1.5 text-gold">({comments.length})</span>
          )}
        </span>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div data-ocid="comments.loading_state" className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-7 w-7 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <p
          data-ocid="comments.error_state"
          className="text-xs text-destructive font-ui"
        >
          Failed to load comments
        </p>
      ) : !comments || comments.length === 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          data-ocid="comments.empty_state"
          className="text-xs text-muted-foreground font-ui italic py-2"
        >
          No comments yet — be the first to leave feedback.
        </motion.p>
      ) : (
        <AnimatePresence initial={false}>
          <div className="space-y-3">
            {comments.map((comment, i) => (
              <CommentRow
                key={comment.id}
                comment={comment}
                index={i}
                currentPrincipal={currentPrincipal}
                trackId={trackId}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Input or login prompt */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 pt-1">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Leave feedback on this track… (⌘↵ to post)"
            rows={2}
            maxLength={500}
            data-ocid="comments.input"
            className="resize-none bg-secondary/50 border-border text-sm font-ui placeholder:text-muted-foreground/50 focus-visible:ring-gold/40 focus-visible:border-gold/30 transition-colors"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground/50 font-ui tabular-nums">
              {text.length}/500
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={!text.trim() || addMutation.isPending}
              data-ocid="comments.submit_button"
              className="bg-gold/15 text-gold hover:bg-gold/25 border border-gold/25 font-ui font-semibold h-7 px-3 text-xs transition-all"
            >
              {addMutation.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                  Posting…
                </>
              ) : (
                "Post"
              )}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-2 pt-1">
          <LogIn className="h-3.5 w-3.5 text-muted-foreground/60" />
          <p className="text-xs text-muted-foreground/70 font-ui italic">
            Sign in to leave a comment
          </p>
        </div>
      )}
    </div>
  );
}
