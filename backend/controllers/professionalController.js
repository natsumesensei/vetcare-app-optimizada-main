const db = require("../database/db");
const { today, sendError } = require("../utils/values");

// --- FACTURAS ---

exports.listInvoices = (req, res) => {
  try {
    const { status, search } = req.query;
    let query = `
      SELECT 
        i.*,
        p.name AS patient_name,
        p.species AS patient_species,
        p.breed AS patient_breed,
        (SELECT COUNT(*) FROM invoice_items WHERE invoice_id = i.id) AS items_count
      FROM invoices i
      LEFT JOIN patients p ON p.id = i.patient_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== "all") {
      query += " AND i.status = ?";
      params.push(status);
    }
    if (search) {
      query += " AND (i.invoice_number LIKE ? OR i.owner_name LIKE ? OR p.name LIKE ?)";
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += " ORDER BY i.issue_date DESC, i.id DESC";

    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
};

exports.createInvoice = (req, res) => {
  try {
    const p = req.body;
    const items = Array.isArray(p.items) ? p.items : [];

    // Calcular subtotal, descuento e impuestos
    let calculatedSubtotal = 0;
    let calculatedTax = 0;

    items.forEach((item) => {
      const q = Number(item.quantity || 1);
      const price = Number(item.unit_price || 0);
      const disc = Number(item.discount_rate || 0);
      const lineBase = q * price * (1 - disc / 100);
      const lineTax = (lineBase * Number(item.tax_rate || 0)) / 100;
      calculatedSubtotal += lineBase;
      calculatedTax += lineTax;
    });

    const globalDiscountRate = Number(p.discount_rate || 0);
    const globalDiscountAmount = (calculatedSubtotal * globalDiscountRate) / 100;
    const finalSubtotal = calculatedSubtotal - globalDiscountAmount;
    const finalTax = calculatedTax * (1 - globalDiscountRate / 100);
    const finalTotal = finalSubtotal + finalTax;

    // Configuración y correlativo
    const clinic = db.prepare("SELECT * FROM settings ORDER BY id LIMIT 1").get();
    const currency = p.currency || clinic?.currency || "EUR";

    let number = p.invoice_number;
    if (!number) {
      const prefix = clinic?.invoice_prefix || `FAC-${new Date().getFullYear()}-`;
      const nextNum = clinic?.next_invoice_number || 101;
      number = `${prefix}${String(nextNum).padStart(5, "0")}`;
      
      // Actualizar correlativo en settings
      db.prepare("UPDATE settings SET next_invoice_number = next_invoice_number + 1 WHERE id = ?").run(clinic?.id || 1);
    }

    // Datos del paciente y propietario
    let patient = null;
    if (p.patient_id) {
      patient = db.prepare("SELECT * FROM patients WHERE id = ?").get(p.patient_id);
    }

    const tx = db.transaction(() => {
      const r = db
        .prepare(
          `INSERT INTO invoices (
            patient_id, owner_name, invoice_number, issue_date, due_date,
            status, subtotal, tax, total, currency, discount_rate, discount_amount,
            tax_id, owner_address, owner_phone, owner_email,
            patient_species, patient_breed, patient_microchip,
            payment_method, notes
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
        )
        .run(
          p.patient_id || null,
          p.owner_name || patient?.owner_name || "Cliente General",
          number,
          p.issue_date || today(),
          p.due_date || null,
          p.status || "Pagada",
          finalSubtotal,
          finalTax,
          finalTotal,
          currency,
          globalDiscountRate,
          globalDiscountAmount,
          p.tax_id || null,
          p.owner_address || patient?.address || null,
          p.owner_phone || patient?.owner_phone || null,
          p.owner_email || patient?.owner_email || null,
          patient?.species || p.patient_species || null,
          patient?.breed || p.patient_breed || null,
          patient?.microchip || p.patient_microchip || null,
          p.payment_method || "Tarjeta",
          p.notes || null
        );

      const invoiceId = r.lastInsertRowid;

      const insertItem = db.prepare(`
        INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, tax_rate, discount_rate, total)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      items.forEach((x) => {
        const q = Number(x.quantity || 1);
        const up = Number(x.unit_price || 0);
        const disc = Number(x.discount_rate || 0);
        const tr = Number(x.tax_rate || 0);
        const lineTotal = q * up * (1 - disc / 100) * (1 + tr / 100);

        insertItem.run(
          invoiceId,
          x.description || "Servicio veterinario",
          q,
          up,
          tr,
          disc,
          lineTotal
        );
      });

      return invoiceId;
    });

    const invoiceId = tx();
    res.status(201).json({
      id: invoiceId,
      invoice_number: number,
      subtotal: finalSubtotal,
      tax: finalTax,
      total: finalTotal,
      currency,
      success: true,
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateInvoice = (req, res) => {
  try {
    const { id } = req.params;
    const p = req.body;
    const items = Array.isArray(p.items) ? p.items : [];

    let calculatedSubtotal = 0;
    let calculatedTax = 0;

    items.forEach((item) => {
      const q = Number(item.quantity || 1);
      const price = Number(item.unit_price || 0);
      const disc = Number(item.discount_rate || 0);
      const lineBase = q * price * (1 - disc / 100);
      const lineTax = (lineBase * Number(item.tax_rate || 0)) / 100;
      calculatedSubtotal += lineBase;
      calculatedTax += lineTax;
    });

    const globalDiscountRate = Number(p.discount_rate || 0);
    const globalDiscountAmount = (calculatedSubtotal * globalDiscountRate) / 100;
    const finalSubtotal = calculatedSubtotal - globalDiscountAmount;
    const finalTax = calculatedTax * (1 - globalDiscountRate / 100);
    const finalTotal = finalSubtotal + finalTax;

    const tx = db.transaction(() => {
      db.prepare(
        `UPDATE invoices SET
          patient_id = ?,
          owner_name = ?,
          issue_date = ?,
          due_date = ?,
          status = ?,
          subtotal = ?,
          tax = ?,
          total = ?,
          currency = ?,
          discount_rate = ?,
          discount_amount = ?,
          tax_id = ?,
          owner_address = ?,
          owner_phone = ?,
          owner_email = ?,
          payment_method = ?,
          notes = ?
         WHERE id = ?`
      ).run(
        p.patient_id || null,
        p.owner_name,
        p.issue_date,
        p.due_date || null,
        p.status,
        finalSubtotal,
        finalTax,
        finalTotal,
        p.currency || "EUR",
        globalDiscountRate,
        globalDiscountAmount,
        p.tax_id || null,
        p.owner_address || null,
        p.owner_phone || null,
        p.owner_email || null,
        p.payment_method,
        p.notes,
        id
      );

      if (items.length > 0) {
        db.prepare("DELETE FROM invoice_items WHERE invoice_id = ?").run(id);
        const insertItem = db.prepare(`
          INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, tax_rate, discount_rate, total)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        items.forEach((x) => {
          const q = Number(x.quantity || 1);
          const up = Number(x.unit_price || 0);
          const disc = Number(x.discount_rate || 0);
          const tr = Number(x.tax_rate || 0);
          const lineTotal = q * up * (1 - disc / 100) * (1 + tr / 100);

          insertItem.run(
            id,
            x.description || "Servicio",
            q,
            up,
            tr,
            disc,
            lineTotal
          );
        });
      }
    });

    tx();
    res.json({ success: true, message: "Factura actualizada exitosamente." });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateInvoiceStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare("UPDATE invoices SET status = ? WHERE id = ?").run(status, id);
    res.json({ success: true, status });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getInvoice = (req, res) => {
  try {
    const invoice = db
      .prepare(
        `SELECT i.*, 
                p.name AS patient_name, 
                p.species AS patient_species, 
                p.breed AS patient_breed, 
                p.sex AS patient_sex,
                p.microchip AS patient_microchip,
                p.owner_name AS patient_owner,
                p.owner_phone AS patient_phone, 
                p.owner_email AS patient_email, 
                p.address AS patient_address
         FROM invoices i
         LEFT JOIN patients p ON p.id = i.patient_id
         WHERE i.id = ?`
      )
      .get(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: "Factura no encontrada" });
    }

    invoice.items = db
      .prepare("SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id")
      .all(req.params.id);

    const clinic = db.prepare("SELECT * FROM settings ORDER BY id LIMIT 1").get();
    invoice.clinic = clinic || {};

    res.json(invoice);
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteInvoice = (req, res) => {
  try {
    db.prepare("DELETE FROM invoice_items WHERE invoice_id = ?").run(req.params.id);
    const result = db.prepare("DELETE FROM invoices WHERE id = ?").run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ message: "Factura no encontrada" });
    }
    res.json({ success: true, message: "Factura eliminada." });
  } catch (error) {
    sendError(res, error);
  }
};

