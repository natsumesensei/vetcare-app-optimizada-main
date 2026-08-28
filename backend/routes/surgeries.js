const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/surgeryController");

router.get("/surgeries", auth, controller.list);
router.get("/surgeries/:id", auth, controller.show);
router.post("/surgeries", auth, controller.store);
router.put("/surgeries/:id", auth, controller.update);
router.delete("/surgeries/:id", auth, controller.destroy);
router.delete("/surgeries/:id", auth, controller.destroy);

module.exports = router;
