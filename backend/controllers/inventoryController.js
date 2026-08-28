const db = require("../database/db");
const { emptyToNull, toNumber, sendError } = require("../utils/values");

function payload(body) {
  return {
    name: (body.name || "").trim(),
    category: emptyToNull(body.category),
    presentation: emptyToNull(body.presentation),
    unit: body.unit || "unidad",
    stock: toNumber(body.stock, 0),
    minimum_stock: toNumber(body.minimum_stock, 0),
    lot: emptyToNull(body.lot),
    expiry_date: emptyToNull(body.expiry_date),
    supplier: emptyToNull(body.supplier),
    purchase_price: toNumber(body.purchase_price, 0),
    sale_price: toNumber(body.sale_price, 0),
    active: body.active === false || body.active === 0 ? 0 : 1,
  };
}

exports.list = (req, res) => {
  try {
    const rows = db
      .prepare("SELECT * FROM inventory ORDER BY active DESC, name")
      .all();
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
};

exports.show = (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM inventory WHERE id = ?").get(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: "Producto no encontrado." });
    }
    res.json(row);
  } catch (error) {
    sendError(res, error);
  }
};

exports.store = (req, res) => {
  try {
    const p = payload(req.body);
    if (!p.name) {
      return res.status(400).json({
        success: false,
        message: "El nombre del producto es obligatorio.",
      });
    }

    const result = db
      .prepare(
        `INSERT INTO inventory (
          name, category, presentation, unit, stock, minimum_stock,
          lot, expiry_date, supplier, purchase_price, sale_price, active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        p.name,
        p.category,
        p.presentation,
        p.unit,
        p.stock,
        p.minimum_stock,
        p.lot,
        p.expiry_date,
        p.supplier,
        p.purchase_price,
        p.sale_price,
        p.active
      );

    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    sendError(res, error);
  }
};

exports.update = (req, res) => {
  try {
    const existing = db.prepare("SELECT id FROM inventory WHERE id = ?").get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Producto no encontrado." });
    }

    const p = payload(req.body);

    db.prepare(
      `UPDATE inventory SET
        name = ?, category = ?, presentation = ?, unit = ?, stock = ?,
        minimum_stock = ?, lot = ?, expiry_date = ?, supplier = ?,
        purchase_price = ?, sale_price = ?, active = ?
       WHERE id = ?`
    ).run(
      p.name,
      p.category,
      p.presentation,
      p.unit,
      p.stock,
      p.minimum_stock,
      p.lot,
      p.expiry_date,
      p.supplier,
      p.purchase_price,
      p.sale_price,
      p.active,
      req.params.id
    );

    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
};

exports.destroy = (req, res) => {
  try {
    db.prepare("DELETE FROM inventory WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
};
