# Updated `DESIGN.md`

Here's a revised `DESIGN.md` that reflects everything we've actually built and decided during this session — the Tailwind v4 setup, Motion usage rules, the split Nav/Footer architecture, the palette mini-preview, and the specific "show the math" tweaks we made. I've kept every locked decision from the original, only adding what's now true.

---

```markdown
# DESIGN.md — Product & Experience Design

> The why and how it feels. Product thinking, not code.

---

## 1. One-Line Pitch

> **"Upload any exam paper. Practice like it's the real thing. Learn where your time goes."**

---

## 2. The Problem

Students don't fail because they don't know answers — they fail because **the clock beats them**.

Existing mock apps give **more questions**. We teach **pacing**.

---

## 3. Who It's For — One User, Two Modes

**No roles.** No teacher vs student. Same account, same dashboard.

- **Author mode** — upload PDF, configure test
- **Test-taker mode** — fullscreen CBT, submit, review

**Personas:**
- **Aarav** (19–25) — JEE/NEET/SSC aspirant with own PDFs. Wants real CBT feel.
- **Meera** (27) — working, weekend practice. Wants speed.
- **Rohit** — coaching teacher. Same account, no special role.

---

## 4. Design Principles

1. Respect the user's paper
2. Feel like a real exam
3. No noise, no ads, no upsells
4. Time is the hero
5. Show the math, always
6. Upload → result in under 90 seconds

---

## 5. Emotional Arc

| Stage | Feeling |
|-------|---------|
| Landing | "Clean and serious." |
| Upload | "My own paper." |
| CBT entry | "This is real." |
| Mid-exam | "Focus." |
| Last 60s | "Controlled panic." |
| Result | "I know what went wrong." |

---

## 6. Screens

### Login
Dark. Centered card. Email + password. One button. No marketing.

### Dashboard
```
┌──────────────────────────────────────┐
│  CBT Simulator            [ Log out ]│
├──────────────────────────────────────┤
│  Good evening, Aarav.                │
│                                      │
│  [+ Create Test]  [ Take a Test ]    │
│                                      │
│  ── My Tests ──                      │
│  • SSC CGL Mock 3   100 Q · 60 min   │
│                                      │
│  ── Recent Attempts ──               │
│  • SSC CGL Mock 2   142/200          │
└──────────────────────────────────────┘
```
Two equal CTAs. No hierarchy bias.

### Create Test
Single vertical form, max 640px. Name, PDF drop zone, duration chips, total Q, +marks, −marks, **Start Test** button.

Inline banners (never modals):
- ✅ *"Answer key detected for 98/100."*
- ⚠️ *"Only 40 detected — fix manually."*
- ❌ *"This PDF didn't work."*

### CBT Room (Hero)
```
┌──────────────────────────────────────────────────────┐
│  SSC CGL Mock 3                    ⏱ 42:17          │
├──────────────────┬──────────────┬────────────────────┤
│                  │  Question 47 │   PALETTE          │
│   PDF PAGE       │  ○ A         │   1 2 3 4 5        │
│                  │  ● B         │   6 7 8 9 10       │
│                  │  ○ C         │   ...              │
│                  │  ○ D         │                    │
│                  │  [Mark]      │  ● Answered        │
│                  │              │  ● Marked          │
├──────────────────┴──────────────┴────────────────────┤
│  [< Prev]                        [Next >]            │
│              [ Submit Test ]                         │
└──────────────────────────────────────────────────────┘
```

**Feel:**
- Timer: green → amber (5 min) → red (1 min)
- Palette flash 100ms green on answer
- Mark-for-review turns palette purple
- Question type label (`MCQ`/`TF`/`AR`/`MSQ`) shown above options
- No back button. Fullscreen locked.

### Violation Modal (only modal in exam)
```
⚠️ Warning 1 of 3
Leaving the exam window isn't allowed.
[ Return to exam ]
```
3 violations → auto-submit.

### Submit — Two Steps
1. Confirm modal (shows answered / unanswered counts)
2. 1-second "Calculating…" screen
3. Result page

### Result Page
```
┌──────────────────────────────────────┐
│  SSC CGL Mock 3                      │
│                                      │
│  SCORE  CORRECT  WRONG  SKIPPED      │
│   142     71       8      21         │
│                                      │
│  Accuracy: 89%                       │
│  Time: 54:12 / 60:00                 │
│  Avg: 32.5 sec/Q  ·  Ideal: 36.0 ✅  │
│                                      │
│  🐢 Slowest 5:                       │
│    Q47 — 3m12s — Wrong ⚠️            │
│                                      │
│  ⚡ Fastest 5:                        │
│    Q1 — 8s — Correct                 │
│                                      │
│  [ Retake ]  [ Back to dashboard ]   │
└──────────────────────────────────────┘
```
No celebration. Just honest numbers.

### Mobile Fallback
Viewport < 1024px → **"🖥️ Desktop required"** page.
Login and Dashboard work on mobile. Exam Room doesn't.

### Empty States
- **No tests:** line-art + *"Upload your first paper →"*
- **No attempts:** *"Pick a test from your list."*
- **PDF failed:** *"This file didn't load. Try another."*

---

## 7. Visual Language

### Theme — Dark Only
Dark UI makes the **PDF the brightest element** on screen. PDF pane uses off-white (`#F5F5F4`) to soften contrast.

