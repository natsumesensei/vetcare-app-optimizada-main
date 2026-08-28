const db = require("../database/db");


// ===============================
// NORMALIZAR CONSULTA
// ===============================
function normalizeRow(row) {
  if (!row) return null;
  const dateVal = row.consultation_date || row.date || (row.created_at ? row.created_at.slice(0, 10) : "");
  return {
    ...row,
    date: dateVal,
    consultation_date: dateVal,
    observations: row.observations || row.notes || "",
    notes: row.observations || row.notes || "",
  };
}

// ===============================
// CREAR CONSULTA
// ===============================
function create(data) {
  if (!data || !data.patient_id) {
    throw new Error("patient_id es requerido");
  }

  const dateVal = data.date || data.consultation_date || new Date().toISOString().substring(0, 10);
  const obsVal = data.observations || data.notes || "";

  return db.prepare(`
    INSERT INTO consultations (
      patient_id,
      consultation_date,
      veterinarian,
      reason,
      clinical_signs,
      temperature,
      heart_rate,
      respiratory_rate,
      weight,
      diagnosis,
      treatment,
      observations
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.patient_id,
    dateVal,
    data.veterinarian || "",
    data.reason || "",
    data.clinical_signs || "",
    data.temperature !== "" && data.temperature != null ? Number(data.temperature) : null,
    data.heart_rate !== "" && data.heart_rate != null ? Number(data.heart_rate) : null,
    data.respiratory_rate !== "" && data.respiratory_rate != null ? Number(data.respiratory_rate) : null,
    data.weight !== "" && data.weight != null ? Number(data.weight) : null,
    data.diagnosis || "",
    data.treatment || "",
    obsVal
  );
}

// ===============================
// LISTAR POR PACIENTE
// ===============================
function getByPatient(patientId) {
  const rows = db.prepare(`
    SELECT *
    FROM consultations
    WHERE patient_id = ?
    ORDER BY COALESCE(consultation_date, created_at) DESC, id DESC
  `).all(patientId);

  return rows.map(normalizeRow);
}

// ===============================
// OBTENER UNA CONSULTA
// ===============================
function getById(id) {
  const row = db.prepare(`
    SELECT *
    FROM consultations
    WHERE id = ?
  `).get(id);

  return normalizeRow(row);
}

// ===============================
// ACTUALIZAR CONSULTA
// ===============================
function update(id, data) {
  const dateVal = data.date || data.consultation_date || new Date().toISOString().substring(0, 10);
  const obsVal = data.observations || data.notes || "";

  return db.prepare(`
    UPDATE consultations
    SET
      consultation_date = ?,
      veterinarian = ?,
      reason = ?,
      clinical_signs = ?,
      temperature = ?,
      heart_rate = ?,
      respiratory_rate = ?,
      weight = ?,
      diagnosis = ?,
      treatment = ?,
      observations = ?
    WHERE id = ?
  `).run(
    dateVal,
    data.veterinarian || "",
    data.reason || "",
    data.clinical_signs || "",
    data.temperature !== "" && data.temperature != null ? Number(data.temperature) : null,
    data.heart_rate !== "" && data.heart_rate != null ? Number(data.heart_rate) : null,
    data.respiratory_rate !== "" && data.respiratory_rate != null ? Number(data.respiratory_rate) : null,
    data.weight !== "" && data.weight != null ? Number(data.weight) : null,
    data.diagnosis || "",
    data.treatment || "",
    obsVal,
    id
  );
}

// ===============================
// ELIMINAR CONSULTA
// ===============================
function remove(id) {
  return db.prepare(`
    DELETE FROM consultations
    WHERE id = ?
  `).run(id);
}

module.exports = {
  create,
  getByPatient,
  getById,
  update,
  remove
};