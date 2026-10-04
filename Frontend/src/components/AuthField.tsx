import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/** Props for {@link AuthField}. */
export interface AuthFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Visible label rendered above the input. */
  label: string;
  /** Field-level error. Renders red text under the input when set. */
  error?: string;
  /** Helper text shown only when there is no error. */
  hint?: string;
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ label, error, hint, type = "text", id, ...rest }, ref) => {
    const [show, setShow] = useState(false);
    const isPassword = type === "password";
    const inputId = id ?? rest.name ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div>
        <label
          htmlFor={inputId}
          className="block text-xs font-mono uppercase tracking-widest text-txt-dim mb-2"
        >
          {label}
        </label>

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={isPassword && show ? "text" : type}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={`w-full rounded border bg-app px-3 py-2.5 text-sm text-txt placeholder:text-txt-dim/60 focus:outline-none focus:ring-2 focus:ring-primary transition ${
              error
                ? "border-danger focus:ring-danger"
                : "border-border focus:border-primary/40"
            } ${isPassword ? "pr-10" : ""}`}
            {...rest}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-dim hover:text-txt focus:outline-none focus:text-primary transition"
            >
              {show ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {error ? (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-danger">
            {error}
          </p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-txt-dim">{hint}</p>
        ) : null}
      </div>
    );
  },
);

AuthField.displayName = "AuthField";