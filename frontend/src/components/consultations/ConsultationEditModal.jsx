import { useEffect, useState } from "react";

import { updateConsultation } from "../../services/consultationService";

import ConsultationHeader from "./ConsultationHeader";
import VitalSigns from "./VitalSigns";
import DiagnosisSection from "./DiagnosisSection";
import TreatmentSection from "./TreatmentSection";
import ConsultationActions from "./ConsultationActions";

export default function ConsultationEditModal({
  open,
  consultation,
  onClose,
  onUpdated,
}) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    patient_id: "",
    date: "",
    veterinarian: "",
    reason: "",
    clinical_signs: "",
    temperature: "",
    heart_rate: "",
    respiratory_rate: "",
    weight: "",
    diagnosis: "",
    treatment: "",
    observations: "",
  });

  useEffect(() => {
    if (consultation) {
      setForm({
        patient_id: consultation.patient_id,
        date: consultation.date || "",
        veterinarian: consultation.veterinarian || "",
        reason: consultation.reason || "",
        clinical_signs: consultation.clinical_signs || "",
        temperature: consultation.temperature || "",
        heart_rate: consultation.heart_rate || "",
        respiratory_rate: consultation.respiratory_rate || "",
        weight: consultation.weight || "",
        diagnosis: consultation.diagnosis || "",
        treatment: consultation.treatment || "",
        observations: consultation.observations || "",
      });
    }
  }, [consultation]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    if (open) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "auto";
    };
  }, [open, onClose]);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);

      await updateConsultation(consultation.id, form);

      alert("Consulta actualizada correctamente.");

      if (onUpdated) {
        onUpdated();
      }

      onClose();

    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
        "No fue posible actualizar la consulta."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!open || !consultation) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">

        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">

          <h2 className="text-2xl font-bold">
            Editar Consulta
          </h2>

          <button
            onClick={onClose}
            className="text-3xl hover:text-red-500"
          >
            ×
          </button>

        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6"
        >

          <ConsultationHeader
            form={form}
            setForm={setForm}
          />

          <VitalSigns
            form={form}
            setForm={setForm}
          />

          <DiagnosisSection
            form={form}
            setForm={setForm}
          />

          <TreatmentSection
            form={form}
            setForm={setForm}
          />

          <ConsultationActions
            loading={loading}
            onCancel={onClose}
          />

        </form>

      </div>

    </div>
  );
}