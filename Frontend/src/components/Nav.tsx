import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "motion/react";


const LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
] as const;

export default function Nav() {
  const navigate = useNavigate();

  return (
    <header className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between gap-6">
        {/* Brand */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary rounded shrink-0"
        >
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span className="font-mono text-sm font-semibold tracking-tight">
            CBT Simulator
          </span>
        </button>

        {/* Right cluster: links + auth buttons */}
        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          {LINKS.map((link) => (
            <NavUnderline key={link.to} to={link.to} label={link.label} />
          ))}

          {/* Divider between nav links and auth buttons */}
          <div className="mx-2 hidden sm:block h-4 w-px bg-border" />

          {/* Login — ghost */}
          <button
            onClick={() => navigate("/login")}
            className="rounded px-3 py-2 font-medium text-txt-dim hover:text-txt transition focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Log in
          </button>

          {/* Signup — primary */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.1 }}
            onClick={() => navigate("/signup")}
            className="rounded bg-primary px-4 py-2 font-medium text-app hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-app transition"
          >
            Sign up
          </motion.button>
        </nav>
      </div>
    </header>
  );
}

function NavUnderline({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className="group relative rounded px-3 py-2 font-medium text-txt-dim hover:text-txt transition focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {({ isActive }) => (
        <>
          <span>{label}</span>

          {/* Underline progress bar */}
          <span
            aria-hidden
            className={[
              "pointer-events-none absolute left-3 right-3 bottom-1 h-px origin-left",
              "bg-primary transition-transform duration-150 ease-out",
              isActive
                ? "scale-x-100"
                : "scale-x-0 group-hover:scale-x-100",
            ].join(" ")}
          />
        </>
      )}
    </NavLink>
  );
}