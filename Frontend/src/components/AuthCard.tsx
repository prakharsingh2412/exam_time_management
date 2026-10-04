import { motion } from "motion/react";

/** Props for {@link AuthCard}. */
export interface AuthCardProps {
  /** Card heading. */
  title: string;
  /** One-line subtitle under the heading. */
  subtitle: string;
  /** Form + footer-link content. */
  children: React.ReactNode;
  /** Optional small note rendered under the card. */
  note?: string;
}

export function AuthCard({ title, subtitle, children, note }: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="w-full max-w-sm"
    >
      <div className="relative rounded-lg border border-border bg-surface">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="p-8">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-txt-dim">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>

      {note && <p className="mt-4 text-center text-xs text-txt-dim">{note}</p>}
    </motion.div>
  );
}