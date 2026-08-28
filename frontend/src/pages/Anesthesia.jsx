import { useEffect, useState } from "react";
import { 
  Activity, Plus, Printer, Save, Trash2, HeartPulse, 
  Thermometer, Wind, Eye, Clock, CheckCircle2, ChevronRight, X
} from "lucide-react";
import { toast } from "sonner";
import api from "../api/apiClient";
import { printDocument } from "../lib/print";

const ASA_STATUSES = [
  { value: "ASA I", label: "ASA I - Paciente sano normal" },
  { value: "ASA II", label: "ASA II - Enfermedad sistémica leve" },
  { value: "ASA III", label: "ASA III - Enfermedad sistémica grave" },
  { value: "ASA IV", label: "ASA IV - Enfermedad sistémica grave con amenaza vital" },
  { value: "ASA V", label: "ASA V - Paciente moribundo" },
  { value: "ASA E", label: "ASA E - Procedimiento de Urgencia / Emergencia" },
];

const emptyProtocol = {
  patient_id: "",
  surgery_id: "",
  record_date: new Date().toISOString().slice(0, 10),
  anesthetist: "",
  protocol: "",
  asa_status: "ASA I",
  premedication: "",
  induction: "",
  maintenance: "",
  analgesia: "",
  monitoring: "",
  complications: "",
  recovery: "",
};

const emptyMonitoringPoint = {
  elapsed_minutes: 0,
  heart_rate: "",
  respiratory_rate: "",
  spo2: "",
  etco2: "",
  temperature: "",
  systolic_bp: "",
  diastolic_bp: "",
  mean_bp: "",
  ecg: "Sinusal normal",
  anesthetic_depth: "Adecuada",
  oxygen_flow: "1.0",
  sevoflurane: "",
  isoflurane: "1.5",
  fluids_ml_h: "40",
  notes: "",
};

