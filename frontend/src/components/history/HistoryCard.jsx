import {
  Calendar,
  Stethoscope,
} from "lucide-react";

export default function HistoryCard({ item }) {
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm">

      <div className="flex justify-between items-center">

        <div className="flex items-center gap-2">

          <Calendar
            size={18}
            className="text-blue-600"
          />

          <span className="font-semibold">
            {item.date}
          </span>

        </div>

        <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">

          {item.type}

        </span>

      </div>

      <div className="mt-4 flex items-center gap-2">

        <Stethoscope size={18} />

        <span className="font-semibold">

          {item.veterinarian}

        </span>

      </div>

      <div className="mt-4">

        <h4 className="font-semibold">
          Motivo
        </h4>

        <p className="text-slate-600">

          {item.reason}

        </p>

      </div>

      <div className="mt-4">

        <h4 className="font-semibold">
          Diagnóstico
        </h4>

        <p className="text-slate-600">

          {item.diagnosis}

        </p>

      </div>

      <div className="mt-4">

        <h4 className="font-semibold">
          Tratamiento
        </h4>

        <p className="text-slate-600">

          {item.treatment}

        </p>

      </div>

    </div>
  );
}