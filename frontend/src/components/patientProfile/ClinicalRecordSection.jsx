import { useState } from "react";
import {
  ClipboardList,
  Syringe,
  Bug,
  FlaskConical,
  Pill,
  Scissors,
  Image as ImageIcon,
} from "lucide-react";

import ConsultationsTab from "./ConsultationsTab";
import VaccinesTab from "../preventive/VaccinesTab";
import ParasiteTab from "../preventive/ParasiteTab";
import LaboratoryTab from "./LaboratoryTab";
import MedicationsTab from "./MedicationsTab";
import SurgeriesTab from "./SurgeriesTab";
import ImagesTab from "./ImagesTab";

const SECTIONS = [
  { key: "consultas", label: "Consultas", icon: ClipboardList, Component: ConsultationsTab },
  { key: "vacunas", label: "Vacunas", icon: Syringe, Component: VaccinesTab },
  { key: "parasitos", label: "Parásitos", icon: Bug, Component: ParasiteTab },
  { key: "laboratorio", label: "Laboratorio", icon: FlaskConical, Component: LaboratoryTab },
  { key: "medicamentos", label: "Medicamentos", icon: Pill, Component: MedicationsTab },
  { key: "cirugias", label: "Cirugías", icon: Scissors, Component: SurgeriesTab },
  { key: "imagenes", label: "Imágenes", icon: ImageIcon, Component: ImagesTab },
];

export default function ClinicalRecordSection({ patientId }) {
  const [active, setActive] = useState("consultas");

  const activeSection = SECTIONS.find((s) => s.key === active) || SECTIONS[0];
  const ActiveComponent = activeSection.Component;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-ink">Historial Clínico</h2>
        <p className="text-muted">
          Toda la información médica del paciente, organizada por categoría.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {SECTIONS.map(({ key, label, icon: Icon }) => {
          const isActive = key === active;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 border ${
                isActive
                  ? "bg-brand-600 border-brand-600 text-white shadow-sm"
                  : "bg-white border-line text-ink hover:bg-slate-50"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>

      <ActiveComponent patientId={patientId} />
    </div>
  );
}
