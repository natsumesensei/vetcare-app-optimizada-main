export default function Spinner({ label = "Cargando..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted text-sm">
      <div className="w-8 h-8 rounded-full border-[3px] border-slate-200 border-t-brand-600 animate-spin" />
      {label}
    </div>
  );
}
