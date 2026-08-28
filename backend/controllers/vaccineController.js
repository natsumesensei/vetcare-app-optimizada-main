const vaccineService = require("../services/vaccineService");

// =======================
// CREAR VACUNA
// =======================
function create(req, res) {
    try {
        const result = vaccineService.createVaccine(req.body);
        res.json({
            success: true,
            id: result.lastInsertRowid
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
}

// =======================
// LISTAR POR PACIENTE
// =======================
function getByPatient(req, res) {
    try {
        const data = vaccineService.getVaccinesByPatient(req.params.patientId);
        res.json(data);
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
}

// =======================
// ELIMINAR
// =======================
function remove(req, res) {
    try {
        vaccineService.deleteVaccine(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
}

// =======================
// ACTUALIZAR
// =======================
function update(req, res) {
    try {
        vaccineService.updateVaccine(req.params.id, req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
}

module.exports = {
    create,
    getByPatient,
    remove,
    update
};