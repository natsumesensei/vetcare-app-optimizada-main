import { ArrowLeft, Pencil, Printer } from "lucide-react";
import Button from "../ui/Button";

export default function PatientHeader({
  patient,
  navigate,
}) {
  return (
    <div className="bg-white rounded-xl border p-6 flex justify-between items-center">

      <div className="flex items-center gap-4">

        <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold">

          {patient.name?.charAt(0)}

        </div>

        <div>

          <h1 className="text-3xl font-bold">
            {patient.name}
          </h1>

          <p className="text-slate-500">
            {patient.species} • {patient.breed}
          </p>

        </div>

      </div>

      <div className="flex gap-3">

        <Button
          onClick={() => navigate("/patients")}
        >
          <ArrowLeft size={18} />
          Volver
        </Button>

        <Button
          onClick={() =>
            navigate(`/patients/${patient.id}/edit`)
          }
        >
          <Pencil size={18} />
          Editar
        </Button>

        <Button onClick={() => navigate(`/patients/${patient.id}/print`)}>
          <Printer size={18} />
          Imprimir / PDF
        </Button>

      </div>

    </div>
  );
}