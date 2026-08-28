import { useEffect, useState } from "react";
import { getConsultations, deleteConsultation } from "../../services/consultationService";

import ConsultationList from "../consultations/ConsultationList";
import ConsultationModal from "../consultations/ConsultationModal";
import ConsultationEditModal from "../consultations/ConsultationEditModal";

import EmptyHistory from "./EmptyHistory";
import NewHistoryButton from "./NewHistoryButton";
import { Card } from "../ui/Card";

export default function HistoryTimeline({ patientId }) {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newModal, setNewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  useEffect(() => {
    if (!patientId) {
      console.error("ERROR: HistoryTimeline recibió patientId vacío");
      setLoading(false);
      return;
    }
    loadConsultations();
  }, [patientId]);

  async function loadConsultations() {
    try {
      setLoading(true);
      const data = await getConsultations(patientId);
      setConsultations(data || []);
    } catch (error) {
      console.error("Error cargando consultas:", error);
    } finally {
      setLoading(false);
    }
  }

  async function removeConsultation(item) {
    const ok = window.confirm("¿Eliminar esta consulta?");
    if (!ok) return;

    try {
      await deleteConsultation(item.id);
      await loadConsultations();
    } catch (error) {
      console.error(error);
    }
  }

  function openNewConsultation() {
    if (!patientId) {
      alert("No se encontró el paciente seleccionado");
      return;
    }
    setNewModal(true);
  }

  return (
    <Card>
      <div className="flex justify-between items-center p-6 border-b border-line">
        <div>
          <h2 className="text-2xl font-bold text-ink">Consultas</h2>
          <p className="text-muted">Historial de consultas médicas.</p>
        </div>

        <NewHistoryButton onClick={openNewConsultation} />
      </div>

      <div className="p-6 pt-4">
        {loading ? (
          <p className="text-muted">Cargando historial...</p>
        ) : consultations.length === 0 ? (
          <EmptyHistory />
        ) : (
          <ConsultationList
            consultations={consultations}
            onEdit={(c) => {
              setSelectedConsultation(c);
              setEditModal(true);
            }}
            onDelete={removeConsultation}
          />
        )}
      </div>

      <ConsultationModal
        open={newModal}
        patientId={patientId}
        onClose={() => setNewModal(false)}
        onSaved={loadConsultations}
      />

      <ConsultationEditModal
        open={editModal}
        consultation={selectedConsultation}
        onClose={() => setEditModal(false)}
        onUpdated={loadConsultations}
      />
    </Card>
  );
}
