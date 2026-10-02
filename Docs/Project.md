CBT Exam Simulator — Project Brief (PROJECT.md)
Below is the complete project markdown. Copy it into a file named PROJECT.md at the root of your repository. This will serve as the single source of truth for the 1-day build.

markdown
# CBT Exam Simulator

> A self-hosted, fullscreen-locked Computer-Based Test (CBT) simulator for government exams (SSC, UPSC, Banking) and college entrance exams (JEE, NEET, CET).  
> Upload your own PDF paper → configure marks/duration → practice under real exam pressure with time-management analytics.

---

## 1. Vision

Most students fail not because they don't know the answer — but because they **run out of time**.  
Existing mock test apps force their own question banks. This platform gives **complete freedom**:

- Bring your **own PDF** (any paper, any exam, any year)
- Simulate the **exact CBT environment** (fullscreen lock, timer, palette)
- Get **time-per-question analytics** to fix pacing habits

No categories. No forced syllabus. Just **pure time-management training**.

---

## 2. Core Objectives

| # | Objective | Success Criteria |
|---|-----------|------------------|
| 1 | Upload any question paper PDF | PDF parsed, answer key auto-extracted |
| 2 | Configure exam like real CBT | Marks, negative marks, duration, total Qs |
| 3 | Replicate real CBT environment | Fullscreen lock, timer, palette, mark-for-review |
| 4 | Server-side scoring | Tamper-proof score computed on backend |
| 5 | Time-management insights | Slowest/fastest questions, ideal pace, waste analysis |
| 6 | Privacy-first | PDFs stay on user's server, no third-party sharing |

---

## 3. Key Features (MVP)

### 3.1 Exam Configuration
- Test name
- Duration (in seconds / minutes)
- Total number of questions
- Marks per correct answer (+)
- Negative marks per wrong answer (−)
- Upload PDF (with answer key embedded)
- Auto-extract answer key via regex; manual override UI for fallback

### 3.2 CBT Exam Room
- **Fullscreen enforced** (with 3-strike violation system)
- **Live countdown timer** (drift-free, based on `Date.now()` anchor)
- **Question palette** with color states:
  - 🟢 Answered
  - 🟣 Marked for review
  - ⚪ Not visited / skipped
- **Navigation**: Prev / Next / Jump-to-question
- **Answer selection**: Option A / B / C / D (or manual)
- **Auto-submit** on timer expiry
- **Tab-switch / fullscreen-exit detection** (anti-cheat simulation)
- **Right-click and copy disabled**

### 3.3 Result & Analytics
- Score, correct, wrong, skipped
- Accuracy percentage
- **Slowest 5 questions** (where time was wasted)
- **Fastest 5 questions**
- Total time used vs total time available
- Average time per question vs **ideal pace**
- (v2) Time spent on wrong answers → "time wasted" metric

### 3.4 User & History
- JWT-based auth (login / signup)
- Per-user attempt history
- Revisit old attempts and compare scores

---

## 4. Out of Scope (Explicitly)

- ❌ Pre-loaded question banks
- ❌ Category / syllabus filtering
- ❌ Live proctoring (webcam / AI monitoring)
- ❌ Payment / subscriptions
- ❌ Mobile app (responsive web only)
- ❌ Multiplayer / leaderboards

---

## 5. Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | React 18 + TypeScript + Vite | Fast dev, typed |
| Styling | TailwindCSS | Zero-config utility styling |
| PDF Rendering | `react-pdf` (pdf.js) | Reliable canvas rendering |
| State | React hooks + Zustand (v2) | Minimal for MVP |
| Backend | Django 5 + DRF | Batteries-included, fast to ship |
| Auth | `djangorestframework-simplejwt` | Stateless, simple |
| Database | PostgreSQL 16 | Robust JSON field support |
| PDF Parsing | `pdfplumber` | Best text extraction quality |
| Deployment | Render (backend) + Vercel (frontend) | Free tiers, one-click |
| Container | Docker + Docker Compose | Reproducible env |

---

## 6. Architecture Overview
┌────────────────────────────────────────────┐
│ Browser (React TS) │
│ │
│ Login → Dashboard → Create Test │
│ ↓ │
│ Upload PDF + Config │
│ ↓ │
│ 🔒 CBT Room (Fullscreen) │
│ ↓ │
│ Submit → Result Page │
└────────────────────────────────────────────┘
│
│ REST (JWT)
▼
┌────────────────────────────────────────────┐
│ Django REST Framework │
│ │
│ /api/token/ (JWT auth) │
│ /api/tests/ (CRUD + upload) │
│ /api/tests/{id}/answer-key/ (PATCH) │
│ /api/attempts/ (create) │
│ /api/attempts/{id}/submit/ (score) │
└────────────────────────────────────────────┘
│
▼
┌────────────────────────────────────────────┐
│ PostgreSQL │
│ users | tests | attempts │
└────────────────────────────────────────────┘
│
▼
┌────────────────────────────────────────────┐
│ media/pdfs/ (local storage) │
└────────────────────────────────────────────┘

