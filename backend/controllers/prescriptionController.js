const db = require("../database/db");
const { emptyToNull, sendError } = require("../utils/values");

const PATIENT_FIELDS = `
  p.name AS patient_name,
  p.species,
  p.breed,
  p.sex,
  p.microchip,
  p.owner_name,
  p.owner_phone,
  p.owner_email,
  p.owner_name AS owner_name,
  p.owner_phone AS owner_phone,
  p.owner_email AS owner_email,
  p.microchip AS microchip
`;

exports.list = (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT pr.*, p.name AS patient_name
         FROM prescriptions pr
         JOIN patients p ON p.id = pr.patient_id
         WHERE pr.patient_id = ?
         ORDER BY pr.id DESC`
      )
      .all(req.params.patientId);
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
};

exports.show = (req, res) => {
  try {
    const row = db
      .prepare(
        `SELECT pr.*, ${PATIENT_FIELDS}
         FROM prescriptions pr
         JOIN patients p ON p.id = pr.patient_id
         WHERE pr.id = ?`
      )
      .get(req.params.id);

    if (!row) {
      return res.status(404).json({ message: "Receta no encontrada." });
    }
    res.json(row);
  } catch (error) {
    sendError(res, error);
  }
};

exports.store = (req, res) => {
  try {
    const p = req.body;
    if (!p.medication) {
      return res.status(400).json({
        success: false,
        message: "El medicamento es obligatorio.",
      });
    }

    const result = db
      .prepare(
        `INSERT INTO prescriptions(
          patient_id, consultation_id, medication, concentration, dose, route,
          frequency, duration, quantity, instructions, start_date, end_date,
          veterinarian, status
        ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
      )
      .run(
        req.params.patientId,
        emptyToNull(p.consultation_id),
        p.medication,
        emptyToNull(p.concentration),
        emptyToNull(p.dose),
        emptyToNull(p.route) || "Oral",
        emptyToNull(p.frequency),
        emptyToNull(p.duration),
        emptyToNull(p.quantity),
        emptyToNull(p.instructions),
        emptyToNull(p.start_date),
        emptyToNull(p.end_date),
        emptyToNull(p.veterinarian),
        p.status || "Activa"
      );

    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    sendError(res, error);
  }
};

exports.update = (req, res) => {
  try {
    const p = req.body;
    if (!p.medication) {
      return res.status(400).json({
        success: false,
        message: "El medicamento es obligatorio.",
      });
    }

    const result = db
      .prepare(
        `UPDATE prescriptions SET
          medication = ?, concentration = ?, dose = ?, route = ?,
          frequency = ?, duration = ?, quantity = ?, instructions = ?,
          start_date = ?, end_date = ?, veterinarian = ?, status = ?
         WHERE id = ?`
      )
      .run(
        p.medication,
        emptyToNull(p.concentration),
        emptyToNull(p.dose),
        emptyToNull(p.route) || "Oral",
        emptyToNull(p.frequency),
        emptyToNull(p.duration),
        emptyToNull(p.quantity),
        emptyToNull(p.instructions),
        emptyToNull(p.start_date),
        emptyToNull(p.end_date),
        emptyToNull(p.veterinarian),
        p.status || "Activa",
        req.params.id
      );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "Receta no encontrada." });
    }

    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
};

exports.destroy = (req, res) => {
  try {
    db.prepare("DELETE FROM prescriptions WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
};
