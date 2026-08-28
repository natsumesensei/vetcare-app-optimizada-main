import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import Button from "../ui/Button";

import PatientStats from "./PatientStats";
import PatientSearch from "./PatientSearch";
import PatientTable from "./PatientTable";
import Pagination from "./Pagination";

import usePatients from "../../hooks/usePatients";

export default function Patients() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const { patients, loading } = usePatients(search);

  // Paginación
  const [page, setPage] = useState(1);

  const pageSize = 10;

  const totalPages = Math.max(
    1,
    Math.ceil(patients.length / pageSize)
  );

  const visiblePatients = patients.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  function previousPage() {
    if (page > 1) {
      setPage(page - 1);
    }
  }

  function nextPage() {
    if (page < totalPages) {
      setPage(page + 1);
    }
  }

  // ✅ ARREGLADO: navegación real
  function handleView(patient) {
    navigate(`/patients/${patient.id}`);
  }

  function handleEdit(patient) {
    navigate(`/patients/${patient.id}/edit`);
  }

  function handleDelete(patient) {
    console.log("Eliminar", patient);
  }

  function handleNewPatient() {
    navigate("/patients/new");
  }

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>

          <h1 className="text-3xl font-bold">
            Pacientes
          </h1>

          <p className="text-slate-500 mt-1">
            Gestión completa de pacientes de la clínica veterinaria.
          </p>

        </div>

        <Button onClick={handleNewPatient}>
          <Plus size={18} />
          Nuevo Paciente
        </Button>

      </div>

      {/* Estadísticas */}
      <PatientStats patients={patients} />

      {/* Buscador */}
      <PatientSearch
        value={search}
        onChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />

      {/* Tabla */}
      {loading ? (

        <div className="bg-white rounded-xl border p-10 text-center">
          Cargando pacientes...
        </div>

      ) : (

        <>
          <PatientTable
            patients={visiblePatients}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            onPrevious={previousPage}
            onNext={nextPage}
          />
        </>

      )}

    </div>
  );
}