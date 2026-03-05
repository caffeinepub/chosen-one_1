import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  Mail,
  Music2,
  Shield,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import type { Variants } from "motion/react";
import { motion } from "motion/react";

/* ── Animation variants ──────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

/* ── Section data ────────────────────────────────────── */
const sections = [
  {
    id: "1",
    icon: Sparkles,
    title: "1. Originality Requirement",
    content: [
      "All uploaded music must be original AI-generated content. You must own or have full rights to every element of the track.",
      "Do NOT upload music owned by, sampled from, or attributed to any other artist — human or AI.",
      "Uploading copyrighted, plagiarized, or unoriginal content will result in immediate removal and account suspension.",
    ],
    highlight: true,
  },
  {
    id: "2",
    icon: Music2,
    title: "2. AI-Generated Content Only",
    content: [
      "This platform is exclusively for music created using AI tools, models, and software.",
      "Human-recorded music, voice samples taken from other recordings, or instrumentals sourced from third parties are not permitted.",
      "If any part of your track is not AI-generated, it is not eligible for upload.",
    ],
    highlight: false,
  },
  {
    id: "3",
    icon: Shield,
    title: "3. Prohibited Content",
    content: [
      "You may not upload content that includes hate speech, slurs, or content that targets any group based on race, religion, gender, sexuality, or national origin.",
      "Explicit, harmful, or illegal content is prohibited.",
      "Content that promotes violence, illegal activities, or infringes on any third party's rights will be removed immediately.",
    ],
    highlight: false,
  },
  {
    id: "4",
    icon: User,
    title: "4. User Conduct",
    content: [
      "Be respectful to all artists and listeners on this platform.",
      "Harassment, spam, or manipulation of voting and ratings is strictly prohibited.",
      "Battle challenges must be made in good faith. Using the battle system to abuse or intimidate other artists is grounds for suspension.",
      "No artist may compete against their own tracks in battle matches.",
    ],
    highlight: false,
  },
  {
    id: "5",
    icon: FileText,
    title: "5. Intellectual Property",
    content: [
      "You retain full ownership of your original AI-generated tracks.",
      "By uploading to Chosen One, you grant the platform a non-exclusive, royalty-free license to host, display, stream, and promote your music on this platform.",
      "This license does not transfer ownership and does not allow third-party redistribution without your consent.",
    ],
    highlight: false,
  },
  {
    id: "6",
    icon: Trash2,
    title: "6. Account & Content Removal",
    content: [
      "We reserve the right to remove any content that violates these Terms & Conditions at any time, without prior notice.",
      "Repeated violations may result in permanent account suspension.",
      "You may delete your own tracks and account at any time from the My Tracks and Profile pages.",
    ],
    highlight: false,
  },
  {
    id: "7",
    icon: AlertTriangle,
    title: "7. Disclaimer",
    content: [
      "Chosen One is provided as-is, without warranties of any kind, express or implied.",
      "We are not responsible for content submitted by users. All user-submitted content is the sole responsibility of the uploader.",
      "We do not guarantee platform availability, data retention, or uninterrupted service.",
    ],
    highlight: false,
  },
];

