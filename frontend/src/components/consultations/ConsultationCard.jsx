import {
  Calendar,
  User,
  Thermometer,
  HeartPulse,
  Activity,
  Weight,
  FileText,
  Pill,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

export default function ConsultationCard({
  consultation,
  onEdit,
  onDelete,
}) {
  return (
    <div className="bg-white border rounded-xl shadow-sm hover:shadow-md transition">

      {/* Encabezado */}

      <div className="border-b px-6 py-4 flex justify-between items-center">

        <div>

          <div className="flex items-center gap-2">

            <Calendar
              size={18}
              className="text-blue-600"
            />

            <span className="font-bold">
              {consultation.date}
            </span>

          </div>

          <div className="flex items-center gap-2 mt-2 text-slate-500">

            <User size={16} />

            {consultation.veterinarian || "Sin veterinario"}

          </div>

        </div>

        <div className="flex gap-2">

          <button
            onClick={() => onEdit?.(consultation)}
            className="p-2 rounded-lg hover:bg-slate-100"
            title="Editar consulta"
          >
            <Pencil
              size={18}
              className="text-blue-600"
            />
          </button>

          <button
            onClick={() => onDelete?.(consultation)}
            className="p-2 rounded-lg hover:bg-red-100"
            title="Eliminar consulta"
          >
            <Trash2
              size={18}
              className="text-red-600"
            />
          </button>

        </div>

      </div>

      {/* Motivo */}

      <div className="p-6">

        <h3 className="font-semibold text-slate-800">

          Motivo de consulta

        </h3>

        <p className="mt-2 text-slate-600">

          {consultation.reason || "Sin información"}

        </p>

      </div>

      {/* Signos Vitales */}

      <div className="px-6">

        <h3 className="font-semibold mb-4">

          Signos Vitales

        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <div className="border rounded-lg p-3">

            <div className="flex items-center gap-2">

              <Thermometer
                size={18}
                className="text-red-500"
              />

              <span className="text-sm">

                Temperatura

              </span>

            </div>

            <p className="mt-2 font-bold">

              {consultation.temperature || "--"} °C

            </p>

          </div>

          <div className="border rounded-lg p-3">

            <div className="flex items-center gap-2">

              <HeartPulse
                size={18}
                className="text-pink-600"
              />

              <span className="text-sm">

                FC

              </span>

            </div>

            <p className="mt-2 font-bold">

              {consultation.heart_rate || "--"}

            </p>

          </div>

          <div className="border rounded-lg p-3">

            <div className="flex items-center gap-2">

              <Activity
                size={18}
                className="text-green-600"
              />

              <span className="text-sm">

                FR

              </span>

            </div>

            <p className="mt-2 font-bold">

              {consultation.respiratory_rate || "--"}

            </p>

          </div>

          <div className="border rounded-lg p-3">

            <div className="flex items-center gap-2">

              <Weight
                size={18}
                className="text-amber-600"
              />

              <span className="text-sm">

                Peso

              </span>

            </div>

            <p className="mt-2 font-bold">

              {consultation.weight || "--"} kg

            </p>

          </div>

        </div>

      </div>

      {/* Diagnóstico */}

      <div className="p-6">

        <div className="flex items-center gap-2 mb-2">

          <Eye
            size={18}
            className="text-blue-600"
          />

          <h3 className="font-semibold">

            Diagnóstico

          </h3>

        </div>

        <p className="text-slate-600">

          {consultation.diagnosis || "Sin diagnóstico"}

        </p>

      </div>

      {/* Tratamiento */}

      <div className="px-6 pb-6">

        <div className="flex items-center gap-2 mb-2">

          <Pill
            size={18}
            className="text-green-600"
          />

          <h3 className="font-semibold">

            Tratamiento

          </h3>

        </div>

        <p className="text-slate-600">

          {consultation.treatment || "Sin tratamiento"}

        </p>

      </div>

      {/* Observaciones */}

      {consultation.observations && (

        <div className="border-t p-6">

          <div className="flex items-center gap-2 mb-2">

            <FileText
              size={18}
              className="text-slate-600"
            />

            <h3 className="font-semibold">

              Observaciones

            </h3>

          </div>

          <p className="text-slate-600">

            {consultation.observations}

          </p>

        </div>

      )}

    </div>
  );
}