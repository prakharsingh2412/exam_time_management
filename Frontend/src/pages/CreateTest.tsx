import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../api/api";

export default function CreateTest() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [durationSec, setDurationSec] = useState(3600);
  const [totalQuestions, setTotalQuestions] = useState(100);
  const [marksPerQ, setMarksPerQ] = useState("1");
  const [negativeMarks, setNegativeMarks] = useState("0.25");
  const [file, setFile] = useState<File | null>(null);

  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");

    if (!name.trim()) return setErr("Test name is required.");
    if (!file) return setErr("Please select a PDF.");
    if (durationSec <= 0) return setErr("Duration must be positive.");
    if (totalQuestions <= 0) return setErr("Total questions must be positive.");

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("duration_sec", String(durationSec));
      fd.append("total_questions", String(totalQuestions));
      fd.append("marks_per_q", marksPerQ);
      fd.append("negative_marks", negativeMarks);
      fd.append("pdf", file);

      const base =
        import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";
      const token = auth.access;

      const res = await fetch(`${base}/tests/`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (!res.ok) {
        const detail =
          data?.message ||
          data?.detail ||
          `Upload failed (${res.status})`;
        throw new Error(detail);
      }

      navigate("/dashboard", { replace: true });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 md:px-8 py-4 flex items-center gap-3">
        <Link
          to="/dashboard"
          className="text-slate-400 hover:text-slate-200 text-sm transition"
        >
          ← Dashboard
        </Link>
        <h1 className="text-lg font-bold">Create test</h1>
      </header>

      <main className="max-w-xl mx-auto p-6 md:p-8">
        <form
          onSubmit={onSubmit}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4"
          noValidate
        >
          {err && (
            <div className="bg-red-950/40 border border-red-900 text-red-200 rounded-lg px-4 py-3 text-sm">
              {err}
            </div>
          )}

          <label className="block text-sm">
            Test name
            <input
              type="text"
              className="mt-1 w-full p-3 rounded bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              placeholder="e.g. SSC CGL 2023 Tier-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm">
              Duration (seconds)
              <input
                type="number"
                min={1}
                className="mt-1 w-full p-3 rounded bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                value={durationSec}
                onChange={(e) => setDurationSec(Number(e.target.value))}
              />
              <span className="text-xs text-slate-500">
                {Math.floor(durationSec / 60)} min {durationSec % 60} sec
              </span>
            </label>

            <label className="text-sm">
              Total questions
              <input
                type="number"
                min={1}
                className="mt-1 w-full p-3 rounded bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value))}
              />
            </label>

            <label className="text-sm">
              Marks / correct
              <input
                type="text"
                inputMode="decimal"
                className="mt-1 w-full p-3 rounded bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                value={marksPerQ}
                onChange={(e) => setMarksPerQ(e.target.value)}
              />
            </label>

            <label className="text-sm">
              Negative marks
              <input
                type="text"
                inputMode="decimal"
                className="mt-1 w-full p-3 rounded bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                value={negativeMarks}
                onChange={(e) => setNegativeMarks(e.target.value)}
              />
            </label>
          </div>

          <label className="block text-sm">
            Question paper PDF
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
            />
            {file && (
              <span className="text-xs text-slate-500">
                {file.name} · {(file.size / 1024).toFixed(0)} KB
              </span>
            )}
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed font-semibold transition"
          >
            {busy ? "Uploading…" : "Create test"}
          </button>
        </form>
      </main>
    </div>
  );
}