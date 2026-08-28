const db = require("../database/db");

// ===============================
// Listar pacientes
// ===============================
exports.list = (req, res) => {
  try {
    const search = req.query.search || "";

    const patients = db
      .prepare(`
        SELECT *
        FROM patients
        WHERE
          name LIKE ?
          OR owner_name LIKE ?
        ORDER BY id DESC
      `)
      .all(`%${search}%`, `%${search}%`);

    res.json(patients);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Obtener paciente
// ===============================
exports.show = (req, res) => {
  try {
    const patient = db
      .prepare(`
        SELECT *
        FROM patients
        WHERE id = ?
      `)
      .get(req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Paciente no encontrado.",
      });
    }

    res.json(patient);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// Crear paciente
// ===============================
exports.store = (req, res) => {
  try {
    const p = req.body;

    const result = db.prepare(`
      INSERT INTO patients (

        name,
        species,
        breed,
        sex,
        birthdate,
        color,
        weight,
        microchip,
        photo,

        owner_name,
        owner_phone,
        owner_email,
        address,

        allergies,
        notes

      )

      VALUES (

        ?,?,?,?,?,?,?,?,?,
        ?,?,?,?,
        ?,?

      )
    `).run(

      p.name,
      p.species,
      p.breed,
      p.sex,
      p.birthdate,
      p.color,
      p.weight,
      p.microchip,
      p.photo || null,

      p.owner_name,
      p.owner_phone,
      p.owner_email,
      p.address,

      p.allergies,
      p.notes

    );

    res.status(201).json({
      success: true,
      id: result.lastInsertRowid,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ===============================
// Actualizar paciente
// ===============================
exports.update = (req, res) => {

  try {

    const p = req.body;

    db.prepare(`

      UPDATE patients SET

        name=?,
        species=?,
        breed=?,
        sex=?,
        birthdate=?,
        color=?,
        weight=?,
        microchip=?,
        photo=?,

        owner_name=?,
        owner_phone=?,
        owner_email=?,
        address=?,

        allergies=?,
        notes=?,

        updated_at=CURRENT_TIMESTAMP

      WHERE id=?

    `).run(

      p.name,
      p.species,
      p.breed,
      p.sex,
      p.birthdate,
      p.color,
      p.weight,
      p.microchip,
      p.photo || null,

      p.owner_name,
      p.owner_phone,
      p.owner_email,
      p.address,

      p.allergies,
      p.notes,

      req.params.id

    );

    res.json({
      success: true,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// ===============================
// Eliminar paciente
// ===============================
exports.destroy = (req, res) => {

  try {

    db.prepare(`
      DELETE FROM patients
      WHERE id = ?
    `).run(req.params.id);

    res.json({
      success: true,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};