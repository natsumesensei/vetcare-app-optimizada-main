const express = require("express");

const router = express.Router();

const auth = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

// Login
router.post("/auth/login", auth.login);

// Perfil del Usuario Autenticado
router.get("/auth/profile", authMiddleware, auth.getProfile);
router.put("/auth/profile", authMiddleware, auth.updateProfile);

// Información de la clínica
router.get("/settings/clinic", auth.getClinic);

// Gestión de Usuarios
router.get("/users", authMiddleware, auth.getUsers);
router.post("/users", authMiddleware, auth.createUser);
router.put("/users/:id", authMiddleware, auth.updateUser);
router.delete("/users/:id", authMiddleware, auth.deleteUser);

module.exports = router;
