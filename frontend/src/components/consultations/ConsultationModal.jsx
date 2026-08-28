import { useState, useEffect } from "react";
import { createConsultation } from "../../services/consultationService";

import ConsultationHeader from "./ConsultationHeader";
import VitalSigns from "./VitalSigns";
import DiagnosisSection from "./DiagnosisSection";
import TreatmentSection from "./TreatmentSection";
import ConsultationActions from "./ConsultationActions";

const emptyForm = {
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
};

export default function ConsultationModal({
  open,
  patientId,
  onClose,
  onSaved,
}) {

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  // Limpiar el formulario cada vez que se abre el modal
  useEffect(() => {
    if (open) {
      setForm(emptyForm);
    }
  }, [open]);

  useEffect(() => {

    function handleKey(e) {

      if (e.key === "Escape") {

        onClose();

      }

    }


    if (open) {

      document.addEventListener(
        "keydown",
        handleKey
      );

      document.body.style.overflow = "hidden";

    }


    return () => {

      document.removeEventListener(
        "keydown",
        handleKey
      );

      document.body.style.overflow = "auto";

    };


  }, [open, onClose]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!patientId) {
      alert("No existe paciente seleccionado");
      return;
    }

    try {
      setLoading(true);

      await createConsultation(Number(patientId), form);

      if (onSaved) onSaved();
      onClose();

    } catch (err) {
      console.error("Error guardando consulta:", err);
      alert("Error al guardar consulta");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;



  return (

    <div
      className="
        fixed 
        inset-0 
        bg-black/60 
        z-50 
        flex 
        items-center 
        justify-center 
        p-6
      "
    >


      <div
        className="
          bg-white 
          rounded-2xl 
          shadow-2xl 
          w-full 
          max-w-5xl 
          max-h-[90vh] 
          overflow-y-auto
        "
      >


        <div
          className="
            sticky 
            top-0 
            bg-white 
            border-b 
            p-6 
            flex 
            justify-between 
            items-center
          "
        >


          <h2 className="text-2xl font-bold">
            Nueva Consulta
          </h2>



          <button

            onClick={onClose}

            className="
              text-3xl 
              hover:text-red-500
            "

          >

            ×

          </button>


        </div>




        <form onSubmit={handleSubmit} className="p-6 space-y-6">

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