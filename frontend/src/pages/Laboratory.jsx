import { useState, useEffect, useMemo } from "react";
import {
  FlaskConical,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Sparkles,
  Eye,
  Edit3,
  Trash2,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  PawPrint,
  X,
  FileText,
  Save,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useOutletContext } from "react-router-dom";
import api from "../api/apiClient";

const SAMPLE_TYPES = [
  "Sangre Total (EDTA)",
  "Suero Sanguíneo",
  "Plasma (Heparina/Citrato)",
  "Orina (Cistocentesis / Micción)",
  "Heces (Coproparasitológico)",
  "Líquido Cefalorraquídeo / Cavitario",
  "Raspado Cutáneo / Citología",
  "Biopsia Tisular",
];

const SPECIES_LIST = ["Perro", "Gato", "Caballo", "Conejo", "Ave"];
const CATEGORIES = ["Hematología", "Bioquímica", "Electrolitos", "Urianálisis", "Endocrinología"];

export default function Laboratory() {
  const { openAI } = useOutletContext() || {};
  const [activeTab, setActiveTab] = useState("orders"); // 'orders' | 'catalog'

  // Datos
  const [orders, setOrders] = useState([]);
  const [references, setReferences] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [catalogSpecies, setCatalogSpecies] = useState("Perro");
  const [catalogCategory, setCatalogCategory] = useState("all");

  // Modales
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [viewOrderModalOpen, setViewOrderModalOpen] = useState(false);
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);

  // Formulario de Orden
  const [orderForm, setOrderForm] = useState({
    patient_id: "",
    veterinarian: "Dr. Saladin",
    order_date: new Date().toISOString().slice(0, 10),
    sample_type: "Sangre Total (EDTA)",
    panel: "Hemograma Completo",
    status: "Completado",
    clinical_notes: "",
    interpretation: "",
    items: [],
  });

  // Formulario de Catálogo de Referencias
  const [refForm, setRefForm] = useState({
    species: "Perro",
    category: "Bioquímica",
    parameter_name: "",
    unit: "mg/dL",
    min_value: "",
    max_value: "",
    description: "",
  });
  const [editingRefId, setEditingRefId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordRes, refRes, tplRes, patRes] = await Promise.all([
        api.get("/lab-orders"),
        api.get("/reference-values"),
        api.get("/lab-orders/templates"),
        api.get("/patients"),
      ]);

      setOrders(ordRes.data || []);
      setReferences(refRes.data || []);
      setTemplates(tplRes.data || []);
      setPatients(patRes.data?.patients || patRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar datos del laboratorio.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Métricas
  const metrics = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "Pendiente" || o.status === "En proceso").length;
    const completed = orders.filter((o) => o.status === "Completado").length;
    const abnormal = orders.filter((o) => o.overall_status === "FUERA DE RANGO").length;
    return { total, pending, completed, abnormal };
  }, [orders]);

  // Filtrado de Órdenes
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        (o.order_number || "").toLowerCase().includes(orderSearch.toLowerCase()) ||
        (o.patient_name || "").toLowerCase().includes(orderSearch.toLowerCase()) ||
        (o.panel || "").toLowerCase().includes(orderSearch.toLowerCase());

      const matchStatus = orderStatus === "all" || o.status === orderStatus;
      return matchSearch && matchStatus;
    });
  }, [orders, orderSearch, orderStatus]);

  // Filtrado de Catálogo de Referencias
  const filteredReferences = useMemo(() => {
    return references.filter((r) => {
      const matchSpecies = !catalogSpecies || r.species === catalogSpecies;
      const matchCat = catalogCategory === "all" || r.category === catalogCategory;
      return matchSpecies && matchCat;
    });
  }, [references, catalogSpecies, catalogCategory]);

  // Carga de plantilla al seleccionar panel
  const handlePanelChange = (panelName, currentSpecies) => {
    const pat = patients.find((p) => String(p.id) === String(orderForm.patient_id));
    const species = currentSpecies || pat?.species || "Perro";

    const tpl = templates.find((t) => t.panel === panelName);
    if (!tpl) {
      setOrderForm((prev) => ({ ...prev, panel: panelName }));
      return;
    }

    // Buscar referencias para los parámetros del panel
    const newItems = tpl.default_parameters.map((paramName) => {
      const ref = references.find(
        (r) =>
          r.species.toLowerCase() === species.toLowerCase() &&
          r.parameter_name.toLowerCase() === paramName.toLowerCase()
      );

      return {
        parameter_name: paramName,
        category: ref?.category || "General",
        unit: ref?.unit || "",
        min_value: ref?.min_value ?? null,
        max_value: ref?.max_value ?? null,
        result_value: "",
        status: "Normal",
        notes: "",
      };
    });

    setOrderForm((prev) => ({
      ...prev,
      panel: panelName,
      sample_type: tpl.sample_type || prev.sample_type,
      items: newItems,
    }));
  };

  const handlePatientSelect = (patientId) => {
    const pat = patients.find((p) => String(p.id) === String(patientId));
    setOrderForm((prev) => ({ ...prev, patient_id: patientId }));
    if (pat && orderForm.panel) {
      handlePanelChange(orderForm.panel, pat.species);
    }
  };

  const updateItemValue = (idx, val) => {
    setOrderForm((prev) => {
      const updated = [...prev.items];
      const item = { ...updated[idx], result_value: val };

      // Calcular status automáticamente
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

  const addItemRow = () => {
    setOrderForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          parameter_name: "",
          category: "Bioquímica",
          unit: "",
          min_value: null,
          max_value: null,
          result_value: "",
          status: "Normal",
          notes: "",
        },
      ],
    }));
  };

  const removeItemRow = (idx) => {
    setOrderForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const handleOpenCreateOrder = () => {
    setEditingOrderId(null);
    setOrderForm({
      patient_id: patients[0]?.id || "",
      veterinarian: "Dr. Saladin",
      order_date: new Date().toISOString().slice(0, 10),
      sample_type: "Sangre Total (EDTA)",
      panel: "Hemograma Completo",
      status: "Completado",
      clinical_notes: "Control analítico rutinario y valoración prequirúrgica.",
      interpretation: "",
      items: [],
    });

    if (patients.length > 0) {
      handlePanelChange("Hemograma Completo", patients[0].species);
    }

    setOrderModalOpen(true);
  };

  const handleOpenEditOrder = async (order) => {
    try {
      const { data } = await api.get(`/lab-orders/${order.id}`);
      setEditingOrderId(order.id);
      setOrderForm({
        patient_id: data.patient_id,
        veterinarian: data.veterinarian || "Dr. Saladin",
        order_date: data.order_date,
        sample_type: data.sample_type,
        panel: data.panel,
        status: data.status,
        clinical_notes: data.clinical_notes || "",
        interpretation: data.interpretation || "",
        items: data.items || [],
      });
      setOrderModalOpen(true);
    } catch (err) {
      toast.error("Error al cargar orden para edición.");
    }
  };

  const handleViewOrder = async (order) => {
    try {
      const { data } = await api.get(`/lab-orders/${order.id}`);
      setSelectedOrder(data);
      setViewOrderModalOpen(true);
    } catch (err) {
      toast.error("Error al obtener detalle del análisis.");
    }
  };

  const handleSaveOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.patient_id) {
      toast.error("Selecciona un paciente para la orden analítica.");
      return;
    }
    if (orderForm.items.length === 0) {
      toast.error("Agrega al menos un parámetro o prueba a la orden.");
      return;
    }

    setSaving(true);
    try {
      if (editingOrderId) {
        await api.put(`/lab-orders/${editingOrderId}`, orderForm);
        toast.success("Orden de laboratorio actualizada.");
      } else {
        await api.post("/lab-orders", orderForm);
        toast.success("Nueva orden analítica creada con éxito.");
      }
      setOrderModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar la orden analítica.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!confirm("¿Deseas eliminar permanentemente esta orden de análisis clínico?")) return;
    try {
      await api.delete(`/lab-orders/${orderId}`);
      toast.success("Orden eliminada.");
      setViewOrderModalOpen(false);
      loadData();
    } catch (err) {
      toast.error("Error al eliminar orden.");
    }
  };

  const handleSaveReference = async (e) => {
    e.preventDefault();
    if (!refForm.parameter_name.trim()) {
      toast.error("El nombre del parámetro es requerido.");
      return;
    }

    try {
      if (editingRefId) {
        await api.put(`/reference-values/${editingRefId}`, refForm);
        toast.success("Valor de referencia actualizado.");
      } else {
        await api.post("/reference-values", refForm);
        toast.success("Parámetro agregado al catálogo de referencias.");
      }
      setCatalogModalOpen(false);
      loadData();
    } catch (err) {
      toast.error("Error al guardar parámetro.");
    }
  };

  const handleDeleteReference = async (refId) => {
    if (!confirm("¿Eliminar este parámetro del catálogo?")) return;
    try {
      await api.delete(`/reference-values/${refId}`);
      toast.success("Parámetro eliminado.");
      loadData();
    } catch (err) {
      toast.error("Error al eliminar parámetro.");
    }
  };

  const handleConsultAI = (order) => {
    if (!order) return;
    const itemsSummary = (order.items || [])
      .map((it) => `${it.parameter_name}: ${it.result_value} ${it.unit} (Ref: ${it.min_value}-${it.max_value}) [${it.status}]`)
      .join("\n");

    const promptText = `Interpreta estos resultados de laboratorio para el paciente ${order.patient_name} (${order.patient_species}, ${order.patient_breed}):\n\nPanel: ${order.panel}\nFecha: ${order.order_date}\n\nParámetros analizados:\n${itemsSummary}\n\nNotas clínicas: ${order.clinical_notes || "Sin notas"}\n\nPor favor proporciona: 1) Hallazgos anormales clave, 2) Diagnósticos diferenciales veterinarios, 3) Pruebas complementarias o pautas sugeridas.`;

    openAI?.(promptText);
  };

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-teal-600">
            Módulo Clínico y Diagnóstico
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Laboratorio y Análisis Clínicos
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gestión de perfiles analíticos, hemogramas, bioquímicas y catálogo de rangos biológicos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "orders" ? (
            <button
              onClick={handleOpenCreateOrder}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition-all"
            >
              <Plus size={18} />
              <span>Nuevo Análisis</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingRefId(null);
                setRefForm({
                  species: catalogSpecies,
                  category: "Bioquímica",
                  parameter_name: "",
                  unit: "mg/dL",
                  min_value: "",
                  max_value: "",
                  description: "",
                });
                setCatalogModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition-all"
            >
              <Plus size={18} />
              <span>Nuevo Parámetro</span>
            </button>
          )}
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-3 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "orders"
              ? "border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FlaskConical size={17} />
          <span>Órdenes y Resultados ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("catalog")}
          className={`px-4 py-3 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "catalog"
              ? "border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookOpen size={17} />
          <span>Catálogo de Valores de Referencia ({references.length})</span>
        </button>
      </div>

      {activeTab === "orders" ? (
        <>
          {/* Métricas de Órdenes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Total de Análisis
                </div>
                <div className="text-2xl font-black text-slate-900 mt-1">{metrics.total}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Órdenes procesadas</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <FlaskConical size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Pendientes / Muestra
                </div>
                <div className="text-2xl font-black text-amber-600 mt-1">{metrics.pending}</div>
                <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                  Esperando resultados
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Fuera de Rango
                </div>
                <div className="text-2xl font-black text-rose-600 mt-1">{metrics.abnormal}</div>
                <div className="text-[11px] text-rose-700 font-medium mt-0.5">
                  Con valores alterados
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Completados
                </div>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  {metrics.completed}
                </div>
                <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  Informes emitidos
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={24} />
              </div>
            </div>
          </div>

          {/* Barra de Filtros */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por Nº orden, paciente o panel..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Filter size={13} /> Estado:
              </span>
              {["all", "Completado", "Pendiente", "En proceso"].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    orderStatus === st
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st === "all" ? "Todos" : st}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de Órdenes */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Cargando análisis de laboratorio...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <FlaskConical className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <h3 className="text-base font-semibold text-slate-700">
                  No hay análisis registrados
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Crea una nueva orden de hemograma, bioquímica o urianálisis para tus pacientes.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 text-slate-500 text-xs font-semibold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Nº Orden</th>
                      <th className="px-4 py-3.5">Fecha</th>
                      <th className="px-4 py-3.5">Paciente</th>
                      <th className="px-4 py-3.5">Panel / Perfil</th>
                      <th className="px-4 py-3.5">Muestra</th>
                      <th className="px-4 py-3.5 text-center">Estado Analítico</th>
                      <th className="px-4 py-3.5 text-center">Estado Orden</th>
                      <th className="px-5 py-3.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredOrders.map((ord) => (
                      <tr
                        key={ord.id}
                        className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                        onClick={() => handleViewOrder(ord)}
                      >
                        <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2">
                          <FlaskConical size={16} className="text-teal-600" />
                          <span>{ord.order_number}</span>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-600 whitespace-nowrap">
                          {ord.order_date}
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{ord.patient_name}</span>
                            <span className="text-xs font-normal text-slate-500">
                              ({ord.patient_species})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            Tutor: {ord.owner_name}
                          </div>
                        </td>
                        <td className="px-4 py-4 font-semibold text-teal-800 text-xs">
                          {ord.panel || "General"}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500">{ord.sample_type}</td>
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              ord.overall_status === "FUERA DE RANGO"
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {ord.overall_status === "FUERA DE RANGO" ? (
                              <>
                                <AlertTriangle size={12} /> Fuera de Rango
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={12} /> Normal
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                            {ord.status}
                          </span>
                        </td>
                        <td
                          className="px-5 py-4 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleViewOrder(ord)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                              title="Ver informe completo"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenEditOrder(ord)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Editar orden"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(ord.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Eliminar orden"
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
        </>
      ) : (
        /* CATÁLOGO DE VALORES DE REFERENCIA */
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Selector de Especie */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Especie:
              </span>
              {SPECIES_LIST.map((sp) => (
                <button
                  key={sp}
                  onClick={() => setCatalogSpecies(sp)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    catalogSpecies === sp
                      ? "bg-teal-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {sp}
                </button>
              ))}
            </div>

            {/* Selector de Categoría */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-400">Categoría:</span>
              <select
                value={catalogCategory}
                onChange={(e) => setCatalogCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-teal-500"
              >
                <option value="all">Todas las categorías</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla de Catálogo */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-slate-500 text-xs font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Parámetro Biológico</th>
                    <th className="px-4 py-3.5">Categoría</th>
                    <th className="px-4 py-3.5">Unidad</th>
                    <th className="px-4 py-3.5 text-center">Rango Mínimo</th>
                    <th className="px-4 py-3.5 text-center">Rango Máximo</th>
                    <th className="px-4 py-3.5">Descripción Clínica</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredReferences.map((ref) => (
                    <tr key={ref.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{ref.parameter_name}</td>
                      <td className="px-4 py-3.5 text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {ref.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{ref.unit}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                        {ref.min_value ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                        {ref.max_value ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">{ref.description || "—"}</td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingRefId(ref.id);
                              setRefForm({
                                species: ref.species,
                                category: ref.category,
                                parameter_name: ref.parameter_name,
                                unit: ref.unit,
                                min_value: ref.min_value ?? "",
                                max_value: ref.max_value ?? "",
                                description: ref.description || "",
                              });
                              setCatalogModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteReference(ref.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR ORDEN ANALÍTICA */}
      {orderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 my-8 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">
                  {editingOrderId ? "Editar Orden de Laboratorio" : "Nuevo Registro de Análisis Clínico"}
                </h3>
                <p className="text-xs text-slate-300">
                  Introduce los valores analizados y el sistema contrastará automáticamente los rangos biológicos.
                </p>
              </div>
              <button
                onClick={() => setOrderModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Paciente y Muestra */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Paciente *
                  </label>
                  <select
                    required
                    value={orderForm.patient_id}
                    onChange={(e) => handlePatientSelect(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-500"
                  >
                    <option value="">-- Seleccionar Paciente --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.species}) - Tutor: {p.owner_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Panel / Plantilla Predefinida
                  </label>
                  <select
                    value={orderForm.panel}
                    onChange={(e) => handlePanelChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-teal-800 outline-none focus:border-teal-500"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.panel}>
                        {t.panel} ({t.category})
                      </option>
                    ))}
                    <option value="Personalizado">Panel Personalizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tipo de Muestra
                  </label>
                  <select
                    value={orderForm.sample_type}
                    onChange={(e) => setOrderForm({ ...orderForm, sample_type: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-500"
                  >
                    {SAMPLE_TYPES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Fecha de Toma / Procesamiento *
                  </label>
                  <input
                    type="date"
                    required
                    value={orderForm.order_date}
                    onChange={(e) => setOrderForm({ ...orderForm, order_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Veterinario Responsable
                  </label>
                  <input
                    type="text"
                    value={orderForm.veterinarian}
                    onChange={(e) => setOrderForm({ ...orderForm, veterinarian: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Estado de la Orden
                  </label>
                  <select
                    value={orderForm.status}
                    onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
                  >
                    <option value="Completado">Completado</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="En proceso">En proceso</option>
                  </select>
                </div>
              </div>

              {/* Tabla de Parámetros */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FlaskConical size={14} className="text-teal-600" /> Resultados de Pruebas ({orderForm.items.length})
                  </span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1"
                  >
                    <Plus size={14} /> Añadir Parámetro
                  </button>
                </div>

                <div className="space-y-2">
                  {orderForm.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 items-center"
                    >
                      <div className="col-span-12 sm:col-span-4">
                        <input
                          type="text"
                          required
                          placeholder="Nombre del parámetro (ej: Leucocitos, Urea)"
                          value={item.parameter_name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOrderForm((prev) => {
                              const updated = [...prev.items];
                              updated[idx].parameter_name = val;
                              return { ...prev, items: updated };
                            });
                          }}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-teal-500"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Resultado"
                          value={item.result_value}
                          onChange={(e) => updateItemValue(idx, e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-black text-slate-900 outline-none focus:border-teal-500 text-center"
                        />
                      </div>

                      <div className="col-span-3 sm:col-span-1">
                        <input
                          type="text"
                          placeholder="Unidad"
                          value={item.unit || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOrderForm((prev) => {
                              const updated = [...prev.items];
                              updated[idx].unit = val;
                              return { ...prev, items: updated };
                            });
                          }}
                          className="w-full rounded-lg border border-slate-200 bg-white px-1.5 py-1.5 text-xs font-mono text-slate-600 outline-none text-center"
                        />
                      </div>

                      <div className="col-span-5 sm:col-span-2 text-center text-xs text-slate-500 font-medium">
                        Ref: {item.min_value ?? "—"} - {item.max_value ?? "—"}
                      </div>

                      <div className="col-span-6 sm:col-span-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
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

                      <div className="col-span-6 sm:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notas Clínicas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Motivo / Observaciones Clínicas
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Sintomatología, antecedentes o motivo del análisis..."
                    value={orderForm.clinical_notes}
                    onChange={(e) => setOrderForm({ ...orderForm, clinical_notes: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Conclusiones / Interpretación Veterinaria
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Conclusión diagnóstica, pauta a seguir o comentarios al tutor..."
                    value={orderForm.interpretation}
                    onChange={(e) => setOrderForm({ ...orderForm, interpretation: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setOrderModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar Orden Analítica"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VER INFORME DE LABORATORIO / IMPRIMIR */}
      {viewOrderModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 my-8 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Barra superior de acciones */}
            <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <FlaskConical size={18} className="text-teal-400" />
                <span className="text-sm font-bold">{selectedOrder.order_number}</span>
                <span className="text-xs text-slate-400">· {selectedOrder.panel}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleConsultAI(selectedOrder)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white text-xs font-bold shadow-xs transition-all"
                >
                  <Sparkles size={14} className="text-teal-200" /> Interpretar con IA
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Printer size={15} /> Imprimir
                </button>
                <button
                  onClick={() => setViewOrderModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Documento A4 Imprimible */}
            <div className="flex-1 overflow-y-auto p-8 bg-white text-slate-900 space-y-6 printable-document">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    VetCare Clínica Dr. Saladin
                  </h2>
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
                  <div className="text-xl font-black text-slate-900 mt-0.5">
                    {selectedOrder.order_number}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Fecha: <span className="font-semibold text-slate-800">{selectedOrder.order_date}</span>
                  </div>
                </div>
              </div>

              {/* Paciente y Muestra */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <div className="font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Paciente & Tutor
                  </div>
                  <div className="font-bold text-sm text-slate-900">{selectedOrder.patient_name}</div>
                  <div className="text-slate-600">
                    {selectedOrder.patient_species} · {selectedOrder.patient_breed || "Mestizo"}
                  </div>
                  <div className="text-slate-600">Tutor: {selectedOrder.owner_name}</div>
                </div>
                <div>
                  <div className="font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Detalles de Muestra
                  </div>
                  <div className="font-bold text-slate-800">{selectedOrder.panel}</div>
                  <div className="text-slate-600">Tipo: {selectedOrder.sample_type}</div>
                  <div className="text-slate-600">Veterinario: {selectedOrder.veterinarian || "Dr. Saladin"}</div>
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
                  {selectedOrder.items?.map((it, idx) => (
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
                {selectedOrder.clinical_notes && (
                  <div>
                    <span className="font-bold text-slate-800">Notas de Exploración:</span>
                    <p className="text-slate-600 mt-0.5">{selectedOrder.clinical_notes}</p>
                  </div>
                )}
                {selectedOrder.interpretation && (
                  <div>
                    <span className="font-bold text-slate-800">Interpretación Clínica:</span>
                    <p className="text-slate-600 mt-0.5">{selectedOrder.interpretation}</p>
                  </div>
                )}

                <div className="pt-8 flex justify-between items-end">
                  <div className="text-[10px] text-slate-400 max-w-xs">
                    Informe emitido conforme a las normas de buenas prácticas de laboratorio veterinario.
                  </div>
                  <div className="text-center">
                    <div className="w-48 border-b border-slate-400 mb-1" />
                    <div className="text-xs font-bold text-slate-800">
                      {selectedOrder.veterinarian || "Dr. Saladin"}
                    </div>
                    <div className="text-[10px] text-slate-400">Veterinario Colegiado</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR PARÁMETRO EN CATÁLOGO */}
      {catalogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingRefId ? "Editar Parámetro de Referencia" : "Nuevo Parámetro en Catálogo"}
              </h3>
              <button
                onClick={() => setCatalogModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveReference} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Especie *</label>
                <select
                  value={refForm.species}
                  onChange={(e) => setRefForm({ ...refForm, species: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
                >
                  {SPECIES_LIST.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Categoría</label>
                <select
                  value={refForm.category}
                  onChange={(e) => setRefForm({ ...refForm, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nombre del Parámetro *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Glucosa, Creatinina, Hematocrito"
                  value={refForm.parameter_name}
                  onChange={(e) => setRefForm({ ...refForm, parameter_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mínimo</label>
                  <input
                    type="number"
                    step="any"
                    value={refForm.min_value}
                    onChange={(e) => setRefForm({ ...refForm, min_value: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-800 outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Máximo</label>
                  <input
                    type="number"
                    step="any"
                    value={refForm.max_value}
                    onChange={(e) => setRefForm({ ...refForm, max_value: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-800 outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Unidad</label>
                  <input
                    type="text"
                    placeholder="mg/dL, %"
                    value={refForm.unit}
                    onChange={(e) => setRefForm({ ...refForm, unit: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-800 outline-none text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Descripción o Significado Clínico
                </label>
                <textarea
                  rows={2}
                  value={refForm.description}
                  onChange={(e) => setRefForm({ ...refForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCatalogModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
