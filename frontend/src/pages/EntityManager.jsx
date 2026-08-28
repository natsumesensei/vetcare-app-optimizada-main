import { useEffect, useState, useMemo } from "react";
import { 
  CalendarDays, Hospital, Package, Scissors, Search, Plus, 
  Trash2, Edit2, CheckCircle2, Clock, XCircle, AlertTriangle, Filter
} from "lucide-react";
import { toast } from "sonner";

import api from "../api/apiClient";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
import Spinner from "../components/ui/Spinner";

const MODULES = {
  appointments: {
    title: "Agenda y Citas",
    endpoint: "/appointments",
    name: "cita",
    icon: CalendarDays,
    description: "Citas, consultas programadas y agenda veterinaria diaria.",
    columns: [
      ["appointment_date", "Fecha"],
      ["appointment_time", "Hora"],
      ["patient_name", "Paciente"],
      ["owner_name", "Propietario"],
      ["type", "Tipo"],
      ["veterinarian", "Veterinario"],
      ["status", "Estado"],
    ],
    statuses: [
      "Programada",
      "Confirmada",
      "En consulta",
      "Completada",
      "Cancelada",
      "No asistió",
    ],
    canDelete: true,
  },
  inventory: {
    title: "Farmacia y Stock",
    endpoint: "/inventory",
    name: "producto",
    icon: Package,
    description: "Medicamentos, vacunas, lotes, caducidades y existencias.",
    columns: [
      ["name", "Producto"],
      ["category", "Categoría"],
      ["stock", "Stock actual"],
      ["minimum_stock", "Stock mín."],
      ["lot", "Lote"],
      ["expiry_date", "Caducidad"],
      ["sale_price", "PVP"],
    ],
    canDelete: true,
  },
  surgeries: {
    title: "Cirugías y Quirófano",
    endpoint: "/surgeries",
    name: "cirugía",
    icon: Scissors,
    description: "Programación quirúrgica, indicaciones y seguimiento de intervenciones.",
    columns: [
      ["surgery_date", "Fecha"],
      ["patient_name", "Paciente"],
      ["procedure", "Procedimiento"],
      ["surgeon", "Cirujano"],
      ["status", "Estado"],
    ],
    statuses: ["Programada", "En curso", "Completada", "Cancelada"],
    canDelete: true,
  },
  hospitalizations: {
    title: "Hospitalización e Ingresos",
    endpoint: "/hospitalizations",
    name: "hospitalización",
    icon: Hospital,
    description: "Pacientes hospitalizados, box/jaulas y plan terapéutico de enfermería.",
    columns: [
      ["admission_date", "Ingreso"],
      ["patient_name", "Paciente"],
      ["reason", "Motivo de ingreso"],
      ["cage", "Box / Jaula"],
      ["status", "Estado"],
    ],
    statuses: ["Hospitalizado", "Alta", "Traslado", "Fallecido"],
    canDelete: true,
  },
};

