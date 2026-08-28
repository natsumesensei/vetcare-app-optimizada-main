import { cn } from "@/lib/utils";

export default function Button({
  children,
  className = "",
  variant = "primary",
  type = "button",
  ...props
}) {
  const variants = {
    primary:
      "bg-brand-600 hover:bg-brand-700 text-white shadow-sm",

    secondary:
      "bg-slate-100 hover:bg-slate-200 text-ink",

    danger:
      "bg-status-danger hover:opacity-90 text-white",

    success:
      "bg-status-success hover:opacity-90 text-white",

    outline:
      "border border-line bg-white hover:bg-slate-50 text-ink",

    ghost:
      "text-muted hover:bg-slate-100 hover:text-ink",
  };

  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
