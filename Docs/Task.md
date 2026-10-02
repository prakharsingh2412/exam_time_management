# TASK.md — CBT Exam Simulator Build Checklist

> Companion to `PROJECT.md`. Tick each item as you complete it.
> Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

---

## 🕐 Hour 0 — Repo & Environment Setup

### Repo
- [ ] Create GitHub repo `cbt-app`
- [ ] Add `PROJECT.md`, `TASK.md`, `README.md` to root
- [ ] Add `.gitignore` (Python + Node + env + media + `__pycache__`)
- [ ] Add `.editorconfig` (2-space for TS, 4-space for Python)
- [ ] First commit: `chore: initial scaffold`

### Local Env
- [ ] Install Python 3.12
- [ ] Install Node 20 LTS
- [ ] Install Docker Desktop
- [ ] Install PostgreSQL 16 (or use Docker)
- [ ] Verify `psql --version`, `python --version`, `node --version`

### Monorepo Layout
- [ ] Create `backend/` and `frontend/` folders
- [ ] Create `.env.example` for both
- [ ] Create root `docker-compose.yml` (skeleton)
- [ ] Create root `Makefile` (optional: `make up`, `make migrate`, `make dev`)

---

## 🕐 Hour 0–1 — Backend Scaffold (Django + DRF + Postgres)

### Install & Init
- [ ] `python -m venv venv && source venv/bin/activate`
- [ ] `pip install django djangorestframework djangorestframework-simplejwt psycopg2-binary python-decouple pdfplumber django-cors-headers gunicorn whitenoise`
- [ ] `pip freeze > backend/requirements.txt`
- [ ] `django-admin startproject core backend`
- [ ] `cd backend && python manage.py startapp accounts`
- [ ] `python manage.py startapp exams`

### Settings (`core/settings.py`)
- [ ] Load `.env` via `python-decouple`
- [ ] Add `rest_framework`, `corsheaders`, `accounts`, `exams` to `INSTALLED_APPS`
- [ ] Add `corsheaders.middleware.CorsMiddleware` (top of MIDDLEWARE)
- [ ] Add `WhiteNoiseMiddleware`
- [ ] Set `AUTH_USER_MODEL = "accounts.User"`
- [ ] Configure Postgres `DATABASES` from env
- [ ] Configure `REST_FRAMEWORK` with JWT auth
- [ ] Configure `SIMPLE_JWT` token lifetime
- [ ] Set `MEDIA_URL`, `MEDIA_ROOT`
- [ ] Set `CORS_ALLOW_ALL_ORIGINS = True` (dev only)

### URLs (`core/urls.py`)
- [ ] Add `admin/`
- [ ] Add `/api/` include router
- [ ] Add `/api/token/` (SimpleJWT)
- [ ] Add `/api/token/refresh/`
- [ ] Add `static(MEDIA_URL, ...)` for dev
- [ ] Verify `python manage.py runserver` boots

### Database
- [ ] Create Postgres DB `cbt`
- [ ] Run `python manage.py migrate`
- [ ] Create superuser
- [ ] Confirm `/admin/` loads

---

## 🕐 Hour 1–2 — Auth + Models

### Custom User (`accounts/models.py`)
- [ ] `class User(AbstractUser): pass`
- [ ] Register in `accounts/admin.py`
- [ ] `makemigrations accounts && migrate`

### Test Model (`exams/models.py`)
- [ ] `Test` model with UUID PK
- [ ] Fields: `owner`, `name`, `duration_sec`, `total_questions`, `marks_per_q`, `negative_marks`, `pdf`, `answer_key`, `created_at`
- [ ] `Attempt` model with UUID PK
- [ ] Fields: `test`, `user`, `responses`, `marked`, `time_per_q`, `score`, `correct`, `wrong`, `skipped`, `started_at`, `submitted_at`
- [ ] Add indexes on `owner`, `user`, `test`
- [ ] `makemigrations exams && migrate`
- [ ] Register both in `exams/admin.py`

### Serializers (`exams/serializers.py`)
- [ ] `TestSerializer` (read; includes `pdf_url`)
- [ ] `TestCreateSerializer` (write; auto-parses answer key)
- [ ] `AttemptSerializer` (read + create only)

### Views (`exams/views.py`)
- [ ] `TestViewSet` — list/create/retrieve/destroy scoped to `request.user`
- [ ] `TestViewSet.set_answer_key` action (PATCH)
- [ ] `AttemptViewSet` — list/retrieve/create scoped to user
- [ ] `AttemptViewSet.submit` action — server-side scoring

### URLs
- [ ] Register `tests` and `attempts` routers
- [ ] Test all endpoints in Postman / `curl`

---

## 🕐 Hour 2–3 — PDF Upload + Answer-Key Parser

