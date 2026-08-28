import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, Edit, PawPrint, User, Phone, 
  Mail, MapPin, Printer, FileText, Syringe
} from "lucide-react";
import { toast } from "sonner";
import { getPatientById } from "../services/patientService";
import ClinicalRecordSection from "../components/patientProfile/ClinicalRecordSection";
import api from "../api/apiClient";
import { printDocument } from "../lib/print";

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPatient() {
      try {
        setLoading(true);
        setError(null);

        const response = await getPatientById(id);
        const data = response?.data?.patient || response?.patient || response?.data || response;

        if (isMounted) {
          if (data && typeof data === "object" && !Array.isArray(data)) {
            setPatient(data);
          } else {
            setError("No se encontraron datos válidos para este paciente.");
          }
        }
      } catch (err) {
        console.error("Error al cargar detalle del paciente:", err);
        if (isMounted) {
          setError("Error de conexión al obtener los datos del paciente.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadPatient();
    } else {
      setLoading(false);
      setError("Identificador de paciente no válido.");
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center text-slate-500">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          <span>Cargando expediente del paciente...</span>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="w-full space-y-4 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm font-semibold text-rose-700">{error || "Paciente no encontrado"}</p>
        <button
          type="button"
          onClick={() => navigate("/patients")}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <ArrowLeft size={16} /> Volver a lista
        </button>
      </div>
    );
  }

  const activeId = patient._id || patient.id || id;
  const name = typeof patient.name === "string" ? patient.name : "Paciente sin nombre";
  
  // Captura de imagen enviada desde el formulario (file/photo/photo_url/image)
  const photoUrl = patient.photo || patient.photo_url || patient.image || patient.image_url || patient.avatar || null;

  // Extracción limpia de los 4 datos del propietario
  const owner = patient.owner || {};
  const ownerName = owner.name || patient.owner_name || patient.ownerName || "Sin registrar";
  const ownerPhone = owner.phone || patient.owner_phone || patient.phone || "—";
  const ownerEmail = owner.email || patient.owner_email || patient.email || "—";
  const ownerAddress = owner.address || patient.owner_address || patient.address || "—";

  const handlePrintVaccines = async () => {
    try {
      const [certRes, setRes] = await Promise.all([
        api.get(`/patients/${activeId}/vaccination-certificate`),
        api.get("/settings")
      ]);
      const { patient: p, vaccines } = certRes.data;
      const clinic = setRes.data || {};

      const rowsHtml = (vaccines || [])
        .map(
          (v) => `
        <tr>
          <td><b>${v.vaccine_name}</b></td>
          <td style="text-align:center;">${v.application_date || "—"}</td>
          <td style="text-align:center; font-weight:bold; color:#0f766e;">${v.next_due_date || "—"}</td>
          <td>${v.batch || "—"}</td>
          <td>${v.laboratory || "—"}</td>
          <td>${v.veterinarian || clinic.veterinarian || "—"}</td>
        </tr>
      `
        )
        .join("");

      const body = `
        <h1 style="color:#0f766e; margin-bottom:15px;">CERTIFICADO OFICIAL DE VACUNACIÓN VETERINARIA</h1>
        <div class="grid">
          <div class="box">
            <b>DATOS DE LA MASCOTA</b><br/>
            <span>Nombre: <b>${p.name}</b></span><br/>
            <span>Especie: ${p.species || "—"} | Raza: ${p.breed || "—"}</span><br/>
            <span>Sexo: ${p.sex || p.gender || "—"} | Peso: ${p.weight ? p.weight + " kg" : "—"}</span><br/>
            <span>Nº Microchip: <b>${p.microchip || "No registrado"}</b></span>
          </div>
          <div class="box">
            <b>DATOS DEL PROPIETARIO</b><br/>
            <span>Titular: <b>${p.owner_name}</b></span><br/>
            <span>Teléfono: ${p.owner_phone || "—"}</span><br/>
            <span>Email: ${p.owner_email || "—"}</span><br/>
            <span>Dirección: ${p.address || "—"}</span>
          </div>
        </div>

        <h2 style="margin-top:20px; font-size:14px;">HISTORIAL DE INMUNIZACIONES ADMINISTRADAS</h2>
        <table>
          <thead>
            <tr>
              <th>Vacuna / Antígeno</th>
              <th style="text-align:center;">Fecha Aplicación</th>
              <th style="text-align:center;">Próxima Dosis</th>
              <th>Lote</th>
              <th>Laboratorio</th>
              <th>Veterinario</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="6" style="text-align:center; padding:15px;">Sin vacunas registradas.</td></tr>'}
          </tbody>
        </table>

        <div class="sign" style="margin-top:60px;">
          <div>Firma y Sello del Veterinario Colegiado</div>
          <div>Firma del Titular / Propietario</div>
        </div>
      `;

      printDocument(`Certificado Vacunación - ${p.name}`, body, clinic);
    } catch (err) {
      console.error(err);
      toast.error("Error al generar certificado de vacunación.");
    }
  };

  const handlePrintFullRecord = async () => {
    try {
      const [consultRes, vaccRes, setRes] = await Promise.all([
        api.get(`/patients/${activeId}/consultations`).catch(() => ({ data: [] })),
        api.get(`/patients/${activeId}/vaccines`).catch(() => ({ data: [] })),
        api.get("/settings")
      ]);
      const consultations = consultRes.data || [];
      const vaccines = vaccRes.data || [];
      const clinic = setRes.data || {};

      const consultHtml = consultations
        .map(
          (c) => `
        <div class="box" style="margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; border-bottom:1px solid #e2e8f0; padding-bottom:4px; margin-bottom:6px;">
            <b>Fecha: ${c.date || c.consultation_date} · ${c.veterinarian || "Dr. Saladin"}</b>
            <span>${c.temperature ? `Tª: ${c.temperature}°C` : ""} ${c.weight ? `| Peso: ${c.weight}kg` : ""}</span>
          </div>
          <div><b>Motivo:</b> ${c.reason || "Consulta clínica"}</div>
          ${c.clinical_signs ? `<div><b>Exploración / Signos:</b> ${c.clinical_signs}</div>` : ""}
          ${c.diagnosis ? `<div><b>Diagnóstico:</b> <span style="color:#0f766e; font-weight:bold;">${c.diagnosis}</span></div>` : ""}
          ${c.treatment ? `<div><b>Tratamiento pautado:</b> ${c.treatment}</div>` : ""}
          ${c.observations ? `<div><b>Observaciones:</b> ${c.observations}</div>` : ""}
        </div>
      `
        )
        .join("");

      const body = `
        <h1 style="color:#0f766e; margin-bottom:12px;">HISTORIAL CLÍNICO VETERINARIO COMPLETO</h1>
        <div class="grid">
          <div class="box">
            <b>EXPEDIENTE DEL PACIENTE</b><br/>
            <span>Nombre: <b>${patient.name}</b> (${patient.species} - ${patient.breed || "Mestizo"})</span><br/>
            <span>Sexo: ${patient.sex || patient.gender || "—"} | Nacimiento: ${patient.birthdate || patient.birth_date || "—"}</span><br/>
            <span>Microchip: <b>${patient.microchip || "—"}</b> | Peso actual: ${patient.weight ? patient.weight + " kg" : "—"}</span>
          </div>
          <div class="box">
            <b>PROPIETARIO</b><br/>
            <span>Titular: <b>${ownerName}</b></span><br/>
            <span>Contacto: ${ownerPhone} | ${ownerEmail}</span><br/>
            <span>Dirección: ${ownerAddress}</span>
          </div>
        </div>

        <h2 style="margin-top:18px; font-size:14px;">CONSULTAS Y EVOLUCIÓN CLÍNICA</h2>
        ${consultHtml || '<p style="color:#64748b; font-style:italic;">No hay consultas médicas previas.</p>'}

        <div class="sign" style="margin-top:50px;">
          <div>Firma del Veterinario</div>
          <div>Sello de la Clínica</div>
        </div>
      `;

      printDocument(`Historial Clínico - ${patient.name}`, body, clinic);
    } catch (err) {
      console.error(err);
      toast.error("Error al generar historial clínico completo.");
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/patients")}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft size={18} /> Volver a Pacientes
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePrintVaccines}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <Syringe size={14} className="text-teal-600" /> Cartilla Vacunación
          </button>

          <button
            type="button"
            onClick={handlePrintFullRecord}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <Printer size={14} className="text-slate-600" /> Imprimir Historial
          </button>

          <Link
            to={`/patients/${activeId}/edit`}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition shadow-sm"
          >
            <Edit size={14} /> Editar Paciente
          </Link>
        </div>
      </div>

      {/* Header Mascota con Foto */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={name}
              className="h-20 w-20 rounded-2xl object-cover border border-slate-200 shadow-sm"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-600 text-white font-bold text-3xl shadow-sm">
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 uppercase tracking-wider">
                {typeof patient.species === "string" ? patient.species : "Especie no especificada"}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Raza: <span className="font-medium text-slate-700">{typeof patient.breed === "string" ? patient.breed : "Desconocida"}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información Mascota */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <PawPrint size={20} className="text-teal-600" /> Información Mascota
          </h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Sexo</p>
              <p className="font-medium text-slate-800 capitalize">{typeof patient.gender === "string" ? patient.gender : patient.sex || "—"}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Peso</p>
              <p className="font-medium text-slate-800">{patient.weight ? `${patient.weight} kg` : "—"}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Fecha de Nacimiento</p>
              <p className="font-medium text-slate-800">{typeof patient.birth_date === "string" ? patient.birth_date : patient.birthDate || "—"}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Número de Chip</p>
              <p className="font-medium text-slate-800">{typeof patient.microchip === "string" ? patient.microchip : patient.chip || "—"}</p>
            </div>
          </div>
        </div>

        {/* Datos del Propietario (Únicamente los 4 campos del formulario) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <User size={20} className="text-teal-600" /> Datos del Propietario
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                <User size={13} className="text-teal-600" /> Nombre
              </p>
              <p className="font-medium text-slate-800 mt-1">{ownerName}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                <Phone size={13} className="text-teal-600" /> Teléfono
              </p>
              <p className="font-medium text-slate-800 mt-1">{ownerPhone}</p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                <Mail size={13} className="text-teal-600" /> Email
              </p>
              <p className="font-medium text-slate-800 mt-1">{ownerEmail}</p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                <MapPin size={13} className="text-teal-600" /> Dirección
              </p>
              <p className="font-medium text-slate-800 mt-1">{ownerAddress}</p>
            </div>
          </div>
        </div>
      </div>

      <ClinicalRecordSection patientId={activeId} />
    </div>
  );
}