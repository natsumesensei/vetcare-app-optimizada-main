const db = require("../database/db");

// =======================
// VACUNAS
// =======================

function createVaccine(data) {
    const stmt = db.prepare(`
        INSERT INTO vaccines (
            patient_id,
            vaccine_name,
            application_date,
            next_due_date,
            veterinarian,
            batch,
            laboratory,
            observations
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
        data.patient_id,
        data.vaccine_name,
        data.application_date,
        data.next_due_date || null,
        data.veterinarian || null,
        data.batch || null,
        data.laboratory || null,
        data.observations || null
    );
}

function getVaccinesByPatient(patientId) {
    return db.prepare(`
        SELECT *
        FROM vaccines
        WHERE patient_id = ?
        ORDER BY application_date DESC
    `).all(patientId);
}

function deleteVaccine(id) {
    return db.prepare(`
        DELETE FROM vaccines
        WHERE id = ?
    `).run(id);
}

function updateVaccine(id, data) {
    return db.prepare(`
        UPDATE vaccines
        SET
            vaccine_name = ?,
            application_date = ?,
            next_due_date = ?,
            veterinarian = ?,
            batch = ?,
            laboratory = ?,
            observations = ?
        WHERE id = ?
    `).run(
        data.vaccine_name,
        data.application_date,
        data.next_due_date || null,
        data.veterinarian || null,
        data.batch || null,
        data.laboratory || null,
        data.observations || null,
        id
    );
}

module.exports = {
    createVaccine,
    getVaccinesByPatient,
    deleteVaccine,
    updateVaccine
};