const db = require("../database/db");
const { emptyToNull, toNumber, sendError } = require("../utils/values");

const SELECT = `
  SELECT a.*, p.name AS patient_name, p.species, p.owner_name AS patient_owner
  FROM appointments a
  LEFT JOIN patients p ON p.id = a.patient_id
`;

function payload(body) {
  return {
    patient_id: emptyToNull(body.patient_id),
    owner_name: emptyToNull(body.owner_name),
    appointment_date: emptyToNull(body.appointment_date),
    appointment_time: emptyToNull(body.appointment_time),
    duration_minutes: toNumber(body.duration_minutes, 30),
    type: body.type || "Consulta",
    status: body.status || "Programada",
    veterinarian: emptyToNull(body.veterinarian),
    reason: emptyToNull(body.reason),
    notes: emptyToNull(body.notes),
  };
}

exports.list = (req, res) => {
  try {
    const rows = db
      .prepare(`${SELECT} ORDER BY a.appointment_date DESC, a.appointment_time DESC`)
      .all();
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
};

exports.show = (req, res) => {
  try {
    const row = db.prepare(`${SELECT} WHERE a.id = ?`).get(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: "Cita no encontrada." });
    }
    res.json(row);
  } catch (error) {
    sendError(res, error);
  }
};

exports.store = (req, res) => {
  try {
    const p = payload(req.body);

    if (!p.appointment_date || !p.appointment_time) {
      return res.status(400).json({
        success: false,
        message: "La fecha y la hora son obligatorias.",
      });
    }

    const result = db
      .prepare(
        `INSERT INTO appointments (
          patient_id, owner_name, appointment_date, appointment_time,
          duration_minutes, type, status, veterinarian, reason, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        p.patient_id,
        p.owner_name,
        p.appointment_date,
        p.appointment_time,
        p.duration_minutes,
        p.type,
        p.status,
        p.veterinarian,
        p.reason,
        p.notes
      );

    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    sendError(res, error);
  }
};

exports.update = (req, res) => {
  try {
    const existing = db.prepare("SELECT id FROM appointments WHERE id = ?").get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Cita no encontrada." });
    }

    const p = payload(req.body);

    db.prepare(
      `UPDATE appointments SET
        patient_id = ?, owner_name = ?, appointment_date = ?, appointment_time = ?,
        duration_minutes = ?, type = ?, status = ?, veterinarian = ?, reason = ?, notes = ?
       WHERE id = ?`
    ).run(
      p.patient_id,
      p.owner_name,
      p.appointment_date,
      p.appointment_time,
      p.duration_minutes,
      p.type,
      p.status,
      p.veterinarian,
      p.reason,
      p.notes,
      req.params.id
    );

    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
};

exports.destroy = (req, res) => {
  try {
    db.prepare("DELETE FROM appointments WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
};