// --- ANESTESIA ---

exports.listAnesthesia = (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT a.*, p.name patient_name, p.species, s.procedure, s.surgery_date
         FROM anesthesia_records a
         JOIN patients p ON p.id = a.patient_id
         LEFT JOIN surgeries s ON s.id = a.surgery_id
         ORDER BY a.record_date DESC, a.id DESC`
      )
      .all();
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
};

exports.getAnesthesia = (req, res) => {
  try {
    const record = db
      .prepare(
        `SELECT a.*, p.name patient_name, p.species, p.breed, p.sex, s.procedure, s.surgery_date
         FROM anesthesia_records a
         JOIN patients p ON p.id = a.patient_id
         LEFT JOIN surgeries s ON s.id = a.surgery_id
         WHERE a.id = ?`
      )
      .get(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Registro no encontrado" });
    }

    record.monitoring = db
      .prepare(
        "SELECT * FROM anesthesia_monitoring WHERE anesthesia_record_id = ? ORDER BY elapsed_minutes ASC"
      )
      .all(req.params.id);

    res.json(record);
  } catch (error) {
    sendError(res, error);
  }
};

exports.createAnesthesia = (req, res) => {
  try {
    const p = req.body;
    const r = db
      .prepare(
        `INSERT INTO anesthesia_records(
          patient_id, surgery_id, veterinarian, record_date, asa_grade,
          premedication, induction, maintenance, fluid_rate_ml_kg_h,
          recovery_quality, notes
        ) VALUES(?,?,?,?,?,?,?,?,?,?,?)`
      )
      .run(
        p.patient_id,
        p.surgery_id || null,
        p.veterinarian,
        p.record_date || today(),
        p.asa_grade || "I",
        p.premedication,
        p.induction,
        p.maintenance,
        p.fluid_rate_ml_kg_h,
        p.recovery_quality,
        p.notes
      );
    res.status(201).json({ id: r.lastInsertRowid });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateAnesthesia = (req, res) => {
  try {
    const p = req.body;
    db.prepare(
      `UPDATE anesthesia_records SET
        veterinarian=?, asa_grade=?, premedication=?, induction=?,
        maintenance=?, fluid_rate_ml_kg_h=?, recovery_quality=?, notes=?
       WHERE id=?`
    ).run(
      p.veterinarian,
      p.asa_grade,
      p.premedication,
      p.induction,
      p.maintenance,
      p.fluid_rate_ml_kg_h,
      p.recovery_quality,
      p.notes,
      req.params.id
    );
    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
};

exports.listMonitoring = (req, res) => {
  try {
    const rows = db
      .prepare(
        "SELECT * FROM anesthesia_monitoring WHERE anesthesia_record_id = ? ORDER BY elapsed_minutes ASC"
      )
      .all(req.params.id);
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
};

exports.createMonitoring = (req, res) => {
  try {
    const p = req.body;
    const r = db
      .prepare(
        `INSERT INTO anesthesia_monitoring(
          anesthesia_record_id, elapsed_minutes, heart_rate, respiratory_rate,
          spo2, etco2, temperature, systolic_bp, diastolic_bp, mean_bp,
          ecg, anesthetic_depth, oxygen_flow, sevoflurane, isoflurane,
          fluids_ml_h, notes
        ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
      )
      .run(
        req.params.id,
        p.elapsed_minutes || 0,
        p.heart_rate,
        p.respiratory_rate,
        p.spo2,
        p.etco2,
        p.temperature,
        p.systolic_bp,
        p.diastolic_bp,
        p.mean_bp,
        p.ecg,
        p.anesthetic_depth,
        p.oxygen_flow,
        p.sevoflurane,
        p.isoflurane,
        p.fluids_ml_h,
        p.notes
      );
    res.status(201).json({ id: r.lastInsertRowid });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteMonitoring = (req, res) => {
  try {
    db.prepare("DELETE FROM anesthesia_monitoring WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
};
