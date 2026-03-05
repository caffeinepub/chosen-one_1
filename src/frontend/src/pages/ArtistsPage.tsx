import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Principal } from "@icp-sdk/core/principal";
import { Link } from "@tanstack/react-router";
import { Music2, Search, Users } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { useAllArtists } from "../hooks/useQueries";
import { useUserProfile } from "../hooks/useQueries";

/* ── Artist card: fetches its own profile ────────────── */
function ArtistCard({
  ownerId,
  artistName,
  index,
}: {
  ownerId: Principal;
  artistName: string;
  index: number;
}) {
  const { data: profile } = useUserProfile(ownerId);
  const picUrl = profile?.profilePicKey?.getDirectURL();
  const displayName =
    artistName.trim() !== ""
      ? artistName
      : `${ownerId.toString().slice(0, 8)}…`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      data-ocid={`artists.item.${index + 1}`}
    >
      <Link
        to="/artist/$principalId"
        params={{ principalId: ownerId.toString() }}
        className="group block"
      >
        <div
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl border border-border bg-card",
            "hover:border-gold/30 hover:bg-card/80 hover:shadow-[0_0_20px_oklch(0.78_0.17_72/0.07),0_4px_16px_oklch(0_0_0/0.3)]",
            "transition-all duration-200 cursor-pointer",
          )}
        >
          <Avatar className="h-11 w-11 shrink-0 border border-border group-hover:border-gold/30 transition-colors duration-200">
            <AvatarImage src={picUrl} alt={displayName} />
            <AvatarFallback className="bg-secondary text-gold text-base font-display font-bold">
              {displayName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm truncate text-foreground group-hover:text-gold transition-colors duration-200">
              {displayName}
            </p>
            <p className="text-[11px] font-ui text-muted-foreground/50 truncate">
              {ownerId.toString().slice(0, 16)}…
            </p>
          </div>
          <Music2 className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-gold/50 transition-colors duration-200 shrink-0" />
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Loading skeleton ────────────────────────────────── */
function ArtistsSkeleton() {
  return (
    <div className="space-y-2" data-ocid="artists.loading_state">
      {["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"].map((k) => (
        <div
          key={k}
          className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
        >
          <Skeleton className="h-11 w-11 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Alphabet jump bar ───────────────────────────────── */
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function AlphabetBar({
  activeLetter,
  availableLetters,
  onLetterClick,
}: {
  activeLetter: string | null;
  availableLetters: Set<string>;
  onLetterClick: (letter: string) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap justify-center py-1">
      {LETTERS.map((letter) => {
        const hasArtists = availableLetters.has(letter);
        const isActive = activeLetter === letter;
        return (
          <button
            key={letter}
            type="button"
            onClick={() => hasArtists && onLetterClick(letter)}
            disabled={!hasArtists}
            data-ocid="artists.alphabet.tab"
            aria-label={`Jump to ${letter}`}
            className={cn(
              "h-7 w-7 rounded-md text-xs font-display font-bold transition-all duration-150",
              hasArtists
                ? isActive
                  ? "bg-gold/20 text-gold border border-gold/40 shadow-[0_0_8px_oklch(0.78_0.17_72/0.2)]"
                  : "text-foreground border border-border hover:border-gold/30 hover:text-gold hover:bg-gold/10 cursor-pointer"
                : "text-muted-foreground/25 border border-border/30 cursor-not-allowed",
            )}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────── */
export function ArtistsPage() {
  const [search, setSearch] = useState("");
  const [jumpLetter, setJumpLetter] = useState<string | null>(null);
  const letterRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { data: artists, isLoading } = useAllArtists();

  /* Sort A-Z + normalize display names */
  const sortedArtists = useMemo(() => {
    if (!artists) return [];
    return [...artists]
      .map((a) => ({
        ...a,
        displayName:
          a.artistName.trim() !== ""
            ? a.artistName
            : `${a.ownerId.toString().slice(0, 8)}…`,
      }))
      .sort((a, b) =>
        a.displayName.localeCompare(b.displayName, undefined, {
          sensitivity: "base",
        }),
      );
  }, [artists]);

  /* Filter by search */
  const filteredArtists = useMemo(() => {
    if (!search.trim()) return sortedArtists;
    const q = search.trim().toLowerCase();
    return sortedArtists.filter((a) => a.displayName.toLowerCase().includes(q));
  }, [sortedArtists, search]);

  /* Group by first letter */
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filteredArtists>();
    for (const artist of filteredArtists) {
      const letter = artist.displayName[0]?.toUpperCase() ?? "#";
      const key = /[A-Z]/.test(letter) ? letter : "#";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(artist);
    }
    // Sort keys A-Z with # at end
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b);
    });
  }, [filteredArtists]);

  /* Available letters for alphabet bar */
  const availableLetters = useMemo(() => {
    return new Set(grouped.map(([letter]) => letter).filter((l) => l !== "#"));
  }, [grouped]);

  /* Jump to letter section */
  function handleLetterClick(letter: string) {
    setJumpLetter(letter);
    const el = letterRefs.current[letter];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  /* Running index for data-ocid */
  let globalIndex = 0;

  return (
    <main className="container max-w-3xl py-8 pb-16" data-ocid="artists.page">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-gold" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black text-foreground">
              Artists
            </h1>
            <p className="text-sm font-ui text-muted-foreground">
              Browse all AI music creators
            </p>
          </div>
        </div>
      </motion.div>

      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative mb-4"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
        <Input
          type="search"
          placeholder="Search artists…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setJumpLetter(null);
          }}
          className="pl-9 font-ui bg-secondary/60 border-border focus:border-gold/40 focus:ring-gold/20 h-10"
          data-ocid="artists.search.search_input"
        />
      </motion.div>

      {/* Alphabet bar — only show when not searching */}
      {!search.trim() && !isLoading && availableLetters.size > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <AlphabetBar
            activeLetter={jumpLetter}
            availableLetters={availableLetters}
            onLetterClick={handleLetterClick}
          />
        </motion.div>
      )}

      {/* Loading */}
      {isLoading && <ArtistsSkeleton />}

      {/* Empty state — no artists at all */}
      {!isLoading && sortedArtists.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center gap-5 py-20 rounded-2xl border border-border bg-card text-center px-6"
          data-ocid="artists.empty_state"
        >
          <div className="h-16 w-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Users className="h-7 w-7 text-gold/60" />
          </div>
          <div className="space-y-1">
            <p className="font-display font-bold text-lg text-foreground">
              No artists yet
            </p>
            <p className="text-sm font-ui text-muted-foreground max-w-xs">
              Be the first to upload — your name will appear here
            </p>
          </div>
          <Link
            to="/upload"
            className="text-xs font-ui font-semibold text-gold hover:text-gold/80 transition-colors"
            data-ocid="artists.upload.link"
          >
            Upload your first track →
          </Link>
        </motion.div>
      )}

      {/* No results from search */}
      {!isLoading &&
        sortedArtists.length > 0 &&
        filteredArtists.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 py-16 rounded-2xl border border-border bg-card text-center px-6"
            data-ocid="artists.no_results.empty_state"
          >
            <div className="h-14 w-14 rounded-2xl bg-secondary border border-border flex items-center justify-center">
              <Search className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <div className="space-y-1">
              <p className="font-display font-bold text-base text-foreground">
                No artists match your search
              </p>
              <p className="text-sm font-ui text-muted-foreground">
                Try a different name or clear the search
              </p>
            </div>
          </motion.div>
        )}

      {/* Artist list grouped by letter */}
      {!isLoading && filteredArtists.length > 0 && (
        <div className="space-y-6" data-ocid="artists.list">
          {grouped.map(([letter, letterArtists]) => (
            <div
              key={letter}
              ref={(el) => {
                letterRefs.current[letter] = el;
              }}
            >
              {/* Letter header */}
              <div className="flex items-center gap-3 mb-2">
                <div className="h-7 w-7 rounded-md bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <span className="font-display font-black text-xs text-gold">
                    {letter}
                  </span>
                </div>
                <div className="flex-1 h-px bg-border/60" />
                <span className="text-[11px] font-ui text-muted-foreground/50 tabular-nums">
                  {letterArtists.length}
                </span>
              </div>

              {/* Artist cards in this letter group */}
              <div className="space-y-2">
                {letterArtists.map((artist) => {
                  const cardIndex = globalIndex++;
                  return (
                    <ArtistCard
                      key={artist.ownerId.toString()}
                      ownerId={artist.ownerId}
                      artistName={artist.artistName}
                      index={cardIndex}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Artist count footer */}
      {!isLoading && sortedArtists.length > 0 && (
        <p className="text-center text-xs font-ui text-muted-foreground/40 mt-8">
          {sortedArtists.length}{" "}
          {sortedArtists.length === 1 ? "artist" : "artists"} total
        </p>
      )}
    </main>
  );
}
