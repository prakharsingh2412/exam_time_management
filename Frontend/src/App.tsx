import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import { auth } from "./api/api";

/** Props for {@link RequireAuth}. */
export interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * Guards any route that requires authentication.
 * Redirects to /login (preserving the intended destination) if not logged in.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  if (!auth.isAuthenticated()) {
    // `replace` avoids polluting history with the redirect
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />

      {/* Fallback: unknown URLs → landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}