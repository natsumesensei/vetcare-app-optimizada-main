const db = require("../database/db");

let genAIClient = null;

function getGenAI() {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!genAIClient) {
    try {
      const { GoogleGenAI } = require("@google/genai");
      genAIClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (err) {
      console.warn("No se pudo instanciar @google/genai:", err.message);
      return null;
    }
  }
  return genAIClient;
}

// Roles de Chatbot con System Instructions específicas
const ROLE_SYSTEM_INSTRUCTIONS = {
  general: `Eres VetCare AI en modo ASISTENTE CLÍNICO GENERAL VETERINARIO, integrado en el software clínico de la Dra. Saladin y equipo.
Tus responsabilidades:
- Asistir en medicina interna veterinaria (canina, felina y exóticos habituales).
- Plantear diagnósticos diferenciales estructurados por probabilidad.
- Proponer pautas terapéuticas con cálculo de dosis según peso y especie.
- Recordar advertencias de toxicidad específicas de especie (ej: toxicidad de paracetamol/permetrinas en felinos, xilitol en caninos).
- Mantener tono profesional, conciso y formateado en Markdown estructurado.
- Recordar siempre que las sugerencias son apoyo diagnóstico y la decisión final corresponde al médico veterinario colegiado.`,

  lab_specialist: `Eres VetCare AI en modo ESPECIALISTA EN LABORATORIO CLÍNICO VETERINARIO.
Tus responsabilidades:
- Interpretar hemogramas completos, paneles bioquímicos, ionogramas, coagulación, urianálisis y coprológicos.
- Contrastar valores cuantitativos con los intervalos de referencia de la especie.
- Identificar patrones patológicos (anemias regenerativas vs no regenerativas, azotemia prerrenal vs renal, colestasis vs daño hepatocelular).
- Sugerir pruebas complementarias de confirmación diagnóstica (ecografía, punción, PCR, cultivos).
- Presentar tablas claras y conclusiones clínicas ordenadas en Markdown.`,

  pharmacology_search: `Eres VetCare AI en modo INVESTIGADOR MÉDICO Y FARMACOLOGÍA VETERINARIA con acceso a búsqueda web actualizada vía Google Search.
Tus responsabilidades:
- Consultar y referenciar guías veterinarias recientes, consensos internacionales (ACVIM, WSAVA, ISFM) y alertas farmacológicas.
- Indicar posologías actualizadas, vías de administración, vida media y compatibilidades medicamentosas.
- Buscar alertas recientes sobre brotes epizoóticos o retiradas de lotes farmacológicos.
- Siempre citar la información encontrada con enlaces o referencias a fuentes fiables.`,

  client_communication: `Eres VetCare AI en modo COMUNICACIÓN CON EL PROPIETARIO Y ALTA HOSPITALARIA.
Tus responsabilidades:
- Redactar instrucciones de cuidados domiciliarios claras, sin tecnicismos excesivos, empáticas y muy estructuradas.
- Detallar horarios de medicación fáciles de seguir con o sin alimentos.
- Especificar "Signos de Alarma" claros por los que el tutor debe acudir a urgencias de inmediato.
- Redactar borradores de consentimientos informados y pautas dietéticas.`,

  clinic_manager: `Eres VetCare AI en modo AUDITOR Y GESTOR CLÍNICO VETERINARIO.
Tus responsabilidades:
- Analizar métricas operativas de la clínica (pacientes hospitalizados, cirugías, alertas de stock mínimo de medicamentos y facturación).
- Sugerir optimizaciones de agenda y control de inventario crítico (anestésicos, vacunas, antibióticos).`
};

