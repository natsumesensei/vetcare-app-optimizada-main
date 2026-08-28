const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/imageController");

router.get("/patients/:patientId/images", auth, controller.list);
router.post("/patients/:patientId/images", auth, controller.upload);
router.delete("/images/:id", auth, controller.destroy);

module.exports = router;
