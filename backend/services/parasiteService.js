const db = require("../database/db");

// =======================
// CONTROL PARASITARIO
// =======================

function create(data) {
    const stmt = db.prepare(`
        INSERT INTO parasite_control (
            patient_id,
            type,
            product,
            application_date,
            next_due_date,
            veterinarian,
            observations
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
        data.patient_id,
        data.type,
        data.product,
        data.application_date,
        data.next_due_date || null,
        data.veterinarian || null,
        data.observations || null
    );
}

function getByPatient(patientId) {
    return db.prepare(`
        SELECT *
        FROM parasite_control
        WHERE patient_id = ?
        ORDER BY application_date DESC
    `).all(patientId);
}

function remove(id) {
    return db.prepare(`
        DELETE FROM parasite_control
        WHERE id = ?
    `).run(id);
}

function update(id, data) {
    return db.prepare(`
        UPDATE parasite_control
        SET
            type = ?,
            product = ?,
            application_date = ?,
            next_due_date = ?,
            veterinarian = ?,
            observations = ?
        WHERE id = ?
    `).run(
        data.type,
        data.product,
        data.application_date,
        data.next_due_date || null,
        data.veterinarian || null,
        data.observations || null,
        id
    );
}

module.exports = {
    create,
    getByPatient,
    remove,
    update
};