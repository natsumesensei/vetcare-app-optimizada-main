import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import api from "../api/apiClient";
import { printDocument } from "../lib/print";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";

function table(headers, rowsHtml, empty) {
  if (!rowsHtml) return `<p>${empty}</p>`;
  return `<table><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>${rowsHtml}</table>`;
}

export default function PatientPrint() {
  const { id } = useParams();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.get(`/patients/${id}`),
      api.get("/settings"),
      api.get(`/patients/${id}/consultations`).catch(() => ({ data: [] })),
      api.get(`/vaccines/patient/${id}`).catch(() => ({ data: [] })),
      api.get(`/parasites/patient/${id}`).catch(() => ({ data: [] })),
      api.get(`/patients/${id}/prescriptions`).catch(() => ({ data: [] })),
      api.get(`/patients/${id}/labs`).catch(() => ({ data: [] })),
      api.get(`/patients/${id}/weights`).catch(() => ({ data: [] })),
    ])
      .then(([a, b, c, d, e, f, g, h]) => {
        if (cancelled) return;
        const p = a.data;
        const clinic = b.data || {};
        const consult = c.data || [];
        const vacc = d.data || [];
        const paras = e.data || [];
        const pres = f.data || [];
        const labs = g.data || [];
        const weights = h.data || [];

        const body = `
          <h1>Historia clínica: ${p.name}</h1>
          <div class="grid">
            <div class="box">
              <b>Especie:</b> ${p.species}<br>
              <b>Raza:</b> ${p.breed || "—"}<br>
              <b>Sexo:</b> ${p.sex || "—"}<br>
              <b>Nacimiento:</b> ${p.birthdate || p.birthdate || "—"}<br>
              <b>Microchip:</b> ${p.microchip || p.microchip || "—"}
            </div>
            <div class="box">
              <b>Propietario:</b> ${p.owner_name || p.owner_name || "—"}<br>
              <b>Teléfono:</b> ${p.owner_phone || p.owner_phone || "—"}<br>
              <b>Email:</b> ${p.owner_email || p.owner_email || "—"}<br>
              <b>Alergias:</b> ${p.allergies || "Ninguna registrada"}
            </div>
          </div>
          <h2>Consultas</h2>
          ${table(
            ["Fecha", "Motivo", "Diagnóstico", "Tratamiento"],
            consult
              .map(
                (x) =>
                  `<tr><td>${x.consultation_date || x.date || ""}</td><td>${x.reason || ""}</td><td>${x.diagnosis || ""}</td><td>${x.treatment || ""}</td></tr>`
              )
              .join(""),
            "Sin consultas registradas."
          )}
          <h2>Vacunación</h2>
          ${table(
            ["Vacuna", "Aplicación", "Próxima", "Lote"],
            vacc
              .map(
                (x) =>
                  `<tr><td>${x.vaccine_name || x.vaccine_name || ""}</td><td>${x.application_date || x.application_date || ""}</td><td>${x.next_due_date || x.next_due_date || ""}</td><td>${x.batch || ""}</td></tr>`
              )
              .join(""),
            "Sin vacunas registradas."
          )}
          <h2>Antiparasitarios</h2>
          ${table(
            ["Tipo", "Producto", "Aplicación", "Próxima"],
            paras
              .map(
                (x) =>
                  `<tr><td>${x.type}</td><td>${x.product}</td><td>${x.application_date || ""}</td><td>${x.next_due_date || ""}</td></tr>`
              )
              .join(""),
            "Sin registros."
          )}
          <h2>Medicaciones / recetas</h2>
          ${table(
            ["Medicamento", "Dosis", "Vía", "Frecuencia", "Duración"],
            pres
              .map(
                (x) =>
                  `<tr><td>${x.medication} ${x.concentration || ""}</td><td>${x.dose || ""}</td><td>${x.route || ""}</td><td>${x.frequency || ""}</td><td>${x.duration || ""}</td></tr>`
              )
              .join(""),
            "Sin recetas registradas."
          )}
          <h2>Laboratorio</h2>
          ${table(
            ["Fecha", "Parámetro", "Resultado", "Referencia", "Interpretación"],
            labs
              .map(
                (x) =>
                  `<tr><td>${x.date}</td><td>${x.parameter}</td><td>${x.result_value ?? x.result_text ?? ""} ${x.unit || ""}</td><td>${x.reference_min ?? ""}–${x.reference_max ?? ""}</td><td>${x.interpretation || ""}</td></tr>`
              )
              .join(""),
            "Sin laboratorio."
          )}
          <h2>Evolución del peso</h2>
          ${table(
            ["Fecha", "Peso kg", "BCS"],
            weights
              .map(
                (x) =>
                  `<tr><td>${x.measured_at || x.measured_at || ""}</td><td>${x.weight}</td><td>${x.body_condition_score || x.body_condition_score || ""}</td></tr>`
              )
              .join(""),
            "Sin mediciones."
          )}
          <h2>Observaciones</h2>
          <div class="box">${p.notes || "—"}</div>
          <div class="sign"><div>Firma del veterinario</div><div>Firma del propietario</div></div>
        `;
        printDocument(`Historia clínica - ${p.name}`, body, clinic);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo preparar la historia clínica.");
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

  return <Spinner label="Preparando historia clínica para impresión…" />;
}
