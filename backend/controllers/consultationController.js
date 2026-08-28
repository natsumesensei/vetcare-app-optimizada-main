const consultationService = require("../services/consultationService");

// ===============================
// LISTAR POR PACIENTE
// ===============================
exports.list = (req, res) => {
  try {
    const data = consultationService.getByPatient(req.params.patientId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// VER UNA CONSULTA
// ===============================
exports.show = (req, res) => {
  try {
    const data = consultationService.getById(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Consulta no encontrada"
      });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// CREAR CONSULTA
// ===============================
exports.store = (req, res) => {
  try {
    const patientId = req.params.patientId;

    const data = {
      ...req.body,
      patient_id: patientId,
    };

    const result = consultationService.create(data);

    res.status(201).json({
      success: true,
      id: result.lastInsertRowid
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// ACTUALIZAR CONSULTA
// ===============================
exports.update = (req, res) => {
  try {
    consultationService.update(req.params.id, req.body);

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// ELIMINAR CONSULTA
// ===============================
exports.destroy = (req, res) => {
  try {
    consultationService.remove(req.params.id);

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};