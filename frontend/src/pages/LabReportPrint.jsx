import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Printer, ArrowLeft, FlaskConical } from "lucide-react";
import api from "../api/apiClient";

export default function LabReportPrint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { data } = await api.get(`/lab-orders/${id}`);
        setOrder(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500">
        Cargando informe analítico...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
        <p className="text-base font-semibold text-slate-700">Informe de laboratorio no encontrado</p>
        <button
          onClick={() => navigate("/laboratory")}
          className="mt-4 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl"
        >
          Volver a Laboratorio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:p-0">
      {/* Barra superior de control (oculta en print) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate("/laboratory")}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs"
        >
          <ArrowLeft size={16} /> Volver a Laboratorio
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm"
        >
          <Printer size={16} /> Imprimir Informe / PDF
        </button>
      </div>

      {/* Documento A4 */}
      <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl shadow-lg border border-slate-200 print:border-0 print:shadow-none print:p-0 text-slate-900 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              VetCare Clínica Dr. Saladin
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Servicio de Análisis Clínicos y Diagnóstico Veterinario
            </p>
            <p className="text-xs text-slate-500">
              Calle Mayor 45, 28013 Madrid · Tel: +34 912 345 678
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-teal-700 uppercase tracking-wider">
              INFORME DE LABORATORIO
            </div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{order.order_number}</div>
            <div className="text-xs text-slate-500 mt-1">
              Fecha: <span className="font-semibold text-slate-800">{order.order_date}</span>
            </div>
          </div>
        </div>

        {/* Paciente y Muestra */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <div className="font-bold text-slate-400 uppercase tracking-wider mb-1">
              Paciente & Tutor
            </div>
            <div className="font-bold text-sm text-slate-900">{order.patient_name}</div>
            <div className="text-slate-600">
              {order.patient_species} · {order.patient_breed || "Mestizo"}
            </div>
            <div className="text-slate-600">Tutor: {order.owner_name}</div>
          </div>
          <div>
            <div className="font-bold text-slate-400 uppercase tracking-wider mb-1">
              Detalles de Muestra
            </div>
            <div className="font-bold text-slate-800">{order.panel}</div>
            <div className="text-slate-600">Tipo: {order.sample_type}</div>
            <div className="text-slate-600">Veterinario: {order.veterinarian || "Dr. Saladin"}</div>
          </div>
        </div>

        {/* Resultados */}
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200 text-slate-500 font-bold uppercase">
              <th className="py-2.5">Parámetro</th>
              <th className="py-2.5 text-center">Resultado</th>
              <th className="py-2.5 text-center">Unidad</th>
              <th className="py-2.5 text-center">Valores Referencia</th>
              <th className="py-2.5 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {order.items?.map((it, idx) => (
              <tr key={idx} className={it.status !== "Normal" ? "bg-amber-50/40" : ""}>
                <td className="py-3 font-semibold text-slate-900">{it.parameter_name}</td>
                <td className="py-3 text-center font-black text-sm text-slate-900">
                  {it.result_value || "—"}
                </td>
                <td className="py-3 text-center font-mono text-slate-500">{it.unit}</td>
                <td className="py-3 text-center text-slate-600">
                  {it.min_value ?? "—"} - {it.max_value ?? "—"}
                </td>
                <td className="py-3 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      it.status === "Alto"
                        ? "bg-rose-100 text-rose-800"
                        : it.status === "Bajo"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {it.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Conclusiones & Firma */}
        <div className="pt-4 border-t border-slate-200 space-y-4 text-xs">
          {order.clinical_notes && (
            <div>
              <span className="font-bold text-slate-800">Notas de Exploración:</span>
              <p className="text-slate-600 mt-0.5">{order.clinical_notes}</p>
            </div>
          )}
          {order.interpretation && (
            <div>
              <span className="font-bold text-slate-800">Interpretación Clínica:</span>
              <p className="text-slate-600 mt-0.5">{order.interpretation}</p>
            </div>
          )}

          <div className="pt-8 flex justify-between items-end">
            <div className="text-[10px] text-slate-400 max-w-xs">
              Informe emitido conforme a las normas de buenas prácticas de laboratorio veterinario.
            </div>
            <div className="text-center">
              <div className="w-48 border-b border-slate-400 mb-1" />
              <div className="text-xs font-bold text-slate-800">
                {order.veterinarian || "Dr. Saladin"}
              </div>
              <div className="text-[10px] text-slate-400">Veterinario Colegiado</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
