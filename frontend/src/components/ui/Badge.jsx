import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-slate-100 text-slate-600",
  brand: "bg-brand-100 text-brand-700",
  success: "bg-status-successBg text-status-success",
  warning: "bg-status-warningBg text-status-warning",
  danger: "bg-status-dangerBg text-status-danger",
  info: "bg-status-infoBg text-status-info",
};

export default function Badge({ children, tone = "neutral", className = "" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone] || tones.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}
