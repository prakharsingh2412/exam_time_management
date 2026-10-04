// src/api/api.ts
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

// ---------------------------------------------------------------------------
// Shared API interfaces
// ---------------------------------------------------------------------------

/** DRF-style field error map: { field: ["msg", ...] } */
export interface FieldErrors {
  [field: string]: string[];
}

/** JWT pair returned by SimpleJWT (tokens_for_user). */
export interface TokenPair {
  access: string;
  refresh: string;
}

/** Matches RegisterSerializer fields. */
export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  password2: string;
}

/** Matches LoginSerializer fields. */
export interface LoginPayload {
  email: string;
  password: string;
}

/** Matches UserSerializer response. */
export interface User {
  id: number;
  email: string;
  full_name: string;
  date_joined: string;
  last_login: string | null;
}

/** Options for {@link api}. `body` is a plain object; the wrapper serializes it. */
export interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Skip attaching the Authorization header (used for login/register/refresh). */
  skipAuth?: boolean;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  readonly status: number;
  readonly fields: FieldErrors;

  constructor(message: string, status: number, fields: FieldErrors = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

// ---------------------------------------------------------------------------
// Token storage
// ---------------------------------------------------------------------------

const ACCESS_KEY = "access";
const REFRESH_KEY = "refresh";
const USERNAME_KEY = "username";

/**
 * localStorage returns `null` for missing keys, BUT if a bad caller did
 * `setItem(key, String(undefined))`, we'd read back the literal string
 * "undefined" — which is truthy and silently poisons every request.
 * This helper normalizes all those garbage cases back to `null`.
 *
 * FIX: hardens every read path against the "Bearer undefined" class of bug.
 */
function readStorage(key: string): string | null {
  const v = localStorage.getItem(key);
  if (
    v === null ||
    v === "" ||
    v === "undefined" ||
    v === "null"
  ) {
    return null;
  }
  return v;
}

export const auth = {
  /* ---------- Tokens ---------- */

  get access(): string | null {
    return readStorage(ACCESS_KEY);
  },
  get refresh(): string | null {
    return readStorage(REFRESH_KEY);
  },

  /**
   * FIX: guard against writing garbage into storage. If either token is
   * missing/undefined, we clear instead of poisoning localStorage.
   */
  set(tokens: TokenPair | null | undefined): void {
    if (!tokens || !tokens.access || !tokens.refresh) {
      this.clear();
      return;
    }
    localStorage.setItem(ACCESS_KEY, tokens.access);
    localStorage.setItem(REFRESH_KEY, tokens.refresh);
  },

  /* ---------- User info ---------- */

  getUsername(): string | null {
    return readStorage(USERNAME_KEY);
  },
  setUsername(name: string): void {
    if (!name) return;
    localStorage.setItem(USERNAME_KEY, name);
  },

  /* ---------- Session ---------- */

  isAuthenticated(): boolean {
    // FIX: uses the hardened getter, so "undefined"/"null" strings no longer
    // count as "logged in".
    return this.access !== null;
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USERNAME_KEY);
  },
  logout(): void {
    this.clear();
  },
};

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

const GET_LIKE = new Set(["GET", "HEAD", "DELETE"]);

function parseErrorBody(data: unknown): { detail: string; fields: FieldErrors } {
  const obj = (data ?? {}) as Record<string, unknown>;

  const detail =
    typeof obj.detail === "string"
      ? obj.detail
      : typeof obj.message === "string"          // ← FIX: also accept "message"
      ? obj.message
      : "Something didn't look right.";

  const fields: FieldErrors = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k !== "detail" && k !== "message" && Array.isArray(v)) {
      fields[k] = v.filter((x): x is string => typeof x === "string");
    }
  }

  return { detail, fields };
}

/**
 * FIX (major): auto-unwrap the EnvelopeResponseMixin shape.
 *
 * Backend wraps everything as:
 *   { success: bool, message: string, data: <actual payload> }
 *
 * Previously this returned the raw envelope, so callers had to know to
 * reach into `.data` — and most didn't. That's why `auth.set(tokens)`
 * was storing `undefined`.
 *
 * Now `api()` returns the inner `data` directly. Non-enveloped responses
 * (e.g. raw SimpleJWT /token/refresh/) pass through unchanged.
 */
async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { detail: text };
  }

  // Detect envelope shape
  if (
    parsed !== null &&
    typeof parsed === "object" &&
    "success" in parsed &&
    "data" in parsed
  ) {
    const env = parsed as {
      success: boolean;
      message?: string;
      data: unknown;
      errors?: FieldErrors;
    };

    if (env.success === false) {
      // Server said "no" in its envelope — surface as ApiError
      throw new ApiError(
        env.message || "Request failed",
        res.status,
        env.errors ?? {},
      );
    }

    return env.data;
  }

  return parsed;
}

// ---------------------------------------------------------------------------
// api() — the main fetch wrapper
// ---------------------------------------------------------------------------

export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { body, headers, skipAuth = false, ...rest } = options;
  const method = (rest.method ?? "GET").toUpperCase();

  if (body !== undefined && GET_LIKE.has(method)) {
    throw new Error(`api(): ${method} requests cannot have a body.`);
  }

  const authHeader: Record<string, string> =
    !skipAuth && auth.access ? { Authorization: `Bearer ${auth.access}` } : {};

  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...(headers ?? {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await readBody(res);

  if (!res.ok) {
    const { detail, fields } = parseErrorBody(data);
    throw new ApiError(detail, res.status, fields);
  }

  return data as T;
}

// ---------------------------------------------------------------------------
// Token refresh — single-flight
// ---------------------------------------------------------------------------

let refreshPromise: Promise<TokenPair> | null = null;

export async function refreshAccessToken(): Promise<TokenPair> {
  if (refreshPromise) return refreshPromise;

  const refresh = auth.refresh;
  if (!refresh) {
    auth.clear();
    throw new ApiError("Session expired. Log in again.", 401, {});
  }

  refreshPromise = (async () => {
    try {
      /**
       * FIX: endpoint path.
       *
       * Was "/auth/refresh/". DRF SimpleJWT's default route is
       * "/token/refresh/". Change the string below to match whatever
       * you actually mounted in urls.py.
       *
       * FIX: response shape.
       *
       * SimpleJWT's TokenRefreshView returns a bare {access, refresh}.
       * Your custom views may return {success, data:{access, refresh}}.
       * Thanks to readBody() unwrapping envelopes, `api<TokenPair>()`
       * now returns the right thing in BOTH cases — but we still guard
       * against the API ever changing shape silently.
       */
      const tokens = await api<TokenPair>("/token/refresh/", {
        method: "POST",
        body: { refresh },
        skipAuth: true,
      });

      // FIX: sanity-check before writing to storage.
      if (!tokens?.access || !tokens?.refresh) {
        auth.clear();
        throw new ApiError("Refresh response missing tokens", 401, {});
      }

      auth.set(tokens);
      return tokens;
    } catch (err) {
      auth.clear();
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ---------------------------------------------------------------------------
// apiWithAuth() — retries once on 401 after refreshing
// ---------------------------------------------------------------------------

export async function apiWithAuth<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  try {
    return await api<T>(path, options);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      // FIX: if refresh itself fails, force a logout + redirect instead of
      // leaving the user stranded on a broken page.
      try {
        await refreshAccessToken();
      } catch (refreshErr) {
        auth.clear();
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/login")
        ) {
          window.location.href = "/login";
        }
        throw refreshErr;
      }
      // Retry the original request with the new access token
      return await api<T>(path, options);
    }
    throw err;
  }
}