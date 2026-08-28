import PatientRow from "./PatientRow";

export default function PatientTable({
  patients,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <div className="overflow-x-auto">

      <table className="w-full">

        <thead className="bg-slate-100">

          <tr>

            <th className="text-left px-4 py-3">Foto</th>

            <th className="text-left px-4 py-3">Nombre</th>

            <th className="text-left px-4 py-3">Especie</th>

            <th className="text-left px-4 py-3">Raza</th>

            <th className="text-left px-4 py-3">Propietario</th>

            <th className="text-left px-4 py-3">Teléfono</th>

            <th className="text-left px-4 py-3">Acciones</th>

          </tr>

        </thead>

        <tbody>

          {patients.map((patient) => (
            <PatientRow
              key={patient.id}
              patient={patient}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}

        </tbody>

      </table>

    </div>
  );
}