// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { dashboardApi, type DashboardSummary } from "../api/dashboard";
import { auth } from "../api/api";

/* ---------- Small presentational pieces ---------- */

function StatCard({
  label,
  value,
  accent = "text-slate-100",
  hint,
}: {
  label: string;
  value: string | number;
  accent?: string;
  hint?: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 animate-pulse">
      <div className="h-3 w-16 bg-slate-800 rounded" />
      <div className="mt-3 h-8 w-24 bg-slate-800 rounded" />
    </div>
  );
}

function TestCard({
  test,
  onStart,
  loading,
}: {
  test: DashboardSummary["tests"][number];
  onStart: (id: string) => void;
  loading: boolean;
}) {
  const minutes = Math.round(test.duration_sec / 60);
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 hover:border-slate-700 transition">
      <div>
        <h3 className="font-semibold truncate" title={test.name}>
          {test.name}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {test.total_questions} Qs · {minutes} min · +{test.marks_per_q} / −
          {test.negative_marks}
        </p>
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={() => onStart(test.id)}
        className="mt-auto py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-sm font-semibold transition"
      >
        {loading ? "Starting…" : "Start attempt"}
      </button>
    </div>
  );
}

/* ---------- The dashboard ---------- */

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [err, setErr] = useState("");
  const [startingId, setStartingId] = useState<string | null>(null);

  // Username pulled from auth module (see src/api/api.ts)
  const username = auth.getUsername?.() ?? "there";

  useEffect(() => {
    let alive = true;
    setErr("");
    dashboardApi
      .summary()
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e: unknown) => {
        if (alive) setErr(e instanceof Error ? e.message : "Failed to load");
      });
    return () => {
      alive = false;
    };
  }, []);

  async function handleStart(testId: string) {
    setStartingId(testId);
    setErr("");
    try {
      const attempt = await dashboardApi.startAttempt(testId);
      navigate(`/exam/${attempt.id}`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to start attempt");
    } finally {
      setStartingId(null);
    }
  }

  function handleLogout() {
    auth.logout();
    navigate("/login", { replace: true });
  }

  /* ---------- Error state ---------- */

  if (err) {
    return (
      <div className="min-h-screen bg-slate-950 grid place-items-center p-8">
        <div className="bg-red-950/40 border border-red-900 text-red-200 rounded-2xl p-6 max-w-md">
          <p className="font-semibold">Couldn't load dashboard</p>
          <p className="text-sm mt-1 opacity-80">{err}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 rounded bg-red-800 hover:bg-red-700 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ---------- Main render ---------- */

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top bar */}
      <header className="border-b border-slate-800 px-6 md:px-8 py-4 flex items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 grid place-items-center font-bold">
            C
          </div>
          <h1 className="text-lg font-bold">CBT Simulator</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm hidden sm:inline">
            Hi, {username}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm px-3 py-1.5 rounded border border-slate-700 hover:bg-slate-800 transition"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-8 space-y-10">
        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {!data ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard label="Tests" value={data.stats.total_tests} />
              <StatCard label="Attempts" value={data.stats.total_attempts} />
              <StatCard
                label="Best score"
                value={data.stats.best_score.toFixed(1)}
                accent="text-emerald-400"
              />
              <StatCard
                label="Avg score"
                value={data.stats.avg_score.toFixed(1)}
              />
              <StatCard
                label="Avg accuracy"
                value={`${data.stats.avg_accuracy}%`}
                accent="text-indigo-400"
              />
            </>
          )}
        </section>

        {/* Tests */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your tests</h2>
            <Link
              to="/create"
              className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition"
            >
              + New test
            </Link>
          </div>

          {!data ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : data.tests.length === 0 ? (
            <div className="border border-dashed border-slate-800 rounded-2xl p-10 text-center text-slate-400">
              No tests yet.{" "}
              <Link to="/create" className="text-indigo-400 hover:underline">
                Upload a PDF
              </Link>{" "}
              to get started.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.tests.map((t) => (
                <TestCard
                  key={t.id}
                  test={t}
                  onStart={handleStart}
                  loading={startingId === t.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* Recent attempts */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Recent attempts</h2>
          {!data ? (
            <SkeletonCard />
          ) : data.recent_attempts.length === 0 ? (
            <p className="text-slate-500 text-sm">No attempts yet.</p>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800 overflow-hidden">
              {data.recent_attempts.map((a) => (
                <Link
                  key={a.id}
                  to={`/result/${a.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {a.test_name ?? "Attempt"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {a.submitted_at
                        ? new Date(a.submitted_at).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-semibold text-emerald-400">
                      {a.score != null ? Number(a.score).toFixed(1) : "—"}
                    </p>
                    <p className="text-xs text-slate-400">
                      ✓{a.correct} ✗{a.wrong} –{a.skipped}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}