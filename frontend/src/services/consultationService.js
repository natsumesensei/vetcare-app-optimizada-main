import api from "../api/apiClient";

// ===============================
// LISTAR CONSULTAS DE PACIENTE
// ===============================
export async function getConsultations(patientId) {
  if (!patientId) {
    throw new Error("patientId no proporcionado");
  }

  const { data } = await api.get(`/${patientId}/consultations`);
  return data;
}

// ===============================
// CREAR CONSULTA
// ===============================
export async function createConsultation(patientId, data) {
  if (!patientId) {
    throw new Error("patientId no proporcionado");
  }

  const res = await api.post(`/${patientId}/consultations`, data);
  return res.data;
}

// ===============================
// ACTUALIZAR CONSULTA
// ===============================
export async function updateConsultation(id, data) {
  const res = await api.put(`/consultation/${id}`, data);
  return res.data;
}

// ===============================
// ELIMINAR CONSULTA
// ===============================
export async function deleteConsultation(id) {
  const res = await api.delete(`/consultation/${id}`);
  return res.data;
}
