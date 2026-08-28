import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "Sin datos todavía",
  description,
  action,
}) {
  return (
    <div className="text-center py-14 px-6">
      <div className="w-12 h-12 rounded-full bg-slate-100 text-muted flex items-center justify-center mx-auto mb-3">
        <Icon size={20} />
      </div>
      <p className="font-semibold text-ink">{title}</p>
      {description && (
        <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
