import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // En Windows, "localhost" puede resolverse a ::1 mientras Express escucha
  // en IPv4 (0.0.0.0). Eso provoca 502 desde el proxy de Vite.
  const backendUrl = env.VITE_BACKEND_URL || "http://127.0.0.1:3000";

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: false,
      hmr: false,
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          configure(proxy) {
            proxy.on("error", (error) => {
              console.error(`[Vite proxy] No se pudo conectar con ${backendUrl}:`, error.message);
            });
          },
        },
        "/uploads": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
  };
});
