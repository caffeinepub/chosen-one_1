import { Button } from "@/components/ui/button";
import { LogIn, Music2 } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface LoginGateProps {
  message?: string;
}

export function LoginGate({ message = "Sign in to continue" }: LoginGateProps) {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[40vh] gap-6 text-center"
    >
      <div className="relative">
        <div className="h-20 w-20 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20">
          <Music2 className="h-9 w-9 text-gold" />
        </div>
        <div className="absolute -inset-2 rounded-3xl bg-gold/5 -z-10 blur-xl" />
      </div>

      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Exclusive Access
        </h2>
        <p className="text-muted-foreground text-sm max-w-xs">{message}</p>
      </div>

      <Button
        onClick={login}
        disabled={isLoggingIn}
        className="gap-2 bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30 font-ui font-bold"
        data-ocid="nav.login.button"
      >
        <LogIn className="h-4 w-4" />
        {isLoggingIn ? "Signing in…" : "Sign In to Continue"}
      </Button>
    </motion.div>
  );
}
