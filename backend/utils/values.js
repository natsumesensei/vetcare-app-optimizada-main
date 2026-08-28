function emptyToNull(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return value;
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function sendError(res, error) {
  console.error(error);
  return res.status(500).json({
    success: false,
    message: error.message || "Error interno del servidor.",
  });
}

module.exports = { emptyToNull, toNumber, today, sendError };
