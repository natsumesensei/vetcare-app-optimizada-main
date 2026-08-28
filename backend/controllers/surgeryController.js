const db = require("../database/db");
const { emptyToNull, sendError } = require("../utils/values");

const SELECT = `
  SELECT s.*, p.name AS patient_name, p.species
  FROM surgeries s
  LEFT JOIN patients p ON p.id = s.patient_id
`;

function payload(body) {
  return {
    patient_id: emptyToNull(body.patient_id),
    surgery_date: emptyToNull(body.surgery_date),
    procedure: (body.procedure || "").trim(),
    surgeon: emptyToNull(body.surgeon),
    indication: emptyToNull(body.indication),
    preoperative_assessment: emptyToNull(body.preoperative_assessment),
    anesthesia_protocol: emptyToNull(body.anesthesia_protocol),
    findings: emptyToNull(body.findings),
    complications: emptyToNull(body.complications),
    postoperative_plan: emptyToNull(body.postoperative_plan),
    discharge_notes: emptyToNull(body.discharge_notes),
    status: body.status || "Programada",
  };
}

exports.list = (req, res) => {
  try {
    const { patient_id } = req.query;

    const rows = patient_id
      ? db
          .prepare(
            `${SELECT} WHERE s.patient_id = ? ORDER BY s.surgery_date DESC, s.id DESC`
          )
          .all(patient_id)
      : db.prepare(`${SELECT} ORDER BY s.surgery_date DESC, s.id DESC`).all();

    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
};

exports.show = (req, res) => {
  try {
    const row = db.prepare(`${SELECT} WHERE s.id = ?`).get(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: "Cirugía no encontrada." });
    }
    res.json(row);
  } catch (error) {
    sendError(res, error);
  }
};

exports.store = (req, res) => {
  try {
    const p = payload(req.body);

    if (!p.patient_id || !p.surgery_date || !p.procedure) {
      return res.status(400).json({
        success: false,
        message: "Paciente, fecha y procedimiento son obligatorios.",
      });
    }

    const result = db
      .prepare(
        `INSERT INTO surgeries (
          patient_id, surgery_date, procedure, surgeon, indication,
          preoperative_assessment, anesthesia_protocol, findings,
          complications, postoperative_plan, discharge_notes, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        p.patient_id,
        p.surgery_date,
        p.procedure,
        p.surgeon,
        p.indication,
        p.preoperative_assessment,
        p.anesthesia_protocol,
        p.findings,
        p.complications,
        p.postoperative_plan,
        p.discharge_notes,
        p.status
      );

    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    sendError(res, error);
  }
};

exports.update = (req, res) => {
  try {
    const existing = db.prepare("SELECT id FROM surgeries WHERE id = ?").get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Cirugía no encontrada." });
    }

    const p = payload(req.body);

    db.prepare(
      `UPDATE surgeries SET
        patient_id = ?, surgery_date = ?, procedure = ?, surgeon = ?, indication = ?,
        preoperative_assessment = ?, anesthesia_protocol = ?, findings = ?,
        complications = ?, postoperative_plan = ?, discharge_notes = ?, status = ?
       WHERE id = ?`
    ).run(
      p.patient_id,
      p.surgery_date,
      p.procedure,
      p.surgeon,
      p.indication,
      p.preoperative_assessment,
      p.anesthesia_protocol,
      p.findings,
      p.complications,
      p.postoperative_plan,
      p.discharge_notes,
      p.status,
      req.params.id
    );

    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
};

exports.destroy = (req, res) => {
  try {
    const result = db.prepare("DELETE FROM surgeries WHERE id = ?").run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "Cirugía no encontrada." });
    }
    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
};
