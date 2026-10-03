import { useNavigate } from "react-router-dom";

// ---------------------------------------------------------------------------
// Nav — shared across all pages. Border-bottom, mono logo, minimal links.
// Kept deliberately thin: DESIGN.md §6 — "Clean and serious."
// ---------------------------------------------------------------------------

export default function Nav() {
  const navigate = useNavigate();

  return (
    <header className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary rounded"
        >
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span className="font-mono text-sm font-semibold tracking-tight">
            CBT Simulator
          </span>
        </button>

        {/* Links */}
        <nav className="flex items-center gap-6 text-sm text-txt-dim">
          <button
            onClick={() => navigate("/login")}
            className="hover:text-txt transition focus:outline-none focus:ring-2 focus:ring-primary rounded"
          >
            Log in
          </button>
        </nav>
      </div>
    </header>
  );
}