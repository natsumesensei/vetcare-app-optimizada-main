const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const controller = require("../controllers/patientController");

router.get("/patients", auth, controller.list);

router.get("/patients/:id", auth, controller.show);

router.post("/patients", auth, controller.store);

router.put("/patients/:id", auth, controller.update);

router.delete("/patients/:id", auth, controller.destroy);

module.exports = router;