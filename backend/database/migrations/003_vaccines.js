module.exports = function (db) {
    console.log("📦 Creando tablas de Medicina Preventiva...");

    db.exec(`
        CREATE TABLE IF NOT EXISTS vaccine_catalog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            species TEXT,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vaccines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            vaccine_name TEXT NOT NULL,
            application_date TEXT NOT NULL,
            next_due_date TEXT,
            veterinarian TEXT,
            batch TEXT,
            laboratory TEXT,
            observations TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(patient_id) REFERENCES patients(id)
        );

        CREATE TABLE IF NOT EXISTS parasite_control (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            product TEXT NOT NULL,
            application_date TEXT NOT NULL,
            next_due_date TEXT,
            veterinarian TEXT,
            observations TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(patient_id) REFERENCES patients(id)
        );
    `);

    console.log("✅ Tablas de Medicina Preventiva creadas.");
};