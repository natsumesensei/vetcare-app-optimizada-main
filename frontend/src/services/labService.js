import api from "../api/apiClient";

export async function getLabs(patientId) {
  const res = await api.get(`/patients/${patientId}/labs`);
  return res.data;
}

export async function createLab(patientId, data) {
  const res = await api.post(`/patients/${patientId}/labs`, data);
  return res.data;
}

export async function updateLab(id, data) {
  const res = await api.put(`/labs/${id}`, data);
  return res.data;
}

export async function deleteLab(id) {
  const res = await api.delete(`/labs/${id}`);
  return res.data;
}
