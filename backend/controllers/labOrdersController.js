const db = require("../database/db");
const { today, sendError } = require("../utils/values");

// Helper para calcular estado del parámetro analítico
function computeStatus(val, min, max, explicitStatus) {
  if (explicitStatus && explicitStatus !== "PENDIENTE") {
    return explicitStatus;
  }
  if (val === null || val === undefined || isNaN(Number(val))) {
    return explicitStatus || "NORMAL";
  }
  const num = Number(val);
  const minNum = min != null && min !== "" ? Number(min) : null;
  const maxNum = max != null && max !== "" ? Number(max) : null;

  if (minNum != null && num < minNum) {
    if (num < minNum * 0.7) return "CRITICO";
    return "BAJO";
  }
  if (maxNum != null && num > maxNum) {
    if (num > maxNum * 1.4) return "CRITICO";
    return "ALTO";
  }
  return "NORMAL";
}

// 1. Listar Órdenes de Laboratorio
exports.list = (req, res) => {
  try {
    const { patientId, status, search, panel } = req.query;
    let query = `
      SELECT 
        o.*,
        p.name AS patient_name,
        p.species AS patient_species,
        p.breed AS patient_breed,
        p.microchip AS patient_microchip,
        p.owner_name AS owner_name,
        p.owner_phone AS owner_phone,
        (SELECT COUNT(*) FROM lab_order_items WHERE order_id = o.id) AS total_items,
        (SELECT COUNT(*) FROM lab_order_items WHERE order_id = o.id AND status IN ('ALTO', 'BAJO', 'CRITICO')) AS abnormal_items
      FROM lab_orders o
      LEFT JOIN patients p ON p.id = o.patient_id
      WHERE 1=1
    `;
    const params = [];

    if (patientId) {
      query += " AND o.patient_id = ?";
      params.push(patientId);
    }
    if (status && status !== "all") {
      query += " AND o.status = ?";
      params.push(status);
    }
    if (panel && panel !== "all") {
      query += " AND o.panel = ?";
      params.push(panel);
    }
    if (search) {
      query += " AND (o.order_number LIKE ? OR p.name LIKE ? OR p.owner_name LIKE ? OR o.panel LIKE ?)";
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += " ORDER BY o.order_date DESC, o.id DESC";

    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
};

// 2. Obtener una Orden Completa con Items y Datos de la Clínica
exports.show = (req, res) => {
  try {
    const order = db
      .prepare(
        `SELECT 
          o.*,
          p.name AS patient_name,
          p.species AS patient_species,
          p.breed AS patient_breed,
          p.sex AS patient_sex,
          p.birthdate AS patient_birthdate,
          p.weight AS patient_weight,
          p.microchip AS patient_microchip,
          p.allergies AS patient_allergies,
          p.owner_name AS owner_name,
          p.owner_phone AS owner_phone,
          p.owner_email AS owner_email,
          p.address AS owner_address
         FROM lab_orders o
         LEFT JOIN patients p ON p.id = o.patient_id
         WHERE o.id = ?`
      )
      .get(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Orden de laboratorio no encontrada." });
    }

    order.items = db
      .prepare("SELECT * FROM lab_order_items WHERE order_id = ? ORDER BY id")
      .all(req.params.id);

    const clinic = db.prepare("SELECT * FROM settings ORDER BY id LIMIT 1").get();
    order.clinic = clinic || {};

    res.json(order);
  } catch (error) {
    sendError(res, error);
  }
};

// 3. Crear Nueva Orden de Laboratorio
exports.create = (req, res) => {
  try {
    const p = req.body;
    const items = Array.isArray(p.items) ? p.items : [];

    // Generar número de orden si no viene dado
    let orderNumber = p.order_number;
    if (!orderNumber) {
      const year = new Date().getFullYear();
      const count = db.prepare("SELECT COUNT(*) c FROM lab_orders").get().c + 1;
      orderNumber = `LAB-${year}-${String(count).padStart(4, "0")}`;
    }

    const tx = db.transaction(() => {
      const result = db
        .prepare(
          `INSERT INTO lab_orders (
            order_number, patient_id, order_date, veterinarian,
            sample_type, panel, status, indications, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          orderNumber,
          p.patient_id,
          p.order_date || today(),
          p.veterinarian || "Equipo Veterinario",
          p.sample_type || "Sangre entera",
          p.panel || "General",
          p.status || "Completado",
          p.indications || null,
          p.notes || null
        );

      const orderId = result.lastInsertRowid;

      const insertItem = db.prepare(`
        INSERT INTO lab_order_items (
          order_id, test_name, category, unit, result_value,
          result_text, reference_min, reference_max, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const it of items) {
        const val = it.result_value !== "" && it.result_value != null ? Number(it.result_value) : null;
        const min = it.reference_min !== "" && it.reference_min != null ? Number(it.reference_min) : null;
        const max = it.reference_max !== "" && it.reference_max != null ? Number(it.reference_max) : null;
        const status = computeStatus(val, min, max, it.status);

        insertItem.run(
          orderId,
          it.test_name || "Parámetro",
          it.category || "General",
          it.unit || null,
          val,
          it.result_text || null,
          min,
          max,
          status,
          it.notes || null
        );
      }

      return orderId;
    });

    const createdId = tx();
    res.status(201).json({ id: createdId, order_number: orderNumber, success: true });
  } catch (error) {
    sendError(res, error);
  }
};

// 4. Actualizar Orden de Laboratorio y sus Resultados
exports.update = (req, res) => {
  try {
    const { id } = req.params;
    const p = req.body;
    const items = Array.isArray(p.items) ? p.items : [];

    const tx = db.transaction(() => {
      db.prepare(
        `UPDATE lab_orders SET
          order_date = ?,
          veterinarian = ?,
          sample_type = ?,
          panel = ?,
          status = ?,
          indications = ?,
          notes = ?
         WHERE id = ?`
      ).run(
        p.order_date,
        p.veterinarian,
        p.sample_type,
        p.panel,
        p.status,
        p.indications,
        p.notes,
        id
      );

      // Reemplazar items si se envían
      if (items.length > 0) {
        db.prepare("DELETE FROM lab_order_items WHERE order_id = ?").run(id);

        const insertItem = db.prepare(`
          INSERT INTO lab_order_items (
            order_id, test_name, category, unit, result_value,
            result_text, reference_min, reference_max, status, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const it of items) {
          const val = it.result_value !== "" && it.result_value != null ? Number(it.result_value) : null;
          const min = it.reference_min !== "" && it.reference_min != null ? Number(it.reference_min) : null;
          const max = it.reference_max !== "" && it.reference_max != null ? Number(it.reference_max) : null;
          const status = computeStatus(val, min, max, it.status);

          insertItem.run(
            id,
            it.test_name || "Parámetro",
            it.category || "General",
            it.unit || null,
            val,
            it.result_text || null,
            min,
            max,
            status,
            it.notes || null
          );
        }
      }
    });

    tx();
    res.json({ success: true, message: "Orden de laboratorio actualizada correctamente." });
  } catch (error) {
    sendError(res, error);
  }
};

// 5. Eliminar Orden de Laboratorio
exports.destroy = (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM lab_order_items WHERE order_id = ?").run(id);
    const result = db.prepare("DELETE FROM lab_orders WHERE id = ?").run(id);
    if (result.changes === 0) {
      return res.status(404).json({ message: "Orden no encontrada." });
    }
    res.json({ success: true, message: "Orden eliminada." });
  } catch (error) {
    sendError(res, error);
  }
};

// 6. Catálogo de Valores de Referencia
exports.listReferences = (req, res) => {
  try {
    const { species, category, search } = req.query;
    let query = "SELECT * FROM clinical_reference_values WHERE 1=1";
    const params = [];

    if (species && species !== "all") {
      query += " AND species = ?";
      params.push(species);
    }
    if (category && category !== "all") {
      query += " AND category = ?";
      params.push(category);
    }
    if (search) {
      query += " AND (parameter LIKE ? OR notes LIKE ? OR source LIKE ?)";
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += " ORDER BY species, category, parameter";
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
};

exports.createReference = (req, res) => {
  try {
    const p = req.body;
    const result = db
      .prepare(
        `INSERT INTO clinical_reference_values (
          species, category, parameter, unit, min_value, max_value, source, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        p.species || "dog",
        p.category || "Bioquímica",
        p.parameter,
        p.unit || null,
        p.min_value !== "" && p.min_value != null ? Number(p.min_value) : null,
        p.max_value !== "" && p.max_value != null ? Number(p.max_value) : null,
        p.source || "Manual de Laboratorio Clínico",
        p.notes || null
      );
    res.status(201).json({ id: result.lastInsertRowid, success: true });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateReference = (req, res) => {
  try {
    const { id } = req.params;
    const p = req.body;
    db.prepare(
      `UPDATE clinical_reference_values SET
        species = ?, category = ?, parameter = ?, unit = ?,
        min_value = ?, max_value = ?, source = ?, notes = ?
       WHERE id = ?`
    ).run(
      p.species,
      p.category,
      p.parameter,
      p.unit || null,
      p.min_value !== "" && p.min_value != null ? Number(p.min_value) : null,
      p.max_value !== "" && p.max_value != null ? Number(p.max_value) : null,
      p.source || null,
      p.notes || null,
      id
    );
    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteReference = (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM clinical_reference_values WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
};

// 7. Plantillas predefinidas según especie y panel
exports.getPanelTemplates = (req, res) => {
  try {
    const species = req.query.species === "cat" ? "cat" : "dog";
    const refRows = db.prepare("SELECT * FROM clinical_reference_values WHERE species = ?").all(species);

    const findRef = (param) => refRows.find((r) => r.parameter.toLowerCase().includes(param.toLowerCase())) || null;

    const templates = {
      hemogram: {
        title: "Hemograma Completo",
        sample: "Sangre entera con EDTA",
        items: ["Hematocrito", "Hemoglobina", "Eritrocitos", "VCM", "Leucocitos", "Plaquetas"].map((name) => {
          const r = findRef(name);
          return {
            test_name: name,
            category: "Hematología",
            unit: r?.unit || "",
            reference_min: r?.min_value ?? "",
            reference_max: r?.max_value ?? "",
            result_value: "",
            result_text: "",
            status: "NORMAL",
            notes: "",
          };
        }),
      },
      biochemistry_basic: {
        title: "Perfil Bioquímico Básico",
        sample: "Suero sanguíneo o Plasma",
        items: ["ALT", "Creatinina", "Urea nitrogenada", "Glucosa", "Proteínas totales"].map((name) => {
          const r = findRef(name);
          return {
            test_name: name,
            category: "Bioquímica",
            unit: r?.unit || "",
            reference_min: r?.min_value ?? "",
            reference_max: r?.max_value ?? "",
            result_value: "",
            result_text: "",
            status: "NORMAL",
            notes: "",
          };
        }),
      },
      renal: {
        title: "Perfil Renal y Electrolitos",
        sample: "Suero sanguíneo",
        items: ["Creatinina", "Urea nitrogenada", "Fósforo", "Potasio", "Sodio", "Cloro"].map((name) => {
          const r = findRef(name);
          return {
            test_name: name,
            category: "Bioquímica",
            unit: r?.unit || "",
            reference_min: r?.min_value ?? "",
            reference_max: r?.max_value ?? "",
            result_value: "",
            result_text: "",
            status: "NORMAL",
            notes: "",
          };
        }),
      },
      hepatic: {
        title: "Perfil Hepático Completo",
        sample: "Suero sanguíneo",
        items: ["ALT", "Fosfatasa Alcalina (FA)", "GGT", "Bilirrubina total", "Albúmina", "Colesterol"].map((name) => {
          const r = findRef(name);
          return {
            test_name: name,
            category: "Bioquímica",
            unit: r?.unit || "",
            reference_min: r?.min_value ?? "",
            reference_max: r?.max_value ?? "",
            result_value: "",
            result_text: "",
            status: "NORMAL",
            notes: "",
          };
        }),
      },
      urinalysis: {
        title: "Urianálisis Completo",
        sample: "Orina fresca (cistocentesis / micción espontánea)",
        items: ["Densidad urinaria", "pH Urinario"].map((name) => {
          const r = findRef(name);
          return {
            test_name: name,
            category: "Urianálisis",
            unit: r?.unit || "",
            reference_min: r?.min_value ?? "",
            reference_max: r?.max_value ?? "",
            result_value: "",
            result_text: "",
            status: "NORMAL",
            notes: "",
          };
        }),
      },
    };

    res.json(templates);
  } catch (error) {
    sendError(res, error);
  }
};
