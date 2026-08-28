import { useState, useEffect } from "react";
import { Menu, Search, X, Sparkles } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import ErrorBoundary from "../components/ErrorBoundary";
import GlobalSearchModal from "../components/layout/GlobalSearchModal";
import NotificationCenter from "../components/layout/NotificationCenter";
import AIAssistantModal from "../components/layout/AIAssistantModal";

const titles = {
  "/": ["Dashboard", "Resumen operativo y métricas de la clínica"],
  "/patients": ["Pacientes", "Historias clínicas, tutores e identificación"],
  "/appointments": ["Agenda", "Citas, consultas y seguimiento"],
  "/consultations": ["Consultas", "Atención médica, exploración y evolución"],
  "/surgeries": ["Cirugías", "Programación quirúrgica y seguimiento"],
  "/hospitalizations": ["Hospitalización", "Pacientes ingresados, jaulas y pautas"],
  "/anesthesia": ["Anestesia y Quirófano", "Protocolos, constantes y monitorización"],
  "/reference-values": ["Laboratorio", "Órdenes analíticas y valores de referencia"],
  "/laboratory": ["Laboratorio", "Órdenes analíticas y valores de referencia"],
  "/inventory": ["Farmacia y Stock", "Medicamentos, lotes, caducidades y existencias"],
  "/invoices": ["Facturación", "Ingresos, emisión de facturas y cobros"],
  "/settings": ["Configuración", "Datos de clínica, tarifas, alertas y copias"],
};

export default function MainLayout() {
  const [openSidebar, setOpenSidebar] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState("");

  const loc = useLocation();
  const nav = useNavigate();

  const base = "/" + (loc.pathname.split("/")[1] || "");
  const [title, subtitle] = titles[base] || [
    "Historia Clínica",
    "Información del paciente y actos clínicos",
  ];

  // Hotkey Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleOpenAIWithPrompt = (promptText = "") => {
    setAiInitialPrompt(promptText);
    setAiModalOpen(true);
  };

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      <div
        className={`mobile-overlay ${openSidebar ? "show" : ""}`}
        onClick={() => setOpenSidebar(false)}
      />

      {/* Sidebar */}
      <aside className={`app-sidebar ${openSidebar ? "mobile-open" : ""}`}>
        <Sidebar onNavigate={() => setOpenSidebar(false)} />
        <button className="mobile-close" onClick={() => setOpenSidebar(false)}>
          <X size={19} />
        </button>
      </aside>

      {/* Main Container */}
      <main className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              onClick={() => setOpenSidebar(true)}
            >
              <Menu size={20} />
            </button>

            <div>
              <div className="eyebrow">CLÍNICA VETERINARIA</div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>

          <div className="topbar-actions">
            {/* Global Search Button */}
            <button
              type="button"
              className="search-button cursor-pointer hover:border-slate-300 transition-colors"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={16} />
              <span>Buscar paciente, cita, factura...</span>
              <kbd>⌘ K</kbd>
            </button>

            {/* AI Assistant Quick Trigger */}
            <button
              type="button"
              onClick={() => handleOpenAIWithPrompt("")}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-700 hover:to-sky-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Asistente IA VetCare"
            >
              <Sparkles size={14} className="text-teal-200" />
              <span>IA VetCare</span>
            </button>

            {/* Notification Center */}
            <NotificationCenter />

            {/* User Chip */}
            <div className="user-chip">
              <div className="avatar">DR</div>
              <div>
                <strong>Equipo Clínico</strong>
                <small>Dr. Saladin</small>
              </div>
            </div>
          </div>
        </header>

        <section className="page-content">
          <ErrorBoundary key={loc.pathname}>
            <Outlet context={{ openAI: handleOpenAIWithPrompt }} />
          </ErrorBoundary>
        </section>
      </main>

      {/* Modales Globales */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpenAI={handleOpenAIWithPrompt}
      />

      <AIAssistantModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        initialPrompt={aiInitialPrompt}
      />
    </div>
  );
}
