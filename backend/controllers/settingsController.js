const db = require("../database/db");
const { sendError } = require("../utils/values");

const CURRENCY_SYMBOLS = {
  EUR: "€",
  USD: "$",
  DOP: "RD$",
  GBP: "£",
  MXN: "$",
  COP: "$",
  ARS: "$",
  BRL: "R$",
  CLP: "$",
  PEN: "S/",
};

function resolveCurrencySymbol(code, customSymbol) {
  if (customSymbol && customSymbol.trim().length > 0) {
    return customSymbol.trim();
  }
  const cleanCode = (code || "EUR").toUpperCase();
  return CURRENCY_SYMBOLS[cleanCode] || "€";
}

function formatSettings(row) {
  if (!row) return {};
  let methods = ["Tarjeta", "Efectivo", "Transferencia", "Bizum", "Financiación"];
  try {
    if (row.payment_methods) {
      methods = JSON.parse(row.payment_methods);
    }
  } catch (e) {
    // fallback
  }

  return {
    id: row.id,
    clinic_name: row.clinic_name || "VetCare Clínica Dr. Saladin",
    veterinarian: row.veterinarian || "Dr. Saladin",
    phone: row.phone || "+34 912 345 678",
    email: row.email || "contacto@vetcare-saladin.es",
    address: row.address || "Calle Mayor 45, 28013 Madrid",
    logo: row.logo || "",
    nif: row.nif || "B-12345678",
    license_number: row.license_number || "COL-MAD-4521",
    website: row.website || "www.vetcare-saladin.es",
    currency: row.currency || "EUR",
    currency_symbol: row.currency_symbol || "€",
    tax_rate: row.tax_rate != null ? Number(row.tax_rate) : 21,
    invoice_prefix: row.invoice_prefix || "FAC-2026-",
    next_invoice_number: row.next_invoice_number != null ? Number(row.next_invoice_number) : 101,
    payment_terms: row.payment_terms || "Pago al contado / 30 días",
    payment_methods: methods,
    vaccine_alert_days: row.vaccine_alert_days != null ? Number(row.vaccine_alert_days) : 15,
    deworming_alert_days: row.deworming_alert_days != null ? Number(row.deworming_alert_days) : 15,
    low_stock_threshold: row.low_stock_threshold != null ? Number(row.low_stock_threshold) : 5,
    date_format: row.date_format || "DD/MM/YYYY",
    time_format: row.time_format || "24h",
    theme: row.theme || "light",
    legal_notes: row.legal_notes || "Centro Veterinario Autorizado. Factura simplificada oficial.",
  };
}