export default function Anesthesia() {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [surgeries, setSurgeries] = useState([]);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [monitoringRows, setMonitoringRows] = useState([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState(emptyProtocol);
  const [monitorForm, setMonitorForm] = useState(emptyMonitoringPoint);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recRes, patRes, surRes] = await Promise.all([
        api.get("/anesthesia"),
        api.get("/patients"),
        api.get("/surgeries"),
      ]);
      setRecords(recRes.data || []);
      setPatients(patRes.data?.patients || patRes.data || []);
      setSurgeries(surRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar registros anestésicos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadMonitoring = async (recordId) => {
    try {
      const res = await api.get(`/anesthesia/${recordId}/monitoring`);
      setMonitoringRows(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar monitorización.");
    }
  };

  const handleSelectRecord = (id) => {
    setSelectedRecordId(id);
    loadMonitoring(id);
  };

  const handleSaveProtocol = async (e) => {
    e.preventDefault();
    if (!form.patient_id) {
      toast.error("Selecciona un paciente.");
      return;
    }
    try {
      setSaving(true);
      const res = await api.post("/anesthesia", form);
      toast.success("Protocolo anestésico registrado.");
      setShowNewModal(false);
      setForm(emptyProtocol);
      await loadData();
      if (res.data?.id) {
        handleSelectRecord(res.data.id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar el registro anestésico.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddMonitoring = async (e) => {
    e.preventDefault();
    if (!selectedRecordId) return;
    try {
      await api.post(`/anesthesia/${selectedRecordId}/monitoring`, monitorForm);
      toast.success("Constante vital registrada.");
      setMonitorForm((prev) => ({
        ...emptyMonitoringPoint,
        elapsed_minutes: Number(prev.elapsed_minutes || 0) + 5,
      }));
      await loadMonitoring(selectedRecordId);
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar constantes.");
    }
  };

  const handleDeleteMonitoring = async (monitorId) => {
    try {
      await api.delete(`/anesthesia-monitoring/${monitorId}`);
      toast.success("Punto de control eliminado.");
      await loadMonitoring(selectedRecordId);
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar punto.");
    }
  };

  const handlePrint = async (recordId) => {
    try {
      const [{ data }, setRes] = await Promise.all([
        api.get(`/anesthesia/${recordId}`),
        api.get("/settings"),
      ]);
      const clinic = setRes.data || {};

      const monitorTable = (data.monitoring || [])
        .map(
          (m) => `
        <tr>
          <td style="text-align:center; font-weight:bold;">${m.elapsed_minutes}'</td>
          <td style="text-align:center;">${m.heart_rate || "—"}</td>
          <td style="text-align:center;">${m.respiratory_rate || "—"}</td>
          <td style="text-align:center; font-weight:bold; color:#0f766e;">${m.spo2 ? m.spo2 + "%" : "—"}</td>
          <td style="text-align:center;">${m.etco2 || "—"}</td>
          <td style="text-align:center;">${m.temperature ? m.temperature + "°C" : "—"}</td>
          <td style="text-align:center;">${m.systolic_bp || "—"}/${m.diastolic_bp || "—"} (${m.mean_bp || "—"})</td>
          <td style="text-align:center;">${m.anesthetic_depth || "—"}</td>
          <td style="text-align:center;">${m.fluids_ml_h ? m.fluids_ml_h + " ml/h" : "—"}</td>
          <td>${m.notes || ""}</td>
        </tr>
      `
        )
        .join("");

      const body = `
        <h1 style="color:#0f766e; margin-bottom:12px;">HOJA DE ANESTESIA Y MONITORIZACIÓN QUIRÚRGICA</h1>
        
        <div class="grid">
          <div class="box">
            <b>DATOS DEL PACIENTE</b><br/>
            <span>Nombre: <b>${data.patient_name}</b></span><br/>
            <span>Especie / Raza: ${data.species || ""} ${data.breed ? `(${data.breed})` : ""}</span><br/>
            <span>Procedimiento: <b>${data.procedure || "Intervención quirúrgica"}</b></span><br/>
            <span>Fecha de intervención: ${data.record_date || ""}</span>
          </div>
          <div class="box">
            <b>EQUIPO Y EVALUACIÓN PREANESTÉSICA</b><br/>
            <span>Anestesista: <b>${data.anesthetist || "Dr. Saladin"}</b></span><br/>
            <span>Clasificación ASA: <b style="color:#b45309;">${data.asa_status || "ASA I"}</b></span><br/>
            <span>Protocolo general: ${data.protocol || "Balanceada inhalatoria"}</span>
          </div>
        </div>

        <h2 style="font-size:14px; margin-top:16px;">FARMACOLOGÍA Y PROTOCOLO ANESTÉSICO</h2>
        <div class="grid">
          <div class="box">
            <b>1. Premedicación / Sedación:</b><br/>
            <span>${data.premedication || "Ninguna especificada"}</span>
          </div>
          <div class="box">
            <b>2. Inducción:</b><br/>
            <span>${data.induction || "Ninguna especificada"}</span>
          </div>
          <div class="box">
            <b>3. Mantenimiento:</b><br/>
            <span>${data.maintenance || "Isoflurano / O₂"}</span>
          </div>
          <div class="box">
            <b>4. Analgesia Peri/Postoperatoria:</b><br/>
            <span>${data.analgesia || "AINE + Opioide"}</span>
          </div>
        </div>

        <h2 style="font-size:14px; margin-top:16px;">REGISTRO TEMPORAL DE CONSTANTES VITALES</h2>
        <table>
          <thead>
            <tr>
              <th style="text-align:center;">Tiempo</th>
              <th style="text-align:center;">FC (ppm)</th>
              <th style="text-align:center;">FR (rpm)</th>
              <th style="text-align:center;">SpO₂</th>
              <th style="text-align:center;">EtCO₂</th>
              <th style="text-align:center;">Temp</th>
              <th style="text-align:center;">PA (PAS/PAD/PAM)</th>
              <th style="text-align:center;">Profundidad</th>
              <th style="text-align:center;">Fluidos</th>
              <th>Observaciones / Eventos</th>
            </tr>
          </thead>
          <tbody>
            ${monitorTable || '<tr><td colspan="10" style="text-align:center; padding:15px;">Sin registros continuos.</td></tr>'}
          </tbody>
        </table>

        <h2 style="font-size:14px; margin-top:16px;">INCIDENCIAS Y RECUPERACIÓN</h2>
        <div class="box">
          <b>Complicaciones intraoperatorias:</b> ${data.complications || "Sin incidencias destacables."}<br/>
          <b>Evolución y recuperación anestésica:</b> ${data.recovery || "Extubación satisfactoria, reflejo deglutorio presente y recuperación normotérmica."}
        </div>

        <div class="sign">
          <div>Firma del Anestesista</div>
          <div>Firma del Cirujano / Responsable</div>
        </div>
      `;

      printDocument(`Hoja Anestesia - ${data.patient_name}`, body, clinic);
    } catch (err) {
      console.error(err);
      toast.error("Error al generar el documento imprimible.");
    }
  };

  const selectedRecord = records.find((r) => r.id === selectedRecordId);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Activity className="text-teal-600" /> Anestesia y Monitorización Perioperatoria
          </h1>
          <p className="text-sm text-slate-500">
            Control de protocolos preanestésicos, inducción, mantenimiento y registro temporal de constantes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
        >
          <Plus size={18} /> Nuevo Registro Anestésico
        </button>
      </div>

      {/* Main Grid: List on Left / Active Monitor on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Records List (Left 5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Registros Anestésicos ({records.length})
            </h2>

            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Cargando registros...</div>
            ) : records.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No hay hojas anestésicas creadas todavía.
              </div>
            ) : (
              <div className="space-y-2">
                {records.map((r) => {
                  const isSelected = r.id === selectedRecordId;
                  return (
                    <div
                      key={r.id}
                      onClick={() => handleSelectRecord(r.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? "bg-teal-50 border-teal-500 shadow-sm"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{r.patient_name}</span>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                            {r.species}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            {r.asa_status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">{r.procedure || "Cirugía general"}</p>
                        <p className="text-[11px] text-slate-400">
                          {r.record_date} · Anestesista: {r.anesthetist || "Dr. Saladin"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrint(r.id);
                          }}
                          title="Imprimir Hoja"
                          className="p-2 text-slate-500 hover:text-teal-600 hover:bg-white rounded-lg transition"
                        >
                          <Printer size={16} />
                        </button>
                        <ChevronRight className={`transition ${isSelected ? "text-teal-600" : "text-slate-300"}`} size={18} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Live Monitoring Dashboard (Right 7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedRecord ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              {/* Active Sheet Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">
                      Monitorización · {selectedRecord.patient_name}
                    </h2>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      {selectedRecord.asa_status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {selectedRecord.procedure || "Cirugía"} · {selectedRecord.record_date}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handlePrint(selectedRecord.id)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
                >
                  <Printer size={14} /> Imprimir Hoja Quirúrgica
                </button>
              </div>

              {/* Protocol Details Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-medium">Premedicación</span>
                  <span className="font-semibold text-slate-800">{selectedRecord.premedication || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Inducción</span>
                  <span className="font-semibold text-slate-800">{selectedRecord.induction || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Mantenimiento</span>
                  <span className="font-semibold text-slate-800">{selectedRecord.maintenance || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Analgesia</span>
                  <span className="font-semibold text-slate-800">{selectedRecord.analgesia || "—"}</span>
                </div>
              </div>

              {/* Add New Vital Signs Entry Form */}
              <form onSubmit={handleAddMonitoring} className="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                    <HeartPulse size={16} className="text-teal-600" /> Registrar Punto de Monitorización
                  </span>
                  <span className="text-xs text-teal-700 font-semibold">Minuto +5</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Min</label>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={monitorForm.elapsed_minutes}
                      onChange={(e) => setMonitorForm({ ...monitorForm, elapsed_minutes: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 bg-white text-center font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">FC (ppm)</label>
                    <input
                      type="number"
                      placeholder="110"
                      value={monitorForm.heart_rate}
                      onChange={(e) => setMonitorForm({ ...monitorForm, heart_rate: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 bg-white text-center font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">FR (rpm)</label>
                    <input
                      type="number"
                      placeholder="20"
                      value={monitorForm.respiratory_rate}
                      onChange={(e) => setMonitorForm({ ...monitorForm, respiratory_rate: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 bg-white text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">SpO₂ (%)</label>
                    <input
                      type="number"
                      placeholder="99"
                      value={monitorForm.spo2}
                      onChange={(e) => setMonitorForm({ ...monitorForm, spo2: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 bg-white text-center font-bold text-teal-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">EtCO₂</label>
                    <input
                      type="number"
                      placeholder="38"
                      value={monitorForm.etco2}
                      onChange={(e) => setMonitorForm({ ...monitorForm, etco2: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 bg-white text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Temp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="37.5"
                      value={monitorForm.temperature}
                      onChange={(e) => setMonitorForm({ ...monitorForm, temperature: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 bg-white text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">PAS (mmHg)</label>
                    <input
                      type="number"
                      placeholder="115"
                      value={monitorForm.systolic_bp}
                      onChange={(e) => setMonitorForm({ ...monitorForm, systolic_bp: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 bg-white text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">PAD (mmHg)</label>
                    <input
                      type="number"
                      placeholder="70"
                      value={monitorForm.diastolic_bp}
                      onChange={(e) => setMonitorForm({ ...monitorForm, diastolic_bp: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 bg-white text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Profundidad</label>
                    <select
                      value={monitorForm.anesthetic_depth}
                      onChange={(e) => setMonitorForm({ ...monitorForm, anesthetic_depth: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 bg-white"
                    >
                      <option value="Superficial">Superficial</option>
                      <option value="Adecuada">Adecuada</option>
                      <option value="Profunda">Profunda</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Fluidos ml/h</label>
                    <input
                      type="number"
                      placeholder="40"
                      value={monitorForm.fluids_ml_h}
                      onChange={(e) => setMonitorForm({ ...monitorForm, fluids_ml_h: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 bg-white text-center"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Eventos / Notas</label>
                    <input
                      type="text"
                      placeholder="Ej. Incisión, bolo fentanilo..."
                      value={monitorForm.notes}
                      onChange={(e) => setMonitorForm({ ...monitorForm, notes: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition"
                  >
                    <Plus size={14} /> Añadir Lectura de Constantes
                  </button>
                </div>
              </form>

              {/* Monitoring Table */}
              <div className="border rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-semibold text-slate-500 border-b">
                    <tr>
                      <th className="p-3 text-center">Min</th>
                      <th className="p-3 text-center">FC</th>
                      <th className="p-3 text-center">FR</th>
                      <th className="p-3 text-center">SpO₂</th>
                      <th className="p-3 text-center">EtCO₂</th>
                      <th className="p-3 text-center">Temp</th>
                      <th className="p-3 text-center">PA</th>
                      <th className="p-3 text-center">Prof.</th>
                      <th className="p-3 text-center">Fluidos</th>
                      <th className="p-3">Notas</th>
                      <th className="p-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monitoringRows.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="p-6 text-center text-slate-400">
                          Aún no se han registrado constantes vitales para esta intervención.
                        </td>
                      </tr>
                    ) : (
                      monitoringRows.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 text-center font-bold text-slate-900">{m.elapsed_minutes}'</td>
                          <td className="p-3 text-center font-semibold text-rose-600">{m.heart_rate || "—"}</td>
                          <td className="p-3 text-center">{m.respiratory_rate || "—"}</td>
                          <td className="p-3 text-center font-bold text-teal-600">{m.spo2 ? `${m.spo2}%` : "—"}</td>
                          <td className="p-3 text-center">{m.etco2 || "—"}</td>
                          <td className="p-3 text-center">{m.temperature ? `${m.temperature}°C` : "—"}</td>
                          <td className="p-3 text-center">
                            {m.systolic_bp || "—"}/{m.diastolic_bp || "—"}
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-[11px]">
                              {m.anesthetic_depth || "—"}
                            </span>
                          </td>
                          <td className="p-3 text-center">{m.fluids_ml_h ? `${m.fluids_ml_h} ml/h` : "—"}</td>
                          <td className="p-3 text-slate-600">{m.notes || "—"}</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteMonitoring(m.id)}
                              className="text-slate-300 hover:text-rose-600 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <Activity size={48} className="mx-auto mb-3 text-slate-300" />
              <h3 className="text-base font-bold text-slate-700">Ningún registro anestésico seleccionado</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Selecciona una hoja anestésica del panel izquierdo o crea una nueva para registrar constantes intraoperatorias.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CREAR PROTOCOLO ANESTÉSICO */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="text-teal-600" size={20} /> Nuevo Protocolo Anestésico y Hoja de Control
              </h2>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProtocol} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Paciente *</label>
                  <select
                    required
                    value={form.patient_id}
                    onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-teal-500 focus:outline-none bg-white"
                  >
                    <option value="">Seleccionar paciente...</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.species} ({p.owner_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cirugía Vinculada</label>
                  <select
                    value={form.surgery_id}
                    onChange={(e) => setForm({ ...form, surgery_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-teal-500 focus:outline-none bg-white"
                  >
                    <option value="">Procedimiento quirúrgico (opcional)...</option>
                    {surgeries.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.surgery_date} · {s.procedure}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={form.record_date}
                    onChange={(e) => setForm({ ...form, record_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Anestesista Responsable</label>
                  <input
                    type="text"
                    placeholder="Dr. Saladin / Dra. Vega"
                    value={form.anesthetist}
                    onChange={(e) => setForm({ ...form, anesthetist: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Evaluación ASA *</label>
                  <select
                    value={form.asa_status}
                    onChange={(e) => setForm({ ...form, asa_status: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-teal-500 focus:outline-none bg-white"
                  >
                    {ASA_STATUSES.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Protocolo General</label>
                  <input
                    type="text"
                    placeholder="Ej. Anestesia Balanceada TIVA/Inhalatoria"
                    value={form.protocol}
                    onChange={(e) => setForm({ ...form, protocol: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">1. Premedicación / Sedación</label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Dexmedetomidina 5 mcg/kg + Metadona 0.2 mg/kg IM"
                    value={form.premedication}
                    onChange={(e) => setForm({ ...form, premedication: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">2. Inducción</label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Propofol 3 mg/kg IV lento a efecto + Intubación endotraqueal tubo nº 8"
                    value={form.induction}
                    onChange={(e) => setForm({ ...form, induction: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">3. Mantenimiento Anestésico</label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Isoflurano 1.5% en O2 al 100% (circuito circular)"
                    value={form.maintenance}
                    onChange={(e) => setForm({ ...form, maintenance: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">4. Analgesia Peri/Postoperatoria</label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Meloxicam 0.2 mg/kg SC + Bloqueo local lidocaína 2%"
                    value={form.analgesia}
                    onChange={(e) => setForm({ ...form, analgesia: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Complicaciones y Plan de Recuperación</label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Monitorizar hipotensión, mantener fluidos normotérmicos hasta extubación."
                    value={form.recovery}
                    onChange={(e) => setForm({ ...form, recovery: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition"
                >
                  <Save size={16} /> Guardar Hoja Anestésica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