/* ── Component ───────────────────────────────────────── */
export function TermsPage() {
  return (
    <main className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-void via-background to-background pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_-10%,oklch(0.78_0.17_72/0.10),transparent)] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          {/* Back button */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <Link to="/">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 font-ui text-muted-foreground hover:text-foreground hover:bg-secondary/60 -ml-2"
                data-ocid="terms.back.button"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Charts
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-3xl"
          >
            {/* Badge */}
            <motion.div variants={fadeUp} className="mb-5">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/25 bg-gold/8 text-gold font-ui text-xs font-semibold tracking-wide">
                <FileText className="h-3 w-3" />
                Legal &amp; Community Guidelines
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none mb-4"
            >
              <span className="text-foreground">Terms &amp; </span>
              <span className="text-gold glow-text-gold">Conditions</span>
            </motion.h1>

            {/* Intro */}
            <motion.p
              variants={fadeUp}
              className="font-ui text-base text-muted-foreground leading-relaxed mb-2 max-w-2xl"
            >
              Welcome to{" "}
              <span className="text-foreground font-semibold">Chosen One</span>{" "}
              — the exclusive AI music platform where original, AI-generated
              artists compete, collaborate, and climb the charts. By using this
              platform, you agree to the following terms.
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="font-ui text-sm text-muted-foreground/60 italic"
            >
              Last updated: March 2026
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Intro Banner ─────────────────────────────── */}
      <section
        className="container mx-auto px-4 mb-10"
        data-ocid="terms.intro.section"
      >
        <div className="rounded-2xl border border-gold/25 bg-gold/5 p-5 sm:p-6 flex gap-4 items-start">
          <div className="shrink-0 mt-0.5">
            <div className="h-10 w-10 rounded-xl bg-gold/15 border border-gold/25 flex items-center justify-center text-gold">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h2 className="font-display font-bold text-base text-gold mb-1">
              Originality is Everything
            </h2>
            <p className="font-ui text-sm text-muted-foreground leading-relaxed">
              Chosen One was built exclusively for original AI-generated music.
              Every upload must be your own creation. This isn't just a rule —
              it's the foundation of a fair, creative, and respectful community.
              Respect other artists. Respect the platform. Upload only what's
              yours.
            </p>
          </div>
        </div>
      </section>

      {/* ── Sections ─────────────────────────────────── */}
      <section
        className="container mx-auto px-4 pb-16 max-w-3xl"
        data-ocid="terms.sections.section"
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="space-y-5"
        >
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.id}
                variants={fadeUp}
                className={`rounded-2xl border p-5 sm:p-6 transition-all duration-300 ${
                  section.highlight
                    ? "border-gold/30 bg-gold/5"
                    : "border-border bg-card hover:border-gold/20 hover:bg-secondary/20"
                }`}
                data-ocid={`terms.section.${section.id}.card`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center border ${
                      section.highlight
                        ? "bg-gold/15 border-gold/30 text-gold"
                        : "bg-secondary border-border text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-display font-bold text-base mb-3 ${
                        section.highlight ? "text-gold" : "text-foreground"
                      }`}
                    >
                      {section.title}
                    </h3>
                    <ul className="space-y-2">
                      {section.content.map((point) => (
                        <li
                          key={point}
                          className="flex items-start gap-2.5 font-ui text-sm text-muted-foreground leading-relaxed"
                        >
                          <span
                            className={`shrink-0 mt-2 h-1.5 w-1.5 rounded-full ${
                              section.highlight
                                ? "bg-gold"
                                : "bg-muted-foreground/40"
                            }`}
                          />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Contact section */}
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-border bg-card p-5 sm:p-6"
            data-ocid="terms.contact.card"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 h-10 w-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground">
                <Mail className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-base text-foreground mb-2">
                  8. Contact
                </h3>
                <p className="font-ui text-sm text-muted-foreground leading-relaxed mb-3">
                  Have questions about these terms, a copyright concern, or need
                  to report a violation? Reach out to our team directly — we'll
                  respond as quickly as possible.
                </p>
                <a
                  href="mailto:chosenoneproductions901@gmail.com"
                  className="inline-flex items-center gap-2 font-ui text-sm font-semibold text-gold hover:text-gold/80 transition-colors underline underline-offset-2"
                  data-ocid="terms.contact.link"
                >
                  <Mail className="h-3.5 w-3.5" />
                  chosenoneproductions901@gmail.com
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Footer CTA ───────────────────────────────── */}
      <section className="border-t border-border py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="font-ui text-sm text-muted-foreground mb-4">
            By uploading music or using any feature of Chosen One, you confirm
            that you have read, understood, and agree to these Terms &amp;
            Conditions.
          </p>
          <Link to="/">
            <Button
              className="gap-2 bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30 font-ui font-bold"
              data-ocid="terms.back_to_charts.button"
            >
              <Music2 className="h-4 w-4" />
              Back to Charts
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
