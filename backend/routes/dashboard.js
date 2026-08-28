const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/dashboardController");

router.get("/dashboard", auth, controller.show);

module.exports = router;
