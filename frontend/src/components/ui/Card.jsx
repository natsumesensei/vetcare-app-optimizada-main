import { cn } from "@/lib/utils";

export function Card({ children, className = "" }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white shadow-card border border-line",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return (
    <div className={cn("border-b border-line px-6 py-4", className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }) {
  return <div className={cn("p-6", className)}>{children}</div>;
}
