import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiWithAuth, ApiError } from "../api/api";

interface Test {
  id: number;
  name: string;
  duration_sec: number;
  total_questions: number;
  marks_per_q: string;
  negative_marks: string;
  pdf_url?: string | null;
  parsing_status?: string;
}

interface Question {
  number: number;
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

interface Attempt {
  id: number;
  test: number;
  responses: Record<string, string | null> | null;
  marked: number[] | null;
  started_at: string;
  submitted_at: string | null;
}

interface ExamPayload {
  test: Test;
  questions: Question[];
}

type QState = "unseen" | "visited" | "answered" | "marked" | "answered-marked";

export default function ExamRoom() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [current, setCurrent] = useState(1);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [visited, setVisited] = useState<Set<number>>(new Set([1]));

  const [remaining, setRemaining] = useState(0);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [parsingStatus, setParsingStatus] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState(false);

  const deadlineRef = useRef<number>(0);

  /* ---------- Load attempt + exam payload ---------- */
  const loadExam = useCallback(async (alive: () => boolean) => {
    if (!attemptId) return;
    try {
      const a = await apiWithAuth<Attempt>(`/attempts/${attemptId}/`);
      if (!alive()) return;
      setAttempt(a);

      const payload = await apiWithAuth<ExamPayload>(
        `/tests/${a.test}/exam-payload/`,
      );
      if (!alive()) return;

      setTest(payload.test);
      setQuestions(payload.questions);
      setParsingStatus(payload.test.parsing_status ?? "done");

      const r: Record<string, string> = {};
      if (a.responses) {
        for (const [k, v] of Object.entries(a.responses)) {
          if (typeof v === "string" && v) r[k] = v;
        }
      }
      setResponses(r);
      setMarked(new Set(a.marked ?? []));

      const startedAt = new Date(a.started_at).getTime();
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = Math.max(0, payload.test.duration_sec - elapsed);
      setRemaining(left);
      deadlineRef.current = Date.now() + left * 1000;
    } catch (e) {
      if (!alive()) return;
      if (e instanceof ApiError && e.status === 401) return;
      if (e instanceof ApiError && e.status === 409) {
        const anyErr = e as unknown as { body?: { parsing_status?: string } };
        setParsingStatus(anyErr.body?.parsing_status ?? "pending");
        return;
      }
      setErr(e instanceof Error ? e.message : "Failed to load exam");
    }
  }, [attemptId]);

  useEffect(() => {
    let alive = true;
    void loadExam(() => alive);
    return () => {
      alive = false;
    };
  }, [loadExam]);

  /* ---------- Poll while parsing ---------- */
  useEffect(() => {
    if (!parsingStatus || parsingStatus === "done" || parsingStatus === "failed")
      return;
    const id = setInterval(() => {
      void loadExam(() => true);
    }, 3000);
    return () => clearInterval(id);
  }, [parsingStatus, loadExam]);

