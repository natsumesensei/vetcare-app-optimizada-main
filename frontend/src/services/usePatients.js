import { useEffect, useState } from "react";
import { getPatients } from "../services/patientService";

export default function usePatients(search = "") {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadPatients() {
    try {
      setLoading(true);

      const data = await getPatients(search);

      setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
  }, [search]);

  return {
    patients,
    loading,
    reload: loadPatients,
  };
}