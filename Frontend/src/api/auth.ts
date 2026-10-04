// src/api/auth.ts
import {
  api,
  auth,
  type LoginPayload,
  type RegisterPayload,
  type TokenPair,
  type User,
} from "./api";

/** Shape the backend actually returns from /auth/login/ and /auth/register/. */
interface AuthResponse {
  user: User;
  tokens: TokenPair;
}

/** Accepts either the enveloped shape or a bare object. */
function unwrapAuth(raw: unknown): AuthResponse {
  const obj = raw as Record<string, unknown> | null;
  // Enveloped: { success, message, data: { user, tokens } }
  if (obj && typeof obj === "object" && "data" in obj && obj.data) {
    return obj.data as AuthResponse;
  }
  // Bare: { user, tokens }
  return raw as AuthResponse;
}

/** POST /auth/login/ — stores tokens, returns the current user. */
export async function login(payload: LoginPayload): Promise<User | null> {
  const raw = await api<unknown>("/auth/login/", {
    method: "POST",
    body: payload,
    skipAuth: true,
  });

  const { user, tokens } = unwrapAuth(raw);

  if (!tokens?.access || !tokens?.refresh) {
    throw new Error("Login succeeded but no tokens were returned.");
  }

  auth.set(tokens);
  auth.setUsername(user?.full_name ?? user?.email ?? "");

  return user ?? null;
}

/** POST /auth/register/ then auto-login. */
export async function register(payload: RegisterPayload): Promise<User | null> {
  await api<unknown>("/auth/register/", {
    method: "POST",
    body: payload,
    skipAuth: true,
  });
  return login({ email: payload.email, password: payload.password });
}

/** GET /auth/me/ — current user, or null if unauthenticated. */
export async function getCurrentUser(): Promise<User | null> {
  if (!auth.isAuthenticated()) return null;
  try {
    const raw = await api<unknown>("/auth/me/");
    const obj = raw as any;
    return (obj?.data ?? obj) as User;
  } catch {
    return null;
  }
}

/** Clear tokens. Caller navigates. */
export function logout(): void {
  auth.clear();
}