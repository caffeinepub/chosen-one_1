import { Music2 } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();
  const hostname = encodeURIComponent(window.location.hostname);

  return (
    <footer className="border-t border-border mt-auto py-6">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground font-ui">
        <div className="flex items-center gap-2">
          <Music2 className="h-4 w-4 text-gold" />
          <span className="font-display font-bold text-foreground">
            CHOSEN ONE
          </span>
        </div>
        <p>
          © {year}. Built with{" "}
          <span className="text-gold" aria-label="love">
            ♥
          </span>{" "}
          using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${hostname}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:text-gold/80 transition-colors underline underline-offset-2"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
