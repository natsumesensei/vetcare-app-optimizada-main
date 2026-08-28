const fs = require("fs");
const path = require("path");
const db = require("./db");

function runMigrations() {

    db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations(

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            migration TEXT UNIQUE,

            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP

        );
    `);

    const folder = path.join(__dirname, "migrations");

    const files = fs
        .readdirSync(folder)
        .filter(file => file.endsWith(".js"))
        .sort();

    for (const file of files) {

        const exists = db.prepare(
            `
            SELECT *
            FROM schema_migrations
            WHERE migration = ?
            `
        ).get(file);

        if (exists) {

            console.log(`✔ ${file}`);

            continue;

        }

        console.log(`🚀 Ejecutando ${file}`);

        const migration = require(path.join(folder, file));

        migration(db);

        db.prepare(`
            INSERT INTO schema_migrations(migration)
            VALUES(?)
        `).run(file);

    }

}

module.exports = runMigrations;