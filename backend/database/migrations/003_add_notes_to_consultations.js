module.exports = function (db) {
  db.exec(`
    ALTER TABLE consultations
    ADD COLUMN notes TEXT;
  `);
};