### Colors
| Purpose | Hex |
|---------|-----|
| App background | `#0B0F14` |
| Surface | `#111827` |
| Border | `#1F2937` |
| Text primary | `#E5E7EB` |
| Text secondary | `#9CA3AF` |
| Primary action | `#14B8A6` (teal) |
| Danger | `#DC2626` |
| Warning | `#F59E0B` |
| Answered | `#22C55E` |
| Marked | `#A855F7` |
| Unvisited | `#374151` |
| PDF pane | `#F5F5F4` |

### Typography
- **Headings / Body:** Inter
- **Timer / Scores / Palette:** JetBrains Mono
- Both loaded via `<link>` in `index.html` (never `@import` in CSS — Tailwind v4 expands its own import first, breaking CSS ordering rules)

### Spacing
Base 4px · Container 24px · Card 20px · Section gap 32px

### Radii & Shadows
Max radius 8px. **No drop shadows. Flat by default.**
Elevation is communicated by border color shifts (`border-border` → `border-primary/40`) and hairline rules, never by shadow.

### Motion
- Fades: 150ms
- Modal: 200ms ease-out
- Palette flash: 100ms
- Section reveals (scroll into view): 200ms ease-out, one-shot
- Timer pulse: only < 60s
- **No confetti, no bounce, no gamification**
- **Timer digits never animate.** Numbers must be stable to read.
- **Result numbers never animate.** "No celebration. Just honest numbers."
- All Motion components inherit `MotionConfig reducedMotion="user"`

### Structural Cues
- Section headings sit on a horizontal row with a `1px` border rule running to the right edge
- Card headers use a top accent gradient (`transparent → border → transparent`)
- Icon badges are `40×40` bordered teal-tinted squares — not bare icons
- Step numbers (`01`, `02`, `03`) are mono, tabular, right-aligned to the badge row

---

## 8. Microcopy Rules

| Instead of | Say |
|-----------|-----|
| "Submit" | "Submit Test" |
| "Error 400" | "That duration doesn't look right." |
| "Answer key not found" | "We couldn't detect the answer key." |
| "Are you sure?" | "You have 6 unanswered questions. Submit anyway?" |

**Tone:** second person, never blame, short sentences, no exclamation marks.

---

## 9. Error Handling

- Errors **never use modals** — only inline banners
- Green (success), amber (warning), red (error)
- Auto-dismiss after 6 seconds
- Describe problem + offer next step

---

## 10. The CBT Feel — Key Details

