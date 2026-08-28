import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardPlus, Search, Stethoscope, UserRound } from "lucide-react";
import { getPatients } from "../services/patientService";
import { getConsultations, deleteConsultation } from "../services/consultationService";
import ConsultationModal from "../components/consultations/ConsultationModal";
import ConsultationEditModal from "../components/consultations/ConsultationEditModal";
import ConsultationList from "../components/consultations/ConsultationList";

export default function ConsultationPage() {
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingConsultations, setLoadingConsultations] = useState(false);
  const [error, setError] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadPatients = useCallback(async () => {
    try {
      setLoadingPatients(true);
      setError("");
      const data = await getPatients(patientSearch);
      setPatients(Array.isArray(data) ? data : data?.patients || []);
    } catch (err) {
      console.error(err);
      setError("No fue posible cargar los pacientes.");
    } finally {
      setLoadingPatients(false);
    }
  }, [patientSearch]);

  const loadConsultations = useCallback(async () => {
    if (!selectedPatient?.id) {
      setConsultations([]);
      return;
    }
    try {
      setLoadingConsultations(true);
      setError("");
      const data = await getConsultations(selectedPatient.id);
      setConsultations(Array.isArray(data) ? data : data?.consultations || []);
    } catch (err) {
      console.error(err);
      setError("No fue posible cargar las consultas del paciente.");
      setConsultations([]);
    } finally {
      setLoadingConsultations(false);
    }
  }, [selectedPatient]);

  useEffect(() => {
    const timer = setTimeout(loadPatients, 250);
    return () => clearTimeout(timer);
  }, [loadPatients]);

  useEffect(() => {
    loadConsultations();
  }, [loadConsultations]);

  const stats = useMemo(() => ({
    total: consultations.length,
    latest: consultations[0]?.date || "—",
    veterinarian: consultations[0]?.veterinarian || "—",
  }), [consultations]);

  async function handleDelete(consultation) {
    if (!window.confirm("¿Eliminar esta consulta? Esta acción no se puede deshacer.")) return;
    try {
      await deleteConsultation(consultation.id);
      await loadConsultations();
    } catch (err) {
      console.error(err);
      setError("No fue posible eliminar la consulta.");
    }
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6">
      {/* Encabezado Principal */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-teal-50 p-3 text-teal-600 shrink-0">
            <Stethoscope size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
              Consultas clínicas
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Historia médica, exploración, diagnóstico y tratamiento.
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={!selectedPatient}
          onClick={() => setNewOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ClipboardPlus size={18} /> Nueva consulta
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Selector de Pacientes */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-base sm:text-lg font-semibold text-slate-900">
          <UserRound size={20} className="text-teal-600" /> Seleccionar paciente
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
          <input
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            placeholder="Buscar por nombre, microchip o propietario..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-teal-600 focus:bg-white"
          />
        </div>

        {loadingPatients ? (
          <p className="py-6 text-center text-sm text-slate-500">Cargando pacientes...</p>
        ) : (
          <div className="mt-3 grid max-h-56 sm:max-h-64 gap-2 overflow-y-auto grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {patients.map((patient) => {
              const active = selectedPatient?.id === patient.id;
              return (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => setSelectedPatient(patient)}
                  className={`rounded-xl border p-3.5 text-left transition ${
                    active
                      ? "border-teal-600 bg-teal-50/60 ring-1 ring-teal-600"
                      : "border-slate-200 hover:border-teal-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                    {patient.name || "Sin nombre"}
                  </div>
                  <div className="mt-0.5 text-xs sm:text-sm text-slate-500 truncate">
                    {patient.species || "Especie no indicada"}
                    {patient.breed ? ` · ${patient.breed}` : ""}
                  </div>
                  {patient.owner_name && (
                    <div className="mt-1 text-xs text-slate-400 truncate">
                      Propietario: {patient.owner_name}
                    </div>
                  )}
                </button>
              );
            })}
            {!patients.length && (
              <p className="col-span-full py-6 text-center text-sm text-slate-500">
                No se encontraron pacientes.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Detalle y Lista de Consultas */}
      {selectedPatient ? (
        <>
          <section className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="text-xs sm:text-sm text-slate-500">Paciente</div>
              <div className="mt-1 text-lg sm:text-xl font-bold text-slate-900 truncate">
                {selectedPatient.name}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="text-xs sm:text-sm text-slate-500">Consultas registradas</div>
              <div className="mt-1 text-lg sm:text-xl font-bold text-teal-700">
                {stats.total}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="text-xs sm:text-sm text-slate-500">Última consulta</div>
              <div className="mt-1 flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-900 truncate">
                <CalendarDays size={18} className="text-teal-600 shrink-0" />
                <span>{stats.latest}</span>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Historial de consultas</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {selectedPatient.name} · {stats.veterinarian !== "—" ? `Último vet: ${stats.veterinarian}` : "Sin veterinario"}
              </p>
            </div>

            {loadingConsultations ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                Cargando historial...
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <ConsultationList
                  consultations={consultations}
                  onEdit={setEditing}
                  onDelete={handleDelete}
                />
              </div>
            )}
          </section>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center shadow-sm">
          <Stethoscope className="mx-auto text-slate-300" size={40} />
          <h2 className="mt-3 text-base sm:text-lg font-semibold text-slate-800">
            Selecciona un paciente
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Elige un paciente para consultar su historial o registrar una nueva consulta.
          </p>
        </div>
      )}

      <ConsultationModal
        open={newOpen}
        patientId={selectedPatient?.id}
        onClose={() => setNewOpen(false)}
        onSaved={loadConsultations}
      />

      <ConsultationEditModal
        open={Boolean(editing)}
        consultation={editing}
        onClose={() => setEditing(null)}
        onUpdated={loadConsultations}
      />
    </div>
  );
}