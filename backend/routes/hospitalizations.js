const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/hospitalizationController");

router.get("/hospitalizations", auth, controller.list);
router.get("/hospitalizations/:id", auth, controller.show);
router.post("/hospitalizations", auth, controller.store);
router.put("/hospitalizations/:id", auth, controller.update);
router.delete("/hospitalizations/:id", auth, controller.destroy);

module.exports = router;
