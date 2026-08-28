import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  X,
  FileText,
  FlaskConical,
  HeartPulse,
  Package,
  Bot,
  RefreshCw,
  Copy,
  Check,
  Globe,
  Stethoscope,
  Pill,
  Trash2,
  ExternalLink,
  Zap,
  BrainCircuit,
  MessageSquareQuote,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../api/apiClient";

const ROLES = [
  {
    id: "general",
    label: "Clínico General",
    icon: Stethoscope,
    desc: "Diagnósticos diferenciales, pautas terapéuticas y medicina interna",
    defaultModel: "gemini-3.5-flash",
  },
  {
    id: "lab_specialist",
    label: "Laboratorio",
    icon: FlaskConical,
    desc: "Interpretación hematológica, perfiles bioquímicos y citología",
    defaultModel: "gemini-3.5-flash",
  },
  {
    id: "pharmacology_search",
    label: "Farmacología & Web",
    icon: Pill,
    desc: "Posologías, contraindicaciones y búsqueda de literatura con Google Search",
    defaultModel: "gemini-3.5-flash",
    autoSearch: true,
  },
  {
    id: "client_communication",
    label: "Alta & Tutor",
    icon: HeartPulse,
    desc: "Pautas domiciliarias claras, empáticas y consentimientos",
    defaultModel: "gemini-3.1-flash-lite",
  },
  {
    id: "clinic_manager",
    label: "Gestión Clínica",
    icon: Package,
    desc: "Auditoría de stock, hospitalizaciones y operativa clínica",
    defaultModel: "gemini-3.1-flash-lite",
  },
];

const TASK_MODES = [
  {
    id: "fast",
    label: "Rápido",
    badge: "gemini-3.1-flash-lite",
    icon: Zap,
    description: "Máxima velocidad para consultas directas y redacción ágil",
  },
  {
    id: "general",
    label: "General + Web",
    badge: "gemini-3.5-flash",
    icon: Globe,
    description: "Equilibrio ideal con soporte de búsqueda Google Search",
  },
  {
    id: "complex",
    label: "Razonamiento Profundo",
    badge: "gemini-3.1-pro-preview",
    icon: BrainCircuit,
    description: "Análisis complejo y diagnósticos multidisciplinares",
  },
];

const ROLE_PROMPTS = {
  general: [
    "Plantea 3 diagnósticos diferenciales para un canino con vómitos agudos y letargia.",
    "Calcula la fluidoterapia de mantenimiento y reposición para 12 kg con 6% de deshidratación.",
    "Indica pauta analgésica multimodal postquirúrgica segura en felinos.",
  ],
  lab_specialist: [
    "Interpreta un hemograma con leucocitosis (24.000/μL) y neutrofilia con desviación a la izquierda.",
    "Analiza una elevación de ALT (450 U/L) y Fosfatasa Alcalina (620 U/L) en un paciente canino geriátrico.",
    "Interpreta una densidad urinaria de 1.018 con creatinina de 2.8 mg/dL.",
  ],
  pharmacology_search: [
    "Busca las últimas guías veterinarias sobre el tratamiento de la Giardiasis canina.",
    "Verifica compatibilidad e interacciones entre Omeprazol, Amoxicilina-Clavulánico y Maropitant.",
    "Consulta alertas farmacológicas y posologías actualizadas para Apoquel (Oclacitinib).",
  ],
  client_communication: [
    "Redacta una pauta de cuidados domiciliarios clara para el tutor de un gato con cistitis idiopática.",
    "Explica al propietario cómo limpiar una herida quirúrgica y cuándo llamar a urgencias.",
    "Escribe una guía amigable sobre la importancia del control estricto de la diabetes felina.",
  ],
  clinic_manager: [
    "Resume las prioridades clínicas, cirugías pendientes y alertas de stock de la clínica hoy.",
    "Recomienda el stock mínimo de seguridad para propofol, amoxicilina y sueros Ringer Lactato.",
    "Analiza el volumen de consultas de la semana y sugiere franjas horarias prioritarias.",
  ],
};

