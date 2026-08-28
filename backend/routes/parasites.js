const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const controller = require("../controllers/parasiteController");

// Crear
router.post("/", auth, controller.create);

// Obtener por paciente
router.get("/patient/:patientId", auth, controller.getByPatient);

// Actualizar
router.put("/:id", auth, controller.update);

// Eliminar
router.delete("/:id", auth, controller.remove);

module.exports = router;