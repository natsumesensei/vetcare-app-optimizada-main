import api from "../api/apiClient";

const BASE_URL = "/vaccines";

export async function getVaccines(patientId) {

    const res = await api.get(`${BASE_URL}/patient/${patientId}`);

    return res.data;

}

export async function createVaccine(data) {

    const res = await api.post(BASE_URL, data);

    return res.data;

}

export async function updateVaccine(id, data) {

    const res = await api.put(`${BASE_URL}/${id}`, data);

    return res.data;

}

export async function deleteVaccine(id) {

    const res = await api.delete(`${BASE_URL}/${id}`);

    return res.data;

}