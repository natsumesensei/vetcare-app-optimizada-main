import { cn } from "@/lib/utils";

export default function Input({ className = "", ...props }) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-line px-3 py-2 outline-none transition-colors focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500",
        className
      )}
      {...props}
    />
  );
}
