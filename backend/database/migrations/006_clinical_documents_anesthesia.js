module.exports = function (db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS anesthesia_monitoring (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anesthesia_record_id INTEGER NOT NULL,
      elapsed_minutes INTEGER DEFAULT 0,
      heart_rate REAL,
      respiratory_rate REAL,
      spo2 REAL,
      etco2 REAL,
      temperature REAL,
      systolic_bp REAL,
      diastolic_bp REAL,
      mean_bp REAL,
      ecg TEXT,
      anesthetic_depth TEXT,
      oxygen_flow REAL,
      sevoflurane REAL,
      isoflurane REAL,
      fluids_ml_h REAL,
      notes TEXT,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(anesthesia_record_id) REFERENCES anesthesia_records(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_anesthesia_monitoring_record ON anesthesia_monitoring(anesthesia_record_id, elapsed_minutes);
  `);
};