### Parser (`exams/parser.py`)
- [ ] `extract_answer_key(pdf_path)` using `pdfplumber`
- [ ] Regex for `ANS: B` / `Answer - B` / `Ans) b`
- [ ] Handle multi-page PDFs
- [ ] Return `{"1":"B","2":"A",...}`
- [ ] Unit test with sample PDF (10 questions)

### Upload Flow
- [ ] `TestCreateSerializer.create()` calls parser
- [ ] Save parsed key to `test.answer_key`
- [ ] Handle parse failure → empty dict + warn flag
- [ ] Add manual override via `PATCH /api/tests/{id}/answer-key/`
- [ ] Verify PDF stored under `media/pdfs/`
- [ ] Verify `pdf_url` returned in API response

---

## 🕐 Hour 3–4 — Attempt + Submit + Score

### Start Attempt
- [ ] `POST /api/attempts/` with `{test: id}` creates Attempt
- [ ] Auto-assign `user` from JWT
- [ ] Return `attempt.id` + `test.pdf_url`

### Submit
- [ ] `POST /api/attempts/{id}/submit/`
- [ ] Accept `{responses, time_per_q, marked}`
- [ ] Loop over all questions, compute correct/wrong/skipped
- [ ] Compute `score = correct*marks_per_q - wrong*negative_marks`
- [ ] Save `submitted_at`
- [ ] Return `{score, correct, wrong, skipped, accuracy, answer_key}`

### Edge Cases
- [ ] Submit twice → return same result (idempotent)
- [ ] Missing responses → treated as skipped
- [ ] Invalid question numbers ignored

---

## 🕐 Hour 4–5 — Frontend Scaffold

### Vite + React TS
- [ ] `npm create vite@latest frontend -- --template react-ts`
- [ ] `cd frontend && npm install`
- [ ] `npm i axios react-router-dom react-pdf zustand`
- [ ] `npm i -D tailwindcss postcss autoprefixer`
- [ ] `npx tailwindcss init -p`
- [ ] Configure `tailwind.config.js` content paths
- [ ] Add Tailwind directives to `index.css`
- [ ] Add `VITE_API_URL` to `.env`

### API Client
- [ ] `src/api/client.ts` — axios instance
- [ ] Request interceptor → attach `Bearer` token
- [ ] Response interceptor → redirect to `/login` on 401

### Routing (`App.tsx`)
- [ ] `/login` → `Login`
- [ ] `/` → `Dashboard` (protected)
- [ ] `/create` → `CreateTest` (protected)
- [ ] `/exam/:id` → `ExamRoom` (protected)
- [ ] `/result/:id` → `Result` (protected)
- [ ] `Private` wrapper component

### Login Page
- [ ] Username + password form
- [ ] `POST /api/token/` → store token in `localStorage`
- [ ] Redirect to `/`

### Dashboard
- [ ] Fetch `GET /api/tests/`
- [ ] List tests with name + date
- [ ] "Create Test" button → `/create`
- [ ] "Attempts" list from `GET /api/attempts/`

---

## 🕐 Hour 5–7 — CBT Exam Room (Heart of the App)

### Load & Setup
- [ ] Fetch test detail on mount
- [ ] Create Attempt via `POST /api/attempts/`
- [ ] Enter fullscreen on mount
- [ ] Initialize timer anchor: `endRef = Date.now() + duration*1000`

### Timer
- [ ] Custom hook `useExamTimer`
- [ ] Update every 250ms
- [ ] Display `MM:SS`
- [ ] Red color when < 60s
- [ ] Auto-submit at 0

### PDF Viewer
- [ ] `react-pdf` `<Document>` + `<Page>`
- [ ] Set worker via `pdfjs.GlobalWorkerOptions.workerSrc`
- [ ] Fit page width to pane

### Answer Panel
- [ ] Show `Question N`
- [ ] Radio A/B/C/D
- [ ] Bind to `responses[String(current)]`
- [ ] Mark-for-review toggle button

### Navigation
- [ ] Prev / Next buttons
- [ ] Disable at bounds
- [ ] Jump-to-question via palette

### Palette
- [ ] Grid of question numbers
- [ ] Colors: green (answered), purple (marked), gray (unvisited)
- [ ] Highlight current question with ring

### Fullscreen Lock & Anti-Cheat
- [ ] `requestFullscreen()` on mount
- [ ] Listen to `fullscreenchange`
- [ ] Increment `violations` on exit
- [ ] Alert warning at 1/3, 2/3
- [ ] Auto-submit at 3/3
- [ ] Listen to `visibilitychange` → increment violations
- [ ] Block `contextmenu`
- [ ] Block `copy`
- [ ] Block `beforeunload` (refresh/close guard)

### Time Tracking
- [ ] `qStartRef` records time when question changes
- [ ] Accumulate into `timePerQ.current[String(current)]`
- [ ] Send on submit

