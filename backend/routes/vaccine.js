const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const vaccineController = require("../controllers/vaccineController");

// =======================
// VACUNAS
// =======================

// Crear vacuna
router.post("/", auth, vaccineController.create);

// Obtener vacunas por paciente
router.get("/patient/:patientId", auth, vaccineController.getByPatient);

// Actualizar vacuna
router.put("/:id", auth, vaccineController.update);

// Eliminar vacuna
router.delete("/:id", auth, vaccineController.remove);

module.exports = router;