text

---

## 7. Data Model

### 7.1 `User` (extends Django `AbstractUser`)
- `id`, `username`, `email`, `password`, timestamps

### 7.2 `Test`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `owner` | FK → User | |
| `name` | CharField(200) | |
| `duration_sec` | PositiveInteger | |
| `total_questions` | PositiveInteger | |
| `marks_per_q` | Decimal(5,2) | |
| `negative_marks` | Decimal(5,2) | |
| `pdf` | FileField | `media/pdfs/` |
| `answer_key` | JSONField | `{"1":"B","2":"A",...}` |
| `created_at` | DateTimeField | |

### 7.3 `Attempt`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `test` | FK → Test | |
| `user` | FK → User | |
| `responses` | JSONField | `{"1":"B","2":null,...}` |
| `marked` | JSONField | `[3,17,42]` |
| `time_per_q` | JSONField | `{"1":45,"2":12,...}` seconds |
| `score` | Decimal(8,2) | Computed server-side |
| `correct` | PositiveInteger | |
| `wrong` | PositiveInteger | |
| `skipped` | PositiveInteger | |
| `started_at` | DateTimeField | auto |
| `submitted_at` | DateTimeField | nullable |

---

## 8. API Endpoints

### Auth
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/token/` | Login (returns JWT) |
| POST | `/api/token/refresh/` | Refresh JWT |

### Tests
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/tests/` | List user's tests |
| POST | `/api/tests/` | Create test + upload PDF |
| GET | `/api/tests/{id}/` | Test detail (includes `pdf_url`) |
| PATCH | `/api/tests/{id}/answer-key/` | Manually fix answer key |

### Attempts
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/attempts/` | Start attempt (`{test: id}`) |
| GET | `/api/attempts/` | User's history |
| GET | `/api/attempts/{id}/` | Attempt detail |
| POST | `/api/attempts/{id}/submit/` | Submit answers → score |

---

## 9. Scoring Logic

```python
for q in range(1, total_questions + 1):
    user_ans = responses.get(str(q))
    correct_ans = answer_key.get(str(q))

    if not user_ans:
        skipped += 1
    elif user_ans == correct_ans:
        correct += 1
    else:
        wrong += 1

score = (correct * marks_per_q) - (wrong * negative_marks)
accuracy = correct / max(correct + wrong, 1) * 100
Scoring is always server-side — client cannot tamper.

10. Anti-Cheat / Exam Lock Rules
Rule	Implementation
Fullscreen enforced	document.documentElement.requestFullscreen()
Exit detection	fullscreenchange event
Tab switch detection	visibilitychange event
3-strike rule	Auto-submit after 3 violations
Right-click block	contextmenu preventDefault
Copy block	copy preventDefault
Refresh/close guard	beforeunload preventDefault
Timer tamper-proof	Anchored to Date.now() at start
11. Time-Management Analytics (Killer Feature)
Post-submit report shows:

text
Total time:        58:12 / 60:00
Avg time/question: 34.9 sec
Ideal pace:        36.0 sec ✅

Slowest 5 questions:
  Q47  — 3:12 (wrong)
  Q63  — 2:48 (correct)
  ...

Fastest 5 questions:
  Q1   — 8 sec (correct)
  ...

⚠️ Time wasted on wrong answers: 6 min 24 sec
💡 Recommendation: Skip Q47 & Q63 on first pass; revisit at end.
This transforms the app from "another mock test" into a pacing coach.

12. Project Structure
text
cbt-app/
├── PROJECT.md
├── docker-compose.yml
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── core/              # settings, urls, wsgi
│   ├── accounts/          # User model
│   ├── exams/             # Test, Attempt, parser
│   └── media/pdfs/
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── Dockerfile
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api/client.ts
        ├── pages/
        │   ├── Login.tsx
        │   ├── Dashboard.tsx
        │   ├── CreateTest.tsx
        │   ├── ExamRoom.tsx
        │   └── Result.tsx
        └── components/
            ├── Timer.tsx
            ├── Palette.tsx
            └── QuestionView.tsx