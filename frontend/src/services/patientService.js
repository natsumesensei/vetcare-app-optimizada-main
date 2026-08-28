import api from "../api/apiClient";

export const getPatients = async (search = "") => {
  const response = await api.get("/patients", {
    params: search ? { search } : {},
  });
  return response.data;
};

// Se exporta con ambos nombres para compatibilidad
export const getPatientById = async (id) => {
  const response = await api.get(`/patients/${id}`);
  return response.data;
};

export const getPatient = getPatientById;

export const createPatient = async (patientData) => {
  const response = await api.post("/patients", patientData);
  return response.data;
};

export const updatePatient = async (id, patientData) => {
  const response = await api.put(`/patients/${id}`, patientData);
  return response.data;
};

export const deletePatient = async (id) => {
  const response = await api.delete(`/patients/${id}`);
  return response.data;
};

export default {
  getPatients,
  getPatientById,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
};