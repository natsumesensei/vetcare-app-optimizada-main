import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import api from "../api/apiClient";
import { printDocument } from "../lib/print";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";

export default function PrescriptionPrint() {
  const { id } = useParams();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([api.get(`/prescriptions/${id}`), api.get("/settings")])
      .then(([a, b]) => {
        if (cancelled) return;
        const r = a.data;
        const clinic = b.data || {};
        const body = `
          <h1>Receta veterinaria</h1>
          <div class="grid">
            <div class="box">
              <b>Paciente:</b> ${r.patient_name || "—"}<br>
              <b>Especie:</b> ${r.species || "—"}<br>
              <b>Raza:</b> ${r.breed || "—"}<br>
              <b>Sexo:</b> ${r.sex || "—"}<br>
              <b>Microchip:</b> ${r.microchip || r.microchip || "—"}
            </div>
            <div class="box">
              <b>Propietario:</b> ${r.owner_name || r.owner_name || "—"}<br>
              <b>Teléfono:</b> ${r.owner_phone || r.owner_phone || "—"}<br>
              <b>Fecha:</b> ${r.start_date || new Date().toISOString().slice(0, 10)}
            </div>
          </div>
          <h2>Prescripción</h2>
          <div class="box">
            <h2 style="border:0;margin-top:0">${r.medication || ""} ${r.concentration || ""}</h2>
            <p><b>Dosis:</b> ${r.dose || "—"} &nbsp; <b>Vía:</b> ${r.route || "—"}</p>
            <p><b>Frecuencia:</b> ${r.frequency || "—"} &nbsp; <b>Duración:</b> ${r.duration || "—"}</p>
            <p><b>Cantidad:</b> ${r.quantity || "—"} &nbsp; <b>Hasta:</b> ${r.end_date || "—"}</p>
            <p><b>Instrucciones:</b><br>${r.instructions || "—"}</p>
          </div>
          <div class="box"><b>Veterinario:</b> ${r.veterinarian || clinic.veterinarian || "—"}</div>
          <div class="sign"><div>Firma y sello del veterinario</div><div>Firma del propietario</div></div>
        `;
        printDocument(`Receta - ${r.patient_name || "paciente"}`, body, clinic);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo preparar la receta.");
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="p-10 max-w-xl mx-auto">
        <Alert type="error" title="Error al imprimir">
          {error}
        </Alert>
      </div>
    );
  }

  return <Spinner label="Preparando receta para impresión…" />;
}
