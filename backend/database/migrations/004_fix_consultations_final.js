module.exports = function (db) {

  // SOLO agregar columnas si no existen (seguro)

  const tableInfo = db.prepare(`PRAGMA table_info(consultations)`).all();

  const columns = tableInfo.map(c => c.name);

  if (!columns.includes("notes")) {
    db.exec(`ALTER TABLE consultations ADD COLUMN notes TEXT`);
  }

  if (!columns.includes("date")) {
    db.exec(`ALTER TABLE consultations ADD COLUMN date TEXT`);
  }

};