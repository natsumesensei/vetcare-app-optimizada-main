import { useEffect, useState } from "react";
import { Scissors, Plus, Pencil, Trash2 } from "lucide-react";

import {
  getSurgeries,
  createSurgery,
  updateSurgery,
  deleteSurgery,
} from "../../services/surgeryService";

import Button from "../ui/Button";
import Input from "../ui/Input";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";
import { Card } from "../ui/Card";

const emptyForm = {
  surgery_date: new Date().toISOString().slice(0, 10),
  procedure: "",
  surgeon: "",
  indication: "",
  preoperative_assessment: "",
  anesthesia_protocol: "",
  findings: "",
  complications: "",
  postoperative_plan: "",
  discharge_notes: "",
  status: "Programada",
};

function statusTone(status) {
  if (status === "Realizada") return "success";
  if (status === "Programada") return "info";
  if (status === "Cancelada") return "danger";
  return "neutral";
}

export default function SurgeriesTab({ patientId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    setLoading(true);
    try {
      const data = await getSurgeries(patientId);
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
      surgery_date: row.surgery_date?.slice(0, 10) || emptyForm.surgery_date,
      procedure: row.procedure || "",
      surgeon: row.surgeon || "",
      indication: row.indication || "",
      preoperative_assessment: row.preoperative_assessment || "",
      anesthesia_protocol: row.anesthesia_protocol || "",
      findings: row.findings || "",
      complications: row.complications || "",
      postoperative_plan: row.postoperative_plan || "",
      discharge_notes: row.discharge_notes || "",
      status: row.status || "Programada",
    });
    setOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateSurgery(editingId, form);
      } else {
        await createSurgery(patientId, form);
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
    if (!confirm("¿Eliminar este registro de cirugía?")) return;
    await deleteSurgery(id);
    await load();
  }

  return (
    <Card>
      <div className="flex justify-between items-center p-6 border-b border-line">
        <div>
          <h2 className="text-2xl font-bold text-ink">Cirugías</h2>
          <p className="text-muted">Procedimientos quirúrgicos realizados o programados.</p>
        </div>

        <Button onClick={openNew}>
          <Plus size={16} /> Nueva cirugía
        </Button>
      </div>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="bg-canvas rounded-xl p-4 m-6 grid md:grid-cols-3 gap-3"
        >
          <Input
            type="date"
            required
            value={form.surgery_date}
            onChange={(e) => setForm({ ...form, surgery_date: e.target.value })}
          />

          <Input
            required
            placeholder="Procedimiento (ej. Ovariohisterectomía)"
            className="md:col-span-2"
            value={form.procedure}
            onChange={(e) => setForm({ ...form, procedure: e.target.value })}
          />

          <Input
            placeholder="Cirujano"
            value={form.surgeon}
            onChange={(e) => setForm({ ...form, surgeon: e.target.value })}
          />

          <select
            className="w-full rounded-lg border border-line px-3 py-2 bg-white"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="Programada">Programada</option>
            <option value="Realizada">Realizada</option>
            <option value="Cancelada">Cancelada</option>
          </select>

          <Input
            placeholder="Protocolo anestésico"
            value={form.anesthesia_protocol}
            onChange={(e) => setForm({ ...form, anesthesia_protocol: e.target.value })}
          />

          <textarea
            className="w-full rounded-lg border border-line px-3 py-2 bg-white md:col-span-3"
            placeholder="Indicación / motivo de la cirugía"
            value={form.indication}
            onChange={(e) => setForm({ ...form, indication: e.target.value })}
          />

          <textarea
            className="w-full rounded-lg border border-line px-3 py-2 bg-white md:col-span-3"
            placeholder="Evaluación preoperatoria"
            value={form.preoperative_assessment}
            onChange={(e) =>
              setForm({ ...form, preoperative_assessment: e.target.value })
            }
          />

          <textarea
            className="w-full rounded-lg border border-line px-3 py-2 bg-white md:col-span-3"
            placeholder="Hallazgos durante la cirugía"
            value={form.findings}
            onChange={(e) => setForm({ ...form, findings: e.target.value })}
          />

          <textarea
            className="w-full rounded-lg border border-line px-3 py-2 bg-white md:col-span-3"
            placeholder="Complicaciones (si hubo)"
            value={form.complications}
            onChange={(e) => setForm({ ...form, complications: e.target.value })}
          />

          <textarea
            className="w-full rounded-lg border border-line px-3 py-2 bg-white md:col-span-3"
            placeholder="Plan postoperatorio"
            value={form.postoperative_plan}
            onChange={(e) => setForm({ ...form, postoperative_plan: e.target.value })}
          />

          <textarea
            className="w-full rounded-lg border border-line px-3 py-2 bg-white md:col-span-3"
            placeholder="Notas de alta"
            value={form.discharge_notes}
            onChange={(e) => setForm({ ...form, discharge_notes: e.target.value })}
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
            icon={Scissors}
            title="Aún no hay cirugías registradas"
            description="Registra el primer procedimiento con el botón de arriba."
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
                      {row.procedure}
                    </h3>
                    <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                  </div>

                  <p className="text-sm text-muted">
                    {row.surgery_date}
                    {row.surgeon ? ` · Dr(a). ${row.surgeon}` : ""}
                  </p>

                  {row.indication && (
                    <p className="text-sm mt-2">
                      <strong>Indicación:</strong> {row.indication}
                    </p>
                  )}

                  {row.findings && (
                    <p className="text-sm mt-1">
                      <strong>Hallazgos:</strong> {row.findings}
                    </p>
                  )}

                  {row.complications && (
                    <p className="text-sm mt-1 text-status-danger">
                      <strong>Complicaciones:</strong> {row.complications}
                    </p>
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
