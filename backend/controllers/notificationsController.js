const db = require("../database/db");
const { today, sendError } = require("../utils/values");

exports.list = (req, res) => {
  try {
    const nowDate = today();
    const notifications = [];

    // Obtener claves ya marcadas como leídas
    const readRows = db.prepare("SELECT key_id FROM notifications_log WHERE is_read = 1").all();
    const readSet = new Set(readRows.map((r) => r.key_id));

    // 1. Citas del día
    const todayAppts = db
      .prepare(
        `SELECT a.*, p.name AS patient_name
         FROM appointments a
         LEFT JOIN patients p ON p.id = a.patient_id
         WHERE a.appointment_date = ? AND a.status NOT IN ('Completada', 'Cancelada')`
      )
      .all(nowDate);

    todayAppts.forEach((a) => {
      const key = `appt-${a.id}-${a.appointment_date}`;
      notifications.push({
        id: key,
        type: "appointment",
        title: `Cita hoy (${a.appointment_time}): ${a.patient_name || a.owner_name}`,
        message: `${a.type || "Consulta"} - ${a.reason || "Sin motivo especificado"}`,
        link: `/appointments`,
        severity: a.status === "En consulta" ? "info" : "warning",
        is_read: readSet.has(key),
        created_at: a.appointment_date,
      });
    });

    // 2. Vacunas vencidas o próximas
    const vaccines = db
      .prepare(
        `SELECT v.*, p.name AS patient_name, p.id AS patient_id, p.owner_name
         FROM vaccines v
         JOIN patients p ON p.id = v.patient_id
         WHERE v.next_due_date IS NOT NULL AND v.next_due_date <= DATE(?, '+15 days')
         ORDER BY v.next_due_date ASC LIMIT 10`
      )
      .all(nowDate);

    vaccines.forEach((v) => {
      const isOverdue = v.next_due_date < nowDate;
      const key = `vac-${v.id}-${v.next_due_date}`;
      notifications.push({
        id: key,
        type: "vaccine",
        title: isOverdue ? `Vacuna VENCIDA: ${v.patient_name}` : `Vacuna Próxima: ${v.patient_name}`,
        message: `${v.vaccine_name} vence el ${v.next_due_date}. Propietario: ${v.owner_name}`,
        link: `/patients/${v.patient_id}`,
        severity: isOverdue ? "danger" : "warning",
        is_read: readSet.has(key),
        created_at: v.next_due_date,
      });
    });

    // 3. Stock crítico o agotado en farmacia
    const lowStockItems = db
      .prepare(
        `SELECT * FROM inventory
         WHERE active = 1 AND (stock <= minimum_stock OR (expiry_date IS NOT NULL AND expiry_date <= DATE(?, '+30 days')))`
      )
      .all(nowDate);

    lowStockItems.forEach((item) => {
      const isOut = item.stock <= 0;
      const isExpired = item.expiry_date && item.expiry_date <= nowDate;
      const key = `stock-${item.id}-${item.stock}-${item.lot || ""}`;
      
      let title = `Stock Bajo: ${item.name}`;
      let severity = "warning";
      if (isOut) {
        title = `STOCK AGOTADO: ${item.name}`;
        severity = "danger";
      } else if (isExpired) {
        title = `PRODUCTO CADUCADO: ${item.name}`;
        severity = "danger";
      }

      notifications.push({
        id: key,
        type: "inventory",
        title,
        message: `Quedan ${item.stock} ${item.unit || "uds."} (Mín: ${item.minimum_stock}). Lote: ${item.lot || "N/A"}`,
        link: `/inventory`,
        severity,
        is_read: readSet.has(key),
        created_at: nowDate,
      });
    });

    // 4. Facturas pendientes de cobro
    const pendingInvoices = db
      .prepare(
        `SELECT * FROM invoices
         WHERE status = 'Pendiente'
         ORDER BY issue_date ASC LIMIT 8`
      )
      .all();

    pendingInvoices.forEach((inv) => {
      const key = `inv-${inv.id}-${inv.status}`;
      notifications.push({
        id: key,
        type: "invoice",
        title: `Factura Pendiente: ${inv.invoice_number}`,
        message: `Importe: ${inv.total} ${inv.currency || "€"} - Cliente: ${inv.owner_name}`,
        link: `/invoices`,
        severity: "warning",
        is_read: readSet.has(key),
        created_at: inv.issue_date,
      });
    });

    // 5. Hospitalizaciones en curso
    const activeHosp = db
      .prepare(
        `SELECT h.*, p.name AS patient_name, p.id AS patient_id
         FROM hospitalizations h
         JOIN patients p ON p.id = h.patient_id
         WHERE h.status = 'Hospitalizado'`
      )
      .all();

    activeHosp.forEach((h) => {
      const key = `hosp-${h.id}`;
      notifications.push({
        id: key,
        type: "hospitalization",
        title: `Paciente Ingresado: ${h.patient_name} (${h.cage || "Box"})`,
        message: `Motivo: ${h.reason}. Pauta: ${h.treatment_plan || "En observación"}`,
        link: `/hospitalizations`,
        severity: "info",
        is_read: readSet.has(key),
        created_at: h.admission_date,
      });
    });

    // 6. Análisis de laboratorio pendientes
    const pendingLabs = db
      .prepare(
        `SELECT o.*, p.name AS patient_name, p.id AS patient_id
         FROM lab_orders o
         JOIN patients p ON p.id = o.patient_id
         WHERE o.status IN ('Pendiente', 'En proceso')`
      )
      .all();

    pendingLabs.forEach((l) => {
      const key = `lab-${l.id}-${l.status}`;
      notifications.push({
        id: key,
        type: "laboratory",
        title: `Laboratorio ${l.status}: ${l.patient_name}`,
        message: `Panel: ${l.panel || "General"} (${l.order_number})`,
        link: `/reference-values`,
        severity: "info",
        is_read: readSet.has(key),
        created_at: l.order_date,
      });
    });

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.markAsRead = (req, res) => {
  try {
    const { key_id } = req.body;
    if (!key_id) {
      return res.status(400).json({ message: "Se requiere key_id." });
    }

    db.prepare(
      `INSERT INTO notifications_log(key_id, is_read, read_at)
       VALUES(?, 1, CURRENT_TIMESTAMP)
       ON CONFLICT(key_id) DO UPDATE SET is_read = 1, read_at = CURRENT_TIMESTAMP`
    ).run(key_id);

    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
};

exports.markAllAsRead = (req, res) => {
  try {
    const { keys = [] } = req.body;
    const stmt = db.prepare(`
      INSERT INTO notifications_log(key_id, is_read, read_at)
      VALUES(?, 1, CURRENT_TIMESTAMP)
      ON CONFLICT(key_id) DO UPDATE SET is_read = 1, read_at = CURRENT_TIMESTAMP
    `);

    db.transaction(() => {
      keys.forEach((k) => stmt.run(k));
    })();

    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
};
