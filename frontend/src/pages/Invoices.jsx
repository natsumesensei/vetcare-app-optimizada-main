import { useEffect, useState, useMemo } from "react";
import {
  FileText,
  Plus,
  Search,
  Printer,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  Ban,
  ArrowDownRight,
  TrendingUp,
  X,
  CreditCard,
  Building,
  User,
  PawPrint,
  Percent,
  Eye,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import api from "../api/apiClient";
import { CURRENCIES, getCurrencySymbol } from "../utils/currency";

const PAYMENT_METHODS = [
  "Tarjeta de Crédito/Débito",
  "Efectivo",
  "Transferencia Bancaria",
  "Bizum",
  "Financiación",
  "Pendiente de Pago",
];

const TAX_RATES = [
  { label: "21% (IVA General Veterinario)", value: 21 },
  { label: "10% (IVA Reducido Farmacia)", value: 10 },
  { label: "4% (IVA Superreducido)", value: 4 },
  { label: "0% (Exento)", value: 0 },
];

const EMPTY_ITEM = {
  description: "",
  quantity: 1,
  unit_price: 0,
  tax_rate: 21,
  discount_rate: 0,
};

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [clinicSettings, setClinicSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modales
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Formulario
  const [form, setForm] = useState({
    patient_id: "",
    owner_name: "",
    tax_id: "",
    owner_address: "",
    owner_phone: "",
    owner_email: "",
    patient_species: "",
    patient_breed: "",
    patient_microchip: "",
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: "",
    payment_method: "Tarjeta de Crédito/Débito",
    currency: "EUR",
    status: "Pagada",
    discount_rate: 0,
    notes: "Gracias por confiar en el cuidado de su mascota.",
    items: [{ ...EMPTY_ITEM, description: "Consulta médica general", unit_price: 45.0 }],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, patRes, setRes] = await Promise.all([
        api.get("/invoices"),
        api.get("/patients"),
        api.get("/settings"),
      ]);
      setInvoices(invRes.data || []);
      setPatients(patRes.data?.patients || patRes.data || []);
      setClinicSettings(setRes.data?.settings || {});
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar datos de facturación.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Cálculos dinámicos en formulario
  const { subtotal, totalDiscount, totalTax, grandTotal } = useMemo(() => {
    let rawSubtotal = 0;
    let rawTax = 0;

    form.items.forEach((item) => {
      const q = Number(item.quantity || 1);
      const p = Number(item.unit_price || 0);
      const lineDisc = Number(item.discount_rate || 0);
      const base = q * p * (1 - lineDisc / 100);
      const tax = (base * Number(item.tax_rate || 0)) / 100;
      rawSubtotal += base;
      rawTax += tax;
    });

    const globalDiscRate = Number(form.discount_rate || 0);
    const globalDiscAmount = (rawSubtotal * globalDiscRate) / 100;
    const finalSubtotal = rawSubtotal - globalDiscAmount;
    const finalTax = rawTax * (1 - globalDiscRate / 100);
    const finalTotal = finalSubtotal + finalTax;

    return {
      subtotal: finalSubtotal,
      totalDiscount: globalDiscAmount,
      totalTax: finalTax,
      grandTotal: finalTotal,
    };
  }, [form.items, form.discount_rate]);

  // Filtrado de facturas
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        (inv.invoice_number || "").toLowerCase().includes(search.toLowerCase()) ||
        (inv.owner_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (inv.patient_name || "").toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, search, statusFilter]);

  // Métricas
  const metrics = useMemo(() => {
    const totalRev = invoices
      .filter((i) => i.status !== "Anulada")
      .reduce((sum, i) => sum + Number(i.total || 0), 0);
    const paidCount = invoices.filter((i) => i.status === "Pagada").length;
    const pendingCount = invoices.filter((i) => i.status === "Pendiente").length;
    const pendingAmount = invoices
      .filter((i) => i.status === "Pendiente")
      .reduce((sum, i) => sum + Number(i.total || 0), 0);

    return { totalRev, paidCount, pendingCount, pendingAmount };
  }, [invoices]);

  const handlePatientSelect = (patientId) => {
    const p = patients.find((pat) => String(pat.id) === String(patientId));
    setForm((prev) => ({
      ...prev,
      patient_id: patientId,
      owner_name: p?.owner_name || prev.owner_name,
      owner_phone: p?.owner_phone || prev.owner_phone,
      owner_email: p?.owner_email || prev.owner_email,
      owner_address: p?.address || prev.owner_address,
      patient_species: p?.species || "",
      patient_breed: p?.breed || "",
      patient_microchip: p?.microchip || "",
    }));
  };

  const addItemRow = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...EMPTY_ITEM }],
    }));
  };

  const removeItemRow = (idx) => {
    if (form.items.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const updateItem = (idx, field, val) => {
    setForm((prev) => {
      const newItems = [...prev.items];
      newItems[idx] = { ...newItems[idx], [field]: val };
      return { ...prev, items: newItems };
    });
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      patient_id: "",
      owner_name: "",
      tax_id: "",
      owner_address: "",
      owner_phone: "",
      owner_email: "",
      patient_species: "",
      patient_breed: "",
      patient_microchip: "",
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: "",
      payment_method: "Tarjeta de Crédito/Débito",
      currency: clinicSettings.currency || "EUR",
      status: "Pagada",
      discount_rate: 0,
      notes: clinicSettings.payment_terms || "Pago al contado. Factura oficial simplificada.",
      items: [{ ...EMPTY_ITEM, description: "Consulta clínica veterinaria", unit_price: 45.0 }],
    });
    setFormModalOpen(true);
  };

  const handleOpenEdit = async (inv) => {
    try {
      const { data } = await api.get(`/invoices/${inv.id}`);
      setEditingId(inv.id);
      setForm({
        patient_id: data.patient_id || "",
        owner_name: data.owner_name || "",
        tax_id: data.tax_id || "",
        owner_address: data.owner_address || "",
        owner_phone: data.owner_phone || "",
        owner_email: data.owner_email || "",
        patient_species: data.patient_species || "",
        patient_breed: data.patient_breed || "",
        patient_microchip: data.patient_microchip || "",
        issue_date: data.issue_date || new Date().toISOString().slice(0, 10),
        due_date: data.due_date || "",
        payment_method: data.payment_method || "Tarjeta de Crédito/Débito",
        currency: data.currency || "EUR",
        status: data.status || "Pagada",
        discount_rate: data.discount_rate || 0,
        notes: data.notes || "",
        items: data.items?.length > 0 ? data.items : [{ ...EMPTY_ITEM }],
      });
      setFormModalOpen(true);
    } catch (err) {
      toast.error("Error al cargar detalles de la factura.");
    }
  };

  const handleViewInvoice = async (inv) => {
    try {
      const { data } = await api.get(`/invoices/${inv.id}`);
      setSelectedInvoice(data);
      setDetailModalOpen(true);
    } catch (err) {
      toast.error("Error al obtener factura.");
    }
  };

  const handleSaveInvoice = async (e) => {
    e.preventDefault();
    if (!form.owner_name.trim()) {
      toast.error("El nombre del cliente/propietario es obligatorio.");
      return;
    }
    if (form.items.some((it) => !it.description.trim() || Number(it.unit_price) < 0)) {
      toast.error("Revisa las líneas: todos los conceptos deben tener descripción y precio válido.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/invoices/${editingId}`, form);
        toast.success("Factura actualizada correctamente.");
      } else {
        await api.post("/invoices", form);
        toast.success("Factura emitida y registrada exitosamente.");
      }
      setFormModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar la factura.");
    } finally {
      setSaving(false);
    }
  };

  const handleVoidInvoice = async (invId) => {
    if (!confirm("¿Deseas anular esta factura? Su estado pasará a Anulada y no sumará a los ingresos.")) return;
    try {
      await api.patch(`/invoices/${invId}/status`, { status: "Anulada" });
      toast.success("Factura marcada como Anulada.");
      loadData();
      if (detailModalOpen && selectedInvoice?.id === invId) {
        setSelectedInvoice((prev) => ({ ...prev, status: "Anulada" }));
      }
    } catch (err) {
      toast.error("Error al anular la factura.");
    }
  };

  const handleDeleteInvoice = async (invId) => {
    if (!confirm("¿Estás seguro de eliminar permanentemente este registro de factura?")) return;
    try {
      await api.delete(`/invoices/${invId}`);
      toast.success("Factura eliminada.");
      setDetailModalOpen(false);
      loadData();
    } catch (err) {
      toast.error("Error al eliminar la factura.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-teal-600">
            Módulo de Facturación y Finanzas
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Facturas e Ingresos
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Emisión de facturas fiscales, control de pagos, divisas y presupuestos.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition-all"
        >
          <Plus size={18} />
          <span>Nueva Factura</span>
        </button>
      </div>

      {/* Métricas Financieras */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Facturación Total
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {metrics.totalRev.toLocaleString("es-ES", { minimumFractionDigits: 2 })} {getCurrencySymbol(clinicSettings.currency)}
            </div>
            <div className="text-[11px] text-teal-600 font-semibold mt-0.5 flex items-center gap-1">
              <TrendingUp size={12} /> {invoices.length} comprobantes emitidos
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            {getCurrencySymbol(clinicSettings.currency)}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Facturas Cobradas
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {metrics.paidCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Estado: Pagadas y liquidadas
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Pendientes de Cobro
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {metrics.pendingCount}
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              {metrics.pendingAmount.toLocaleString("es-ES", { minimumFractionDigits: 2 })} {getCurrencySymbol(clinicSettings.currency)} por cobrar
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Moneda Principal
            </div>
            <div className="text-xl font-bold text-slate-800 mt-1">
              {clinicSettings.currency || "EUR"} ({getCurrencySymbol(clinicSettings.currency)})
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              IVA estándar: {clinicSettings.tax_rate ?? 21}%
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <CreditCard size={24} />
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por Nº factura, cliente o paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <Filter size={13} /> Estado:
          </span>
          {["all", "Pagada", "Pendiente", "Borrador", "Anulada"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "all" ? "Todos" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Facturas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Cargando facturas...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="text-base font-semibold text-slate-700">No hay facturas registradas</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== "all"
                ? "No hay resultados para los filtros seleccionados."
                : "Comienza emitiendo la primera factura para un paciente o tutor."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-xs font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Nº Factura</th>
                  <th className="px-4 py-3.5">Fecha</th>
                  <th className="px-4 py-3.5">Cliente / Propietario</th>
                  <th className="px-4 py-3.5">Paciente</th>
                  <th className="px-4 py-3.5">Método de Pago</th>
                  <th className="px-4 py-3.5 text-right">Total</th>
                  <th className="px-4 py-3.5 text-center">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                    onClick={() => handleViewInvoice(inv)}
                  >
                    <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2">
                      <FileText size={16} className="text-teal-600" />
                      <span>{inv.invoice_number}</span>
                    </td>
                    <td className="px-4 py-4 text-slate-600 text-xs font-medium whitespace-nowrap">
                      {inv.issue_date}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-800">
                      {inv.owner_name}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600">
                      {inv.patient_name ? (
                        <span className="inline-flex items-center gap-1 font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                          <PawPrint size={12} /> {inv.patient_name}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">
                      {inv.payment_method || "Tarjeta"}
                    </td>
                    <td className="px-4 py-4 text-right font-black text-slate-900 whitespace-nowrap">
                      {Number(inv.total || 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })}{" "}
                      <span className="text-xs font-semibold text-slate-500">
                        {getCurrencySymbol(inv.currency)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${
                          inv.status === "Pagada"
                            ? "bg-emerald-100 text-emerald-800"
                            : inv.status === "Pendiente"
                            ? "bg-amber-100 text-amber-800"
                            : inv.status === "Anulada"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewInvoice(inv)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                          title="Ver detalle / Imprimir"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(inv)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Editar factura"
                        >
                          <Edit3 size={16} />
                        </button>
                        {inv.status !== "Anulada" && (
                          <button
                            onClick={() => handleVoidInvoice(inv.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Anular factura"
                          >
                            <Ban size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Eliminar registro"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CREAR / EDITAR FACTURA */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 my-8 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">
                  {editingId ? "Editar Factura" : "Emitir Nueva Factura"}
                </h3>
                <p className="text-xs text-slate-300">
                  Completa los datos del cliente, paciente y conceptos veterinarios.
                </p>
              </div>
              <button
                onClick={() => setFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSaveInvoice} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Sección 1: Paciente y Propietario */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={14} className="text-teal-600" /> Datos del Cliente y Paciente
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Vincular a Paciente
                    </label>
                    <select
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-500"
                      value={form.patient_id}
                      onChange={(e) => handlePatientSelect(e.target.value)}
                    >
                      <option value="">-- Seleccionar Paciente --</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.species}) - Propietario: {p.owner_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Nombre Cliente / Razón Social *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nombre y apellidos"
                      value={form.owner_name}
                      onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      NIF / CIF / DNI
                    </label>
                    <input
                      type="text"
                      placeholder="Identificación fiscal"
                      value={form.tax_id}
                      onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      placeholder="Teléfono de contacto"
                      value={form.owner_phone}
                      onChange={(e) => setForm({ ...form, owner_phone: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="email@ejemplo.com"
                      value={form.owner_email}
                      onChange={(e) => setForm({ ...form, owner_email: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      placeholder="Dirección fiscal / residencia"
                      value={form.owner_address}
                      onChange={(e) => setForm({ ...form, owner_address: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Configuración de Fecha, Divisa y Pago */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Fecha de Emisión *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.issue_date}
                    onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Moneda / Divisa
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-500"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Forma de Pago
                  </label>
                  <select
                    value={form.payment_method}
                    onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-500"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Estado
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
                  >
                    <option value="Pagada">Pagada</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Borrador">Borrador</option>
                    <option value="Anulada">Anulada</option>
                  </select>
                </div>
              </div>

              {/* Sección 3: Tabla de Conceptos / Líneas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <FileText size={14} className="text-teal-600" /> Líneas de Factura
                  </span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1"
                  >
                    <Plus size={14} /> Añadir Concepto
                  </button>
                </div>

                <div className="space-y-2">
                  {form.items.map((item, idx) => {
                    const q = Number(item.quantity || 1);
                    const p = Number(item.unit_price || 0);
                    const d = Number(item.discount_rate || 0);
                    const t = Number(item.tax_rate || 0);
                    const lineTotal = q * p * (1 - d / 100) * (1 + t / 100);

                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 items-center"
                      >
                        <div className="col-span-12 sm:col-span-4">
                          <input
                            type="text"
                            required
                            placeholder="Descripción del servicio o producto"
                            value={item.description}
                            onChange={(e) => updateItem(idx, "description", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-teal-500"
                          />
                        </div>

                        <div className="col-span-3 sm:col-span-1">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="Cant."
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-teal-500 text-center"
                          />
                        </div>

                        <div className="col-span-3 sm:col-span-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Precio base"
                            value={item.unit_price}
                            onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-teal-500 text-right"
                          />
                        </div>

                        <div className="col-span-3 sm:col-span-2">
                          <select
                            value={item.tax_rate}
                            onChange={(e) => updateItem(idx, "tax_rate", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-1.5 py-1.5 text-xs text-slate-800 outline-none focus:border-teal-500"
                          >
                            {TAX_RATES.map((tr) => (
                              <option key={tr.value} value={tr.value}>
                                {tr.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-2 sm:col-span-2 text-right font-bold text-xs text-slate-900">
                          {lineTotal.toFixed(2)} {getCurrencySymbol(form.currency)}
                        </div>

                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            disabled={form.items.length <= 1}
                            className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sección 4: Descuento global, Notas y Totales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Notas y Condiciones de Pago
                  </label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Subtotal Base Imponible:</span>
                    <span className="font-semibold">
                      {subtotal.toFixed(2)} {getCurrencySymbol(form.currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Percent size={12} /> Descuento General (%):
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.discount_rate}
                      onChange={(e) => setForm({ ...form, discount_rate: e.target.value })}
                      className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs text-right"
                    />
                  </div>

                  <div className="flex justify-between text-xs text-slate-600">
                    <span>IVA Total:</span>
                    <span className="font-semibold">
                      {totalTax.toFixed(2)} {getCurrencySymbol(form.currency)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-extrabold text-slate-900">
                    <span>TOTAL FACTURA:</span>
                    <span className="text-teal-700">
                      {grandTotal.toFixed(2)} {getCurrencySymbol(form.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm disabled:opacity-50"
                >
                  {saving ? "Guardando..." : editingId ? "Guardar Cambios" : "Emitir Factura"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE VISTA PREVIA IMPRESIÓN */}
      {detailModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 my-8 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Actions Bar (hidden on print) */}
            <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  Factura Oficial
                </span>
                <span className="text-sm font-bold text-white">
                  {selectedInvoice.invoice_number}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Printer size={15} /> Imprimir / PDF
                </button>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Plantilla A4 de Factura Imprimible */}
            <div className="flex-1 overflow-y-auto p-8 bg-white text-slate-900 space-y-6 printable-document">
              {/* Header Clínica */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {clinicSettings.clinic_name || "VetCare Clínica Dr. Saladin"}
                  </h2>
                  <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                    <p>{clinicSettings.address || "Calle Mayor 45, 28013 Madrid"}</p>
                    <p>
                      NIF/CIF: <span className="font-semibold">{clinicSettings.nif || "B-12345678"}</span> · Colegiado: <span className="font-semibold">{clinicSettings.license_number || "COL-MAD-4521"}</span>
                    </p>
                    <p>
                      Tel: {clinicSettings.phone || "+34 912 345 678"} · Email: {clinicSettings.email || "contacto@vetcare-saladin.es"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                    FACTURA SIMPLIFICADA
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">
                    {selectedInvoice.invoice_number}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Fecha: <span className="font-semibold text-slate-800">{selectedInvoice.issue_date}</span>
                  </div>
                  <span
                    className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedInvoice.status === "Pagada"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {selectedInvoice.status}
                  </span>
                </div>
              </div>

              {/* Datos del Cliente y Mascota */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <div className="font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Datos del Cliente / Pagador
                  </div>
                  <div className="font-bold text-sm text-slate-900">
                    {selectedInvoice.owner_name}
                  </div>
                  {selectedInvoice.tax_id && (
                    <div className="text-slate-600">NIF/DNI: {selectedInvoice.tax_id}</div>
                  )}
                  {selectedInvoice.owner_address && (
                    <div className="text-slate-600">{selectedInvoice.owner_address}</div>
                  )}
                  {selectedInvoice.owner_phone && (
                    <div className="text-slate-600">Tel: {selectedInvoice.owner_phone}</div>
                  )}
                </div>

                <div>
                  <div className="font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Paciente Asociado
                  </div>
                  {selectedInvoice.patient_name ? (
                    <>
                      <div className="font-bold text-sm text-slate-900">
                        {selectedInvoice.patient_name}
                      </div>
                      <div className="text-slate-600">
                        Especie: {selectedInvoice.patient_species || "Mascota"} · Raza: {selectedInvoice.patient_breed || "Mestizo"}
                      </div>
                      {selectedInvoice.patient_microchip && (
                        <div className="text-slate-600">
                          Microchip: {selectedInvoice.patient_microchip}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-slate-400 italic">Servicios veterinarios generales</div>
                  )}
                </div>
              </div>

              {/* Desglose de Conceptos */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="py-2.5">Descripción del Servicio / Medicamento</th>
                    <th className="py-2.5 text-center">Cant.</th>
                    <th className="py-2.5 text-right">Precio Unit.</th>
                    <th className="py-2.5 text-center">IVA</th>
                    <th className="py-2.5 text-right">Importe Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {selectedInvoice.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-3 font-semibold text-slate-900">{it.description}</td>
                      <td className="py-3 text-center">{it.quantity}</td>
                      <td className="py-3 text-right">
                        {Number(it.unit_price).toFixed(2)} {getCurrencySymbol(selectedInvoice.currency)}
                      </td>
                      <td className="py-3 text-center text-slate-500">{it.tax_rate}%</td>
                      <td className="py-3 text-right font-bold text-slate-900">
                        {Number(it.total).toFixed(2)} {getCurrencySymbol(selectedInvoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Cuadro de Totales */}
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <div className="w-64 space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span>Base Imponible:</span>
                    <span className="font-semibold">
                      {Number(selectedInvoice.subtotal || 0).toFixed(2)} {getCurrencySymbol(selectedInvoice.currency)}
                    </span>
                  </div>
                  {Number(selectedInvoice.discount_rate) > 0 && (
                    <div className="flex justify-between text-teal-700">
                      <span>Descuento ({selectedInvoice.discount_rate}%):</span>
                      <span className="font-semibold">
                        -{Number(selectedInvoice.discount_amount || 0).toFixed(2)} {getCurrencySymbol(selectedInvoice.currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Impuestos (IVA):</span>
                    <span className="font-semibold">
                      {Number(selectedInvoice.tax || 0).toFixed(2)} {getCurrencySymbol(selectedInvoice.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-900 text-sm font-black text-slate-900">
                    <span>TOTAL:</span>
                    <span>
                      {Number(selectedInvoice.total || 0).toFixed(2)} {getCurrencySymbol(selectedInvoice.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Método de Pago y Notas Legales */}
              <div className="pt-6 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <p>
                  <span className="font-bold text-slate-700">Método de pago:</span>{" "}
                  {selectedInvoice.payment_method}
                </p>
                {selectedInvoice.notes && (
                  <p>
                    <span className="font-bold text-slate-700">Observaciones:</span>{" "}
                    {selectedInvoice.notes}
                  </p>
                )}
                <p className="text-[10px] text-slate-400 pt-3">
                  {clinicSettings.legal_notes ||
                    "Centro Veterinario Autorizado. Factura emitida según la legislación fiscal vigente."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
