const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "database.sqlite");

const db = new Database(dbPath);

// Activar claves foráneas
db.pragma("foreign_keys = ON");

// Mejor rendimiento
db.pragma("journal_mode = WAL");

console.log("📦 Base de datos SQLite conectada.");

module.exports = db;