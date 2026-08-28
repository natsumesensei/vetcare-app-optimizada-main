const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const controller = require("../controllers/inventoryController");

router.get("/inventory", auth, controller.list);
router.get("/inventory/:id", auth, controller.show);
router.post("/inventory", auth, controller.store);
router.put("/inventory/:id", auth, controller.update);
router.delete("/inventory/:id", auth, controller.destroy);

module.exports = router;
