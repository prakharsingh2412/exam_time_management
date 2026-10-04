import { motion } from "motion/react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export type BannerKind = "success" | "warning" | "error";

/** Props for {@link AuthBanner}. */
export interface AuthBannerProps {
  kind: BannerKind;
  children: React.ReactNode;
}

interface BannerStyle {
  icon: React.ComponentType<{ className?: string }>;
  cls: string;
}

const CONFIG: Record<BannerKind, BannerStyle> = {
  success: {
    icon: CheckCircle2,
    cls: "border-answered/30 bg-answered/5 text-answered",
  },
  warning: {
    icon: AlertTriangle,
    cls: "border-warning/30 bg-warning/5 text-warning",
  },
  error: {
    icon: XCircle,
    cls: "border-danger/30 bg-danger/5 text-danger",
  },
};

export function AuthBanner({ kind, children }: AuthBannerProps) {
  const { icon: Icon, cls } = CONFIG[kind];
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      role={kind === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded border px-3 py-2.5 text-xs leading-relaxed ${cls}`}
    >
      <Icon className="h-4 w-4 shrink-0 mt-px" />
      <span className="text-txt">{children}</span>
    </motion.div>
  );
}