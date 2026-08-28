import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Calendar,
  ShieldAlert,
  Package,
  FileText,
  Hospital,
  FlaskConical,
  X,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../api/apiClient";

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Error al cargar notificaciones:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const markAsRead = async (key_id) => {
    try {
      await api.post("/notifications/read", { key_id });
      setNotifications((prev) =>
        prev.map((n) => (n.id === key_id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const keys = notifications.filter((n) => !n.is_read).map((n) => n.id);
      if (keys.length === 0) return;
      await api.post("/notifications/read-all", { keys });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success("Todas las notificaciones marcadas como leídas");
    } catch (err) {
      toast.error("Error al actualizar notificaciones");
    }
  };

  const getIcon = (type, severity) => {
    switch (type) {
      case "appointment":
        return <Calendar size={16} className="text-blue-600" />;
      case "vaccine":
        return <ShieldAlert size={16} className={severity === "danger" ? "text-rose-600" : "text-amber-600"} />;
      case "inventory":
        return <Package size={16} className="text-purple-600" />;
      case "invoice":
        return <FileText size={16} className="text-emerald-600" />;
      case "hospitalization":
        return <Hospital size={16} className="text-sky-600" />;
      case "laboratory":
        return <FlaskConical size={16} className="text-indigo-600" />;
      default:
        return <AlertTriangle size={16} className="text-amber-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="icon-button notification hover:bg-slate-100 transition-colors relative"
        title="Notificaciones y Alertas"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800">Alertas Clínicas</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-rose-100 text-rose-700">
                  {unreadCount} nuevas
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-1 transition-colors"
              >
                <CheckCheck size={14} /> Marcar leídas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Cargando alertas...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCheck className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
                <p className="text-xs font-semibold text-slate-700">Todo al día</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No hay alertas ni avisos pendientes en la clínica.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                    !n.is_read ? "bg-teal-50/30" : ""
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-100 flex-shrink-0 mt-0.5">
                    {getIcon(n.type, n.severity)}
                  </div>
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      if (!n.is_read) markAsRead(n.id);
                      setOpen(false);
                      if (n.link) navigate(n.link);
                    }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                      {n.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={() => {
                setOpen(false);
                navigate("/settings");
              }}
              className="text-[11px] text-slate-500 hover:text-slate-800 font-medium"
            >
              Configurar umbrales de alerta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