const FIELDS = {
  appointments: [
    ["patient_id", "Paciente *", "patient"],
    ["appointment_date", "Fecha de cita *", "date"],
    ["appointment_time", "Hora (HH:MM) *", "time"],
    ["type", "Tipo de cita", "text"],
    ["veterinarian", "Veterinario responsable", "text"],
    ["status", "Estado de la cita", "status"],
    ["reason", "Motivo de consulta", "text"],
    ["notes", "Notas adicionales", "textarea"],
  ],
  inventory: [
    ["name", "Nombre del producto / Medicamento *", "text"],
    ["category", "Categoría", "text"],
    ["presentation", "Presentación / Formato", "text"],
    ["stock", "Stock actual", "number"],
    ["minimum_stock", "Stock mínimo de alerta", "number"],
    ["lot", "Nº de Lote", "text"],
    ["expiry_date", "Fecha de Caducidad", "date"],
    ["supplier", "Laboratorio / Proveedor", "text"],
    ["purchase_price", "Precio de compra (€)", "number"],
    ["sale_price", "Precio de venta PVP (€)", "number"],
  ],
  surgeries: [
    ["patient_id", "Paciente *", "patient"],
    ["surgery_date", "Fecha de intervención *", "date"],
    ["procedure", "Procedimiento quirúrgico *", "text"],
    ["surgeon", "Cirujano responsable", "text"],
    ["status", "Estado", "status"],
    ["indication", "Indicación / Diagnóstico previo", "textarea"],
    ["anesthesia_protocol", "Protocolo anestésico previsto", "textarea"],
    ["postoperative_plan", "Plan postoperatorio", "textarea"],
  ],
  hospitalizations: [
    ["patient_id", "Paciente *", "patient"],
    ["admission_date", "Fecha de ingreso *", "date"],
    ["discharge_date", "Fecha de alta estimada / real", "date"],
    ["reason", "Motivo del ingreso *", "text"],
    ["cage", "Box o Jaula asignada", "text"],
    ["status", "Estado de hospitalización", "status"],
    ["treatment_plan", "Plan terapéutico / Fluidoterapia", "textarea"],
    ["nursing_notes", "Pautas y cuidados de enfermería", "textarea"],
  ],
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

function statusTone(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("completa") || value.includes("alta") || value.includes("confirm")) {
    return "success";
  }
  if (value.includes("cancel") || value.includes("fallec") || value.includes("no asist")) {
    return "danger";
  }
  if (value.includes("curso") || value.includes("consulta") || value.includes("hospital")) {
    return "info";
  }
  return "warning";
}

function emptyForm(type) {
  const firstStatus = MODULES[type]?.statuses?.[0];
  const defaults = {
    appointment_date: new Date().toISOString().slice(0, 10),
    appointment_time: "10:00",
    surgery_date: new Date().toISOString().slice(0, 10),
    admission_date: new Date().toISOString().slice(0, 10),
    veterinarian: "Dr. Saladin",
    surgeon: "Dr. Saladin",
    type: "Consulta",
    category: "Antibióticos",
  };
  return firstStatus ? { status: firstStatus, ...defaults } : { ...defaults };
}

