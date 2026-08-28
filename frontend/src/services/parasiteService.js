import api from "../api/apiClient";

const BASE_URL = "/parasites";

export async function getParasites(patientId) {

    const res = await api.get(`${BASE_URL}/patient/${patientId}`);

    return res.data;

}

export async function createParasite(data) {

    const res = await api.post(BASE_URL, data);

    return res.data;

}

export async function updateParasite(id, data) {

    const res = await api.put(`${BASE_URL}/${id}`, data);

    return res.data;

}

export async function deleteParasite(id) {

    const res = await api.delete(`${BASE_URL}/${id}`);

    return res.data;

}