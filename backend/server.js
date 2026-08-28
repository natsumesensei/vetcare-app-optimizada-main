require("dotenv").config();

const express = require("express");
const cors = require("cors");

const config = require("./config/config");

// =========================
// Base de datos
// =========================

const initDatabase = require("./database/init");
const runMigrations = require("./database/migrationRunner");
const seedDatabase = require("./database/seed");

// =========================
// Rutas
// =========================

const authRoutes = require("./routes/auth");
const patientRoutes = require("./routes/patients");
const consultationRoutes = require("./routes/consultations");
const vaccineRoutes = require("./routes/vaccine");
const parasiteRoutes = require("./routes/parasites");
const dashboardRoutes = require("./routes/dashboard");
const appointmentRoutes = require("./routes/appointments");
const inventoryRoutes = require("./routes/inventory");
const surgeryRoutes = require("./routes/surgeries");
const hospitalizationRoutes = require("./routes/hospitalizations");
const professionalRoutes = require("./routes/professional");
const imageRoutes = require("./routes/images");

const app = express();

// =========================
// Middlewares
// =========================

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Servir imágenes subidas de pacientes
app.use(
  "/uploads/patient-images",
  express.static(require("path").join(__dirname, "uploads", "patient-images"))
);

// =========================
// Inicializar Base de Datos
// =========================

initDatabase();
runMigrations();
seedDatabase();

// =========================
// Ruta principal
// =========================

app.get("/", (req, res) => {
    res.json({
        success: true,
        application: "Clínica Veterinaria API",
        version: "1.0.0",
        status: "online"
    });
});

// =========================
// Health Check
// =========================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Servidor funcionando correctamente"
    });
});

// =========================
// API
// =========================

// Autenticación
app.use("/api", authRoutes);

// Pacientes
app.use("/api", patientRoutes);

// Consultas
app.use("/api", consultationRoutes);

// Vacunas
app.use("/api/vaccines", vaccineRoutes);

// Control Parasitario
app.use("/api/parasites", parasiteRoutes);

// Operación diaria (Fase 2)
app.use("/api", dashboardRoutes);
app.use("/api", appointmentRoutes);
app.use("/api", inventoryRoutes);
app.use("/api", surgeryRoutes);
app.use("/api", hospitalizationRoutes);

// Módulos pendientes de fases posteriores
app.use("/api", professionalRoutes);

// Imágenes de pacientes
app.use("/api", imageRoutes);

// =========================
// Ruta no encontrada
// =========================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Ruta no encontrada."
    });
});

// =========================
// Manejo de errores
// =========================

app.use((err, req, res, next) => {

    console.error(err);

    res.status(500).json({
        success: false,
        message: "Error interno del servidor."
    });

});

// =========================
// Iniciar servidor
// =========================

app.listen(config.port, () => {

    console.log(
        `🚀 Servidor ejecutándose en http://localhost:${config.port}`
    );

});