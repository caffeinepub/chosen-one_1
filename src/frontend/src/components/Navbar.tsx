import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import { ListMusic, LogIn, LogOut, Music2, Upload, User } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const navLinks = [
  { to: "/", label: "Charts", icon: ListMusic, ocid: "nav.charts.link" },
  { to: "/upload", label: "Upload", icon: Upload, ocid: "nav.upload.link" },
  {
    to: "/my-tracks",
    label: "My Tracks",
    icon: Music2,
    ocid: "nav.my_tracks.link",
  },
  { to: "/profile", label: "Profile", icon: User, ocid: "nav.profile.link" },
];

export function Navbar() {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div
            className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"
            whileHover={{ scale: 1.05 }}
          >
            <Music2 className="h-5 w-5 text-gold" />
            <div className="absolute inset-0 rounded-lg bg-gold/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
          <span className="font-display text-xl font-black tracking-tight">
            <span className="text-gold">CHOSEN</span>
            <span className="text-foreground"> ONE</span>
          </span>
        </Link>

        {/* Nav links — desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                data-ocid={link.ocid}
                className="relative group"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-1.5 font-ui font-semibold text-sm transition-all duration-200",
                    isActive
                      ? "text-gold hover:text-gold hover:bg-transparent"
                      : "text-muted-foreground hover:text-foreground hover:bg-transparent",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Button>
                {/* Gold underline indicator */}
                <span
                  className={cn(
                    "absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-gold transition-all duration-200",
                    isActive
                      ? "opacity-100 scale-x-100"
                      : "opacity-0 scale-x-0 group-hover:opacity-40 group-hover:scale-x-100",
                  )}
                  style={{ transformOrigin: "center" }}
                />
              </Link>
            );
          })}
        </nav>

        {/* Auth button */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Button
              variant="outline"
              size="sm"
              onClick={clear}
              className="gap-1.5 font-ui font-semibold border-border text-muted-foreground hover:text-foreground hover:border-gold/40"
              data-ocid="nav.login.button"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={login}
              disabled={isLoggingIn}
              className="gap-1.5 font-ui font-bold bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30"
              data-ocid="nav.login.button"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isLoggingIn ? "Signing in…" : "Sign In"}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden flex border-t border-border">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              data-ocid={link.ocid}
              className="flex-1"
            >
              <button
                type="button"
                className={cn(
                  "w-full flex flex-col items-center gap-1 py-2 text-xs font-ui font-semibold transition-colors",
                  isActive ? "text-gold" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </button>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
