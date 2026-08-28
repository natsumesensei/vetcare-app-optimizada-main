import api from "../api/apiClient";
import { API_URL } from "../config/config";

// La URL base del servidor sin el sufijo /api, para construir la ruta
// pública de las imágenes servidas de forma estática.
export const SERVER_URL = API_URL.replace(/\/api$/, "");

export function getImageUrl(filename) {
  return `${SERVER_URL}/uploads/patient-images/${filename}`;
}

export async function getImages(patientId) {
  const res = await api.get(`/patients/${patientId}/images`);
  return res.data;
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(patientId, { file, description, veterinarian }) {
  const image_base64 = await fileToBase64(file);

  const res = await api.post(`/patients/${patientId}/images`, {
    image_base64,
    original_name: file.name,
    description,
    veterinarian,
  });

  return res.data;
}

export async function deleteImage(id) {
  const res = await api.delete(`/images/${id}`);
  return res.data;
}
