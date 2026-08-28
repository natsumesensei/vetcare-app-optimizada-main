module.exports = function (db) {

    db.exec(`

    CREATE TABLE IF NOT EXISTS users (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        name TEXT NOT NULL,

        email TEXT NOT NULL UNIQUE,

        password TEXT NOT NULL,

        role TEXT NOT NULL DEFAULT 'admin',

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP

    );

    CREATE TABLE IF NOT EXISTS settings (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        clinic_name TEXT,

        veterinarian TEXT,

        phone TEXT,

        email TEXT,

        address TEXT,

        logo TEXT,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP

    );

    CREATE TABLE IF NOT EXISTS patients (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        name TEXT NOT NULL,

        species TEXT NOT NULL,

        breed TEXT,

        sex TEXT,

        birthdate TEXT,

        color TEXT,

        weight REAL,

        microchip TEXT,

        photo TEXT,

        owner_name TEXT NOT NULL,

        owner_phone TEXT,

        owner_email TEXT,

        address TEXT,

        allergies TEXT,

        notes TEXT,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP

    );

    CREATE INDEX IF NOT EXISTS idx_patients_name
    ON patients(name);

    CREATE INDEX IF NOT EXISTS idx_patients_owner
    ON patients(owner_name);

    `);

};