import ParasiteCard from "./ParasiteCard";
export default function ParasiteList({ parasites = [], onEdit, onDelete }) {
  if (!parasites.length) return <div className="rounded-xl border border-dashed bg-white p-8 text-center text-slate-500">No hay registros antiparasitarios.</div>;
  return <div className="grid gap-4 md:grid-cols-2">{parasites.map(p => <ParasiteCard key={p.id} parasite={p} onEdit={onEdit} onDelete={onDelete} />)}</div>;
}
