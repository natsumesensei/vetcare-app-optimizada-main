const service = require("../services/parasiteService");

// Crear
function create(req, res) {
    try {
        const result = service.create(req.body);
        res.json({ success: true, id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}

// Obtener por paciente
function getByPatient(req, res) {
    try {
        const data = service.getByPatient(req.params.patientId);
        res.json(data);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}

// Eliminar
function remove(req, res) {
    try {
        service.remove(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}

// Actualizar
function update(req, res) {
    try {
        service.update(req.params.id, req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}

module.exports = {
    create,
    getByPatient,
    remove,
    update
};