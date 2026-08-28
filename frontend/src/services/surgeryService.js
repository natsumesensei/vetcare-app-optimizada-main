import api from "../api/apiClient";

export async function getSurgeries(patientId) {
  const res = await api.get(`/surgeries`, {
    params: { patient_id: patientId },
  });
  return res.data;
}

export async function createSurgery(patientId, data) {
  const res = await api.post(`/surgeries`, { ...data, patient_id: patientId });
  return res.data;
}

export async function updateSurgery(id, data) {
  const res = await api.put(`/surgeries/${id}`, data);
  return res.data;
}

export async function deleteSurgery(id) {
  const res = await api.delete(`/surgeries/${id}`);
  return res.data;
}
