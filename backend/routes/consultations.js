const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const consultationController = require("../controllers/consultationController");

// ===============================
// CONSULTAS
// ===============================

// Listar todas las consultas
router.get("/consultations", auth, (req, res) => {
  try {
    const rows = require("../database/db")
      .prepare(
        `SELECT c.*, p.name AS patient_name, p.species, p.breed, p.owner_name
         FROM consultations c
         LEFT JOIN patients p ON p.id = c.patient_id
         ORDER BY COALESCE(c.consultation_date, c.created_at) DESC`
      )
      .all();
    res.json(rows.map(r => ({
      ...r,
      date: r.consultation_date || r.date || (r.created_at ? r.created_at.slice(0, 10) : ""),
      notes: r.observations || r.notes || ""
    })));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Crear consulta (por paciente)
router.post("/:patientId/consultations", auth, consultationController.store);
router.post("/patients/:patientId/consultations", auth, consultationController.store);

// Listar consultas por paciente
router.get("/:patientId/consultations", auth, consultationController.list);
router.get("/patients/:patientId/consultations", auth, consultationController.list);

// Ver una consulta
router.get("/consultation/:id", auth, consultationController.show);
router.get("/consultations/:id", auth, consultationController.show);

// Actualizar consulta
router.put("/consultation/:id", auth, consultationController.update);
router.put("/consultations/:id", auth, consultationController.update);

// Eliminar consulta
router.delete("/consultation/:id", auth, consultationController.destroy);
router.delete("/consultations/:id", auth, consultationController.destroy);

module.exports = router;