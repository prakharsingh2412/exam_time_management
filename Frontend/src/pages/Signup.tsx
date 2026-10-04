import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { AuthField } from "../components/AuthField";
import { AuthBanner } from "../components/AuthBanner";
import { AuthCard } from "../components/AuthCard";
import { AuthLayout } from "../layouts/AuthLayout";
import { ApiError, type FieldErrors } from "../lib/api";
import { register } from "../lib/auth";

export default function Signup() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    // Mirrors RegisterSerializer.validate() so we skip a round-trip.
    if (password !== password2) {
      setFieldErrors({ password2: ["Passwords do not match."] });
      return;
    }

    setSubmitting(true);
    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        password2,
      });
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
        title="Create your account"
        subtitle="One account. Author mode and test-taker mode."
        note="Your PDFs are private. Auto-deleted after 30 days."
      >
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {formError && <AuthBanner kind="error">{formError}</AuthBanner>}

          <AuthField
            label="Full name"
            name="full_name"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={first("full_name")}
          />

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
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={first("password")}
            hint="At least 8 characters. Not all numbers."
          />

          <AuthField
            label="Confirm password"
            name="password2"
            type="password"
            autoComplete="new-password"
            required
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            error={first("password2")}
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded bg-primary px-6 py-3 font-medium text-app hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-app transition"
          >
            {submitting ? "Creating account…" : "Create account"}
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <p className="mt-6 text-xs text-txt-dim text-center">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
          >
            Log in
          </Link>
          .
        </p>
      </AuthCard>
    </AuthLayout>
  );
}