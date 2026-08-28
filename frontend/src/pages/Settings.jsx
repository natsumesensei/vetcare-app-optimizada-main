import { useState, useEffect } from "react";
import {
  Building,
  CreditCard,
  Bell,
  Users,
  Database,
  Download,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  KeyRound,
  User,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import api from "../api/apiClient";
import { CURRENCIES, getCurrencySymbol } from "../utils/currency";
import { useAuth } from "../contexts/AuthContext";

const AVAILABLE_PAYMENT_METHODS = [
  "Tarjeta de Crédito/Débito",
  "Efectivo",
  "Transferencia Bancaria",
  "Bizum",
  "Financiación",
  "TPV Virtual",
];

const ROLES = [
  { value: "admin", label: "Administrador (Control Total)" },
  { value: "veterinario", label: "Veterinario / Facultativo" },
  { value: "auxiliar", label: "Auxiliar Técnico Veterinario (ATV)" },
  { value: "recepcionista", label: "Recepcionista / Atención al Cliente" },
];

export default function Settings() {
  const { user: currentUser, updateUserData } = useAuth();
  const [activeTab, setActiveTab] = useState("clinic");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);

  // Formulario de Configuración General de la Clínica
  const [form, setForm] = useState({
    clinic_name: "",
    veterinarian: "",
    phone: "",
    email: "",
    address: "",
    nif: "",
    license_number: "",
    website: "",
    logo: "",
    currency: "DOP",
    currency_symbol: "RD$",
    tax_rate: 18,
    invoice_prefix: "FAC-2026-",
    next_invoice_number: 101,
    payment_terms: "Pago al contado. Factura válida para crédito fiscal.",
    payment_methods: ["Tarjeta de Crédito/Débito", "Efectivo", "Transferencia Bancaria"],
    vaccine_alert_days: 15,
    deworming_alert_days: 15,
    low_stock_threshold: 5,
    date_format: "DD/MM/YYYY",
    time_format: "24h",
    theme: "light",
    legal_notes: "Centro Veterinario Autorizado. Factura emitida según la legislación fiscal vigente.",
  });

  // Formulario para "Mi Perfil & Contraseña"
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [showProfilePass, setShowProfilePass] = useState(false);

  // Modales de Gestión de Usuarios
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null = Crear, object = Editar
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "veterinario",
  });
  const [savingUser, setSavingUser] = useState(false);
  const [showUserPass, setShowUserPass] = useState(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/settings");
      if (data.settings) {
        setForm((prev) => ({ ...prev, ...data.settings }));
      }
      setStats(data.stats || {});
      setUsers(data.users || []);

      // Cargar perfil actual
      if (currentUser) {
        setProfileForm((prev) => ({
          ...prev,
          name: currentUser.name || "",
          email: currentUser.email || "",
        }));
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar configuración de la clínica.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleCurrencyChange = (code) => {
    const selected = CURRENCIES.find((c) => c.code === code);
    setForm((prev) => ({
      ...prev,
      currency: code,
      currency_symbol: selected?.symbol || getCurrencySymbol(code),
    }));
  };

  const togglePaymentMethod = (method) => {
    setForm((prev) => {
      const current = prev.payment_methods || [];
      const exists = current.includes(method);
      const updated = exists ? current.filter((m) => m !== method) : [...current, method];
      return { ...prev, payment_methods: updated };
    });
  };

  const handleSaveClinicSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/settings", form);
      if (data.settings) {
        setForm((prev) => ({ ...prev, ...data.settings }));
      }
      toast.success("Configuración de la clínica guardada exitosamente.");
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  // Guardar Cambios en Mi Perfil & Contraseña
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      toast.error("El nombre y correo electrónico son obligatorios.");
      return;
    }

    if (profileForm.newPassword) {
      if (profileForm.newPassword.length < 4) {
        toast.error("La nueva contraseña debe tener al menos 4 caracteres.");
        return;
      }
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        toast.error("Las nuevas contraseñas no coinciden.");
        return;
      }
    }

    try {
      setSavingProfile(true);
      const res = await api.put("/auth/profile", {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        currentPassword: profileForm.currentPassword,
        newPassword: profileForm.newPassword,
      });

      if (res.data?.user) {
        updateUserData(res.data.user);
      }

      setProfileForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      toast.success("Perfil y credenciales actualizados correctamente.");
      loadSettings();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error al actualizar tus credenciales.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Abrir Modal de Creación de Usuario
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserFormData({
      name: "",
      email: "",
      password: "",
      role: "veterinario",
    });
    setUserModalOpen(true);
  };

  // Abrir Modal de Edición de Usuario
  const handleOpenEditUser = (u) => {
    setEditingUser(u);
    setUserFormData({
      name: u.name || "",
      email: u.email || "",
      password: "", // Opcional si solo se quiere cambiar datos
      role: u.role || "veterinario",
    });
    setUserModalOpen(true);
  };

  // Guardar Usuario (Crear o Actualizar)
  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!userFormData.name.trim() || !userFormData.email.trim()) {
      toast.error("El nombre y correo son obligatorios.");
      return;
    }

    if (!editingUser && (!userFormData.password || userFormData.password.length < 4)) {
      toast.error("La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    if (editingUser && userFormData.password && userFormData.password.length < 4) {
      toast.error("La nueva contraseña debe tener al menos 4 caracteres.");
      return;
    }

    try {
      setSavingUser(true);
      if (editingUser) {
        // Actualizar
        await api.put(`/users/${editingUser.id}`, {
          name: userFormData.name.trim(),
          email: userFormData.email.trim(),
          role: userFormData.role,
          password: userFormData.password || undefined,
        });
        toast.success(`Usuario "${userFormData.name}" actualizado exitosamente.`);
      } else {
        // Crear
        await api.post("/users", {
          name: userFormData.name.trim(),
          email: userFormData.email.trim(),
          role: userFormData.role,
          password: userFormData.password,
        });
        toast.success(`Nuevo usuario "${userFormData.name}" creado con éxito.`);
      }

      setUserModalOpen(false);
      loadSettings();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error al guardar usuario.");
    } finally {
      setSavingUser(false);
    }
  };

  // Eliminar Usuario
  const handleDeleteUser = async (u) => {
    if (u.id === currentUser?.id) {
      toast.error("No puedes eliminar tu propia cuenta en sesión.");
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar la cuenta de "${u.name}" (${u.email})?`)) {
      return;
    }

    try {
      await api.delete(`/users/${u.id}`);
      toast.success("Usuario eliminado correctamente.");
      loadSettings();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Error al eliminar usuario.");
    }
  };

  const handleDownloadBackup = () => {
    window.location.href = "/api/settings/backup";
    toast.success("Descargando copia de seguridad JSON...");
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Cargando configuración...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-teal-600">
            Administración & Seguridad
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Configuración del Sistema
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ajustes de moneda, facturación, credenciales de acceso, usuarios clínicos y copias de seguridad.
          </p>
        </div>

        {activeTab !== "profile" && activeTab !== "users" && activeTab !== "backup" && (
          <button
            onClick={handleSaveClinicSettings}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50"
          >
            <Save size={18} />
            <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab("clinic")}
          className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "clinic"
              ? "border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building size={16} />
          <span>Perfil de la Clínica</span>
        </button>

        <button
          onClick={() => setActiveTab("billing")}
          className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "billing"
              ? "border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CreditCard size={16} />
          <span>Facturación & Moneda ({form.currency})</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "profile"
              ? "border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <KeyRound size={16} />
          <span>Mi Perfil & Contraseña</span>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "users"
              ? "border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users size={16} />
          <span>Gestión de Usuarios ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("alerts")}
          className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "alerts"
              ? "border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Bell size={16} />
          <span>Alertas</span>
        </button>

        <button
          onClick={() => setActiveTab("backup")}
          className={`px-4 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "backup"
              ? "border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Database size={16} />
          <span>Backup</span>
        </button>
      </div>

      {/* Contenido de Tabs */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        {/* TAB 1: PERFIL DE CLÍNICA */}
        {activeTab === "clinic" && (
          <form onSubmit={handleSaveClinicSettings} className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Identidad y Datos de Contacto</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Estos datos aparecerán en los encabezados de facturas, recetas médicas e informes analíticos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Comercial del Centro *
                </label>
                <input
                  type="text"
                  required
                  value={form.clinic_name}
                  onChange={(e) => setForm({ ...form, clinic_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Veterinario(a) Titular / Director Médico
                </label>
                <input
                  type="text"
                  value={form.veterinarian}
                  onChange={(e) => setForm({ ...form, veterinarian: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  RNC / NIF / CIF Fiscal
                </label>
                <input
                  type="text"
                  value={form.nif}
                  onChange={(e) => setForm({ ...form, nif: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nº Exequátur / Colegiado Oficial
                </label>
                <input
                  type="text"
                  value={form.license_number}
                  onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono de Urgencias y Citas
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico de Contacto
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dirección Completa de la Clínica
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pie de Página Legal de Documentos e Informes
                </label>
                <textarea
                  rows={2}
                  value={form.legal_notes}
                  onChange={(e) => setForm({ ...form, legal_notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition-all"
              >
                {saving ? "Guardando..." : "Guardar Perfil de Clínica"}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: FACTURACIÓN & MONEDA */}
        {activeTab === "billing" && (
          <form onSubmit={handleSaveClinicSettings} className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Parámetros Financieros & Divisa</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configura la moneda oficial (por ejemplo, Peso Dominicano DOP - RD$), tipo impositivo y correlativos.
              </p>
            </div>

            {/* Banner de Moneda Activa */}
            <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {form.currency_symbol || getCurrencySymbol(form.currency)}
                </div>
                <div>
                  <div className="text-xs font-bold text-teal-900">
                    Moneda Configurada: {form.currency} ({form.currency_symbol || getCurrencySymbol(form.currency)})
                  </div>
                  <div className="text-xs text-teal-700">
                    Se aplicará automáticamente a todas las facturas, presupuestos e informes económicos.
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 bg-white text-teal-800 text-xs font-bold rounded-lg border border-teal-200">
                Símbolo: {form.currency_symbol}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Moneda Principal del Sistema *
                </label>
                <select
                  value={form.currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="w-full rounded-xl border-2 border-teal-500 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-teal-200"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-teal-700 mt-1">
                  Selecciona <strong>DOP (RD$)</strong> para Peso Dominicano.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Símbolo de la Moneda
                </label>
                <input
                  type="text"
                  value={form.currency_symbol}
                  onChange={(e) => setForm({ ...form, currency_symbol: e.target.value })}
                  placeholder="RD$, €, $, etc."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ITBIS / IVA General (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.tax_rate}
                  onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prefijo de Factura (NCF / Folio)
                </label>
                <input
                  type="text"
                  value={form.invoice_prefix}
                  onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Próximo Número Correlativo
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.next_invoice_number}
                  onChange={(e) => setForm({ ...form, next_invoice_number: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Condiciones de Pago por Defecto
                </label>
                <input
                  type="text"
                  value={form.payment_terms}
                  onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Métodos de pago activos */}
            <div className="pt-4 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Métodos de Pago Habilitados en la Clínica
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AVAILABLE_PAYMENT_METHODS.map((method) => {
                  const checked = (form.payment_methods || []).includes(method);
                  return (
                    <label
                      key={method}
                      onClick={() => togglePaymentMethod(method)}
                      className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
                        checked
                          ? "bg-teal-50 border-teal-300 text-teal-900 font-semibold"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-xs">{method}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition-all"
              >
                {saving ? "Guardando..." : "Guardar Ajustes Financieros"}
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: MI PERFIL & CONTRASEÑA */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Mis Credenciales de Acceso</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cambia tu nombre de usuario, correo electrónico para iniciar sesión y tu contraseña personal.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6 max-w-xl">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                  {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : "US"}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{currentUser?.name || "Usuario"}</div>
                  <div className="text-xs text-slate-500">{currentUser?.email} · Rol: <span className="font-semibold text-teal-700 uppercase">{currentUser?.role || "admin"}</span></div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo Electrónico (Usuario de Acceso) *
                  </label>
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Este correo se utilizará en la pantalla de inicio de sesión.
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Cambiar Contraseña (Opcional)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowProfilePass(!showProfilePass)}
                      className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
                    >
                      {showProfilePass ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showProfilePass ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">
                        Nueva Contraseña
                      </label>
                      <input
                        type={showProfilePass ? "text" : "password"}
                        placeholder="Dejar en blanco para mantener la actual"
                        value={profileForm.newPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                      />
                    </div>

                    {profileForm.newPassword.length > 0 && (
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">
                          Confirmar Nueva Contraseña *
                        </label>
                        <input
                          type={showProfilePass ? "text" : "password"}
                          placeholder="Repite la nueva contraseña"
                          value={profileForm.confirmPassword}
                          onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition-all flex items-center gap-2"
                >
                  <Save size={16} />
                  <span>{savingProfile ? "Guardando..." : "Actualizar Mis Datos y Contraseña"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: GESTIÓN DE USUARIOS */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Personal y Cuentas de Acceso</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gestiona los miembros del equipo clínico, modifica sus contraseñas o asigna roles de permisos.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenCreateUser}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
              >
                <Plus size={16} /> Nuevo Usuario
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Nombre</th>
                    <th className="px-4 py-3">Email (Usuario)</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Fecha Alta</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div>{u.name}</div>
                          {u.id === currentUser?.id && (
                            <span className="text-[10px] text-teal-600 font-semibold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                              Tu cuenta activa
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 font-mono">{u.email}</td>
                      <td className="px-4 py-3.5 text-xs">
                        <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-200 uppercase text-[10px]">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString("es-ES") : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditUser(u)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-slate-100 transition"
                          title="Editar usuario o cambiar contraseña"
                        >
                          <Edit3 size={16} />
                        </button>
                        {users.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            disabled={u.id === currentUser?.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-30"
                            title="Eliminar usuario"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: ALERTAS & NOTIFICACIONES */}
        {activeTab === "alerts" && (
          <form onSubmit={handleSaveClinicSettings} className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Umbrales de Avisos Automáticos</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Define el tiempo de antelación para recordatorios de inmunización y alarmas de inventario.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Alerta de Vacunación (Días)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={form.vaccine_alert_days}
                  onChange={(e) => setForm({ ...form, vaccine_alert_days: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Avisa antes del vencimiento de la pauta vacunal.
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Alerta de Desparasitación (Días)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={form.deworming_alert_days}
                  onChange={(e) => setForm({ ...form, deworming_alert_days: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Avisos para control interno y externo de parásitos.
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Umbral Mínimo de Stock
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.low_stock_threshold}
                  onChange={(e) => setForm({ ...form, low_stock_threshold: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Dispara la alarma de reposición en farmacia.
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition-all"
              >
                {saving ? "Guardando..." : "Guardar Alertas"}
              </button>
            </div>
          </form>
        )}

        {/* TAB 6: BASE DE DATOS & COPIA DE SEGURIDAD */}
        {activeTab === "backup" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Estado de la Base de Datos y Copias de Seguridad
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Almacenamiento local seguro de historias clínicas, análisis, citas y facturas.
              </p>
            </div>

            {/* Recuento de Registros */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(stats).map(([table, count]) => (
                <div
                  key={table}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {table}
                    </div>
                    <div className="text-xl font-black text-slate-900 mt-0.5">{count}</div>
                  </div>
                  <Database size={18} className="text-teal-600 opacity-60" />
                </div>
              ))}
            </div>

            {/* Botón de Descarga de Backup */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-50 to-sky-50 border border-teal-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-teal-700" />
                  <h4 className="font-bold text-sm text-teal-950">
                    Exportar Copia de Seguridad Completa (JSON)
                  </h4>
                </div>
                <p className="text-xs text-teal-800 mt-1 max-w-lg">
                  Descarga un archivo estructurado con todos los pacientes, consultas, vacunaciones, órdenes analíticas y facturas para salvaguarda legal.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadBackup}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all whitespace-nowrap"
              >
                <Download size={16} /> Descargar Backup JSON
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PARA CREAR O EDITAR USUARIO */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
                  {editingUser ? <Edit3 size={16} /> : <UserCheck size={16} />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingUser ? `Editar Usuario: ${editingUser.name}` : "Registrar Nuevo Usuario"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingUser
                      ? "Modifica sus datos o asigna una nueva contraseña"
                      : "Crea una cuenta para un integrante de la clínica"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Dra. María Fernández"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico (Login) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="usuario@clinica.com"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rol en el Sistema
                </label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {editingUser ? "Nueva Contraseña (Opcional)" : "Contraseña de Acceso *"}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUserPass(!showUserPass)}
                    className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
                  >
                    {showUserPass ? <EyeOff size={12} /> : <Eye size={12} />}
                    {showUserPass ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <input
                  type={showUserPass ? "text" : "password"}
                  required={!editingUser}
                  placeholder={
                    editingUser
                      ? "Dejar en blanco para mantener la contraseña actual"
                      : "Mínimo 4 caracteres"
                  }
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition"
                >
                  {savingUser
                    ? "Guardando..."
                    : editingUser
                    ? "Guardar Cambios"
                    : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
