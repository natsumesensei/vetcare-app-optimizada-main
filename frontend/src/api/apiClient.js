import axios from "axios";
import { toast } from "sonner";
import { API_URL } from "../config/config";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

function friendlyMessage(error) {
  if (!error.response) {
    return "No se pudo conectar con el servidor. Verifica que el backend esté encendido.";
  }

  const { status } = error.response;

  if (status === 401) return "Tu sesión expiró. Inicia sesión de nuevo.";
  if (status === 403) return "No tienes permiso para hacer esto.";
  if (status === 404) return "Esta función todavía no está disponible.";
  if (status >= 500) return "Ocurrió un error en el servidor. Intenta de nuevo.";

  return error.response.data?.message || "Ocurrió un error inesperado.";
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    // No interrumpe la app: solo avisa. Cada pantalla decide, con su propio
    // catch, si además necesita mostrar un estado vacío/de error en el cuerpo.
    toast.error(friendlyMessage(error));

    return Promise.reject(error);
  }
);

export default api;
