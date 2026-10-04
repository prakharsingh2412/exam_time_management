import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { AuthField } from "../components/AuthField";
import { AuthBanner } from "../components/AuthBanner";
import { AuthCard } from "../components/AuthCard";
import { AuthLayout } from "../layouts/AuthLayout";
import { ApiError, type FieldErrors } from "../api/api";
import { login } from "../api/auth";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (!email.trim() || !password) {
      setFormError("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fields);
        const nonField = err.fields.non_field_errors?.[0];
        if (nonField) setFormError(nonField);
        else if (Object.keys(err.fields).length === 0) setFormError(err.message);
      } else {
        setFormError("We couldn't reach the server. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const first = (k: string): string | undefined => fieldErrors[k]?.[0];

  return (
    <AuthLayout>
      <AuthCard
        title="Log in"
        subtitle="Pick up where your clock left off."
        note="Scores computed on the server. Timer is drift-free."
      >
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {formError && <AuthBanner kind="error">{formError}</AuthBanner>}

          <AuthField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={first("email")}
          />

          <AuthField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={first("password")}
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded bg-primary px-6 py-3 font-medium text-app hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-app transition"
          >
            {submitting ? "Logging in…" : "Log in"}
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <p className="mt-6 text-xs text-txt-dim text-center">
          No account?{" "}
          <Link
            to="/signup"
            className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
          >
            Create one
          </Link>
          .
        </p>
      </AuthCard>
    </AuthLayout>
  );
}