1. "Locking in…" pause before exam starts
2. Silent countdown, subtle pulse < 60s
3. Palette flash on answer
4. No "are you sure?" on option clicks
5. Submit needs 2 clicks
6. Question number echoed in PDF + answer panel
7. 1-second "Calculating…" before result
8. Zero ads, zero banners

---

## 11. Onboarding (First 60 Seconds)

1. Single CTA: **Create your first test →**
2. Upload PDF → instant feedback
3. Form pre-filled (60m, 100Q, +1, 0)
4. Big teal **Start Test** button
5. Overlay: *"Once you start, you can't pause. Ready?"*

No tutorial. No "step 3 of 5".

---

## 12. Trust Signals

- Footer: *"Your PDFs are private."*
- Upload note: *"Files auto-deleted after 30 days."*
- Result: *"Scores computed on the server."*

---

## 13. Accessibility

- Contrast ≥ 4.5:1
- Visible focus rings (teal)
- Keyboard-first tab order
- `aria-live` on timer
- Respects `prefers-reduced-motion` — both via CSS `@media` and `MotionConfig reducedMotion="user"`
- Palette uses icon + color (colorblind-safe)

---

## 14. What We Don't Do

❌ Gamification ❌ Leaderboards ❌ Social features ❌ Ads ❌ Push notifications ❌ AI-generated questions ❌ Role-based access ❌ Mobile exam room ❌ Complex dashboards

---

## 15. Success Metrics

- Answer key parses successfully → > 85%
- Tests started that submit → > 80%
- Login to test start → < 90 sec
- Result page viewed fully → > 70%
- 2nd test within 7 days → > 40%
- Attempts per user per week → ≥ 3

---

## 16. Roadmap Signals

1. Section timers → v2 (schema ready day 1)
2. Question-wise review → v2
3. Attempt comparison → v2
4. Share test link → v3
5. Weak-topic tagging → v3

---

## 17. Design Mantras

1. **The clock is the teacher.**
2. **Bring your own paper. We bring the pressure.**
3. **Seriousness = stillness.**
4. **Show the math, always.**
5. **One user. Two modes.**
6. **Dark, focused, honest.**

---

## 18. Frontend Architecture (Locked)

- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS **v4** via `@tailwindcss/vite` (no `tailwind.config.js`, tokens live in `@theme` inside `src/index.css`)
- **Motion:** `motion/react` (package: `motion`) — used only for purposeful transitions
- **Routing:** `react-router-dom` v6 — `StrictMode` outermost in `main.tsx`, `BrowserRouter` at the app root
- **Icons:** `lucide-react`

### File Layout

```
src/
├── main.tsx
├── App.tsx
├── index.css                 ← @theme tokens, base styles
├── components/               ← shared across pages
│   ├── Nav.tsx
│   └── Footer.tsx
└── pages/
    ├── Landing.tsx
    ├── Login.tsx             ← next to build
    ├── Dashboard.tsx
    ├── CreateTest.tsx
    ├── ExamRoom.tsx
    └── Result.tsx
```

### Component Boundaries

- **`Nav` and `Footer`** are shared, prop-less, and own their own routing via `useNavigate()`. Drop-in usable on every page.
- **Landing-specific helpers** (`Reveal`, `Step`, `Trust`, `Stat`, `Row`, `Legend`) stay local to `Landing.tsx` until a second page needs them.
- **`Reveal`** is a `whileInView` wrapper with `viewport={{ once: true }}`. Fades in once; never re-animates on scroll-up.

### CSS Gotchas (Recorded)

- Google Fonts must be loaded via `<link>` in `index.html`, **not** `@import` in `index.css`. Tailwind v4's `@import "tailwindcss"` expands first and makes any later `@import` illegal per CSS spec.

---

**Status:** 🟢 Locked · **Version:** 1.1.0 · **Pairs with:** `PROJECT.md`, `TASK.md`
```

---