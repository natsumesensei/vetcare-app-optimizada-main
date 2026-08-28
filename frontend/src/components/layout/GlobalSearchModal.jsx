import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  CalendarDays,
  FileText,
  Package,
  Scissors,
  Hospital,
  FlaskConical,
  X,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import api from "../../api/apiClient";
import { getCurrencySymbol } from "../../utils/currency";

export default function GlobalSearchModal({ isOpen, onClose, onOpenAI }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(false); // toggle
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(query.trim())}`);
        setResults(data);
      } catch (err) {
        console.error("Error en búsqueda global:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    (results?.patients?.length || 0) +
    (results?.appointments?.length || 0) +
    (results?.invoices?.length || 0) +
    (results?.inventory?.length || 0) +
    (results?.surgeries?.length || 0) +
    (results?.hospitalizations?.length || 0) +
    (results?.lab_orders?.length || 0);

  const handleSelect = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3 bg-slate-50/50">
          <Search className="text-teal-600 w-5 h-5 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-0 outline-none text-slate-800 text-base placeholder-slate-400"
            placeholder="Buscar por paciente, microchip, propietario, factura, medicamento..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
          {query && !loading && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs font-medium text-slate-400 hover:text-slate-700 bg-slate-200/60 rounded-md"
          >
            ESC
          </button>
        </div>

        {/* Categories Tab Bar */}
        {results && totalResults > 0 && (
          <div className="flex items-center gap-1 px-4 py-2 bg-slate-50 border-b border-slate-100 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                activeTab === "all"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/50"
              }`}
            >
              Todos ({totalResults})
            </button>
            {results.patients?.length > 0 && (
              <button
                onClick={() => setActiveTab("patients")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  activeTab === "patients"
                    ? "bg-teal-600 text-white"
                    : "text-slate-600 hover:bg-slate-200/50"
                }`}
              >
                Pacientes ({results.patients.length})
              </button>
            )}
            {results.appointments?.length > 0 && (
              <button
                onClick={() => setActiveTab("appointments")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  activeTab === "appointments"
                    ? "bg-teal-600 text-white"
                    : "text-slate-600 hover:bg-slate-200/50"
                }`}
              >
                Citas ({results.appointments.length})
              </button>
            )}
            {results.invoices?.length > 0 && (
              <button
                onClick={() => setActiveTab("invoices")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  activeTab === "invoices"
                    ? "bg-teal-600 text-white"
                    : "text-slate-600 hover:bg-slate-200/50"
                }`}
              >
                Facturas ({results.invoices.length})
              </button>
            )}
            {results.inventory?.length > 0 && (
              <button
                onClick={() => setActiveTab("inventory")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  activeTab === "inventory"
                    ? "bg-teal-600 text-white"
                    : "text-slate-600 hover:bg-slate-200/50"
                }`}
              >
                Farmacia ({results.inventory.length})
              </button>
            )}
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[55vh]">
          {/* Quick AI Action Banner */}
          {query.length > 2 && (
            <div
              onClick={() => {
                onClose();
                onOpenAI?.(`Analizar y buscar en el sistema: "${query}"`);
              }}
              className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-teal-50 to-sky-50 border border-teal-100/80 cursor-pointer hover:border-teal-300 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-sm">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-teal-900">
                    Consultar con Asistente VetCare AI
                  </div>
                  <div className="text-[11px] text-teal-700">
                    Preguntar a Gemini sobre "{query}"
                  </div>
                </div>
              </div>
              <ArrowRight size={16} className="text-teal-600 group-hover:translate-x-1 transition-transform" />
            </div>
          )}

          {!query && (
            <div className="text-center py-10 text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Búsqueda rápida en VetCare</p>
              <p className="text-xs text-slate-400 mt-1">
                Escribe el nombre de una mascota, teléfono de propietario, chip, cita o producto.
              </p>
            </div>
          )}

          {query && totalResults === 0 && !loading && (
            <div className="text-center py-10 text-slate-400">
              <p className="text-sm font-medium text-slate-600">No se encontraron resultados para "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">
                Comprueba la ortografía o intenta buscar por otro término.
              </p>
            </div>
          )}

          {/* Pacientes */}
          {(activeTab === "all" || activeTab === "patients") && results?.patients?.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users size={13} className="text-teal-600" /> Pacientes
              </div>
              <div className="space-y-1">
                {results.patients.map((p) => (
                  <div
                    key={`pat-${p.id}`}
                    onClick={() => handleSelect(`/patients/${p.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center">
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                          {p.name}
                          <span className="text-xs font-normal text-slate-500">
                            ({p.species} · {p.breed || "Mestizo"})
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Propietario: {p.owner_name} {p.owner_phone ? `· ${p.owner_phone}` : ""}
                          {p.microchip ? ` · Chip: ${p.microchip}` : ""}
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Citas */}
          {(activeTab === "all" || activeTab === "appointments") && results?.appointments?.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CalendarDays size={13} className="text-blue-600" /> Citas y Agenda
              </div>
              <div className="space-y-1">
                {results.appointments.map((a) => (
                  <div
                    key={`appt-${a.id}`}
                    onClick={() => handleSelect(a.patient_id ? `/patients/${a.patient_id}` : `/appointments`)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        {a.patient_name || a.owner_name} — {a.type || "Consulta"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {a.appointment_date} a las {a.appointment_time} · Estado: {a.status}
                      </div>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Facturas */}
          {(activeTab === "all" || activeTab === "invoices") && results?.invoices?.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText size={13} className="text-emerald-600" /> Facturación
              </div>
              <div className="space-y-1">
                {results.invoices.map((inv) => (
                  <div
                    key={`inv-${inv.id}`}
                    onClick={() => handleSelect(`/invoices`)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        {inv.invoice_number} — {inv.owner_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        Fecha: {inv.issue_date} · Paciente: {inv.patient_name || "N/A"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-800">
                        {inv.total} {getCurrencySymbol(inv.currency)}
                      </div>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          inv.status === "Pagada"
                            ? "bg-emerald-50 text-emerald-700"
                            : inv.status === "Pendiente"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inventario */}
          {(activeTab === "all" || activeTab === "inventory") && results?.inventory?.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Package size={13} className="text-purple-600" /> Farmacia y Stock
              </div>
              <div className="space-y-1">
                {results.inventory.map((item) => (
                  <div
                    key={`invt-${item.id}`}
                    onClick={() => handleSelect(`/inventory`)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{item.name}</div>
                      <div className="text-xs text-slate-500">
                        Categoría: {item.category || "General"} {item.lot ? `· Lote: ${item.lot}` : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-700">
                        {item.stock} {item.unit || "uds."}
                      </span>
                      {item.sale_price && (
                        <div className="text-[11px] text-slate-400">{item.sale_price} € PVP</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Laboratorio */}
          {(activeTab === "all" || activeTab === "lab_orders") && results?.lab_orders?.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FlaskConical size={13} className="text-indigo-600" /> Laboratorio
              </div>
              <div className="space-y-1">
                {results.lab_orders.map((l) => (
                  <div
                    key={`lab-${l.id}`}
                    onClick={() => handleSelect(`/reference-values`)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        {l.order_number} — {l.patient_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {l.panel || "General"} · {l.order_date}
                      </div>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between items-center">
          <span>Usa las flechas o ratón para seleccionar</span>
          <span>VetCare Global Search</span>
        </div>
      </div>
    </div>
  );
}
