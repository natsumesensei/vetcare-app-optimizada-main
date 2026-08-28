const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/appointmentController");

router.get("/appointments", auth, controller.list);
router.get("/appointments/:id", auth, controller.show);
router.post("/appointments", auth, controller.store);
router.put("/appointments/:id", auth, controller.update);
router.delete("/appointments/:id", auth, controller.destroy);

module.exports = router;
