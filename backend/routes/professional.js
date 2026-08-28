const express = require("express");
const auth = require("../middleware/auth");

const prescriptions = require("../controllers/prescriptionController");
const settings = require("../controllers/settingsController");
const records = require("../controllers/clinicalRecordController");
const c = require("../controllers/professionalController");
const labOrders = require("../controllers/labOrdersController");
const search = require("../controllers/searchController");
const notifications = require("../controllers/notificationsController");
const gemini = require("../controllers/geminiController");

const router = express.Router();

// 1. Recetas
router.get("/patients/:patientId/prescriptions", auth, prescriptions.list);
router.post("/patients/:patientId/prescriptions", auth, prescriptions.store);
router.get("/prescriptions/:id", auth, prescriptions.show);
router.put("/prescriptions/:id", auth, prescriptions.update);
router.delete("/prescriptions/:id", auth, prescriptions.destroy);

// 2. Sistema de Laboratorio
router.get("/lab-orders", auth, labOrders.list);
router.get("/lab-orders/templates", auth, labOrders.getPanelTemplates);
router.get("/lab-orders/:id", auth, labOrders.show);
router.post("/lab-orders", auth, labOrders.create);
router.put("/lab-orders/:id", auth, labOrders.update);
router.delete("/lab-orders/:id", auth, labOrders.destroy);

// Catálogo de valores de referencia
router.get("/reference-values", auth, labOrders.listReferences);
router.post("/reference-values", auth, labOrders.createReference);
router.put("/reference-values/:id", auth, labOrders.updateReference);
router.delete("/reference-values/:id", auth, labOrders.deleteReference);

// Compatibilidad histórica de laboratorios por paciente
router.get("/patients/:patientId/labs", auth, records.listLabs);
router.post("/patients/:patientId/labs", auth, records.createLab);
router.put("/labs/:id", auth, records.updateLab);
router.delete("/labs/:id", auth, records.deleteLab);

// 3. Configuración y Copia de Seguridad
router.get("/settings", auth, settings.show);
router.put("/settings", auth, settings.update);
router.get("/settings/backup", auth, settings.exportBackup);

// 4. Pesos y certificados
router.get("/patients/:patientId/weights", auth, records.weightHistory);
router.post("/patients/:patientId/weights", auth, records.addWeight);
router.get(
  "/patients/:patientId/vaccination-certificate",
  auth,
  records.vaccinationCertificate
);

// 5. Facturación
router.get("/invoices", auth, c.listInvoices);
router.get("/invoices/:id", auth, c.getInvoice);
router.post("/invoices", auth, c.createInvoice);
router.put("/invoices/:id", auth, c.updateInvoice);
router.patch("/invoices/:id/status", auth, c.updateInvoiceStatus);
router.delete("/invoices/:id", auth, c.deleteInvoice);

// 6. Anestesia
router.get("/anesthesia", auth, c.listAnesthesia);
router.get("/anesthesia/:id", auth, c.getAnesthesia);
router.post("/anesthesia", auth, c.createAnesthesia);
router.put("/anesthesia/:id", auth, c.updateAnesthesia);
router.get("/anesthesia/:id/monitoring", auth, c.listMonitoring);
router.post("/anesthesia/:id/monitoring", auth, c.createMonitoring);
router.delete("/anesthesia-monitoring/:id", auth, c.deleteMonitoring);

// 7. Buscador Global
router.get("/search", auth, search.globalSearch);

// 8. Centro de Notificaciones
router.get("/notifications", auth, notifications.list);
router.post("/notifications/read", auth, notifications.markAsRead);
router.post("/notifications/read-all", auth, notifications.markAllAsRead);

// 9. Asistente IA VetCare (Gemini Server-side)
router.post("/gemini/assistant", auth, gemini.handleAssistant);

module.exports = router;