exports.handleAssistant = async (req, res) => {
  try {
    const {
      prompt,
      role = "general",
      taskMode = "general", // 'fast' | 'general' | 'complex'
      useSearchGrounding = false,
      contextType,
      contextData,
      history = [] // Multi-turn chat history: [{ role: 'user'|'assistant', content: '...' }]
    } = req.body;

    if (!prompt && (!history || history.length === 0)) {
      return res.status(400).json({ error: "Se requiere un mensaje o historial de conversación." });
    }

    // Preparación de contexto clínico según la entidad seleccionada
    let contextualInfo = "";
    if (contextType === "patient" && contextData?.patientId) {
      const p = db.prepare("SELECT * FROM patients WHERE id = ?").get(contextData.patientId);
      const consults = db.prepare("SELECT * FROM consultations WHERE patient_id = ? ORDER BY consultation_date DESC LIMIT 5").all(contextData.patientId);
      const vaccines = db.prepare("SELECT * FROM vaccines WHERE patient_id = ? ORDER BY application_date DESC").all(contextData.patientId);
      const labs = db.prepare("SELECT * FROM lab_orders WHERE patient_id = ? ORDER BY order_date DESC LIMIT 3").all(contextData.patientId);

      contextualInfo = `
PACIENTE ACTUAL EN CONSULTA:
- Nombre: ${p?.name || "Desconocido"} | Especie: ${p?.species || "Canino"} | Raza: ${p?.breed || "Mestizo"} | Sexo: ${p?.sex || "N/D"}
- Fecha Nac.: ${p?.birthdate || "N/D"} | Peso actual: ${p?.weight || "N/D"} kg | Microchip: ${p?.microchip || "N/A"}
- Alergias / Intolerancias conocidas: ${p?.allergies || "Ninguna registrada"}
- Antecedentes / Notas: ${p?.notes || "Sin notas"}
- Historial de Consultas Recientes: ${JSON.stringify(consults.map(c => ({ fecha: c.consultation_date, motivo: c.reason, diag: c.diagnosis, trat: c.treatment })))}
- Registro Vacunal: ${JSON.stringify(vaccines.map(v => ({ vacuna: v.vaccine_name, fecha: v.application_date, proxima: v.next_due_date })))}
- Órdenes de Laboratorio: ${JSON.stringify(labs.map(l => ({ orden: l.order_number, panel: l.panel, fecha: l.order_date, estado: l.status })))}
`;
    } else if (contextType === "lab_order" && contextData?.orderId) {
      const order = db.prepare("SELECT * FROM lab_orders WHERE id = ?").get(contextData.orderId);
      const items = db.prepare("SELECT * FROM lab_order_items WHERE order_id = ?").all(contextData.orderId);
      let patient = null;
      if (order) {
        patient = db.prepare("SELECT * FROM patients WHERE id = ?").get(order.patient_id);
      }

      contextualInfo = `
ANÁLISIS DE LABORATORIO REGISTRADO:
- Orden: ${order?.order_number} | Panel: ${order?.panel} | Fecha: ${order?.order_date} | Estado: ${order?.status}
- Paciente: ${patient?.name || "N/D"} (${patient?.species}, ${patient?.breed}, Peso: ${patient?.weight} kg)
- Indicaciones Clínicas: ${order?.indications || "Control rutinario"}
- Parámetros Obtenidos:
${items.map(it => `  * ${it.test_name} (${it.category}): ${it.result_value ?? it.result_text} ${it.unit || ""} [Ref: ${it.reference_min ?? "—"} a ${it.reference_max ?? "—"}] -> Estado: ${it.status}`).join("\n")}
`;
    } else if (contextType === "clinic_summary") {
      const patientCount = db.prepare("SELECT COUNT(*) as c FROM patients").get().c;
      const hospCount = db.prepare("SELECT COUNT(*) as c FROM hospitalizations WHERE status = 'Hospitalizado'").get().c;
      const lowStock = db.prepare("SELECT name, stock, minimum_stock FROM inventory WHERE active = 1 AND stock <= minimum_stock LIMIT 10").all();
      const todayAppts = db.prepare("SELECT a.*, p.name as patient_name FROM appointments a LEFT JOIN patients p ON p.id = a.patient_id WHERE a.appointment_date = DATE('now')").all();

      contextualInfo = `
RESUMEN OPERATIVO ACTUAL DE LA CLÍNICA:
- Pacientes registrados en base de datos: ${patientCount}
- Pacientes actualmente hospitalizados: ${hospCount}
- Medicamentos / Insumos con stock crítico: ${JSON.stringify(lowStock)}
- Citas programadas para hoy: ${JSON.stringify(todayAppts.map(a => ({ hora: a.appointment_time, paciente: a.patient_name, tipo: a.type, estado: a.status })))}
`;
    }

    const ai = getGenAI();

    if (!ai) {
      // Modo Asistido Local en caso de ausencia temporal de GEMINI_API_KEY
      return res.json({
        success: true,
        isFallback: true,
        response: generateOfflineResponse(prompt, role, contextType, contextualInfo),
        disclaimer: "Modo asistido local de respaldo. Para activar Gemini 3.5 Flash con Google Search y razonamiento clínico en tiempo real, añade GEMINI_API_KEY.",
      });
    }

    // Selección de System Instruction según el rol del chatbot
    const systemInstruction = ROLE_SYSTEM_INSTRUCTIONS[role] || ROLE_SYSTEM_INSTRUCTIONS.general;

    // Construcción del hilo multi-turn preservando el historial
    const contents = [];

    // Si hay historial previo, formatearlo para @google/genai
    if (Array.isArray(history) && history.length > 0) {
      for (const msg of history) {
        if (!msg.content) continue;
        const msgRole = msg.role === "assistant" || msg.role === "model" ? "model" : "user";
        contents.push({
          role: msgRole,
          parts: [{ text: msg.content }]
        });
      }
    }

    // Agregar el mensaje actual del usuario con su contexto clínico inyectado si aplica
    const userMessageContent = `${contextualInfo ? `--- DATOS DEL SISTEMA CLÍNICO ---\n${contextualInfo}\n---------------------------------\n\n` : ""}${prompt || "Por favor analiza la información proporcionada."}`;
    
    contents.push({
      role: "user",
      parts: [{ text: userMessageContent }]
    });

    // Configuración del modelo y herramientas según la tarea y requerimientos
    // Modelos definidos según la especificación:
    // - Tareas rápidas: gemini-3.1-flash-lite
    // - Tareas generales / Búsqueda web: gemini-3.5-flash (con herramienta googleSearch)
    // - Tareas complejas / razonamiento: gemini-3.1-pro-preview (con fallback a 3.5-flash)
    let candidateModels = [];
    const enableSearch = useSearchGrounding || role === "pharmacology_search";

    if (enableSearch) {
      // Para búsqueda web usamos gemini-3.5-flash con la herramienta googleSearch
      candidateModels = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.7-flash"];
    } else if (taskMode === "fast") {
      candidateModels = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.7-flash"];
    } else if (taskMode === "complex") {
      candidateModels = ["gemini-3.1-pro-preview", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.7-flash"];
    } else {
      // General por defecto
      candidateModels = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.7-flash"];
    }

    let aiResponseText = null;
    let successfulModel = null;
    let groundingSources = [];
    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        const config = {
          systemInstruction,
          temperature: taskMode === "fast" ? 0.2 : 0.4,
        };

        // Si se requiere Google Search Grounding y el modelo es compatible (gemini-3.5-flash / gemini-3.7-flash)
        if (enableSearch && (modelName === "gemini-3.5-flash" || modelName === "gemini-3.7-flash")) {
          config.tools = [{ googleSearch: {} }];
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config,
        });

        if (response && response.text) {
          aiResponseText = response.text;
          successfulModel = modelName;

          // Extraer fuentes y URLs del grounding si existen
          const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (chunks && Array.isArray(chunks)) {
            groundingSources = chunks
              .map(c => c.web)
              .filter(Boolean)
              .map(w => ({
                title: w.title || "Fuente Web",
                uri: w.uri || ""
              }))
              .filter(s => s.uri);
          }

          break;
        }
      } catch (err) {
        lastError = err;
        await new Promise((r) => setTimeout(r, 150));
      }
    }

    if (aiResponseText) {
      return res.json({
        success: true,
        isFallback: false,
        model: successfulModel,
        response: aiResponseText,
        sources: groundingSources,
        role,
        disclaimer: "Asistente clínico inteligente VetCare. Toda decisión terapéutica y prescripción farmacológica requiere la validación del médico veterinario responsable.",
      });
    }

    // Fallback asistido local si ningún modelo remoto respondió
    console.warn("Modelos de IA remota ocupados o no disponibles. Fallback local asistido:", lastError?.message);
    return res.json({
      success: true,
      isFallback: true,
      response: generateOfflineResponse(prompt, role, contextType, contextualInfo),
      sources: [],
      role,
      disclaimer: "Modo asistido local de respaldo temporal activado.",
    });
  } catch (error) {
    console.error("Error en Gemini Controller:", error);
    return res.json({
      success: true,
      isFallback: true,
      response: generateOfflineResponse(req.body?.prompt, req.body?.role, req.body?.contextType),
      sources: [],
      disclaimer: "Modo asistido local de respaldo activado.",
    });
  }
};

