import { useEffect, useState } from "react";
import {
  FlaskConical,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Eye,
  Printer,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../api/apiClient";
import { Card } from "../ui/Card";
import Button from "../ui/Button";

export default function LaboratoryTab({ patientId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [saving, setSaving] = useState(false);

  // Formulario
  const [form, setForm] = useState({
    patient_id: patientId,
    veterinarian: "Dr. Saladin",
    order_date: new Date().toISOString().slice(0, 10),
    sample_type: "Sangre Total (EDTA)",
    panel: "Hemograma Completo",
    status: "Completado",
    clinical_notes: "",
    interpretation: "",
    items: [
      { parameter_name: "Hematocrito (HTO)", result_value: "42", unit: "%", min_value: 37, max_value: 55, status: "Normal" },
      { parameter_name: "Hemoglobina (HB)", result_value: "14.5", unit: "g/dL", min_value: 12, max_value: 18, status: "Normal" },
      { parameter_name: "Leucocitos Totales", result_value: "11.2", unit: "x10³/µL", min_value: 6, max_value: 17, status: "Normal" },
      { parameter_name: "Plaquetas", result_value: "290", unit: "x10³/µL", min_value: 200, max_value: 500, status: "Normal" },
    ],
  });

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/lab-orders?patient_id=${patientId}`);
      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) loadOrders();
  }, [patientId]);

  const handleUpdateItemValue = (idx, val) => {
    setForm((prev) => {
      const updated = [...prev.items];
      const item = { ...updated[idx], result_value: val };

      if (val === "" || val === null || isNaN(Number(val))) {
        item.status = "Normal";
      } else {
        const num = Number(val);
        if (item.min_value != null && num < Number(item.min_value)) {
          item.status = "Bajo";
        } else if (item.max_value != null && num > Number(item.max_value)) {
          item.status = "Alto";
        } else {
          item.status = "Normal";
        }
      }

      updated[idx] = item;
      return { ...prev, items: updated };
    });
  };

  const handleAddItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          parameter_name: "",
          result_value: "",
          unit: "",
          min_value: null,
          max_value: null,
          status: "Normal",
        },
      ],
    }));
  };

  const handleRemoveItem = (idx) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/lab-orders", { ...form, patient_id: patientId });
      toast.success("Análisis clínico guardado.");
      setModalOpen(false);
      loadOrders();
    } catch (err) {
      toast.error("Error al registrar análisis.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (orderId) => {
    if (!confirm("¿Eliminar este análisis de la historia del paciente?")) return;
    try {
      await api.delete(`/lab-orders/${orderId}`);
      toast.success("Análisis eliminado.");
      loadOrders();
    } catch (err) {
      toast.error("Error al eliminar.");
    }
  };

  const handleOpenDetail = async (orderId) => {
    try {
      const { data } = await api.get(`/lab-orders/${orderId}`);
      setViewOrder(data);
    } catch (err) {
      toast.error("Error al cargar detalle.");
    }
  };

  return (
    <Card>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-6 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Análisis y Laboratorio</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Historial de hemogramas, perfiles bioquímicos y pruebas diagnósticas.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus size={16} /> Nuevo Análisis
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Cargando análisis...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No hay análisis de laboratorio</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Registra hemogramas, frotis o bioquímicas para el seguimiento de este paciente.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                    <FlaskConical size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {ord.panel || "General"}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        ({ord.order_number})
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ord.overall_status === "FUERA DE RANGO"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {ord.overall_status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Fecha: {ord.order_date} · Muestra: {ord.sample_type} · Vet: {ord.veterinarian || "Dr. Saladin"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenDetail(ord.id)}
                    className="p-2 text-slate-500 hover:text-teal-600 hover:bg-white rounded-lg transition-colors"
                    title="Ver informe"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(ord.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Nuevo Análisis */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 my-8 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Registrar Análisis Clínico</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Panel</label>
                  <input
                    type="text"
                    required
                    value={form.panel}
                    onChange={(e) => setForm({ ...form, panel: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={form.order_date}
                    onChange={(e) => setForm({ ...form, order_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Muestra</label>
                  <input
                    type="text"
                    value={form.sample_type}
                    onChange={(e) => setForm({ ...form, sample_type: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Parámetros Analizados</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-teal-600 hover:text-teal-800 font-semibold"
                  >
                    + Añadir Parámetro
                  </button>
                </div>

                {form.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 items-center"
                  >
                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="Parámetro"
                        value={item.parameter_name}
                        onChange={(e) => {
                          const v = e.target.value;
                          setForm((prev) => {
                            const up = [...prev.items];
                            up[idx].parameter_name = v;
                            return { ...prev, items: up };
                          });
                        }}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        placeholder="Resultado"
                        value={item.result_value}
                        onChange={(e) => handleUpdateItemValue(idx, e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-center outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Unidad"
                        value={item.unit}
                        onChange={(e) => {
                          const v = e.target.value;
                          setForm((prev) => {
                            const up = [...prev.items];
                            up[idx].unit = v;
                            return { ...prev, items: up };
                          });
                        }}
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-center outline-none"
                      />
                    </div>
                    <div className="col-span-2 text-center text-[10px] font-bold">
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          item.status === "Alto"
                            ? "bg-rose-100 text-rose-800"
                            : item.status === "Bajo"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Notas de Exploración / Conclusión
                </label>
                <textarea
                  rows={2}
                  value={form.clinical_notes}
                  onChange={(e) => setForm({ ...form, clinical_notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold shadow-xs"
                >
                  {saving ? "Guardando..." : "Guardar Análisis"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Detalle */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {viewOrder.panel} ({viewOrder.order_number})
                </h3>
                <p className="text-xs text-slate-500">Fecha: {viewOrder.order_date}</p>
              </div>
              <button onClick={() => setViewOrder(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase">
                  <th className="py-2">Parámetro</th>
                  <th className="py-2 text-center">Resultado</th>
                  <th className="py-2 text-center">Unidad</th>
                  <th className="py-2 text-center">Valores Referencia</th>
                  <th className="py-2 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {viewOrder.items?.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 font-semibold text-slate-800">{it.parameter_name}</td>
                    <td className="py-2.5 text-center font-bold text-slate-900">{it.result_value}</td>
                    <td className="py-2.5 text-center text-slate-500">{it.unit}</td>
                    <td className="py-2.5 text-center text-slate-500">
                      {it.min_value ?? "—"} - {it.max_value ?? "—"}
                    </td>
                    <td className="py-2.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
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

            {viewOrder.clinical_notes && (
              <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-700">
                <strong>Notas:</strong> {viewOrder.clinical_notes}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
