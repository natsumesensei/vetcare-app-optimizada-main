import { Eye, Pencil, Trash2 } from "lucide-react";
import Button from "../ui/Button";
import PatientAvatar from "./PatientAvatar";

export default function PatientRow({
  patient,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <tr className="border-b hover:bg-slate-50 transition">

      <td className="px-4 py-3">
        <PatientAvatar patient={patient} />
      </td>

      <td className="px-4 py-3 font-semibold">
        {patient.name}
      </td>

      <td className="px-4 py-3">
        {patient.species}
      </td>

      <td className="px-4 py-3">
        {patient.breed}
      </td>

      <td className="px-4 py-3">
        {patient.owner_name}
      </td>

      <td className="px-4 py-3">
        {patient.owner_phone}
      </td>

      <td className="px-4 py-3">
        <div className="flex gap-2">

          <Button onClick={() => onView(patient)}>
            <Eye size={16} />
          </Button>

          <Button onClick={() => onEdit(patient)}>
            <Pencil size={16} />
          </Button>

          <Button onClick={() => onDelete(patient)}>
            <Trash2 size={16} />
          </Button>

        </div>
      </td>

    </tr>
  );
}