export default function AIAssistantModal({
  isOpen,
  onClose,
  initialPrompt = "",
  contextType = "clinic_summary",
  contextData = null,
}) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [selectedRole, setSelectedRole] = useState("general");
  const [taskMode, setTaskMode] = useState("general");
  const [useSearchGrounding, setUseSearchGrounding] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Inicialización de contexto y prompt inicial
  useEffect(() => {
    if (isOpen) {
      if (contextType === "lab_order") {
        setSelectedRole("lab_specialist");
      } else if (contextType === "discharge_instructions") {
        setSelectedRole("client_communication");
      }

      if (initialPrompt) {
        setPrompt(initialPrompt);
        handleSend(initialPrompt);
      } else if (messages.length === 0) {
        setMessages([
          {
            role: "assistant",
            content: `¡Hola! Soy **VetCare AI**, tu asistente veterinario inteligente respaldado por modelos Gemini y búsqueda web en tiempo real.\n\nPuedes seleccionarme en diferentes roles clínicos, activar **Búsqueda Web con Google Search** para contrastar bibliografía reciente o hacerme preguntas en este hilo interactivo manteniendo todo el historial.`,
            roleId: "general",
            model: "gemini-3.5-flash",
          },
        ]);
      }
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, initialPrompt]);

  // Actualizar modo de búsqueda al cambiar a rol farmacológico
  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    if (roleId === "pharmacology_search") {
      setUseSearchGrounding(true);
      setTaskMode("general");
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || prompt;
    if (!textToSend.trim() || loading) return;

    const userMessage = { role: "user", content: textToSend };
    // Historial previo acumulado para multi-turn
    const currentHistory = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setLoading(true);

    try {
      const { data } = await api.post("/gemini/assistant", {
        prompt: textToSend,
        role: selectedRole,
        taskMode,
        useSearchGrounding: useSearchGrounding || selectedRole === "pharmacology_search",
        contextType,
        contextData,
        history: currentHistory,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response || "No se recibió respuesta del modelo.",
          isFallback: data.isFallback,
          sources: data.sources || [],
          model: data.model || (data.isFallback ? "Modo Asistido Local" : "Gemini"),
          disclaimer: data.disclaimer,
          roleId: selectedRole,
        },
      ]);
    } catch (err) {
      console.error("Error en chat de IA:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Ocurrió una interrupción de red al procesar la solicitud con el asistente.",
          error: true,
        },
      ]);
      toast.error("Error en la conexión con el asistente.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success("Texto copiado al portapapeles");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: `Conversación reiniciada. ¿En qué caso clínico o consulta de gestión puedo apoyarte ahora?`,
        roleId: selectedRole,
      },
    ]);
    toast.info("Hilo de conversación reiniciado");
  };

  if (!isOpen) return null;

  const activeRoleObj = ROLES.find((r) => r.id === selectedRole) || ROLES[0];
  const suggestedPrompts = ROLE_PROMPTS[selectedRole] || ROLE_PROMPTS.general;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col h-[90vh] max-h-[880px] overflow-hidden">
        {/* Header con gradiente profesional */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-inner">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight text-white">VetCare AI Chatbot</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-200 border border-teal-400/30">
                  {taskMode === "fast"
                    ? "Gemini 3.1 Flash-Lite"
                    : taskMode === "complex"
                    ? "Gemini 3.1 Pro"
                    : "Gemini 3.5 Flash"}
                </span>
                {useSearchGrounding && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                    <Globe size={11} /> Google Search
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <span>Rol activo:</span>
                <span className="text-teal-300 font-medium">{activeRoleObj.label}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`p-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
                showConfig
                  ? "bg-teal-500 text-slate-950 font-bold"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
              title="Configurar rol y modelo"
            >
              <BrainCircuit size={16} />
              <span className="hidden sm:inline">Ajustes IA</span>
            </button>
            <button
              onClick={clearChat}
              className="p-2 rounded-xl text-slate-300 hover:text-rose-300 hover:bg-white/10 transition-colors"
              title="Limpiar hilo de chat"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Panel Desplegable de Configuración de Rol y Modelo */}
        {showConfig && (
          <div className="p-4 bg-slate-900 border-b border-slate-800 text-slate-200 text-xs space-y-4 animate-slideDown">
            {/* Selector de Rol del Chatbot */}
            <div>
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block mb-2">
                1. Seleccionar Rol del Asistente (System Instruction):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const isSelected = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleRoleSelect(r.id)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        isSelected
                          ? "bg-teal-500/20 border-teal-400 text-white shadow-xs"
                          : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={15} className={isSelected ? "text-teal-300" : "text-slate-400"} />
                        <span className="font-semibold text-[11px] truncate">{r.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                        {r.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selector de Nivel de Modelo y Búsqueda */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block mb-2">
                  2. Nivel de Tarea & Modelo:
                </span>
                <div className="flex gap-2">
                  {TASK_MODES.map((tm) => {
                    const Icon = tm.icon;
                    const isSelected = taskMode === tm.id;
                    return (
                      <button
                        key={tm.id}
                        onClick={() => setTaskMode(tm.id)}
                        className={`flex-1 p-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? "bg-teal-500/20 border-teal-400 text-white font-medium shadow-xs"
                            : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5 mb-0.5">
                          <Icon size={13} className={isSelected ? "text-teal-300" : "text-slate-400"} />
                          <span className="text-xs font-semibold">{tm.label}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 block font-mono">{tm.badge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block mb-2">
                  3. Búsqueda Web en Tiempo Real (Google Search):
                </span>
                <button
                  onClick={() => setUseSearchGrounding(!useSearchGrounding)}
                  className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    useSearchGrounding
                      ? "bg-blue-600/20 border-blue-400 text-blue-200"
                      : "bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2 text-left">
                    <Globe size={16} className={useSearchGrounding ? "text-blue-300" : "text-slate-400"} />
                    <div>
                      <span className="font-semibold text-xs text-slate-200 block">
                        Google Search Grounding
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {useSearchGrounding
                          ? "Activo (gemini-3.5-flash con citas web)"
                          : "Inactivo (solo conocimiento base y contexto clínico)"}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                      useSearchGrounding ? "bg-teal-500" : "bg-slate-700"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        useSearchGrounding ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Roles Tabs Rápidos en la barra superior */}
        <div className="px-4 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
          <span className="text-slate-500 font-semibold text-[11px] whitespace-nowrap mr-1">
            Modo:
          </span>
          {ROLES.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => handleRoleSelect(r.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap text-xs ${
                  isSelected
                    ? "bg-teal-700 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-teal-50 hover:text-teal-800 border border-slate-200"
                }`}
              >
                <Icon size={13} className={isSelected ? "text-teal-200" : "text-slate-500"} />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sugerencias Rápidas de Preguntas para el Rol */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
          <span className="text-slate-400 font-semibold text-[10px] whitespace-nowrap">Ejemplos:</span>
          {suggestedPrompts.map((spText, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(spText)}
              disabled={loading}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 text-[11px] transition-colors whitespace-nowrap shadow-2xs disabled:opacity-50"
            >
              {spText}
            </button>
          ))}
        </div>

        {/* Hilo de Mensajes (Multi-turn Scrollable Thread) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/60">
          {messages.map((m, idx) => {
            const isAss = m.role === "assistant" || m.role === "model";
            return (
              <div
                key={idx}
                className={`flex gap-3 ${isAss ? "justify-start" : "justify-end"} animate-fadeIn`}
              >
                {isAss && (
                  <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-1">
                    <Bot size={17} />
                  </div>
                )}

                <div
                  className={`max-w-[90%] sm:max-w-[82%] rounded-2xl p-4 text-sm ${
                    isAss
                      ? "bg-white border border-slate-200 text-slate-800 shadow-sm"
                      : "bg-teal-700 text-white shadow-sm"
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed space-y-2">
                    {m.content}
                  </div>

                  {/* Fuentes de Búsqueda Web (Grounding Sources) */}
                  {isAss && m.sources && m.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 mb-1.5">
                        <Globe size={13} className="text-blue-600" />
                        <span>Fuentes Web Consultadas (Google Search):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.sources.map((s, sIdx) => (
                          <a
                            key={sIdx}
                            href={s.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            referrerPolicy="no-referrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-[11px] transition-colors"
                          >
                            <ExternalLink size={10} />
                            <span className="truncate max-w-[200px]">{s.title || s.uri}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pie de Mensaje con Metadatos y Copiar */}
                  {isAss && (
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-2">
                        {m.model && (
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {m.model}
                          </span>
                        )}
                        <span className="hidden sm:inline">
                          {m.disclaimer || "Validar con el veterinario responsable."}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(m.content, idx)}
                        className="p-1 text-slate-400 hover:text-teal-700 transition-colors rounded flex items-center gap-1"
                        title="Copiar texto"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check size={13} className="text-teal-600" />
                            <span className="text-[10px] text-teal-600 font-medium">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span className="text-[10px]">Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 justify-start items-center animate-fadeIn">
              <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <Sparkles size={16} className="animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-600 shadow-sm flex items-center gap-2.5">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-xs font-medium">
                  {useSearchGrounding || selectedRole === "pharmacology_search"
                    ? "Consultando Gemini 3.5 Flash y buscando fuentes con Google Search..."
                    : taskMode === "complex"
                    ? "Razonando análisis clínico profundo con Gemini 3.1 Pro..."
                    : "Analizando información clínica con Gemini AI..."}
                </span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar con opciones directas */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              placeholder={`Pregunta a ${activeRoleObj.label} (ej: dosis, analíticas, literatura médica)...`}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              className="px-4 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-medium text-sm flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <ShieldAlert size={12} className="text-amber-500" />
              Toda orientación clínica o farmacológica debe ser ratificada por el médico veterinario a cargo.
            </span>
            <span className="hidden md:inline font-mono text-[10px]">
              Multi-turn Chat & Search Grounding
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

