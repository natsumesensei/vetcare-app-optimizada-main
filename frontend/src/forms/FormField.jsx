export default function FormField({ label, name, type = "text", value = "", onChange, required = false, placeholder = "", options = [] }) {
  const common = { name, value, onChange, required, placeholder, className: "w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-500" };
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={name} className="text-sm font-medium text-slate-700">{label}</label>}
      {type === "textarea" ? <textarea id={name} {...common} rows={4} /> : type === "select" ? (
        <select id={name} {...common}>{options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}</select>
      ) : <input id={name} type={type} {...common} />}
    </div>
  );
}
