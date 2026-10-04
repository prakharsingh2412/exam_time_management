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

export const auth = {
  get access(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  set(tokens: TokenPair): void {
    localStorage.setItem(ACCESS_KEY, tokens.access);
    localStorage.setItem(REFRESH_KEY, tokens.refresh);
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
  isAuthenticated(): boolean {
    return localStorage.getItem(ACCESS_KEY) !== null;
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
      : "Something didn't look right.";

  const fields: FieldErrors = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k !== "detail" && Array.isArray(v)) {
      fields[k] = v.filter((x): x is string => typeof x === "string");
    }
  }

  return { detail, fields };
}

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
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
      const tokens = await api<TokenPair>("/auth/refresh/", {
        method: "POST",
        body: { refresh },
        skipAuth: true,
      });
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
      await refreshAccessToken();
      return await api<T>(path, options);
    }
    throw err;
  }
}