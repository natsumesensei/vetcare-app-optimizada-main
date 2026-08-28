export default function ParasiteCard({ parasite, onEdit, onDelete }) {
  return (
    <article className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-900">{parasite.type || "Antiparasitario"}</h3>
          <p className="text-sm text-slate-500">{parasite.product || "Producto no indicado"}</p>
        </div>
        <div className="flex gap-2 text-sm">
          <button type="button" onClick={() => onEdit?.(parasite)} className="text-blue-600 hover:underline">Editar</button>
          <button type="button" onClick={() => onDelete?.(parasite)} className="text-red-600 hover:underline">Eliminar</button>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div><dt className="text-slate-400">Aplicación</dt><dd>{parasite.application_date || "—"}</dd></div>
        <div><dt className="text-slate-400">Próxima</dt><dd>{parasite.next_due_date || "—"}</dd></div>
        <div className="col-span-2"><dt className="text-slate-400">Veterinario</dt><dd>{parasite.veterinarian || "—"}</dd></div>
      </dl>
    </article>
  );
}
