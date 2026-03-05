import { Music2 } from "lucide-react";
import { EmailSubscribeWidget } from "./EmailSubscribeWidget";

export function Footer() {
  const year = new Date().getFullYear();
  const hostname = encodeURIComponent(window.location.hostname);

  return (
    <footer className="border-t border-border mt-auto pt-8 pb-6">
      <div className="container space-y-6">
        {/* Email subscribe section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 rounded-xl border border-border/50 bg-card/40 px-5 py-4">
          <div className="shrink-0">
            <p className="font-display font-bold text-sm text-foreground">
              Get Updates
            </p>
            <p className="text-xs text-muted-foreground font-ui mt-0.5">
              Drop your email to hear about new drops and features
            </p>
          </div>
          <div className="w-full sm:max-w-xs">
            <EmailSubscribeWidget />
          </div>
        </div>

        {/* Copyright row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground font-ui">
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
      </div>
    </footer>
  );
}