  /* ---------- Drift-free timer ---------- */
  useEffect(() => {
    const tick = setInterval(() => {
      if (!deadlineRef.current) return;
      const left = Math.max(
        0,
        Math.floor((deadlineRef.current - Date.now()) / 1000),
      );
      setRemaining(left);
      if (left === 0) {
        clearInterval(tick);
        void handleSubmit();
      }
    }, 1000);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Navigation helpers ---------- */
  function goTo(n: number) {
    if (!test) return;
    if (n < 1 || n > questions.length) return;
    setCurrent(n);
    setVisited((prev) => new Set(prev).add(n));
  }

  function selectOption(letter: string) {
    setResponses((prev) => ({ ...prev, [String(current)]: letter }));
    setVisited((prev) => new Set(prev).add(current));
  }

  function clearResponse() {
    setResponses((prev) => {
      const next = { ...prev };
      delete next[String(current)];
      return next;
    });
  }

  function toggleMark() {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(current)) next.delete(current);
      else next.add(current);
      return next;
    });
  }

  /* ---------- Submit ---------- */
  async function handleSubmit() {
    if (!attemptId || busy || !test) return;
    setBusy(true);
    setErr("");
    try {
      await apiWithAuth(`/attempts/${attemptId}/submit/`, {
        method: "POST",
        body: {
          responses,
          marked: Array.from(marked),
          time_per_q: {},
        },
      });
      navigate(`/result/${attemptId}`, { replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Submit failed");
      setBusy(false);
    }
  }

  /* ---------- Palette state ---------- */
  const paletteState = useMemo<QState[]>(() => {
    if (!questions.length) return [];
    return questions.map((q) => {
      const n = q.number;
      const answered = !!responses[String(n)];
      const isMarked = marked.has(n);
      const wasVisited = visited.has(n);

      if (answered && isMarked) return "answered-marked";
      if (isMarked) return "marked";
      if (answered) return "answered";
      if (wasVisited) return "visited";
      return "unseen";
    });
  }, [questions, responses, marked, visited]);

  /* ---------- Render ---------- */

  if (err) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center p-8">
        <div className="bg-red-950/40 border border-red-900 text-red-200 rounded-2xl p-6 max-w-md">
          <p className="font-semibold">Couldn't load exam</p>
          <p className="text-sm mt-1 opacity-80">{err}</p>
          <Link
            to="/dashboard"
            className="inline-block mt-4 px-4 py-2 rounded bg-red-800 hover:bg-red-700 text-sm"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (parsingStatus && parsingStatus !== "done") {
    const failed = parsingStatus === "failed";
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center p-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md text-center">
          <div
            className={`w-12 h-12 mx-auto mb-4 rounded-full grid place-items-center ${
              failed ? "bg-red-950 text-red-300" : "bg-indigo-950 text-indigo-300"
            }`}
          >
            {failed ? "!" : "…"}
          </div>
          <p className="font-semibold text-lg">
            {failed ? "Couldn't prepare this test" : "Preparing your test…"}
          </p>
          <p className="text-sm text-slate-400 mt-2">
            {failed
              ? "The PDF couldn't be parsed. Please contact the test owner."
              : "We're extracting the questions from the PDF. This usually takes a few seconds."}
          </p>
          <Link
            to="/dashboard"
            className="inline-block mt-6 px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!test || !attempt || !questions.length) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center">
        <p className="text-slate-400">Loading exam…</p>
      </div>
    );
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const isLow = remaining < 60;

  // ── Narrow `q` for TypeScript strict mode ──
  // The guard above guarantees `questions.length > 0`, but TS doesn't
  // propagate that through `.find() ?? questions[0]`. This extra check
  // is a no-op at runtime and silences the `'q' is possibly 'undefined'`
  // errors on every `q.*` access below.
  const q: Question | undefined =
    questions.find((x) => x.number === current) ?? questions[0];

  if (!q) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center">
        <p className="text-slate-400">Loading question…</p>
      </div>
    );
  }

  const selected = responses[String(q.number)];

  const pdfSrc =
    test.pdf_url && test.pdf_url.startsWith("/media/")
      ? test.pdf_url
      : undefined;

  const options: Array<{ letter: "A" | "B" | "C" | "D"; body: string }> = [
    { letter: "A", body: q.option_a },
    { letter: "B", body: q.option_b },
    { letter: "C", body: q.option_c },
    { letter: "D", body: q.option_d },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 grid place-items-center font-bold shrink-0">
            C
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{test.name}</p>
            <p className="text-xs text-slate-400">
              Q {current} of {questions.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`px-4 py-2 rounded-lg font-mono text-lg font-bold ${
              isLow
                ? "bg-red-950/60 text-red-300 border border-red-900"
                : "bg-slate-900 border border-slate-800"
            }`}
          >
            {mm}:{ss}
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-sm font-semibold"
          >
            {busy ? "Submitting…" : "Submit"}
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_280px] overflow-hidden">
        {/* Question pane */}
        <main className="p-6 overflow-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Question {q.number}</h2>
              <div className="flex items-center gap-2">
                {pdfSrc && (
                  <button
                    type="button"
                    onClick={() => setShowPdf((v) => !v)}
                    className="text-xs px-3 py-1.5 rounded border border-slate-700 hover:bg-slate-800"
                  >
                    {showPdf ? "Hide PDF" : "View PDF"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleMark}
                  className={`text-xs px-3 py-1.5 rounded border transition ${
                    marked.has(q.number)
                      ? "bg-purple-700 border-purple-600 text-white"
                      : "border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  {marked.has(q.number) ? "Marked ✓" : "Mark for review"}
                </button>
              </div>
            </div>

            <p className="text-slate-100 whitespace-pre-wrap leading-relaxed">
              {q.text || "(Empty question text)"}
            </p>

            {showPdf && pdfSrc && (
              <iframe
                title="Question paper"
                src={pdfSrc}
                className="w-full h-[50vh] mt-4 rounded-lg border border-slate-800 bg-slate-950"
              />
            )}
          </div>

          {/* Options */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <p className="text-sm text-slate-400">Choose an option</p>
            {options.map(({ letter, body }) => {
              const isSelected = selected === letter;
              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => selectOption(letter)}
                  className={`w-full text-left px-4 py-3 rounded border transition ${
                    isSelected
                      ? "bg-indigo-700 border-indigo-500 text-white"
                      : "border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  <span className="font-bold mr-2">{letter}.</span>
                  <span className="text-sm text-slate-200">
                    {body || <em className="text-slate-500">(empty option)</em>}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={clearResponse}
              disabled={!selected}
              className="text-xs text-slate-400 hover:text-slate-200 disabled:opacity-40 mt-2"
            >
              Clear response
            </button>
          </div>

          {/* Nav */}
          <div className="flex justify-between gap-3">
            <button
              type="button"
              onClick={() => goTo(current - 1)}
              disabled={current <= 1}
              className="px-4 py-2 rounded border border-slate-700 hover:bg-slate-800 disabled:opacity-40"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => goTo(current + 1)}
              disabled={current >= questions.length}
              className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </main>

        {/* Palette */}
        <aside className="border-l border-slate-800 bg-slate-900/50 p-6 overflow-auto">
          <h3 className="text-sm font-semibold mb-4">Question palette</h3>

          <div className="grid grid-cols-5 gap-2">
            {paletteState.map((state, i) => {
              const question = questions[i];
              if (!question) return null;

              const n = question.number;
              const isCurrent = n === current;
              const cls =
                state === "answered"
                  ? "bg-emerald-700 border-emerald-500 text-white"
                  : state === "marked"
                  ? "bg-purple-700 border-purple-500 text-white"
                  : state === "answered-marked"
                  ? "bg-purple-700 border-purple-500 ring-2 ring-emerald-400 text-white"
                  : state === "visited"
                  ? "bg-sky-900 border-sky-700 text-sky-100"
                  : "bg-slate-800 border-slate-700 text-slate-400";
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => goTo(n)}
                  className={`h-9 rounded border text-xs font-semibold ${cls} ${
                    isCurrent ? "ring-2 ring-indigo-400" : ""
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-2 text-xs text-slate-400">
            <p>
              <span className="inline-block w-3 h-3 bg-emerald-700 rounded mr-2" />
              Answered ({Object.keys(responses).length})
            </p>
            <p>
              <span className="inline-block w-3 h-3 bg-purple-700 rounded mr-2" />
              Marked ({marked.size})
            </p>
            <p>
              <span className="inline-block w-3 h-3 bg-sky-900 rounded mr-2" />
              Visited but not answered
            </p>
            <p>
              <span className="inline-block w-3 h-3 bg-slate-700 rounded mr-2" />
              Not visited
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}