exports.show = (req, res) => {
  try {
    let row = db.prepare("SELECT * FROM settings ORDER BY id LIMIT 1").get();
    if (!row) {
      db.prepare(`
        INSERT INTO settings(clinic_name, veterinarian, phone, email, address)
        VALUES('VetCare Clínica Dr. Saladin', 'Dr. Saladin', '+34 912 345 678', 'contacto@vetcare-saladin.es', 'Calle Mayor 45, Madrid')
      `).run();
      row = db.prepare("SELECT * FROM settings ORDER BY id LIMIT 1").get();
    }

    // Estadísticas de Base de Datos
    const counts = {
      patients: db.prepare("SELECT COUNT(*) c FROM patients").get().c,
      consultations: db.prepare("SELECT COUNT(*) c FROM consultations").get().c,
      appointments: db.prepare("SELECT COUNT(*) c FROM appointments").get().c,
      invoices: db.prepare("SELECT COUNT(*) c FROM invoices").get().c,
      inventory: db.prepare("SELECT COUNT(*) c FROM inventory").get().c,
      vaccines: db.prepare("SELECT COUNT(*) c FROM vaccines").get().c,
      lab_orders: db.prepare("SELECT COUNT(*) c FROM lab_orders").get().c,
      surgeries: db.prepare("SELECT COUNT(*) c FROM surgeries").get().c,
      hospitalizations: db.prepare("SELECT COUNT(*) c FROM hospitalizations").get().c,
    };

    const users = db.prepare("SELECT id, name, email, role, created_at FROM users").all();

    res.json({
      settings: formatSettings(row),
      stats: counts,
      users,
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.update = (req, res) => {
  try {
    const b = req.body;
    let row = db.prepare("SELECT id FROM settings ORDER BY id LIMIT 1").get();

    const methodsStr = Array.isArray(b.payment_methods)
      ? JSON.stringify(b.payment_methods)
      : b.payment_methods || '["Tarjeta","Efectivo","Transferencia","Bizum"]';

    const selectedCurrency = b.currency ? b.currency.toUpperCase() : "EUR";
    const selectedSymbol = resolveCurrencySymbol(selectedCurrency, b.currency_symbol);

    if (!row) {
      db.prepare(`
        INSERT INTO settings (
          clinic_name, veterinarian, phone, email, address, logo,
          nif, license_number, website, currency, currency_symbol,
          tax_rate, invoice_prefix, next_invoice_number, payment_terms,
          payment_methods, vaccine_alert_days, deworming_alert_days,
          low_stock_threshold, date_format, time_format, theme, legal_notes
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        b.clinic_name || "",
        b.veterinarian || "",
        b.phone || "",
        b.email || "",
        b.address || "",
        b.logo || "",
        b.nif || "",
        b.license_number || "",
        b.website || "",
        selectedCurrency,
        selectedSymbol,
        b.tax_rate != null ? Number(b.tax_rate) : 21,
        b.invoice_prefix || "FAC-2026-",
        b.next_invoice_number != null ? Number(b.next_invoice_number) : 101,
        b.payment_terms || "",
        methodsStr,
        b.vaccine_alert_days != null ? Number(b.vaccine_alert_days) : 15,
        b.deworming_alert_days != null ? Number(b.deworming_alert_days) : 15,
        b.low_stock_threshold != null ? Number(b.low_stock_threshold) : 5,
        b.date_format || "DD/MM/YYYY",
        b.time_format || "24h",
        b.theme || "light",
        b.legal_notes || ""
      );
    } else {
      db.prepare(`
        UPDATE settings SET
          clinic_name = ?, veterinarian = ?, phone = ?, email = ?, address = ?, logo = ?,
          nif = ?, license_number = ?, website = ?, currency = ?, currency_symbol = ?,
          tax_rate = ?, invoice_prefix = ?, next_invoice_number = ?, payment_terms = ?,
          payment_methods = ?, vaccine_alert_days = ?, deworming_alert_days = ?,
          low_stock_threshold = ?, date_format = ?, time_format = ?, theme = ?, legal_notes = ?
        WHERE id = ?
      `).run(
        b.clinic_name || "",
        b.veterinarian || "",
        b.phone || "",
        b.email || "",
        b.address || "",
        b.logo || "",
        b.nif || "",
        b.license_number || "",
        b.website || "",
        selectedCurrency,
        selectedSymbol,
        b.tax_rate != null ? Number(b.tax_rate) : 21,
        b.invoice_prefix || "FAC-2026-",
        b.next_invoice_number != null ? Number(b.next_invoice_number) : 101,
        b.payment_terms || "",
        methodsStr,
        b.vaccine_alert_days != null ? Number(b.vaccine_alert_days) : 15,
        b.deworming_alert_days != null ? Number(b.deworming_alert_days) : 15,
        b.low_stock_threshold != null ? Number(b.low_stock_threshold) : 5,
        b.date_format || "DD/MM/YYYY",
        b.time_format || "24h",
        b.theme || "light",
        b.legal_notes || "",
        row.id
      );
    }

    const saved = db.prepare("SELECT * FROM settings ORDER BY id LIMIT 1").get();
    res.json({ success: true, settings: formatSettings(saved) });
  } catch (error) {
    sendError(res, error);
  }
};

// Exportar copia de seguridad de la base de datos en formato JSON
exports.exportBackup = (req, res) => {
  try {
    const backup = {
      exported_at: new Date().toISOString(),
      app: "VetCare",
      version: "1.0.0",
      tables: {
        settings: db.prepare("SELECT * FROM settings").all(),
        users: db.prepare("SELECT id, name, email, role, created_at FROM users").all(),
        patients: db.prepare("SELECT * FROM patients").all(),
        consultations: db.prepare("SELECT * FROM consultations").all(),
        appointments: db.prepare("SELECT * FROM appointments").all(),
        vaccines: db.prepare("SELECT * FROM vaccines").all(),
        parasite_control: db.prepare("SELECT * FROM parasite_control").all(),
        invoices: db.prepare("SELECT * FROM invoices").all(),
        invoice_items: db.prepare("SELECT * FROM invoice_items").all(),
        inventory: db.prepare("SELECT * FROM inventory").all(),
        surgeries: db.prepare("SELECT * FROM surgeries").all(),
        hospitalizations: db.prepare("SELECT * FROM hospitalizations").all(),
        lab_orders: db.prepare("SELECT * FROM lab_orders").all(),
        lab_order_items: db.prepare("SELECT * FROM lab_order_items").all(),
        clinical_reference_values: db.prepare("SELECT * FROM clinical_reference_values").all(),
      },
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=vetcare_backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    res.json(backup);
  } catch (error) {
    sendError(res, error);
  }
};
