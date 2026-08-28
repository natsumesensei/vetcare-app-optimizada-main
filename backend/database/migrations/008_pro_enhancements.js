module.exports = function (db) {
  // Helper para añadir columnas si no existen
  function addColumnIfNotExists(table, column, def) {
    try {
      const cols = db.prepare(`PRAGMA table_info(${table})`).all();
      if (!cols.some((c) => c.name === column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
      }
    } catch (e) {
      console.warn(`Aviso al alterar tabla ${table}.${column}:`, e.message);
    }
  }

  // 1. Ampliación de tabla settings
  addColumnIfNotExists("settings", "nif", "TEXT DEFAULT 'B-12345678'");
  addColumnIfNotExists("settings", "license_number", "TEXT DEFAULT 'COL-MAD-4521'");
  addColumnIfNotExists("settings", "website", "TEXT DEFAULT 'www.vetcare-saladin.es'");
  addColumnIfNotExists("settings", "currency", "TEXT DEFAULT 'EUR'");
  addColumnIfNotExists("settings", "currency_symbol", "TEXT DEFAULT '€'");
  addColumnIfNotExists("settings", "tax_rate", "REAL DEFAULT 21");
  addColumnIfNotExists("settings", "invoice_prefix", "TEXT DEFAULT 'FAC-2026-'");
  addColumnIfNotExists("settings", "next_invoice_number", "INTEGER DEFAULT 105");
  addColumnIfNotExists("settings", "payment_terms", "TEXT DEFAULT 'Pago al contado / Vencimiento a 30 días'");
  addColumnIfNotExists("settings", "payment_methods", "TEXT DEFAULT '[\"Tarjeta\",\"Efectivo\",\"Transferencia\",\"Bizum\",\"Financiación\"]'");
  addColumnIfNotExists("settings", "vaccine_alert_days", "INTEGER DEFAULT 15");
  addColumnIfNotExists("settings", "deworming_alert_days", "INTEGER DEFAULT 15");
  addColumnIfNotExists("settings", "low_stock_threshold", "INTEGER DEFAULT 5");
  addColumnIfNotExists("settings", "date_format", "TEXT DEFAULT 'DD/MM/YYYY'");
  addColumnIfNotExists("settings", "time_format", "TEXT DEFAULT '24h'");
  addColumnIfNotExists("settings", "theme", "TEXT DEFAULT 'light'");
  addColumnIfNotExists("settings", "legal_notes", "TEXT DEFAULT 'Centro Veterinario autorizado. Factura oficial simplificada exenta de retenciones IRPF salvo indicación expresa.'");

  // 2. Ampliación de facturas (invoices)
  addColumnIfNotExists("invoices", "currency", "TEXT DEFAULT 'EUR'");
  addColumnIfNotExists("invoices", "due_date", "TEXT");
  addColumnIfNotExists("invoices", "discount_rate", "REAL DEFAULT 0");
  addColumnIfNotExists("invoices", "discount_amount", "REAL DEFAULT 0");
  addColumnIfNotExists("invoices", "tax_id", "TEXT");
  addColumnIfNotExists("invoices", "owner_address", "TEXT");
  addColumnIfNotExists("invoices", "owner_phone", "TEXT");
  addColumnIfNotExists("invoices", "owner_email", "TEXT");
  addColumnIfNotExists("invoices", "patient_species", "TEXT");
  addColumnIfNotExists("invoices", "patient_breed", "TEXT");
  addColumnIfNotExists("invoices", "patient_microchip", "TEXT");

  // 3. Ampliación de líneas de factura (invoice_items)
  addColumnIfNotExists("invoice_items", "discount_rate", "REAL DEFAULT 0");

  // 4. Tablas para el Sistema de Laboratorio
  db.exec(`
    CREATE TABLE IF NOT EXISTS lab_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE,
      patient_id INTEGER NOT NULL,
      order_date TEXT NOT NULL,
      veterinarian TEXT,
      sample_type TEXT DEFAULT 'Sangre',
      panel TEXT,
      status TEXT DEFAULT 'Pendiente',
      indications TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON lab_orders(patient_id, order_date);

    CREATE TABLE IF NOT EXISTS lab_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      test_name TEXT NOT NULL,
      category TEXT,
      unit TEXT,
      result_value REAL,
      result_text TEXT,
      reference_min REAL,
      reference_max REAL,
      status TEXT DEFAULT 'NORMAL',
      notes TEXT,
      FOREIGN KEY(order_id) REFERENCES lab_orders(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_lab_order_items_order ON lab_order_items(order_id);

    CREATE TABLE IF NOT EXISTS notifications_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key_id TEXT UNIQUE,
      is_read INTEGER DEFAULT 0,
      read_at DATETIME
    );
  `);

  // 5. Sembrar catálogo amplio de valores de referencia veterinarios
  const insertRef = db.prepare(`
    INSERT OR IGNORE INTO clinical_reference_values
    (species, category, parameter, unit, min_value, max_value, source, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const referenceCatalog = [
    // Canino - Bioquímica ampliada
    ["dog", "Bioquímica", "Fosfatasa Alcalina (FA)", "U/L", 23, 212, "Merck Vet 2024", "Enzima hepática e inducible"],
    ["dog", "Bioquímica", "GGT", "U/L", 1, 10, "Merck Vet 2024", "Colestasis biliar"],
    ["dog", "Bioquímica", "Bilirrubina total", "mg/dL", 0.1, 0.5, "Merck Vet 2024", "Ictericia / hemólisis"],
    ["dog", "Bioquímica", "Colesterol", "mg/dL", 135, 270, "Merck Vet 2024", "Metabolismo lipídico"],
    ["dog", "Bioquímica", "Triglicéridos", "mg/dL", 20, 112, "Merck Vet 2024", "Ayuno previo"],
    ["dog", "Bioquímica", "Calcio", "mg/dL", 9.0, 11.5, "Merck Vet 2024", "Paratiroides / renal"],
    ["dog", "Bioquímica", "Amilasa", "U/L", 500, 1500, "Merck Vet 2024", "Marcador pancreático"],
    ["dog", "Bioquímica", "Lipasa", "U/L", 200, 1800, "Merck Vet 2024", "Marcador pancreático"],

    // Felino - Bioquímica ampliada
    ["cat", "Bioquímica", "Fosfatasa Alcalina (FA)", "U/L", 14, 111, "Merck Vet 2024", "Vida media corta en gatos"],
    ["cat", "Bioquímica", "GGT", "U/L", 0, 5, "Merck Vet 2024", "Colangiohepatitis"],
    ["cat", "Bioquímica", "Bilirrubina total", "mg/dL", 0.1, 0.4, "Merck Vet 2024", "Ictericia felina"],
    ["cat", "Bioquímica", "Colesterol", "mg/dL", 75, 220, "Merck Vet 2024", "Lípidos en suero"],
    ["cat", "Bioquímica", "Calcio", "mg/dL", 8.2, 10.8, "Merck Vet 2024", "Calcio total"],
    ["cat", "Bioquímica", "Fructosamina", "µmol/L", 190, 365, "Merck Vet 2024", "Control glucémico diabetes felina"],

    // Electrolitos y Gases
    ["dog", "Electrolitos", "Cloro", "mmol/L", 105, 115, "Merck Vet 2024", "Equilibrio ácido-base"],
    ["cat", "Electrolitos", "Cloro", "mmol/L", 115, 130, "Merck Vet 2024", "Equilibrio ácido-base"],
    ["dog", "Electrolitos", "Magnesio", "mg/dL", 1.8, 2.4, "Merck Vet 2024", "Catión intracelular"],
    ["cat", "Electrolitos", "Magnesio", "mg/dL", 1.7, 2.5, "Merck Vet 2024", "Catión intracelular"],

    // Urianálisis
    ["dog", "Urianálisis", "Densidad urinaria", "g/ml", 1.015, 1.045, "Merck Vet 2024", "Refractómetro"],
    ["cat", "Urianálisis", "Densidad urinaria", "g/ml", 1.020, 1.060, "Merck Vet 2024", "Capacidad concentradora felina"],
    ["dog", "Urianálisis", "pH Urinario", "pH", 5.5, 7.5, "Merck Vet 2024", "Tira reactiva / pHmetro"],
    ["cat", "Urianálisis", "pH Urinario", "pH", 6.0, 7.0, "Merck Vet 2024", "Cristaluria estruvita vs oxalato"],

    // Endocrinología
    ["dog", "Endocrinología", "T4 Total", "µg/dL", 1.0, 4.0, "Merck Vet 2024", "Descarte hipotiroidismo canino"],
    ["cat", "Endocrinología", "T4 Total", "µg/dL", 0.8, 4.0, "Merck Vet 2024", "Descarte hipertiroidismo felino"],
    ["dog", "Endocrinología", "Cortisol basal", "µg/dL", 1.0, 5.0, "Merck Vet 2024", "Cushing / Addison"],

    // Equino
    ["horse", "Hematología", "Hematocrito", "%", 32, 48, "Merck Vet 2024", "Variación esplénica"],
    ["horse", "Hematología", "Hemoglobina", "g/dL", 11.0, 19.0, "Merck Vet 2024", "Oxigenación"],
    ["horse", "Bioquímica", "Creatinina", "mg/dL", 0.9, 1.8, "Merck Vet 2024", "Función renal"],
    ["horse", "Bioquímica", "Urea", "mg/dL", 10, 24, "Merck Vet 2024", "Metabolismo proteico"],
    ["horse", "Bioquímica", "Lactato", "mmol/L", 0.5, 2.0, "Merck Vet 2024", "Cólicos y perfusión tisular"],

    // Conejo
    ["rabbit", "Hematología", "Hematocrito", "%", 33, 50, "Merck Vet 2024", "Heterófilos característicos"],
    ["rabbit", "Bioquímica", "Glucosa", "mg/dL", 75, 150, "Merck Vet 2024", "Hiperglucemia por estrés"],
    ["rabbit", "Bioquímica", "Calcio", "mg/dL", 12.5, 16.0, "Merck Vet 2024", "Excreción renal dependiente de dieta"],
  ];

  db.transaction(() => {
    referenceCatalog.forEach((row) => insertRef.run(...row));
  })();

  // 6. Sembrar órdenes de laboratorio iniciales si no existen
  const orderCount = db.prepare("SELECT COUNT(*) as c FROM lab_orders").get().c;
  if (orderCount === 0) {
    const patient1 = db.prepare("SELECT id FROM patients WHERE name = 'Max' LIMIT 1").get();
    const patient2 = db.prepare("SELECT id FROM patients WHERE name = 'Luna' LIMIT 1").get();

    if (patient1) {
      const orderDate = new Date().toISOString().slice(0, 10);
      const res1 = db.prepare(`
        INSERT INTO lab_orders (order_number, patient_id, order_date, veterinarian, sample_type, panel, status, indications, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        "LAB-2026-0001",
        patient1.id,
        orderDate,
        "Dr. Saladin",
        "Sangre entera con EDTA y Suero",
        "Perfil Completo Canino (Hemograma + Bioquímica)",
        "Completado",
        "Chequeo previo a AINEs y control de cojera",
        "Resultados globales dentro de parámetros fisiológicos normales."
      );

      const items1 = [
        ["Hematocrito", "Hematología", "%", 46.5, null, 35, 57, "NORMAL", "Serie roja adecuada"],
        ["Hemoglobina", "Hematología", "g/dL", 15.8, null, 11.9, 18.9, "NORMAL", ""],
        ["Leucocitos", "Hematología", "10^3/µL", 8.4, null, 5.0, 14.1, "NORMAL", "Sin desviación izquierda"],
        ["Plaquetas", "Hematología", "10^3/µL", 320, null, 211, 621, "NORMAL", "Agregados normales"],
        ["ALT", "Bioquímica", "U/L", 42, null, 10, 109, "NORMAL", "Función hepatocelular OK"],
        ["Creatinina", "Bioquímica", "mg/dL", 1.1, null, 0.5, 1.7, "NORMAL", "Filtración glomerular conservada"],
        ["Urea nitrogenada", "Bioquímica", "mg/dL", 18.2, null, 8, 28, "NORMAL", ""],
        ["Glucosa", "Bioquímica", "mg/dL", 94, null, 76, 119, "NORMAL", "Normoglucémico"],
      ];

      const insertItem = db.prepare(`
        INSERT INTO lab_order_items (order_id, test_name, category, unit, result_value, result_text, reference_min, reference_max, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      items1.forEach((it) => insertItem.run(res1.lastInsertRowid, ...it));
    }

    if (patient2) {
      const orderDate2 = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().slice(0, 10);
      const res2 = db.prepare(`
        INSERT INTO lab_orders (order_number, patient_id, order_date, veterinarian, sample_type, panel, status, indications, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        "LAB-2026-0002",
        patient2.id,
        orderDate2,
        "Dra. Elena Vega",
        "Suero / Sangre",
        "Perfil Renal y Fructosamina Felina",
        "Completado",
        "Evaluación rutinaria preventiva en paciente felino",
        "Creatinina y BUN levemente en límite superior, monitorizar hidratación."
      );

      const items2 = [
        ["Creatinina", "Bioquímica", "mg/dL", 2.0, null, 0.9, 2.2, "NORMAL", "Límite alto"],
        ["Urea nitrogenada", "Bioquímica", "mg/dL", 31, null, 19, 34, "NORMAL", ""],
        ["Fósforo", "Bioquímica", "mg/dL", 4.2, null, 3.0, 6.1, "NORMAL", ""],
        ["Fructosamina", "Bioquímica", "µmol/L", 260, null, 190, 365, "NORMAL", "Descarte diabetes OK"],
        ["T4 Total", "Endocrinología", "µg/dL", 2.1, null, 0.8, 4.0, "NORMAL", "Tiroides normal"],
      ];

      const insertItem = db.prepare(`
        INSERT INTO lab_order_items (order_id, test_name, category, unit, result_value, result_text, reference_min, reference_max, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      items2.forEach((it) => insertItem.run(res2.lastInsertRowid, ...it));
    }
  }

  console.log("✅ Migración 008 (Pro Upgrades) aplicada correctamente.");
};