function Field({ field, form, setForm, patients, statuses, type }) {
  const [key, label, kind] = field;
  const value = form[key] ?? "";

  const handlePatientChange = (patientId) => {
    const selected = patients.find((p) => String(p.id) === String(patientId));
    if (type === "appointments" && selected) {
      setForm({
        ...form,
        [key]: patientId,
        owner_name: selected.owner_name || "",
      });
    } else {
      setForm({ ...form, [key]: patientId });
    }
  };

  if (kind === "textarea") {
    return (
      <div className="md:col-span-2">
        <Label>{label}</Label>
        <textarea
          className={`${inputClass} min-h-[75px]`}
          value={value}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      </div>
    );
  }

  if (kind === "patient") {
    return (
      <div>
        <Label>{label}</Label>
        <select
          className={inputClass}
          value={value}
          onChange={(e) => handlePatientChange(e.target.value)}
        >
          <option value="">Seleccionar paciente...</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.species} ({p.owner_name})
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (kind === "status") {
    return (
      <div>
        <Label>{label}</Label>
        <select
          className={inputClass}
          value={value}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        >
          {(statuses || []).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <Label>{label}</Label>
      <Input
        type={kind}
        step={kind === "number" ? "0.01" : undefined}
        value={value}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </div>
  );
}

function cellValue(key, row) {
  if (key === "sale_price" || key === "purchase_price") {
    return `${Number(row[key] || 0).toFixed(2)} €`;
  }
  return row[key] ?? "—";
}

export default function EntityManager({ type }) {
  const module = MODULES[type];
  const fields = FIELDS[type];
  const [rows, setRows] = useState([]);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState(() => emptyForm(type));
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [listRes, patientsRes] = await Promise.all([
        api.get(module.endpoint),
        api.get("/patients").catch(() => ({ data: [] })),
      ]);
      setRows(Array.isArray(listRes.data) ? listRes.data : []);
      const patientData = patientsRes.data;
      setPatients(
        Array.isArray(patientData)
          ? patientData
          : Array.isArray(patientData?.patients)
          ? patientData.patients
          : []
      );
    } catch {
      setRows([]);
      setError("No se pudo cargar este módulo. Comprueba que el servidor esté activo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setForm(emptyForm(type));
    setEditing(null);
    setSearch("");
    setStatusFilter("all");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const searchLower = search.toLowerCase();
      const matchSearch =
        !search ||
        (r.patient_name || "").toLowerCase().includes(searchLower) ||
        (r.owner_name || "").toLowerCase().includes(searchLower) ||
        (r.name || "").toLowerCase().includes(searchLower) ||
        (r.procedure || "").toLowerCase().includes(searchLower) ||
        (r.reason || "").toLowerCase().includes(searchLower) ||
        (r.cage || "").toLowerCase().includes(searchLower) ||
        (r.lot || "").toLowerCase().includes(searchLower) ||
        (r.veterinarian || "").toLowerCase().includes(searchLower);

      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [rows, search, statusFilter]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`${module.endpoint}/${editing}`, form);
        toast.success(`${module.name.charAt(0).toUpperCase() + module.name.slice(1)} actualizada.`);
      } else {
        await api.post(module.endpoint, form);
        toast.success(`${module.name.charAt(0).toUpperCase() + module.name.slice(1)} creada.`);
      }
      setForm(emptyForm(type));
      setEditing(null);
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm(`¿Eliminar este registro de ${module.name}?`)) return;
    try {
      await api.delete(`${module.endpoint}/${id}`);
      toast.success("Registro eliminado.");
      await load();
    } catch {
      toast.error("Error al eliminar.");
    }
  };

  const Icon = module.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Icon size={22} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{module.title}</h1>
              <p className="text-sm text-slate-500">{module.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          {editing ? <Edit2 size={18} className="text-teal-600" /> : <Plus size={18} className="text-teal-600" />}
          {editing ? `Editar ${module.name}` : `Nuevo Registro de ${module.name}`}
        </h2>

        <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fields.map((field) => (
            <Field
              key={field[0]}
              field={field}
              form={form}
              setForm={setForm}
              patients={patients}
              statuses={module.statuses}
              type={type}
            />
          ))}

          <div className="md:col-span-3 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm(emptyForm(type));
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition disabled:opacity-50"
            >
              {saving ? "Guardando..." : editing ? "Guardar Cambios" : `Registrar ${module.name}`}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <Alert
          type="error"
          title="No se pudo cargar"
          action={
            <Button variant="outline" onClick={load}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Filtrar por paciente, nombre, motivo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>

        {module.statuses && (
          <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                statusFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todos
            </button>
            {module.statuses.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  statusFilter === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Spinner label={`Cargando ${module.title.toLowerCase()}…`} />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={Icon}
              title={`No se encontraron registros de ${module.name}`}
              description="Cuando crees el primer registro o coincida con la búsqueda, aparecerá en esta tabla."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  {module.columns.map(([key, label]) => (
                    <th key={key} className="p-4">
                      {label}
                    </th>
                  ))}
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition">
                    {module.columns.map(([key]) => {
                      const isLowStock =
                        type === "inventory" &&
                        key === "stock" &&
                        Number(row.stock) <= Number(row.minimum_stock);

                      return (
                        <td key={key} className="p-4 text-slate-900 font-medium">
                          {key === "status" ? (
                            <Badge tone={statusTone(row.status)}>
                              {row.status || "—"}
                            </Badge>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">
                              <AlertTriangle size={14} /> {cellValue(key, row)} (Bajo)
                            </span>
                          ) : (
                            cellValue(key, row)
                          )}
                        </td>
                      );
                    })}
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg font-semibold transition"
                          onClick={() => {
                            setEditing(row.id);
                            setForm(row);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
                        {module.canDelete && (
                          <button
                            type="button"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            onClick={() => remove(row.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
