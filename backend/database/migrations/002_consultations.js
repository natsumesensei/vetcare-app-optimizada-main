module.exports = function (db) {

    db.exec(`

    CREATE TABLE IF NOT EXISTS consultations (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        patient_id INTEGER NOT NULL,

        consultation_date TEXT,

        veterinarian TEXT,

        reason TEXT,

        clinical_signs TEXT,

        temperature REAL,

        heart_rate INTEGER,

        respiratory_rate INTEGER,

        weight REAL,

        diagnosis TEXT,

        treatment TEXT,

        observations TEXT,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY(patient_id)
        REFERENCES patients(id)
        ON DELETE CASCADE

    );

    CREATE INDEX IF NOT EXISTS idx_consultations_patient
    ON consultations(patient_id);

    `);

};