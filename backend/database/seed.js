const bcrypt = require("bcryptjs");
const db = require("./db");

function seedDatabase() {
  // ==========================
  // Usuario administrador
  // ==========================
  const admin = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get("admin@clinica.com");

  if (!admin) {
    const password = bcrypt.hashSync("admin123", 10);
    db.prepare(`
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `).run("Dr. Saladin", "admin@clinica.com", password, "admin");
    console.log("👤 Usuario administrador creado (admin@clinica.com / admin123).");
  }

  // ==========================
  // Configuración de la clínica
  // ==========================
  const clinic = db.prepare("SELECT * FROM settings LIMIT 1").get();
  if (!clinic) {
    db.prepare(`
      INSERT INTO settings (
        clinic_name, veterinarian, phone, email, address
      ) VALUES (?, ?, ?, ?, ?)
    `).run(
      "Vet Nestor",
      "Equipo Clínico Vet Nestor",
      "849-806-6352",
      "",
      "San Pedro de Macorís, RD"
    );
    console.log("🏥 Configuración inicial de la clínica creada.");
  }

  // ==========================
  // Pacientes iniciales
  // ==========================
  const maxPatient = db.prepare("SELECT * FROM patients WHERE name = 'Max' LIMIT 1").get();
  if (!maxPatient) {
    const insertPatient = db.prepare(`
      INSERT INTO patients (
        name, species, breed, sex, birthdate, color, weight, microchip,
        owner_name, owner_phone, owner_email, address, allergies, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const p1 = insertPatient.run(
      "Max", "Perro", "Golden Retriever", "Macho", "2021-04-12", "Dorado", 29.2, "981098102345678",
      "Carlos Méndez", "611223344", "carlos.mendez@email.com", "Calle Alcalá 120, Madrid",
      "Ninguna conocida", "Perro muy dócil y sociable. Buen estado general."
    ).lastInsertRowid;

    const p2 = insertPatient.run(
      "Luna", "Gato", "Común Europeo", "Hembra", "2022-09-05", "Carey", 4.1, "981098103456789",
      "Laura Fernández", "622334455", "laura.f@email.com", "Av. América 34, Madrid",
      "Polen / Dermatitis estacional", "Esterilizada. Muy tranquila en consulta."
    ).lastInsertRowid;

    const p3 = insertPatient.run(
      "Rocky", "Perro", "Bulldog Francés", "Macho", "2020-11-20", "Fawn", 12.8, "981098104567890",
      "Andrés Gómez", "633445566", "andres.g@email.com", "Calle Princesa 18, Pozuelo",
      "Sensibilidad gástrica a pollo", "Síndrome braquiocefálico leve. Monitorizar peso."
    ).lastInsertRowid;

    const p4 = insertPatient.run(
      "Mia", "Gato", "Siamés", "Hembra", "2023-01-15", "Seal Point", 3.6, "981098105678901",
      "Sofía Morales", "644556677", "sofia.m@email.com", "Paseo de la Habana 55, Madrid",
      "Ninguna", "Vacunación y desparasitación al día."
    ).lastInsertRowid;

    const p5 = insertPatient.run(
      "Thor", "Perro", "Pastor Alemán", "Macho", "2019-06-30", "Negro y Fuego", 34.5, "981098106789012",
      "Javier Ruiz", "655667788", "javier.ruiz@email.com", "Calle Serrano 88, Madrid",
      "Alérgeno ambiental", "Displasia de cadera leve controlada con condroprotectores."
    ).lastInsertRowid;

    console.log("🐾 5 Pacientes de prueba creados.");

    // ==========================
    // Consultas clínicas
    // ==========================
    const insertConsultation = db.prepare(`
      INSERT INTO consultations (
        patient_id, consultation_date, veterinarian, reason, clinical_signs,
        temperature, heart_rate, respiratory_rate, weight, diagnosis, treatment, observations
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const todayStr = new Date().toISOString().slice(0, 10);
    const lastMonthStr = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);

    insertConsultation.run(
      p1, todayStr, "Dr. Saladin",
      "Revisión anual y cojera leve en extremidad posterior derecha",
      "Cojera grado 1/4 tras ejercicio intenso. Sin inflamación articular visible.",
      38.4, 92, 24, 29.2,
      "Sobrecarga muscular en cuádriceps derecho. Sin signos de rotura de ligamento.",
      "Meloxicam 1.5mg/ml (0.1mg/kg cada 24h durante 5 días). Reposo relativo.",
      "Revisar en 7 días si persiste cojera. Recomendar condroprotectores."
    );

    insertConsultation.run(
      p2, lastMonthStr, "Dra. Elena Vega",
      "Prurito ótico y sacudida de cabeza frecuente",
      "Secreción ceruminosa oscura y abundante en ambos conductos auditivos. Eritema moderado.",
      38.6, 140, 30, 4.1,
      "Otitis externa bilateral por Otodectes cynotis (ácaros).",
      "Limpieza ótica previa + Gotas óticas con antibiótico/antifúngico/antiinflamatorio cada 12h x 10d.",
      "Citar para citología de control al terminar el tratamiento."
    );

    insertConsultation.run(
      p3, todayStr, "Dr. Saladin",
      "Chequeo respiratorio y control de peso semestral",
      "Estridor respiratorio moderado en reposo. Mucosas sonrosadas, TLLC < 2s.",
      38.8, 105, 28, 12.8,
      "Evolución favorable de síndrome braquicéfalo. Peso estable.",
      "Pautas de manejo ambiental: evitar golpes de calor y pasear con arnés pectoral.",
      "Planificar profilaxis dental en próximo trimestre."
    );

    // ==========================
    // Citas / Agenda
    // ==========================
    const insertAppt = db.prepare(`
      INSERT INTO appointments (
        patient_id, owner_name, appointment_date, appointment_time, duration_minutes,
        type, status, veterinarian, reason, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAppt.run(
      p1, "Carlos Méndez", todayStr, "10:00", 30,
      "Consulta", "En consulta", "Dr. Saladin", "Revisión anual y cojera", "Mascota en sala de espera"
    );

    insertAppt.run(
      p3, "Andrés Gómez", todayStr, "11:30", 30,
      "Consulta", "Confirmada", "Dr. Saladin", "Control respiratorio", "Cliente puntual"
    );

    insertAppt.run(
      p2, "Laura Fernández", todayStr, "16:00", 30,
      "Vacunación", "Programada", "Dra. Elena Vega", "Vacuna Pentavalente felina", "Traer cartilla"
    );

    insertAppt.run(
      p4, "Sofía Morales", todayStr, "17:30", 30,
      "Revisión", "Programada", "Dra. Elena Vega", "Revisión post-desparasitación", "Primer celo"
    );

    // ==========================
    // Vacunas y Desparasitaciones
    // ==========================
    const insertVaccine = db.prepare(`
      INSERT INTO vaccines (
        patient_id, vaccine_name, application_date, next_due_date, batch, laboratory, veterinarian, observations
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const nextYearStr = new Date(Date.now() + 335 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const overdueDateStr = new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString().slice(0, 10);

    insertVaccine.run(p1, "Rabia (Nobivac Rabies)", lastMonthStr, nextYearStr, "LOT-9821-B", "MSD Animal Health", "Dr. Saladin", "Sin reacciones adversas.");
    insertVaccine.run(p1, "DHPPiL (Heptavalente)", lastMonthStr, nextYearStr, "LOT-4412-A", "Zoetis", "Dr. Saladin", "Inmunización correcta.");
    insertVaccine.run(p2, "Trivalente Felina (RCP)", overdueDateStr, overdueDateStr, "LOT-1190-C", "Boehringer Ingelheim", "Dra. Elena Vega", "Requiere revacunación anual.");
    insertVaccine.run(p3, "Rabia y Leptospirosis", lastMonthStr, nextYearStr, "LOT-7731-X", "MSD Animal Health", "Dr. Saladin", "Bien tolerada.");

    const insertParasite = db.prepare(`
      INSERT INTO parasite_control (
        patient_id, type, product, application_date, next_due_date, veterinarian, observations
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const nextMonthStr = new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    insertParasite.run(p1, "Interna y Externa", "NexGard Spectra", todayStr, nextMonthStr, "Dr. Saladin", "Protección mensual pulgas, garrapatas y gusano del corazón.");
    insertParasite.run(p2, "Interna", "Milpro Gatos", overdueDateStr, overdueDateStr, "Dra. Elena Vega", "Desparasitación intestinal periódica.");
    insertParasite.run(p3, "Externa", "Bravecto Masticable", lastMonthStr, nextMonthStr, "Dr. Saladin", "Protección trimestral garrapatas y pulgas.");

    // ==========================
    // Inventario / Farmacia y Stock
    // ==========================
    const insertInv = db.prepare(`
      INSERT INTO inventory (
        name, category, presentation, unit, stock, minimum_stock, lot, expiry_date, supplier, purchase_price, sale_price, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertInv.run("Amoxicilina + Ác. Clavulánico 500mg", "Antibióticos", "Caja 20 comprimidos", "caja", 14, 5, "LOT-AMX-2027", "2027-08-15", "Laboratorios Calier", 6.80, 16.50, 1);
    insertInv.run("Meloxicam 1.5mg/ml oral", "Antiinflamatorios", "Frasco 32ml", "frasco", 8, 4, "LOT-MLX-2026", "2026-11-30", "Boehringer Ingelheim", 8.20, 19.90, 1);
    insertInv.run("Nobivac DHPPi + L", "Vacunas", "Vial monodosis", "vial", 25, 10, "LOT-NBV-2026", "2026-12-31", "MSD Animal Health", 5.40, 24.00, 1);
    insertInv.run("Nexgard Spectra 15-30kg", "Antiparasitarios", "Caja 3 comp", "caja", 2, 5, "LOT-NXG-2027", "2027-05-20", "Boehringer Ingelheim", 28.50, 48.00, 1); // Alerta stock bajo
    insertInv.run("Propofol 1% inyectable", "Anestésicos", "Frasco 50ml", "frasco", 6, 2, "LOT-PPF-2026", "2026-10-15", "B. Braun", 11.20, 28.00, 1);
    insertInv.run("Ringer Lactato 500ml", "Fluidoterapia", "Bolsa infusión", "bolsa", 30, 8, "LOT-RL-2028", "2028-03-01", "Fresenius Kabi", 1.90, 8.50, 1);
    insertInv.run("Sutura Vicryl 3-0 aguja triangular", "Material quirúrgico", "Caja 12 sobres", "caja", 3, 5, "LOT-VIC-2027", "2027-09-10", "Ethicon", 24.00, 45.00, 1); // Alerta stock bajo

    // ==========================
    // Facturación
    // ==========================
    const insertInvoice = db.prepare(`
      INSERT INTO invoices (
        patient_id, owner_name, invoice_number, issue_date, status, subtotal, tax, total, payment_method, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertInvItem = db.prepare(`
      INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, tax_rate, total)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const inv1 = insertInvoice.run(
      p1, "Carlos Méndez", "FAC-2025-000101", todayStr, "Pagada", 64.00, 13.44, 77.44, "Tarjeta", "Consulta y medicación analgésica"
    ).lastInsertRowid;
    insertInvItem.run(inv1, "Consulta general y exploración traumatológica", 1, 45.00, 21, 54.45);
    insertInvItem.run(inv1, "Meloxicam 1.5mg/ml suspensión oral 32ml", 1, 19.00, 21, 22.99);

    const inv2 = insertInvoice.run(
      p2, "Laura Fernández", "FAC-2025-000098", lastMonthStr, "Pagada", 52.00, 10.92, 62.92, "Efectivo", "Citología ótica y tratamiento"
    ).lastInsertRowid;
    insertInvItem.run(inv2, "Consulta clínica dermatológica", 1, 35.00, 21, 42.35);
    insertInvItem.run(inv2, "Citología ótica diagnóstica", 1, 17.00, 21, 20.57);

    // ==========================
    // Hospitalización & Cirugías
    // ==========================
    db.prepare(`
      INSERT INTO hospitalizations (
        patient_id, admission_date, reason, cage, status, treatment_plan, nursing_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      p5, todayStr, "Recuperación post-artroscopia de codo", "Box Canino A-1",
      "Hospitalizado", "Fluidoterapia Ringer Lactato a 40ml/h. Tramadol 2mg/kg IV c/8h.",
      "Monitorizar micción y nivel de dolor cada 4 horas."
    );

    db.prepare(`
      INSERT INTO surgeries (
        patient_id, surgery_date, procedure, surgeon, indication,
        anesthesia_protocol, status, findings, postoperative_plan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      p5, todayStr, "Artroscopia diagnóstica y terapéutica", "Dr. Saladin",
      "Cojera crónica en extremidad anterior izquierda por fragmentación de apófisis coronoides.",
      "Premedicación Dexmedetomidina + Metadona, inducción Propofol, mantenimiento Isoflurano.",
      "Completada", "Se extrae fragmento osteocondral de 4mm. Lavado articular con suero heparinizado.",
      "Reposo estricto 15 días, vendaje acolchado 48h, AINEs + antibioterapia profiláctica."
    );

    console.log("✅ Datos clínicos completos sembrados exitosamente.");
  }
}

module.exports = seedDatabase;
