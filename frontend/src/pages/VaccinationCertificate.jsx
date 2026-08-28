import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import api from "../api/apiClient";
import { printDocument } from "../lib/print";
import Alert from "../components/ui/Alert";
import Spinner from "../components/ui/Spinner";

export default function VaccinationCertificate() {
  const { id } = useParams();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.get(`/patients/${id}/vaccination-certificate`),
      api.get("/settings"),
    ])
      .then(([a, b]) => {
        if (cancelled) return;
        const data = a.data;
        const clinic = b.data || {};
        const p = data.patient || {};
        const rows = (data.vaccines || [])
          .map(
            (v) => `<tr>
              <td>${v.application_date || v.application_date || ""}</td>
              <td><b>${v.vaccine_name || v.vaccine_name || ""}</b></td>
              <td>${v.laboratory || "—"}</td>
              <td>${v.batch || "—"}</td>
              <td>${v.next_due_date || v.next_due_date || "—"}</td>
              <td>${v.veterinarian || "—"}</td>
            </tr>`
          )
          .join("");

        const body = `
          <div class="box" style="text-align:center">
            <h1>Certificado de vacunación</h1>
            <p>Se certifica que el paciente identificado a continuación dispone de los registros vacunales indicados.</p>
          </div>
          <div class="grid">
            <div class="box">
              <b>Paciente:</b> ${p.name}<br>
              <b>Especie:</b> ${p.species || "—"}<br>
              <b>Raza:</b> ${p.breed || "—"}<br>
              <b>Sexo:</b> ${p.sex || "—"}<br>
              <b>Nacimiento:</b> ${p.birthdate || p.birthdate || "—"}<br>
              <b>Microchip:</b> ${p.microchip || p.microchip || "—"}
            </div>
            <div class="box">
              <b>Propietario:</b> ${p.owner_name || p.owner_name || "—"}<br>
              <b>Teléfono:</b> ${p.owner_phone || p.owner_phone || "—"}<br>
              <b>Email:</b> ${p.owner_email || p.owner_email || "—"}
            </div>
          </div>
          <h2>Registro de vacunación</h2>
          ${
            rows
              ? `<table><tr><th>Aplicación</th><th>Vacuna</th><th>Laboratorio</th><th>Lote</th><th>Próxima</th><th>Veterinario</th></tr>${rows}</table>`
              : "<p>No hay vacunaciones registradas.</p>"
          }
          <div class="box" style="margin-top:20px">
            Este documento es una impresión del historial de vacunación registrado en la clínica.
          </div>
          <div class="sign"><div>Firma y sello del veterinario</div><div>Firma del propietario</div></div>
        `;
        printDocument(`Certificado de vacunación - ${p.name}`, body, clinic);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo preparar el certificado.");
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

  return <Spinner label="Preparando certificado…" />;
}
