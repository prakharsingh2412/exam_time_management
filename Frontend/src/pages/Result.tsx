import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiWithAuth, ApiError } from "../api/api";

interface AttemptReport {
  id: string;
  score: string | null;
  correct: number;
  wrong: number;
  skipped: number;
  submitted_at: string | null;
}

interface AnalyticsEntry {
  q: number;
  seconds: number;
  correct?: boolean;
}

interface Analytics {
  total_time_used?: number;
  total_time_available?: number;
  avg_time_per_q?: number;
  ideal_pace?: number;
  slowest?: AnalyticsEntry[];
  fastest?: AnalyticsEntry[];
  time_wasted?: number;
}

interface ReportResponse {
  attempt: AttemptReport;
  analytics: Analytics;
}

function formatSeconds(s: number): string {
  const total = Math.round(s);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  if (m === 0) return `${sec}s`;
  return `${m}m ${String(sec).padStart(2, "0")}s`;
}

export default function Result() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [data, setData] = useState<ReportResponse | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!attemptId) return;
    let alive = true;
    (async () => {
      try {
        const raw = await apiWithAuth<ReportResponse>(
          `/attempts/${attemptId}/report/`,
        );
        if (alive) setData(raw);
      } catch (e) {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 401) return;
        setErr(e instanceof Error ? e.message : "Failed to load report");
      }
    })();
    return () => {
      alive = false;
    };
  }, [attemptId]);

  if (err) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center p-8">
        <div className="bg-red-950/40 border border-red-900 text-red-200 rounded-2xl p-6 max-w-md">
          <p className="font-semibold">Couldn't load report</p>
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

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center">
        <p className="text-slate-400">Loading report…</p>
      </div>
    );
  }

  const a = data.attempt;
  const an = data.analytics ?? {};
  const accuracyBase = a.correct + a.wrong;
  const accuracy =
    accuracyBase > 0 ? (a.correct / accuracyBase) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 md:px-8 py-4 flex items-center gap-3">
        <Link
          to="/dashboard"
          className="text-slate-400 hover:text-slate-200 text-sm transition"
        >
          ← Dashboard
        </Link>
        <h1 className="text-lg font-bold">Result</h1>
        {a.submitted_at && (
          <span className="text-xs text-slate-500 ml-auto">
            Submitted {new Date(a.submitted_at).toLocaleString()}
          </span>
        )}
      </header>

      <main className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
        {/* Score summary */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Score
            </p>
            <p className="text-3xl font-bold mt-2 text-emerald-400">
              {a.score != null ? Number(a.score).toFixed(1) : "—"}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Correct
            </p>
            <p className="text-3xl font-bold mt-2 text-emerald-400">
              {a.correct}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Wrong
            </p>
            <p className="text-3xl font-bold mt-2 text-red-400">
              {a.wrong}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">
              Skipped
            </p>
            <p className="text-3xl font-bold mt-2 text-slate-300">
              {a.skipped}
            </p>
          </div>
        </section>

        {/* Accuracy bar */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">Accuracy</p>
            <p className="text-sm font-semibold">{accuracy.toFixed(1)}%</p>
          </div>
          <div className="h-2 rounded bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all"
              style={{ width: `${Math.min(100, accuracy)}%` }}
            />
          </div>
        </section>

        {/* Time analytics */}
        {(an.total_time_used != null ||
          an.slowest?.length ||
          an.fastest?.length) && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-semibold">Time analysis</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {an.total_time_used != null && (
                <div>
                  <p className="text-slate-400 text-xs uppercase">
                    Time used
                  </p>
                  <p className="font-semibold mt-1">
                    {formatSeconds(an.total_time_used)}
                  </p>
                </div>
              )}
              {an.total_time_available != null && (
                <div>
                  <p className="text-slate-400 text-xs uppercase">
                    Available
                  </p>
                  <p className="font-semibold mt-1">
                    {formatSeconds(an.total_time_available)}
                  </p>
                </div>
              )}
              {an.avg_time_per_q != null && (
                <div>
                  <p className="text-slate-400 text-xs uppercase">
                    Avg / question
                  </p>
                  <p className="font-semibold mt-1">
                    {formatSeconds(an.avg_time_per_q)}
                  </p>
                </div>
              )}
              {an.ideal_pace != null && (
                <div>
                  <p className="text-slate-400 text-xs uppercase">
                    Ideal pace
                  </p>
                  <p className="font-semibold mt-1">
                    {formatSeconds(an.ideal_pace)}
                  </p>
                </div>
              )}
            </div>

            {an.slowest && an.slowest.length > 0 && (
              <div>
                <p className="text-sm text-slate-400 mb-2">
                  Slowest questions
                </p>
                <ul className="space-y-1 text-sm">
                  {an.slowest.map((q) => (
                    <li
                      key={q.q}
                      className="flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded"
                    >
                      <span>
                        Q{q.q}{" "}
                        <span
                          className={
                            q.correct === true
                              ? "text-emerald-400"
                              : q.correct === false
                              ? "text-red-400"
                              : "text-slate-500"
                          }
                        >
                          {q.correct === true
                            ? "✓"
                            : q.correct === false
                            ? "✗"
                            : ""}
                        </span>
                      </span>
                      <span className="font-mono">
                        {formatSeconds(q.seconds)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {an.fastest && an.fastest.length > 0 && (
              <div>
                <p className="text-sm text-slate-400 mb-2">
                  Fastest questions
                </p>
                <ul className="space-y-1 text-sm">
                  {an.fastest.map((q) => (
                    <li
                      key={q.q}
                      className="flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded"
                    >
                      <span>
                        Q{q.q}{" "}
                        <span
                          className={
                            q.correct === true
                              ? "text-emerald-400"
                              : q.correct === false
                              ? "text-red-400"
                              : "text-slate-500"
                          }
                        >
                          {q.correct === true
                            ? "✓"
                            : q.correct === false
                            ? "✗"
                            : ""}
                        </span>
                      </span>
                      <span className="font-mono">
                        {formatSeconds(q.seconds)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {an.time_wasted != null && an.time_wasted > 0 && (
              <p className="text-sm text-amber-400">
                ⚠️ Time wasted on wrong answers:{" "}
                {formatSeconds(an.time_wasted)}
              </p>
            )}
          </section>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            to="/dashboard"
            className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}