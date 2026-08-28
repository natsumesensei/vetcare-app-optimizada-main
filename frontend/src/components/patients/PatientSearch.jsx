import { Search } from "lucide-react";
import Input from "../ui/Input";

export default function PatientSearch({
  value,
  onChange,
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">

      <div className="relative">

        <Search
          size={18}
          className="absolute left-3 top-3 text-slate-400"
        />

        <Input
          className="pl-10"
          placeholder="Buscar por mascota o propietario..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />

      </div>

    </div>
  );
}