### Submit
- [ ] "Submit" button (with confirm modal)
- [ ] `POST /api/attempts/{id}/submit/`
- [ ] Exit fullscreen
- [ ] Navigate to `/result/:id` with response in state

---

## 🕐 Hour 7–8 — Result & Analytics Page

### Score Cards
- [ ] Score
- [ ] Correct
- [ ] Wrong
- [ ] Skipped
- [ ] Accuracy %

### Analytics
- [ ] Total time used vs available
- [ ] Average time per question
- [ ] Ideal pace (`duration / total_questions`)
- [ ] Slowest 5 questions (sorted by `time_per_q`)
- [ ] Fastest 5 questions
- [ ] Pace verdict: "ahead / on track / behind"

### v2 (if time permits)
- [ ] Time wasted on wrong answers
- [ ] Recommendation text
- [ ] Question-wise review (correct vs your answer)

### Actions
- [ ] "Retake test" button
- [ ] "Back to dashboard" button
- [ ] "Download report as PDF" (v2)

---

## 🕐 Hour 8–9 — Wire-Up + Polish

### Integration
- [ ] End-to-end: login → create → exam → result
- [ ] Verify all API calls have correct auth header
- [ ] Loading states on all async screens
- [ ] Error toasts / alerts

### UX Polish
- [ ] Responsive layout (desktop-first, mobile fallback)
- [ ] Consistent color palette
- [ ] Button hover/disabled states
- [ ] Confirm dialogs for destructive actions (submit, exit)
- [ ] Friendly empty states ("No tests yet — create one")

### Bug Bash
- [ ] Timer drift check (compare against stopwatch)
- [ ] Fullscreen re-entry after accidental exit
- [ ] Refresh mid-exam → warning shown
- [ ] Duplicate submit prevented
- [ ] PDF loads for large files (> 50 pages)

---

## 🕐 Hour 9–10 — Docker + Deploy

### Docker
- [ ] `backend/Dockerfile` (Python 3.12-slim + gunicorn)
- [ ] `frontend/Dockerfile` (Node build + nginx serve)
- [ ] `docker-compose.yml` with `db`, `api`, `web`
- [ ] `docker compose up --build` works locally
- [ ] Volumes for Postgres data + media

### Backend Deploy → Render / Railway
- [ ] Push repo to GitHub
- [ ] Create new web service from `backend/`
- [ ] Add Postgres add-on
- [ ] Set env vars: `SECRET_KEY`, `DEBUG=False`, `DB_*`, `ALLOWED_HOSTS`
- [ ] Run `migrate` via shell
- [ ] Create superuser on prod
- [ ] Verify `/api/tests/` responds

### Frontend Deploy → Vercel
- [ ] Import GitHub repo
- [ ] Root directory: `frontend`
- [ ] Build command: `npm run build`
- [ ] Output dir: `dist`
- [ ] Env: `VITE_API_URL=https://<api>.onrender.com/api`
- [ ] Verify login works on prod URL

### Post-Deploy
- [ ] Smoke test: signup → upload PDF → attempt → result
- [ ] Add `README.md` with live URL + screenshots
- [ ] Tag release `v0.1.0`

---

## 🎯 Final Definition of Done

- [ ] Signup / login works
- [ ] Create test with PDF + config works
- [ ] Answer key auto-extracted (fallback works)
- [ ] Exam opens fullscreen with timer
- [ ] Palette, navigation, mark-for-review work
- [ ] Anti-cheat triggers auto-submit at 3 violations
- [ ] Submit computes score server-side
- [ ] Result page shows score + slowest 5 questions
- [ ] Attempt history visible per user
- [ ] Deployed live on Render + Vercel
- [ ] `PROJECT.md`, `TASK.md`, `README.md`, `.env.example` committed

---

## 📌 Stretch Goals (only if 10h remain)

- [ ] Section-wise timers
- [ ] Question-wise review screen
- [ ] Attempt comparison graph
- [ ] Dark mode toggle
- [ ] Keyboard shortcuts (1–4, N, P, M)
- [ ] Manual answer-key mapping UI
- [ ] Tesseract OCR fallback
- [ ] Offline PWA (IndexedDB)
- [ ] Share test templates publicly
- [ ] Admin analytics dashboard

---

## 🐞 Known Risks / Watch-outs

- [ ] `pdfplumber` fails on scanned PDFs → need OCR fallback (v2)
- [ ] `react-pdf` worker path issues in Vite → use CDN worker
- [ ] Fullscreen API not supported in iOS Safari → warn user
- [ ] Large PDFs (> 100 pages) may lag → virtualize pages
- [ ] JWT expiry mid-exam → refresh token silently
- [ ] Timezone drift on server-side `submitted_at` → use UTC

---

**Status:** 🟡 Ready to execute  
**Version:** 0.1.0  
**Owner:** You  
**Pair:** AI