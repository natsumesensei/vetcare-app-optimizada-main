const db = require("../database/db");
const { sendError } = require("../utils/values");

exports.list = (req, res) => {
  try {
    const species = req.query.species || "dog";
    const rows = db
      .prepare(
        `SELECT * FROM clinical_reference_values
         WHERE species = ? OR ? = 'all'
         ORDER BY category, parameter`
      )
      .all(species, species);
    res.json(rows);
  } catch (error) {
    sendError(res, error);
  }
};
