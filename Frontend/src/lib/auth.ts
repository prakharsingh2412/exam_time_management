import {
  api,
  auth,
  type LoginPayload,
  type RegisterPayload,
  type TokenPair,
  type User,
} from "./api";

/** POST /auth/login/ — stores tokens, returns the current user. */
export async function login(payload: LoginPayload): Promise<User | null> {
  const tokens = await api<TokenPair>("/auth/login/", {
    method: "POST",
    body: payload,
    skipAuth: true,
  });
  auth.set(tokens);
  return getCurrentUser();
}

/** POST /auth/register/ then auto-login. */
export async function register(payload: RegisterPayload): Promise<User | null> {
  await api<Pick<User, "id" | "email" | "full_name">>("/auth/register/", {
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
    return await api<User>("/auth/me/");
  } catch {
    return null;
  }
}

/** Clear tokens. Caller navigates. */
export function logout(): void {
  auth.clear();
}