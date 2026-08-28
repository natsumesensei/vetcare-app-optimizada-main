module.exports = function (db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      owner_name TEXT,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 30,
      type TEXT NOT NULL DEFAULT 'Consulta',
      status TEXT NOT NULL DEFAULT 'Programada',
      veterinarian TEXT,
      reason TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date, appointment_time);

    CREATE TABLE IF NOT EXISTS weights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      measured_at TEXT NOT NULL,
      weight REAL NOT NULL,
      body_condition_score INTEGER,
      notes TEXT,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      consultation_id INTEGER,
      medication TEXT NOT NULL,
      concentration TEXT,
      dose TEXT,
      route TEXT,
      frequency TEXT,
      duration TEXT,
      quantity TEXT,
      instructions TEXT,
      start_date TEXT,
      end_date TEXT,
      veterinarian TEXT,
      status TEXT DEFAULT 'Activa',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY(consultation_id) REFERENCES consultations(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      presentation TEXT,
      unit TEXT DEFAULT 'unidad',
      stock REAL DEFAULT 0,
      minimum_stock REAL DEFAULT 0,
      lot TEXT,
      expiry_date TEXT,
      supplier TEXT,
      purchase_price REAL DEFAULT 0,
      sale_price REAL DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inventory_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      owner_name TEXT,
      invoice_number TEXT NOT NULL UNIQUE,
      issue_date TEXT NOT NULL,
      status TEXT DEFAULT 'Pendiente',
      subtotal REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total REAL DEFAULT 0,
      payment_method TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      total REAL DEFAULT 0,
      FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS surgeries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      surgery_date TEXT NOT NULL,
      procedure TEXT NOT NULL,
      surgeon TEXT,
      indication TEXT,
      preoperative_assessment TEXT,
      anesthesia_protocol TEXT,
      findings TEXT,
      complications TEXT,
      postoperative_plan TEXT,
      discharge_notes TEXT,
      status TEXT DEFAULT 'Programada',
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS anesthesia_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      surgery_id INTEGER,
      record_date TEXT NOT NULL,
      anesthetist TEXT,
      protocol TEXT,
      asa_status TEXT,
      premedication TEXT,
      induction TEXT,
      maintenance TEXT,
      analgesia TEXT,
      monitoring TEXT,
      complications TEXT,
      recovery TEXT,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY(surgery_id) REFERENCES surgeries(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS hospitalizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      admission_date TEXT NOT NULL,
      discharge_date TEXT,
      reason TEXT,
      cage TEXT,
      status TEXT DEFAULT 'Hospitalizado',
      treatment_plan TEXT,
      nursing_notes TEXT,
      discharge_instructions TEXT,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS clinical_reference_values (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      species TEXT NOT NULL,
      category TEXT NOT NULL,
      parameter TEXT NOT NULL,
      unit TEXT,
      min_value REAL,
      max_value REAL,
      source TEXT,
      notes TEXT,
      UNIQUE(species, parameter, unit)
    );

    CREATE TABLE IF NOT EXISTS lab_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      panel TEXT,
      parameter TEXT NOT NULL,
      result_value REAL,
      result_text TEXT,
      unit TEXT,
      reference_min REAL,
      reference_max REAL,
      interpretation TEXT,
      veterinarian TEXT,
      notes TEXT,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity TEXT,
      entity_id INTEGER,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  const insert = db.prepare(`INSERT OR IGNORE INTO clinical_reference_values
    (species, category, parameter, unit, min_value, max_value, source) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const seed = db.transaction(() => {
    const source = 'Merck Veterinary Manual, actualizado 2024; confirmar siempre con el laboratorio.';
    const rows = [
      ['dog','Hematología','Hematocrito','%',35,57],['cat','Hematología','Hematocrito','%',30,45],
      ['dog','Hematología','Hemoglobina','g/dL',11.9,18.9],['cat','Hematología','Hemoglobina','g/dL',9.8,15.4],
      ['dog','Hematología','Eritrocitos','10^6/µL',4.95,7.87],['cat','Hematología','Eritrocitos','10^6/µL',5,10],
      ['dog','Hematología','VCM','fL',66,77],['cat','Hematología','VCM','fL',39,55],
      ['dog','Hematología','Plaquetas','10^3/µL',211,621],['cat','Hematología','Plaquetas','10^3/µL',300,800],
      ['dog','Hematología','Leucocitos','10^3/µL',5,14.1],['cat','Hematología','Leucocitos','10^3/µL',5.5,19.5],
      ['dog','Bioquímica','ALT','U/L',10,109],['cat','Bioquímica','ALT','U/L',25,97],
      ['dog','Bioquímica','Creatinina','mg/dL',0.5,1.7],['cat','Bioquímica','Creatinina','mg/dL',0.9,2.2],
      ['dog','Bioquímica','Glucosa','mg/dL',76,119],['cat','Bioquímica','Glucosa','mg/dL',60,120],
      ['dog','Bioquímica','Fósforo','mg/dL',2.9,5.3],['cat','Bioquímica','Fósforo','mg/dL',3,6.1],
      ['dog','Bioquímica','Potasio','mmol/L',3.9,5.1],['cat','Bioquímica','Potasio','mmol/L',3.7,6.1],
      ['dog','Bioquímica','Sodio','mmol/L',142,152],['cat','Bioquímica','Sodio','mmol/L',146,156],
      ['dog','Bioquímica','Proteínas totales','g/dL',5.4,7.5],['cat','Bioquímica','Proteínas totales','g/dL',6,7.9],
      ['dog','Bioquímica','Albúmina','g/dL',2.3,3.1],['cat','Bioquímica','Albúmina','g/dL',2.8,3.9],
      ['dog','Bioquímica','Urea nitrogenada','mg/dL',8,28],['cat','Bioquímica','Urea nitrogenada','mg/dL',19,34],
    ];
    rows.forEach(r => insert.run(...r, source));
  });
  seed();
};
