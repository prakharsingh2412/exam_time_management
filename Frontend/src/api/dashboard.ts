// src/api/dashboard.ts
import { apiWithAuth } from "./api";

/* ---------- Types ---------- */

export interface DashboardStats {
  total_tests: number;
  total_attempts: number;
  best_score: number;
  avg_score: number;
  avg_accuracy: number;
}

export interface DashboardTest {
  id: string;
  name: string;
  duration_sec: number;
  total_questions: number;
  marks_per_q: string;
  negative_marks: string;
  created_at: string;
}

export interface DashboardAttempt {
  id: string;
  test: string;
  test_name?: string;
  score: string | null;
  correct: number;
  wrong: number;
  skipped: number;
  submitted_at: string | null;
}

export interface DashboardSummary {
  stats: DashboardStats;
  tests: DashboardTest[];
  recent_attempts: DashboardAttempt[];
}

/* ---------- Normalization ---------- */

/**
 * Your api.ts already unwraps { success, data } envelopes.
 * This is a second-level safety net: some backends double-wrap, or
 * return the payload under a different top-level key. Whatever the
 * case, we return something the UI can trust.
 */
function normalizeSummary(raw: unknown): DashboardSummary {
  const src = (raw ?? {}) as Record<string, unknown>;

  const s = (src.stats ?? src.summary ?? {}) as Record<string, unknown>;

  return {
    stats: {
      total_tests: Number(s.total_tests ?? 0),
      total_attempts: Number(s.total_attempts ?? 0),
      best_score: Number(s.best_score ?? 0),
      avg_score: Number(s.avg_score ?? 0),
      avg_accuracy: Number(s.avg_accuracy ?? 0),
    },
    tests: Array.isArray(src.tests) ? (src.tests as DashboardTest[]) : [],
    recent_attempts: Array.isArray(src.recent_attempts)
      ? (src.recent_attempts as DashboardAttempt[])
      : [],
  };
}

/* ---------- API ---------- */

export const dashboardApi = {
  summary: async (): Promise<DashboardSummary> => {
    const raw = await apiWithAuth<unknown>("/dashboard/summary/");
    return normalizeSummary(raw);
  },

  startAttempt: async (testId: string): Promise<DashboardAttempt> => {
    const raw = await apiWithAuth<unknown>("/attempts/", {
      method: "POST",
      body: { test: testId },
    });
    return raw as DashboardAttempt;
  },
};