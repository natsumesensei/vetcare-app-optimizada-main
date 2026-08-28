const db = require("../database/db");
const { sendError } = require("../utils/values");

exports.globalSearch = (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q || q.length < 1) {
      return res.json({
        patients: [],
        appointments: [],
        invoices: [],
        inventory: [],
        surgeries: [],
        hospitalizations: [],
        lab_orders: [],
      });
    }

    const term = `%${q}%`;

    // 1. Pacientes
    const patients = db
      .prepare(
        `SELECT id, name, species, breed, microchip, owner_name, owner_phone
         FROM patients
         WHERE name LIKE ? OR microchip LIKE ? OR owner_name LIKE ? OR owner_phone LIKE ? OR breed LIKE ?
         ORDER BY id DESC LIMIT 6`
      )
      .all(term, term, term, term, term);

    // 2. Citas / Agenda
    const appointments = db
      .prepare(
        `SELECT a.id, a.appointment_date, a.appointment_time, a.type, a.status, a.reason,
                p.name AS patient_name, p.id AS patient_id, a.owner_name
         FROM appointments a
         LEFT JOIN patients p ON p.id = a.patient_id
         WHERE a.owner_name LIKE ? OR a.reason LIKE ? OR a.veterinarian LIKE ? OR p.name LIKE ?
         ORDER BY a.appointment_date DESC LIMIT 5`
      )
      .all(term, term, term, term);

    // 3. Facturas
    const invoices = db
      .prepare(
        `SELECT i.id, i.invoice_number, i.issue_date, i.total, i.currency, i.status,
                i.owner_name, p.name AS patient_name, p.id AS patient_id
         FROM invoices i
         LEFT JOIN patients p ON p.id = i.patient_id
         WHERE i.invoice_number LIKE ? OR i.owner_name LIKE ? OR p.name LIKE ?
         ORDER BY i.issue_date DESC LIMIT 5`
      )
      .all(term, term, term);

    // 4. Inventario / Medicamentos
    const inventory = db
      .prepare(
        `SELECT id, name, category, stock, unit, lot, expiry_date, sale_price
         FROM inventory
         WHERE name LIKE ? OR category LIKE ? OR lot LIKE ? OR supplier LIKE ?
         ORDER BY stock ASC LIMIT 5`
      )
      .all(term, term, term, term);

    // 5. Cirugías
    const surgeries = db
      .prepare(
        `SELECT s.id, s.procedure, s.surgery_date, s.surgeon, s.status,
                p.name AS patient_name, p.id AS patient_id
         FROM surgeries s
         LEFT JOIN patients p ON p.id = s.patient_id
         WHERE s.procedure LIKE ? OR s.surgeon LIKE ? OR p.name LIKE ?
         ORDER BY s.surgery_date DESC LIMIT 4`
      )
      .all(term, term, term);

    // 6. Hospitalizaciones
    const hospitalizations = db
      .prepare(
        `SELECT h.id, h.admission_date, h.reason, h.cage, h.status,
                p.name AS patient_name, p.id AS patient_id
         FROM hospitalizations h
         LEFT JOIN patients p ON p.id = h.patient_id
         WHERE h.reason LIKE ? OR h.cage LIKE ? OR p.name LIKE ?
         ORDER BY h.admission_date DESC LIMIT 4`
      )
      .all(term, term, term);

    // 7. Órdenes de Laboratorio
    const lab_orders = db
      .prepare(
        `SELECT o.id, o.order_number, o.order_date, o.panel, o.status,
                p.name AS patient_name, p.id AS patient_id
         FROM lab_orders o
         LEFT JOIN patients p ON p.id = o.patient_id
         WHERE o.order_number LIKE ? OR o.panel LIKE ? OR p.name LIKE ?
         ORDER BY o.order_date DESC LIMIT 4`
      )
      .all(term, term, term);

    res.json({
      query: q,
      patients,
      appointments,
      invoices,
      inventory,
      surgeries,
      hospitalizations,
      lab_orders,
    });
  } catch (error) {
    sendError(res, error);
  }
};
