const db = require("../database/db");
const { emptyToNull, sendError } = require("../utils/values");

const SELECT = `
  SELECT h.*, p.name AS patient_name, p.species
  FROM hospitalizations h
  LEFT JOIN patients p ON p.id = h.patient_id
`;

function payload(body) {
  return {
    patient_id: emptyToNull(body.patient_id),
    admission_date: emptyToNull(body.admission_date),
    discharge_date: emptyToNull(body.discharge_date),
    reason: emptyToNull(body.reason),
    cage: emptyToNull(body.cage),
    status: body.status || "Hospitalizado",
    treatment_plan: emptyToNull(body.treatment_plan),
    nursing_notes: emptyToNull(body.nursing_notes),
    discharge_instructions: emptyToNull(body.discharge_instructions),
  };
}

exports.list = (req, res) => {
  try {
    const rows = db
      .prepare(`${SELECT} ORDER BY h.admission_date DESC, h.id DESC`)
      .all();
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
};

exports.show = (req, res) => {
  try {
    const row = db.prepare(`${SELECT} WHERE h.id = ?`).get(req.params.id);
    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Hospitalización no encontrada.",
      });
    }
    res.json(row);
  } catch (error) {
    sendError(res, error);
  }
};

exports.store = (req, res) => {
  try {
    const p = payload(req.body);

    if (!p.patient_id || !p.admission_date) {
      return res.status(400).json({
        success: false,
        message: "Paciente y fecha de ingreso son obligatorios.",
      });
    }

    const result = db
      .prepare(
        `INSERT INTO hospitalizations (
          patient_id, admission_date, discharge_date, reason, cage,
          status, treatment_plan, nursing_notes, discharge_instructions
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        p.patient_id,
        p.admission_date,
        p.discharge_date,
        p.reason,
        p.cage,
        p.status,
        p.treatment_plan,
        p.nursing_notes,
        p.discharge_instructions
      );

    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    sendError(res, error);
  }
};

exports.update = (req, res) => {
  try {
    const existing = db
      .prepare("SELECT id FROM hospitalizations WHERE id = ?")
      .get(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Hospitalización no encontrada.",
      });
    }

    const p = payload(req.body);

    db.prepare(
      `UPDATE hospitalizations SET
        patient_id = ?, admission_date = ?, discharge_date = ?, reason = ?,
        cage = ?, status = ?, treatment_plan = ?, nursing_notes = ?,
        discharge_instructions = ?
       WHERE id = ?`
    ).run(
      p.patient_id,
      p.admission_date,
      p.discharge_date,
      p.reason,
      p.cage,
      p.status,
      p.treatment_plan,
      p.nursing_notes,
      p.discharge_instructions,
      req.params.id
    );

    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
};

exports.destroy = (req, res) => {
  try {
    db.prepare("DELETE FROM hospitalizations WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
};
