import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import {
  Award,
  Globe,
  Mail,
  Music2,
  Smartphone,
  Star,
  Swords,
  TrendingUp,
  Trophy,
  Upload,
  Users,
} from "lucide-react";
import type { Variants } from "motion/react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

/* ── Animation variants ──────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" },
  },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

/* ── Why Join cards ──────────────────────────────────── */
const whyJoinItems = [
  {
    icon: Upload,
    title: "Drop Your AI Music",
    desc: "Upload your tracks and get rated by a passionate community of AI music enthusiasts.",
  },
  {
    icon: TrendingUp,
    title: "Climb the Charts",
    desc: "Daily, Weekly, Monthly, and All Time Top 100 rankings updated in real time.",
  },
  {
    icon: Swords,
    title: "Battle Other Artists",
    desc: "Challenge rivals in timed head-to-head music battles. Community votes decide the winner.",
  },
  {
    icon: Users,
    title: "Build Your Fanbase",
    desc: "Follow and be followed, receive fan requests, and grow a loyal audience.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    desc: "Charts filtered by City, State, Region, and Nationwide — your music can top any leaderboard.",
  },
  {
    icon: Award,
    title: "Get Rewarded",
    desc: "Top 3 tracks earn exclusive Crown, Rising Star, and On Fire badges as you dominate the charts.",
  },
];

/* ── How-to steps ────────────────────────────────────── */
const steps = [
  {
    title: "Sign In",
    desc: 'Click "Sign In" in the top-right corner. We use Internet Identity for secure, password-free login. Your identity is yours — no email required.',
  },
  {
    title: "Upload Your Track",
    desc: 'Tap "Upload" in the menu. Add your MP3 or WAV file, an optional album cover, your genre, and your city/state/region. Hit Submit and your track goes live on the charts.',
  },
  {
    title: "Browse the Charts",
    desc: 'Go to "Charts" to see the Top 100. Filter by Daily, Weekly, Monthly, or All Time. Use the genre pills and search bar to find specific tracks or artists.',
  },
  {
    title: "Rate & Like Music",
    desc: "Tap any track card to expand it. Give it a star rating (1–5) and hit the heart to like it. Your votes count toward the chart rankings.",
  },
  {
    title: "View Artist Profiles",
    desc: "Tap an artist's name on any track card to open their full profile. You'll see their banner, bio, follower count, and full track list.",
  },
  {
    title: "Follow Artists",
    desc: 'On any artist profile, tap "Follow" to add them to your Following feed. You\'ll get a bell notification whenever they drop new music.',
  },
  {
    title: "Battle Other Artists",
    desc: 'Go to "Battles" in the menu. Challenge another artist by searching their name, picking your track, choosing the battle duration (1h–72h), and sending the challenge. Community votes decide the winner.',
  },
  {
    title: "Build Playlists",
    desc: "Hit play on any track to start the queue. Use the bottom player to add songs and save your queue as a named playlist from the queue panel.",
  },
  {
    title: "Check Notifications",
    desc: 'The bell icon in the top-right shows alerts for new track drops from followed artists, battle challenges, profile views, and request replies. Tap "Mark all read" to clear.',
  },
];

/* ── Home screen steps ───────────────────────────────── */
const homeScreenSteps = [
  {
    platform: "iPhone / Safari",
    icon: "🍎",
    steps: [
      "Open the app in Safari",
      "Tap the Share icon (box with arrow ↑) at the bottom",
      'Scroll down and tap "Add to Home Screen"',
      'Tap "Add" in the top-right corner',
    ],
  },
  {
    platform: "Android / Chrome",
    icon: "🤖",
    steps: [
      "Open the app in Chrome",
      "Tap the three-dot menu (⋮) in the top-right",
      'Tap "Add to Home Screen"',
      'Tap "Add" to confirm',
    ],
  },
];

