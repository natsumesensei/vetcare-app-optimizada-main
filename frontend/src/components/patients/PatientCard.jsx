import { useNavigate } from "react-router-dom";

export default function PatientCard({ patient }) {
  const navigate = useNavigate();

  return (
    <div className="border p-3 rounded flex justify-between">

      <div>
        <p className="font-bold">{patient.name}</p>
      </div>

      <div className="flex gap-2">

        <button
          onClick={() => navigate(`/patients/${patient.id}`)}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Ver
        </button>

        <button
          onClick={() => navigate(`/patients/${patient.id}/edit`)}
          className="bg-yellow-500 text-white px-3 py-1 rounded"
        >
          Editar
        </button>

      </div>

    </div>
  );
}