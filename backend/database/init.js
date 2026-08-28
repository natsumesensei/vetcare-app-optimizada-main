const db = require("./db");

function initDatabase() {
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");

  console.log("✅ Base de datos inicializada.");
}

module.exports = initDatabase;