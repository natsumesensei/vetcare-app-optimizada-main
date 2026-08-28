import { AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const styles = {
  error: {
    wrap: "bg-status-dangerBg border-status-danger/20 text-status-danger",
    Icon: XCircle,
  },
  warning: {
    wrap: "bg-status-warningBg border-status-warning/20 text-status-warning",
    Icon: AlertTriangle,
  },
  success: {
    wrap: "bg-status-successBg border-status-success/20 text-status-success",
    Icon: CheckCircle2,
  },
  info: {
    wrap: "bg-status-infoBg border-status-info/20 text-status-info",
    Icon: Info,
  },
};

export default function Alert({
  type = "info",
  title,
  children,
  action,
  className = "",
}) {
  const { wrap, Icon } = styles[type] || styles.info;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        wrap,
        className
      )}
    >
      <Icon size={18} className="shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        {children && <p className="text-ink/80">{children}</p>}
      </div>
      {action}
    </div>
  );
}
