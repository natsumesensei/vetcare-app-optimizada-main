export default function VaccinesTab() {
  return (
    <div className="bg-white rounded-xl border p-8">

      <div className="flex justify-between items-center mb-6">

        <h2 className="text-2xl font-bold">
          Vacunas
        </h2>

        <button className="bg-blue-600 text-white px-5 py-2 rounded-lg">
          Nueva Vacuna
        </button>

      </div>

      <div className="text-slate-500">

        Aún no existen vacunas registradas para este paciente.

      </div>

    </div>
  );
}