const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

// Base de datos y migraciones
const initDatabase = require("./backend/database/init");
const runMigrations = require("./backend/database/migrationRunner");
const seedDatabase = require("./backend/database/seed");

// Rutas de API
const authRoutes = require("./backend/routes/auth");
const patientRoutes = require("./backend/routes/patients");
const consultationRoutes = require("./backend/routes/consultations");
const vaccineRoutes = require("./backend/routes/vaccine");
const parasiteRoutes = require("./backend/routes/parasites");
const dashboardRoutes = require("./backend/routes/dashboard");
const appointmentRoutes = require("./backend/routes/appointments");
const inventoryRoutes = require("./backend/routes/inventory");
const surgeryRoutes = require("./backend/routes/surgeries");
const hospitalizationRoutes = require("./backend/routes/hospitalizations");
const professionalRoutes = require("./backend/routes/professional");
const imageRoutes = require("./backend/routes/images");

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middlewares
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  // Archivos estáticos de imágenes de pacientes
  app.use(
    "/uploads/patient-images",
    express.static(path.join(__dirname, "backend", "uploads", "patient-images"))
  );

  // Inicializar Base de Datos SQLite
  try {
    initDatabase();
    runMigrations();
    seedDatabase();
    console.log("✅ Base de datos inicializada correctamente.");
  } catch (error) {
    console.error("⚠️ Error inicializando base de datos:", error.message);
  }

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      application: "VetCare API",
      version: "1.0.0",
      status: "online",
    });
  });

  // Rutas API
  app.use("/api", authRoutes);
  app.use("/api", patientRoutes);
  app.use("/api", consultationRoutes);
  app.use("/api/vaccines", vaccineRoutes);
  app.use("/api/parasites", parasiteRoutes);
  app.use("/api", dashboardRoutes);
  app.use("/api", appointmentRoutes);
  app.use("/api", inventoryRoutes);
  app.use("/api", surgeryRoutes);
  app.use("/api", hospitalizationRoutes);
  app.use("/api", professionalRoutes);
  app.use("/api", imageRoutes);

  // Frontend integration: Vite middleware in development, static files in production
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(__dirname, "frontend", "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        configFile: path.resolve(__dirname, "frontend", "vite.config.js"),
        server: {
          middlewareMode: true,
          host: "0.0.0.0",
          hmr: false,
        },
        appType: "spa",
        root: path.resolve(__dirname, "frontend"),
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error("Error starting Vite middleware, fallback to dist:", e);
      const distPath = path.join(__dirname, "frontend", "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor.",
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 VetCare server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