function generateOfflineResponse(prompt = "", role = "general", contextType = "", contextualInfo = "") {
  const pLower = (prompt || "").toLowerCase();

  if (role === "lab_specialist" || contextType === "lab_order" || pLower.includes("laboratorio") || pLower.includes("analisis") || pLower.includes("hemograma")) {
    return `### 🧪 Evaluación Clínica del Análisis de Laboratorio

**Interpretación Hematológica & Bioquímica:**
- Se ha analizado el panel de pruebas laboratoriales registrado en el sistema.
- Los parámetros cuantitativos se comparan con los intervalos de referencia de la especie.

**Puntos Clave a Considerar:**
1. **Función Renal y Hepática:** Monitorizar ALT, Fosfatasa Alcalina, Creatinina y Urea para descartar disfunción orgánica antes de instaurar tratamientos farmacológicos prolongados.
2. **Equilibrio Hidroelectrolítico:** Evaluar sodio, potasio y densidad urinaria para valorar hidratación y equilibrio ácido-base.
3. **Fórmula Leucocitaria:** Contrastar neutrofilia/linfopenia con la temperatura corporal y sintomatología clínica.

*Nota: Conéctate a Gemini 3.5 Flash para obtener diagnósticos diferenciales automáticos con búsqueda científica en tiempo real.*`;
  }

  if (role === "client_communication" || pLower.includes("alta") || pLower.includes("domicilio") || pLower.includes("propietario") || pLower.includes("receta")) {
    return `### 🐾 Pauta de Cuidados Domiciliarios para el Propietario

1. **Administración de Medicamentos:** Respetar estrictamente los horarios y las dosis prescritas por peso corporal. Administrar con comida salvo indicación contraria.
2. **Reposo y Confort:** Mantener a la mascota en un espacio cálido, seco, tranquilo y con agua fresca siempre disponible.
3. **Signos de Alarma Urgentes:** Contactar a la clínica de inmediato ante vómitos continuos, decaimiento severo, dificultad respiratoria o encías pálidas.
4. **Revisión de Control:** Se programa cita de seguimiento para evaluar la evolución clínica.`;
  }

  if (role === "pharmacology_search" || pLower.includes("dosis") || pLower.includes("medicamento") || pLower.includes("farmaco")) {
    return `### 💊 Orientación Farmacológica Veterinaria

- **Verificación de Dosis:** Calcular siempre el miligramaje exacto según el peso actualizado del paciente ($mg/kg$).
- **Seguridad por Especie:** Verificar contraindicaciones específicas en felinos y animales reproductores.
- **Vía de Administración:** Confirmar si el fármaco requiere administración intravenosa lenta, intramuscular o subcutánea.

*Recomendación:* Activa el modo de Búsqueda Web con Gemini 3.5 Flash para consultar literatura científica y fichas técnicas actualizadas.`;
  }

  return `### 🩺 Asistente Clínico VetCare

**Orientación General:**
- El sistema VetCare está sincronizado con la base de datos de pacientes, consultas, laboratorio, inventario y facturación.
- Puedes cambiar de rol en el selector superior (Laboratorio, Farmacología con Google Search, Comunicación al Propietario o Gestión).
- Puedes enviar preguntas sucesivas en este hilo para profundizar en el caso clínico.

*Recordatorio:* Toda indicación terapéutica debe ser validada por el médico veterinario a cargo.`;
}

