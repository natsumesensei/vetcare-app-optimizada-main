const db = require('../database/db');

const patientService = {
    // Obtener todos los pacientes
    getAllPatients: () => {
        return db.prepare("SELECT * FROM patients ORDER BY name ASC").all();
    },

    // Obtener un paciente por su ID
    getPatientById: (id) => {
        return db.prepare("SELECT * FROM patients WHERE id = ?").get(id);
    },

    // Crear un nuevo paciente
    createPatient: (data) => {
        const { name, species, breed, age, owner_name, owner_phone, history } = data;
        const stmt = db.prepare(`
            INSERT INTO patients (name, species, breed, age, owner_name, owner_phone, history)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(name, species, breed, age, owner_name, owner_phone, history);
    },

    // Actualizar un paciente
    updatePatient: (id, data) => {
        const { name, species, breed, age, owner_name, owner_phone, history } = data;
        const stmt = db.prepare(`
            UPDATE patients 
            SET name = ?, species = ?, breed = ?, age = ?, owner_name = ?, owner_phone = ?, history = ?
            WHERE id = ?
        `);
        return stmt.run(name, species, breed, age, owner_name, owner_phone, history, id);
    },

    // Eliminar un paciente
    deletePatient: (id) => {
        return db.prepare("DELETE FROM patients WHERE id = ?").run(id);
    }
};

module.exports = patientService;