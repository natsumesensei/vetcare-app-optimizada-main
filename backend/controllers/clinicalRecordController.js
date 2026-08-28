const db = require("../database/db");
const { emptyToNull, toNumber, sendError } = require("../utils/values");
const consultationController = require("./consultationController");

// --- LABORATORIOS ---

exports.listLabs = (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT * FROM lab_results
         WHERE patient_id = ?
         ORDER BY date DESC, id DESC`
      )
      .all(req.params.patientId);
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
};

exports.createLab = (req, res) => {
  try {
    const p = req.body;
    const min = p.reference_min != null && p.reference_min !== "" ? Number(p.reference_min) : null;
    const max = p.reference_max != null && p.reference_max !== "" ? Number(p.reference_max) : null;
    const value = p.result_value === "" || p.result_value == null ? null : Number(p.result_value);

    let interpretation = p.interpretation || "";
    if (value != null && min != null && max != null) {
      interpretation = value < min ? "Bajo" : value > max ? "Alto" : "Normal";
    }

    const result = db
      .prepare(
        `INSERT INTO lab_results(
          patient_id, date, panel, parameter, result_value, result_text, unit,
          reference_min, reference_max, interpretation, veterinarian, notes
        ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`
      )
      .run(
        req.params.patientId,
        p.date,
        emptyToNull(p.panel),
        p.parameter,
        value,
        emptyToNull(p.result_text),
        emptyToNull(p.unit),
        min,
        max,
        interpretation,
        emptyToNull(p.veterinarian),
        emptyToNull(p.notes)
      );

    res.status(201).json({ id: result.lastInsertRowid, interpretation });
  } catch (error) {
    sendError(res, error);
  }
};

// NUEVO: Editar resultado de laboratorio guardado
exports.updateLab = (req, res) => {
  try {
    const { id } = req.params;
    const p = req.body;
    const min = p.reference_min != null && p.reference_min !== "" ? Number(p.reference_min) : null;
    const max = p.reference_max != null && p.reference_max !== "" ? Number(p.reference_max) : null;
    const value = p.result_value === "" || p.result_value == null ? null : Number(p.result_value);

    let interpretation = p.interpretation || "";
    if (value != null && min != null && max != null) {
      interpretation = value < min ? "Bajo" : value > max ? "Alto" : "Normal";
    }

    const result = db
      .prepare(
        `UPDATE lab_results 
         SET date = ?, panel = ?, parameter = ?, result_value = ?, result_text = ?, 
             unit = ?, reference_min = ?, reference_max = ?, interpretation = ?, 
             veterinarian = ?, notes = ?
         WHERE id = ?`
      )
      .run(
        p.date,
        emptyToNull(p.panel),
        p.parameter,
        value,
        emptyToNull(p.result_text),
        emptyToNull(p.unit),
        min,
        max,
        interpretation,
        emptyToNull(p.veterinarian),
        emptyToNull(p.notes),
        id
      );

    if (result.changes === 0) {
      return res.status(404).json({ message: "Registro de laboratorio no encontrado." });
    }

    res.json({ message: "Laboratorio actualizado correctamente.", interpretation });
  } catch (error) {
    sendError(res, error);
  }
};

// NUEVO: Eliminar laboratorio
exports.deleteLab = (req, res) => {
  try {
    const result = db.prepare(`DELETE FROM lab_results WHERE id = ?`).run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ message: "Registro no encontrado." });
    }
    res.json({ message: "Registro eliminado correctamente." });
  } catch (error) {
    sendError(res, error);
  }
};

// --- PESO HISTÓRICO ---

exports.weightHistory = (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT *, measured_at AS measured_at, body_condition_score AS body_condition_score
         FROM weights
         WHERE patient_id = ?
         ORDER BY measured_at DESC`
      )
      .all(req.params.patientId);
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
};

exports.addWeight = (req, res) => {
  try {
    const p = req.body;
    const result = db
      .prepare(
        `INSERT INTO weights(patient_id, measured_at, weight, body_condition_score, notes)
         VALUES(?,?,?,?,?)`
      )
      .run(
        req.params.patientId,
        p.measured_at,
        toNumber(p.weight, 0),
        emptyToNull(p.body_condition_score),
        emptyToNull(p.notes)
      );
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    sendError(res, error);
  }
};

// NUEVO: Editar registro de peso guardado
exports.updateWeight = (req, res) => {
  try {
    const { id } = req.params;
    const p = req.body;
    const result = db
      .prepare(
        `UPDATE weights 
         SET measured_at = ?, weight = ?, body_condition_score = ?, notes = ?
         WHERE id = ?`
      )
      .run(
        p.measured_at,
        toNumber(p.weight, 0),
        emptyToNull(p.body_condition_score),
        emptyToNull(p.notes),
        id
      );

    if (result.changes === 0) {
      return res.status(404).json({ message: "Registro de peso no encontrado." });
    }

    res.json({ message: "Registro de peso actualizado correctamente." });
  } catch (error) {
    sendError(res, error);
  }
};

// NUEVO: Eliminar registro de peso
exports.deleteWeight = (req, res) => {
  try {
    const result = db.prepare(`DELETE FROM weights WHERE id = ?`).run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ message: "Registro no encontrado." });
    }
    res.json({ message: "Registro eliminado correctamente." });
  } catch (error) {
    sendError(res, error);
  }
};

// --- OTROS SERVICIOS ---

exports.vaccinationCertificate = (req, res) => {
  try {
    const patient = db
      .prepare(
        `SELECT p.*,
                p.owner_name AS owner_name,
                p.owner_phone AS owner_phone,
                p.owner_email AS owner_email,
                p.microchip AS microchip,
                p.birthdate AS birthdate
         FROM patients p
         WHERE p.id = ?`
      )
      .get(req.params.patientId);

    if (!patient) {
      return res.status(404).json({ message: "Paciente no encontrado." });
    }

    const vaccines = db
      .prepare(
        `SELECT *,
                vaccine_name,
                application_date AS application_date,
                next_due_date AS next_due_date,
                batch,
                laboratory
         FROM vaccines
         WHERE patient_id = ?
         ORDER BY application_date DESC, id DESC`
      )
      .all(req.params.patientId);

    res.json({ patient, vaccines });
  } catch (error) {
    sendError(res, error);
  }
};

exports.listConsultations = (req, res) => consultationController.list(req, res);