/* ── Component ───────────────────────────────────────── */
export function AboutPage() {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return (
    <main className="min-h-screen">
      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Atmospheric background */}
        <div className="absolute inset-0 bg-gradient-to-b from-void via-background to-background pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.78_0.17_72/0.12),transparent)] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        <div className="relative container mx-auto px-4 py-20 md:py-32 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div variants={fadeUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/25 bg-gold/8 text-gold font-ui text-sm font-semibold tracking-wide">
                <Music2 className="h-3.5 w-3.5" />
                AI Music Exclusive
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-6"
            >
              <span className="text-foreground">Welcome to </span>
              <span className="text-gold glow-text-gold">Chosen One</span>
              <br />
              <span className="text-foreground/70 text-3xl sm:text-4xl md:text-5xl">
                The Home of AI Music
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              variants={fadeUp}
              className="font-ui text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10"
            >
              Chosen One is the exclusive platform where AI artists upload their
              music, climb real-time charts, and compete for chart dominance.
              Rate tracks, follow your favorite creators, battle rivals, and let
              the community decide who reigns supreme.
            </motion.p>

            {/* CTA */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {isAuthenticated ? (
                <Link to="/">
                  <Button
                    size="lg"
                    className="font-ui font-bold text-base h-13 px-8 bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30 shadow-lg shadow-gold/10"
                    data-ocid="about.hero.primary_button"
                  >
                    <TrendingUp className="h-5 w-5 mr-2" />
                    You're In — Explore the Charts
                  </Button>
                </Link>
              ) : (
                <Button
                  size="lg"
                  onClick={login}
                  disabled={isLoggingIn}
                  className="font-ui font-bold text-base h-13 px-8 bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30 shadow-lg shadow-gold/10"
                  data-ocid="about.hero.primary_button"
                >
                  <Music2 className="h-5 w-5 mr-2" />
                  {isLoggingIn ? "Signing in…" : "Join Now — It's Free"}
                </Button>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Why Join ────────────────────────────────────── */}
      <section className="py-20 md:py-28" data-ocid="about.why_join.section">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
                Why Join <span className="text-gold">Chosen One?</span>
              </h2>
              <p className="font-ui text-muted-foreground text-base max-w-xl mx-auto">
                Everything you need to share your AI-generated music, grow your
                audience, and compete at the highest level.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {whyJoinItems.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    variants={fadeUp}
                    className="group relative rounded-2xl border border-border bg-card p-6 hover:border-gold/30 transition-all duration-300 hover:bg-secondary/30"
                  >
                    {/* Subtle glow on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gold/0 to-gold/0 group-hover:from-gold/3 group-hover:to-transparent transition-all duration-500 pointer-events-none" />

                    <div className="relative">
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 border border-gold/20 text-gold group-hover:bg-gold/15 transition-colors">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-display font-bold text-lg text-foreground mb-2">
                        {item.title}
                      </h3>
                      <p className="font-ui text-sm text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────── */}
      <div className="container mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* ── How to Use ──────────────────────────────────── */}
      <section className="py-20 md:py-28" data-ocid="about.how_to_use.section">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
                How to Use the <span className="text-gold">Platform</span>
              </h2>
              <p className="font-ui text-muted-foreground text-base max-w-xl mx-auto">
                Follow these steps to get started and make the most of
                everything Chosen One has to offer.
              </p>
            </motion.div>

            <div className="max-w-3xl mx-auto space-y-5">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  variants={fadeUp}
                  className="flex gap-5 rounded-2xl border border-border bg-card p-5 hover:border-gold/25 hover:bg-secondary/20 transition-all duration-300"
                >
                  {/* Step number badge */}
                  <div className="shrink-0 mt-0.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 border border-gold/30 text-gold font-display font-black text-sm">
                      {i + 1}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-base text-foreground mb-1.5">
                      {step.title}
                    </h3>
                    <p className="font-ui text-sm text-muted-foreground leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────── */}
      <div className="container mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* ── Add to Home Screen ──────────────────────────── */}
      <section className="py-20 md:py-28" data-ocid="about.home_screen.section">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 border border-gold/20 text-gold">
                <Smartphone className="h-6 w-6" />
              </div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
                Take Chosen One Everywhere
              </h2>
              <p className="font-ui text-muted-foreground text-base max-w-xl mx-auto">
                Add the app to your Home Screen for instant access — no app
                store required.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {homeScreenSteps.map((device) => (
                <motion.div
                  key={device.platform}
                  variants={fadeUp}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-2xl" aria-hidden="true">
                      {device.icon}
                    </span>
                    <h3 className="font-display font-bold text-lg text-foreground">
                      {device.platform}
                    </h3>
                  </div>

                  <ol className="space-y-3">
                    {device.steps.map((step, stepIdx) => (
                      <li key={step} className="flex items-start gap-3">
                        <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-secondary border border-border text-[11px] font-bold font-ui text-muted-foreground mt-0.5">
                          {stepIdx + 1}
                        </span>
                        <span className="font-ui text-sm text-muted-foreground leading-relaxed">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────── */}
      <div className="container mx-auto px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* ── Contact Us ──────────────────────────────────── */}
      <section className="py-20 md:py-28" data-ocid="about.contact.section">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="max-w-2xl mx-auto text-center"
          >
            <motion.div variants={fadeUp} className="mb-4 flex justify-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 border border-gold/20 text-gold">
                <Mail className="h-6 w-6" />
              </div>
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4"
            >
              Have Questions or <span className="text-gold">Concerns?</span>
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="font-ui text-base text-muted-foreground leading-relaxed mb-10"
            >
              Our team is here to help. Reach out to us anytime and we'll get
              back to you as soon as possible. Whether it's a technical issue, a
              feature request, or anything else — your feedback matters.
            </motion.p>

            <motion.div variants={fadeUp}>
              <a
                href="mailto:Chosenoneproductions901@gmail.com"
                data-ocid="about.contact.button"
                className="group inline-flex items-center gap-3 rounded-2xl border border-gold/30 bg-gold/8 px-8 py-4 font-ui font-bold text-gold hover:bg-gold/15 hover:border-gold/50 transition-all duration-300 text-base shadow-lg shadow-gold/5 hover:shadow-gold/15"
              >
                <Mail className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Chosenoneproductions901@gmail.com
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────── */}
      {!isAuthenticated && (
        <section className="py-16 md:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-void/50 via-background to-background pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_100%,oklch(0.78_0.17_72/0.08),transparent)] pointer-events-none" />

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="relative container mx-auto px-4 text-center"
          >
            <motion.div
              variants={fadeUp}
              className="flex justify-center gap-2 mb-4"
            >
              <Trophy className="h-5 w-5 text-gold" />
              <Star className="h-5 w-5 text-gold" />
              <Trophy className="h-5 w-5 text-gold" />
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-4"
            >
              Ready to drop your AI music?
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="font-ui text-muted-foreground mb-8 max-w-md mx-auto"
            >
              Sign in and start your journey to the top of the charts today.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Button
                size="lg"
                onClick={login}
                disabled={isLoggingIn}
                className="font-ui font-bold text-base px-8 bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30 shadow-lg shadow-gold/10"
              >
                <Music2 className="h-5 w-5 mr-2" />
                {isLoggingIn ? "Signing in…" : "Join Chosen One"}
              </Button>
            </motion.div>
          </motion.div>
        </section>
      )}
    </main>
  );
}
