import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, MotionConfig } from "motion/react";
import {
  Clock,
  FileText,
  BarChart3,
  ShieldCheck,
  Upload,
  ArrowRight,
} from "lucide-react";

import Nav from "../components/Nav";
import Footer from "../components/Footer";

export default function Landing() {
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());

  // Live clock — the "hero". Ticks once per second.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-app text-txt">
        <Nav />

        {/* -------------------------------------------------------------- */}
        {/* HERO                                                            */}
        {/* -------------------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left — message */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Time-management trainer
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-tight">
                Upload any exam paper.
                <br />
                Practice like it's
                <br />
                <span className="text-primary">the real thing.</span>
              </h1>

              <p className="mt-6 text-txt-dim text-lg max-w-md leading-relaxed">
                Bring your own PDF. Get a fullscreen CBT with a locked timer, a
                real question palette, and a report that shows you exactly
                where your time went.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                  onClick={() => navigate("/signup")}
                  className="inline-flex items-center justify-center gap-2 rounded bg-primary px-6 py-3 font-medium text-app hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-app transition"
                >
                  Create your first test
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                  onClick={() => navigate("/login")}
                  className="inline-flex items-center justify-center rounded border border-border px-6 py-3 font-medium text-txt hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary transition"
                >
                  I have an account
                </motion.button>
              </div>

              <p className="mt-6 text-xs text-txt-dim">
                No question banks. No categories. No ads.
              </p>
            </motion.div>

            {/* Right — the clock (hero visual) */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut", delay: 0.05 }}
            >
              <div className="rounded-lg border border-border bg-surface p-8">
                <div className="flex items-center justify-between text-xs font-mono text-txt-dim uppercase tracking-widest">
                  <span>SSC CGL Mock 3</span>
                  <span>Live</span>
                </div>

                <div className="mt-8 text-center">
                  {/* Timer — NOT animated. Numbers must be stable to read. */}
                  <div className="font-mono text-7xl md:text-8xl font-bold tabular-nums text-txt">
                    {hh}:{mm}
                    <span className="text-primary">:{ss}</span>
                  </div>
                  <div className="mt-2 text-xs font-mono text-txt-dim">
                    Elapsed · 00:00 started
                  </div>
                </div>

                {/* Palette mini-preview */}
                <div className="mt-8 grid grid-cols-10 gap-1.5">
                  {Array.from({ length: 40 }).map((_, i) => {
                    const state =
                      i % 7 === 0
                        ? "bg-marked"
                        : i % 3 === 0
                          ? "bg-answered"
                          : i < 12
                            ? "bg-unvisited"
                            : "border border-border";
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          duration: 0.15,
                          ease: "easeOut",
                          delay: 0.1 + i * 0.008,
                        }}
                        className={`aspect-square rounded-sm ${state}`}
                      />
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center gap-4 text-[10px] font-mono text-txt-dim">
                  <Legend color="bg-answered" label="Answered" />
                  <Legend color="bg-marked" label="Marked" />
                  <Legend color="border border-border" label="Untouched" />
                </div>
              </div>

              {/* Floating stat card */}
              <motion.div
                className="absolute -bottom-6 -left-6 rounded border border-border bg-app px-4 py-3 hidden md:block"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.2,
                  ease: "easeOut",
                  delay: 0.35,
                }}
              >
                <div className="font-mono text-xs text-txt-dim">
                  Time wasted on wrong answers
                </div>
                <div className="font-mono text-lg font-semibold text-warning">
                  6m 24s
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* HOW IT WORKS                                                    */}
        {/* -------------------------------------------------------------- */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <Reveal>
              <div className="flex items-center gap-4">
                <h2 className="text-xs font-mono uppercase tracking-widest text-txt-dim shrink-0">
                  Upload → result in under 90 seconds
                </h2>
                <div className="h-px flex-1 bg-border" />
              </div>
            </Reveal>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <Reveal delay={0}>
                <Step
                  n="01"
                  icon={<Upload className="h-4 w-4" />}
                  title="Upload your PDF"
                  body="Any paper. Any year. Answer key auto-detected. Fix it manually if we miss one."
                />
              </Reveal>
              <Reveal delay={0.05}>
                <Step
                  n="02"
                  icon={<Clock className="h-4 w-4" />}
                  title="Take it under lock"
                  body="Fullscreen. Timer anchored to Date.now(). Tab-switch detection. Three strikes and it submits itself."
                />
              </Reveal>
              <Reveal delay={0.1}>
                <Step
                  n="03"
                  icon={<BarChart3 className="h-4 w-4" />}
                  title="See where time went"
                  body="Slowest 5 questions. Fastest 5. Ideal pace vs. your pace. Time wasted on wrong answers."
                />
              </Reveal>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* THE ANALYTICS PREVIEW                                           */}
        {/* -------------------------------------------------------------- */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <div>
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                  Most apps give you
                  <br />
                  more questions.
                  <br />
                  <span className="text-primary">We teach pacing.</span>
                </h2>
                <p className="mt-6 text-txt-dim max-w-md leading-relaxed">
                  The clock is the teacher. Every attempt ends with honest
                  numbers: average time per question against an ideal pace,
                  slowest questions flagged, wasted time on wrong answers
                  totalled.
                </p>
                <p className="mt-4 text-txt-dim max-w-md leading-relaxed">
                  No confetti. No leaderboards. Just the math.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="rounded-lg border border-border bg-surface p-6 font-mono text-sm">
                <div className="flex items-center justify-between text-xs text-txt-dim uppercase tracking-widest mb-6">
                  <span>Result — SSC CGL Mock 3</span>
                  <span className="text-answered">Submitted</span>
                </div>

                <div className="grid grid-cols-4 gap-3 text-center">
                  <Stat label="Score" value="142" accent="text-primary" />
                  <Stat label="Correct" value="71" accent="text-answered" />
                  <Stat label="Wrong" value="8" accent="text-danger" />
                  <Stat label="Skipped" value="21" accent="text-txt-dim" />
                </div>

                <div className="mt-6 space-y-2 text-xs">
                  <Row k="Accuracy" v="89%" />
                  <Row k="Time" v="54:12 / 60:00" />
                  <Row k="Avg / question" v="32.5s" />
                  <Row
                    k="Ideal pace"
                    v={<span className="text-answered">36.0s ✅</span>}
                  />
                </div>

                <div className="mt-6 border-t border-border pt-4">
                  <div className="text-xs text-txt-dim mb-3">
                    🐢 Slowest 5
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span>Q47</span>
                      <span className="text-danger">
                        3m 12s — Wrong ⚠️
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Q63</span>
                      <span className="text-txt-dim">
                        2m 48s — Correct
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
                  ⚠️ Time wasted on wrong answers: 6m 24s
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* TRUST                                                           */}
        {/* -------------------------------------------------------------- */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Reveal>
                <Trust
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="Your PDFs are private."
                  body="Files stay on your server. Auto-deleted after 30 days. No third-party sharing."
                />
              </Reveal>
              <Reveal delay={0.05}>
                <Trust
                  icon={<FileText className="h-5 w-5" />}
                  title="Scores computed on the server."
                  body="The client can't tamper. Every attempt is scored backend-side."
                />
              </Reveal>
              <Reveal delay={0.1}>
                <Trust
                  icon={<Clock className="h-5 w-5" />}
                  title="Timer is drift-free."
                  body="Anchored to Date.now() at start. Refresh, tab-switch, or fullscreen-exit — the clock doesn't lie."
                />
              </Reveal>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* FINAL CTA                                                       */}
        {/* -------------------------------------------------------------- */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center">
            <Reveal>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                Bring your own paper.
                <br />
                We bring the pressure.
              </h2>
              <motion.button
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.1 }}
                onClick={() => navigate("/signup")}
                className="mt-10 inline-flex items-center gap-2 rounded bg-primary px-8 py-4 font-medium text-app hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-app transition"
              >
                Create your first test
                <ArrowRight className="h-4 w-4" />
              </motion.button>
              <p className="mt-4 text-xs text-txt-dim">
                Takes about 90 seconds to your first result.
              </p>
            </Reveal>
          </div>
        </section>

        <Footer />
      </div>
    </MotionConfig>
  );
}

// ---------------------------------------------------------------------------
// Landing-only helpers — kept local because they aren't reused elsewhere.
// ---------------------------------------------------------------------------

function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.2, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

function Step({
  n,
  icon,
  title,
  body,
}: {
  n: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="group relative rounded-lg border border-border bg-surface p-6 transition-colors duration-150 hover:border-primary/40 hover:bg-surface/80">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded border border-primary/20 bg-primary/5 text-primary">
          {icon}
        </div>
        <span className="font-mono text-xs font-medium tabular-nums text-txt-dim">
          {n}
        </span>
      </div>

      <h3 className="mt-5 text-base font-medium tracking-tight text-txt">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-txt-dim">{body}</p>
    </div>
  );
}

function Trust({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="text-primary">{icon}</div>
      <h3 className="mt-4 font-medium">{title}</h3>
      <p className="mt-1 text-sm text-txt-dim leading-relaxed">{body}</p>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div>
      <div className={`text-2xl font-bold ${accent}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-txt-dim mt-1">
        {label}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-txt-dim">{k}</span>
      <span>{v}</span>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-2 w-2 rounded-sm ${color}`} />
      <span>{label}</span>
    </div>
  );
}