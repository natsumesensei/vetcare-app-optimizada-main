import api from "../api/apiClient";

export async function getPrescriptions(patientId) {
  const res = await api.get(`/patients/${patientId}/prescriptions`);
  return res.data;
}

export async function createPrescription(patientId, data) {
  const res = await api.post(`/patients/${patientId}/prescriptions`, data);
  return res.data;
}

export async function updatePrescription(id, data) {
  const res = await api.put(`/prescriptions/${id}`, data);
  return res.data;
}

export async function deletePrescription(id) {
  const res = await api.delete(`/prescriptions/${id}`);
  return res.data;
}
