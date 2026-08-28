import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, Search, Eye, Edit2, Trash2, 
  PawPrint, Dog, Cat, Users 
} from "lucide-react";
import { getPatients, deletePatient } from "../services/patientService";

export default function Patients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, [search]);

  async function loadPatients() {
    try {
      setLoading(true);
      const data = await getPatients(search);
      setPatients(Array.isArray(data) ? data : data?.patients || []);
    } catch (error) {
      console.error("Error al cargar pacientes:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!id) return;
    if (!window.confirm("¿Seguro que deseas eliminar este paciente?")) return;
    try {
      await deletePatient(id);
      loadPatients();
    } catch (error) {
      console.error("Error al eliminar paciente:", error);
    }
  }

  const totalPatients = patients.length;
  const totalDogs = patients.filter((p) => p.species?.toLowerCase() === "perro").length;
  const totalCats = patients.filter((p) => p.species?.toLowerCase() === "gato").length;
  const uniqueOwners = new Set(patients.map((p) => p.owner_name).filter(Boolean)).size;

  return (
    <div className="w-full max-w-full space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Pacientes</h1>
          <p className="text-sm text-slate-500">Gestión de pacientes de la clínica.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/patients/new")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-teal-700"
        >
          <Plus size={18} /> Nuevo Paciente
        </button>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pacientes</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totalPatients}</p>
          </div>
          <div className="rounded-xl bg-teal-50 p-3 text-teal-600">
            <PawPrint size={22} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Perros</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totalDogs}</p>
          </div>
          <div className="rounded-xl bg-teal-50 p-3 text-teal-600">
            <Dog size={22} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gatos</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totalCats}</p>
          </div>
          <div className="rounded-xl bg-teal-50 p-3 text-teal-600">
            <Cat size={22} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Propietarios</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{uniqueOwners}</p>
          </div>
          <div className="rounded-xl bg-teal-50 p-3 text-teal-600">
            <Users size={22} />
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar paciente por nombre, especie, propietario..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-teal-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Tabla Responsiva */}
      <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Foto</th>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Especie</th>
                <th className="px-6 py-4">Raza</th>
                <th className="px-6 py-4">Propietario</th>
                <th className="px-6 py-4">Teléfono</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                    Cargando pacientes...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                    No hay pacientes registrados.
                  </td>
                </tr>
              ) : (
                patients.map((patient, index) => {
                  const targetId = patient._id || patient.id;
                  return (
                    <tr key={targetId || index} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-white font-bold text-sm">
                          {patient.name ? patient.name.charAt(0).toUpperCase() : "P"}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{patient.name || "—"}</td>
                      <td className="px-6 py-4">{patient.species || "—"}</td>
                      <td className="px-6 py-4">{patient.breed || "—"}</td>
                      <td className="px-6 py-4">{patient.owner_name || "—"}</td>
                      <td className="px-6 py-4">{patient.owner_phone || "—"}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (targetId) {
                                navigate(`/patients/${targetId}`);
                              } else {
                                console.error("El paciente no tiene ID:", patient);
                              }
                            }}
                            title="Ver detalle"
                            className="rounded-lg bg-teal-50 p-2 text-teal-700 transition hover:bg-teal-100"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/patients/${targetId}/edit`)}
                            title="Editar"
                            className="rounded-lg bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(targetId)}
                            title="Eliminar"
                            className="rounded-lg bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}