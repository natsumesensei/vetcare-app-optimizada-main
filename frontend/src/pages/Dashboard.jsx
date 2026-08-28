import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import {
  Users,
  Calendar,
  TrendingUp,
  Plus,
  ArrowRight,
  ShieldAlert,
  Package,
  HeartPulse,
  Sparkles,
  FlaskConical,
  FileText,
  Hospital,
} from "lucide-react";
import { toast } from "sonner";
import api from "../api/apiClient";

export default function Dashboard() {
  const { openAI } = useOutletContext() || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      try {
        const res = await api.get("/dashboard");
        if (!cancelled) {
          setData({
            patients: 0,
            appointmentsToday: 0,
            activeHospitalizations: 0,
            revenue: 0,
            currencySymbol: "RD$",
            lowStock: 0,
            overdueVaccines: 0,
            overdueParasites: 0,
            pendingLabs: 0,
            todayAppointmentsList: [],
            hospitalizationsList: [],
            monthlyStats: [],
            ...(res.data || {}),
            todayAppointmentsList: Array.isArray(res.data?.todayAppointmentsList) ? res.data.todayAppointmentsList : [],
            hospitalizationsList: Array.isArray(res.data?.hospitalizationsList) ? res.data.hospitalizationsList : [],
            monthlyStats: Array.isArray(res.data?.monthlyStats) ? res.data.monthlyStats : [],
          });
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error cargando dashboard:", err);
          // No dejamos la pantalla en blanco si la API no responde.
          setData({
            patients: 0,
            appointmentsToday: 0,
            activeHospitalizations: 0,
            revenue: 0,
            currencySymbol: "RD$",
            lowStock: 0,
            overdueVaccines: 0,
            overdueParasites: 0,
            pendingLabs: 0,
            todayAppointmentsList: [],
            hospitalizationsList: [],
            monthlyStats: [],
          });
          toast.error("No se pudieron cargar los datos del panel.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-pulse" />
        <p>Cargando información clínica y financiera...</p>
      </div>
    );
  }

  const currencySymbol = data?.currencySymbol || "RD$";
  const todayAppointments = Array.isArray(data?.todayAppointmentsList) ? data.todayAppointmentsList : [];
  const hospitalizations = Array.isArray(data?.hospitalizationsList) ? data.hospitalizationsList : [];
  const monthlyStats = Array.isArray(data?.monthlyStats) ? data.monthlyStats : [];

  return (
    <div className="space-y-6">
      {/* Hero Panel */}
      <div className="hero-panel">
        <div>
          <div className="hero-kicker">
            <span className="pulse-dot" /> PANEL OPERATIVO VET NESTOR
          </div>
          <h2>Vet Nestor · Clínica Veterinaria</h2>
          <p>
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })} · {data?.appointmentsToday || 0} citas programadas hoy
          </p>
        </div>

        <div className="hero-actions">
          <button
            onClick={() => navigate("/appointments")}
            className="primary-action cursor-pointer hover:opacity-90"
          >
            <Plus size={16} />
            <span>Nueva Cita</span>
          </button>

          <button
            onClick={() => openAI?.("¿Cuáles son las prioridades clínicas y alertas de la jornada?")}
            className="secondary-action cursor-pointer hover:bg-white/10"
          >
            <Sparkles size={16} className="text-teal-300" />
            <span>Resumen IA</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas Clave */}
      <div className="stats-grid">
        <div className="stat-card tone-blue">
          <div className="stat-top">
            <div className="stat-icon">
              <Users size={18} />
            </div>
            <span className="stat-trend">Registrados</span>
          </div>
          <div className="stat-value">{data?.patients || 0}</div>
          <div className="stat-label">Pacientes Activos</div>
          <div className="stat-detail">Historias clínicas en sistema</div>
        </div>

        <div className="stat-card tone-violet">
          <div className="stat-top">
            <div className="stat-icon">
              <Calendar size={18} />
            </div>
            <span className="stat-trend">Hoy</span>
          </div>
          <div className="stat-value">{data?.appointmentsToday || 0}</div>
          <div className="stat-label">Citas del Día</div>
          <div className="stat-detail">Consultas y revisiones</div>
        </div>

        <div className="stat-card tone-green">
          <div className="stat-top">
            <div className="stat-icon">
              <TrendingUp size={18} />
            </div>
            <span className="stat-trend">Este Mes</span>
          </div>
          <div className="stat-value">
            {Number(data?.revenue || 0).toLocaleString("es-ES", { minimumFractionDigits: 0 })}{" "}
            <span className="text-sm font-semibold">{currencySymbol}</span>
          </div>
          <div className="stat-label">Facturación Mensual</div>
          <div className="stat-detail">Cobros registrados</div>
        </div>

        <div className="stat-card tone-orange">
          <div className="stat-top">
            <div className="stat-icon">
              <Hospital size={18} />
            </div>
            <span className="stat-trend">Boxes</span>
          </div>
          <div className="stat-value">{data?.activeHospitalizations || 0}</div>
          <div className="stat-label">Hospitalizados</div>
          <div className="stat-detail">En observación médica</div>
        </div>
      </div>

      {/* Avisos Rápidos de Alerta */}
      {(data?.lowStock > 0 || data?.overdueVaccines > 0 || data?.pendingLabs > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {data?.lowStock > 0 && (
            <Link
              to="/inventory"
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 hover:border-rose-300 transition-colors"
            >
              <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                <Package size={18} />
              </div>
              <div>
                <div className="text-xs font-bold">{data.lowStock} Productos con Stock Bajo</div>
                <div className="text-[11px] text-rose-700">Revisa inventario para reposición</div>
              </div>
            </Link>
          )}

          {data?.overdueVaccines > 0 && (
            <Link
              to="/patients"
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 hover:border-amber-300 transition-colors"
            >
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                <ShieldAlert size={18} />
              </div>
              <div>
                <div className="text-xs font-bold">{data.overdueVaccines} Vacunas Pendientes</div>
                <div className="text-[11px] text-amber-700">Pacientes con pauta vacunal vencida</div>
              </div>
            </Link>
          )}

          {data?.pendingLabs > 0 && (
            <Link
              to="/reference-values"
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 hover:border-sky-300 transition-colors"
            >
              <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
                <FlaskConical size={18} />
              </div>
              <div>
                <div className="text-xs font-bold">{data.pendingLabs} Análisis en Proceso</div>
                <div className="text-[11px] text-sky-700">Esperando registro de resultados</div>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Grid Principal: Citas de Hoy & Hospitalizados */}
      <div className="dashboard-grid">
        {/* Panel de Citas de Hoy */}
        <div className="panel appointments-panel">
          <div className="panel-heading">
            <div>
              <div className="panel-eyebrow">AGENDA DIARIA</div>
              <h3>Citas Programadas para Hoy</h3>
            </div>
            <Link to="/appointments">
              Ver agenda completa <ArrowRight size={12} />
            </Link>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="empty-state">
              <Calendar size={32} />
              <p>No hay citas programadas para el día de hoy.</p>
              <Link to="/appointments">+ Agendar nueva cita</Link>
            </div>
          ) : (
            <div className="space-y-1">
              {todayAppointments.map((appt) => (
                <div key={appt.id} className="appointment-row">
                  <div className="time-badge">
                    <strong>{appt.appointment_time || "00:00"}</strong>
                    <small>{appt.type || "Consulta"}</small>
                  </div>
                  <div className="pet-avatar">
                    <HeartPulse size={16} />
                  </div>
                  <div className="appointment-main">
                    <strong>{appt.patient_name || appt.owner_name}</strong>
                    <span>
                      {appt.reason || "Revisión general"} {appt.species ? `· ${appt.species}` : ""}
                    </span>
                  </div>
                  <span className="status-pill">{appt.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel de Hospitalización Activa */}
        <div className="panel alerts-panel">
          <div className="panel-heading">
            <div>
              <div className="panel-eyebrow">MONITORIZACIÓN CONTINUA</div>
              <h3>Hospitalizaciones en Curso</h3>
            </div>
            <Link to="/hospitalizations">
              Ver boxes <ArrowRight size={12} />
            </Link>
          </div>

          {hospitalizations.length === 0 ? (
            <div className="empty-state">
              <Hospital size={32} />
              <p>No hay pacientes ingresados en hospitalización.</p>
            </div>
          ) : (
            <div className="alert-list">
              {hospitalizations.map((h) => (
                <div key={h.id} className="alert-row">
                  <div className="alert-icon amber">
                    <Hospital size={16} />
                  </div>
                  <div>
                    <strong>
                      {h.patient_name} ({h.cage || "Box 1"})
                    </strong>
                    <span>
                      {h.reason} · Ingreso: {h.admission_date}
                    </span>
                  </div>
                  <Link
                    to={`/patients/${h.patient_id}`}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-800"
                  >
                    Ver ficha
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gráfico de Evolución Mensual y Accesos Rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico de Barras de Ingresos */}
        <div className="panel lg:col-span-2">
          <div className="panel-heading">
            <div>
              <div className="panel-eyebrow">BALANCE FINANCIERO</div>
              <h3>Evolución de Ingresos (Últimos 6 Meses)</h3>
            </div>
            <Link to="/invoices">
              Ver facturación <ArrowRight size={12} />
            </Link>
          </div>

          <div className="week-chart pt-4">
            {monthlyStats.map((m, idx) => {
              const maxRev = Math.max(...(monthlyStats.map((x) => Number(x.revenue) || 0) || [1]), 100);
              const heightPct = Math.max(12, Math.round((m.revenue / maxRev) * 100));

              return (
                <div key={idx} className="day-column">
                  <div className="bar-track">
                    <div className="bar-fill" style={{ height: `${heightPct}%` }} />
                  </div>
                  <strong>{m.revenue} {currencySymbol}</strong>
                  <span>{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="panel">
          <div className="panel-heading">
            <div>
              <div className="panel-eyebrow">ACCIONES FRECUENTES</div>
              <h3>Accesos Rápidos</h3>
            </div>
          </div>

          <div className="quick-grid">
            <Link to="/patients" className="quick-action">
              <div className="quick-icon">
                <Users size={16} />
              </div>
              <div>
                <strong>Nuevo Paciente</strong>
                <small>Alta e historia</small>
              </div>
              <ArrowRight size={14} />
            </Link>

            <Link to="/invoices" className="quick-action">
              <div className="quick-icon">
                <FileText size={16} />
              </div>
              <div>
                <strong>Nueva Factura</strong>
                <small>Cobros y recibos</small>
              </div>
              <ArrowRight size={14} />
            </Link>

            <Link to="/reference-values" className="quick-action">
              <div className="quick-icon">
                <FlaskConical size={16} />
              </div>
              <div>
                <strong>Laboratorio</strong>
                <small>Analítica clínica</small>
              </div>
              <ArrowRight size={14} />
            </Link>

            <Link to="/inventory" className="quick-action">
              <div className="quick-icon">
                <Package size={16} />
              </div>
              <div>
                <strong>Farmacia</strong>
                <small>Revisar stock</small>
              </div>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
