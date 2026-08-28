const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const db = require("../database/db");
const { sendError } = require("../utils/values");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "patient-images");

// Asegurar que la carpeta de subida exista
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

exports.list = (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT * FROM patient_images
         WHERE patient_id = ?
         ORDER BY uploaded_at DESC, id DESC`
      )
      .all(req.params.patientId);

    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
};

exports.upload = (req, res) => {
  try {
    const { image_base64, description, veterinarian } = req.body;

    if (!image_base64) {
      return res.status(400).json({
        success: false,
        message: "No se recibió ninguna imagen.",
      });
    }

    // Formato esperado: "data:image/png;base64,AAAA..."
    const match = image_base64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);

    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Formato de imagen no válido.",
      });
    }

    const mimeType = match[1];
    const extension = ALLOWED_MIME[mimeType];

    if (!extension) {
      return res.status(400).json({
        success: false,
        message: "Solo se permiten imágenes JPG, PNG, WEBP o GIF.",
      });
    }

    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, "base64");

    // Límite de 8 MB por imagen
    if (buffer.length > 8 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "La imagen es demasiado grande (máximo 8 MB).",
      });
    }

    const filename = `${crypto.randomUUID()}.${extension}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    fs.writeFileSync(filePath, buffer);

    const result = db
      .prepare(
        `INSERT INTO patient_images(
          patient_id, filename, original_name, mime_type, description, veterinarian
        ) VALUES(?,?,?,?,?,?)`
      )
      .run(
        req.params.patientId,
        filename,
        req.body.original_name || null,
        mimeType,
        description || null,
        veterinarian || null
      );

    res.status(201).json({
      success: true,
      id: result.lastInsertRowid,
      filename,
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.destroy = (req, res) => {
  try {
    const row = db
      .prepare(`SELECT * FROM patient_images WHERE id = ?`)
      .get(req.params.id);

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Imagen no encontrada.",
      });
    }

    const filePath = path.join(UPLOAD_DIR, row.filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    db.prepare(`DELETE FROM patient_images WHERE id = ?`).run(req.params.id);

    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
};
