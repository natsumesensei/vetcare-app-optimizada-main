import { useEffect, useState } from "react";
import { Pill, Plus, Pencil, Trash2 } from "lucide-react";

import {
  getPrescriptions,
  createPrescription,
  updatePrescription,
  deletePrescription,
} from "../../services/medicationService";

import Button from "../ui/Button";
import Input from "../ui/Input";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";
import { Card } from "../ui/Card";

const emptyForm = {
  medication: "",
  concentration: "",
  dose: "",
  route: "Oral",
  frequency: "",
  duration: "",
  quantity: "",
  instructions: "",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: "",
  veterinarian: "",
  status: "Activa",
};

function statusTone(status) {
  if (status === "Activa") return "success";
  if (status === "Suspendida") return "danger";
  if (status === "Finalizada") return "neutral";
  return "neutral";
}

export default function MedicationsTab({ patientId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    setLoading(true);
    try {
      const data = await getPrescriptions(patientId);
      setRows(data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (patientId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(row) {
    setEditingId(row.id);
    setForm({
      medication: row.medication || "",
      concentration: row.concentration || "",
      dose: row.dose || "",
      route: row.route || "Oral",
      frequency: row.frequency || "",
      duration: row.duration || "",
      quantity: row.quantity || "",
      instructions: row.instructions || "",
      start_date: row.start_date?.slice(0, 10) || emptyForm.start_date,
      end_date: row.end_date?.slice(0, 10) || "",
      veterinarian: row.veterinarian || "",
      status: row.status || "Activa",
    });
    setOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updatePrescription(editingId, form);
      } else {
        await createPrescription(patientId, form);
      }
      setOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar esta receta?")) return;
    await deletePrescription(id);
    await load();
  }

  return (
    <Card>
      <div className="flex justify-between items-center p-6 border-b border-line">
        <div>
          <h2 className="text-2xl font-bold text-ink">Medicamentos</h2>
          <p className="text-muted">Recetas y tratamientos indicados.</p>
        </div>

        <Button onClick={openNew}>
          <Plus size={16} /> Nueva receta
        </Button>
      </div>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="bg-canvas rounded-xl p-4 m-6 grid md:grid-cols-3 gap-3"
        >
          <Input
            required
            placeholder="Medicamento"
            value={form.medication}
            onChange={(e) => setForm({ ...form, medication: e.target.value })}
          />

          <Input
            placeholder="Concentración (ej. 50mg)"
            value={form.concentration}
            onChange={(e) => setForm({ ...form, concentration: e.target.value })}
          />

          <Input
            placeholder="Dosis (ej. 1 tableta)"
            value={form.dose}
            onChange={(e) => setForm({ ...form, dose: e.target.value })}
          />

          <select
            className="w-full rounded-lg border border-line px-3 py-2 bg-white"
            value={form.route}
            onChange={(e) => setForm({ ...form, route: e.target.value })}
          >
            <option value="Oral">Oral</option>
            <option value="Subcutánea">Subcutánea</option>
            <option value="Intramuscular">Intramuscular</option>
            <option value="Intravenosa">Intravenosa</option>
            <option value="Tópica">Tópica</option>
            <option value="Otra">Otra</option>
          </select>

          <Input
            placeholder="Frecuencia (ej. cada 12h)"
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value })}
          />

          <Input
            placeholder="Duración (ej. 7 días)"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
          />

          <Input
            placeholder="Cantidad a entregar"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />

          <Input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
          />

          <Input
            type="date"
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
          />

          <Input
            placeholder="Veterinario"
            value={form.veterinarian}
            onChange={(e) => setForm({ ...form, veterinarian: e.target.value })}
          />

          <select
            className="w-full rounded-lg border border-line px-3 py-2 bg-white"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="Activa">Activa</option>
            <option value="Finalizada">Finalizada</option>
            <option value="Suspendida">Suspendida</option>
          </select>

          <textarea
            className="w-full rounded-lg border border-line px-3 py-2 bg-white md:col-span-3"
            placeholder="Instrucciones adicionales"
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          />

          <div className="flex gap-2 md:col-span-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : editingId ? "Actualizar" : "Guardar"}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setOpen(false);
                setEditingId(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <div className="p-6 pt-0">
        {loading ? (
          <p className="text-muted">Cargando...</p>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Pill}
            title="Aún no hay recetas registradas"
            description="Registra la primera receta con el botón de arriba."
          />
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="border border-line rounded-xl p-4 flex justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-ink">
                      {row.medication} {row.concentration}
                    </h3>
                    <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                  </div>

                  <p className="text-sm text-muted">
                    {row.dose} · {row.route} · {row.frequency} ·{" "}
                    {row.duration}
                  </p>

                  <p className="text-sm text-muted">
                    {row.start_date}
                    {row.end_date ? ` – ${row.end_date}` : ""}
                    {row.veterinarian ? ` · Dr(a). ${row.veterinarian}` : ""}
                  </p>

                  {row.instructions && (
                    <p className="text-sm mt-2">{row.instructions}</p>
                  )}
                </div>

                <div className="flex gap-2 items-start">
                  <Button variant="ghost" onClick={() => openEdit(row)}>
                    <Pencil size={16} />
                  </Button>

                  <Button variant="ghost" onClick={() => handleDelete(row.id)}>
                    <Trash2 size={16} className="text-status-danger" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
