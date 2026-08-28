import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Syringe, Plus, Pencil, Trash2, FileBadge2 } from "lucide-react";

import {
  getVaccines,
  createVaccine,
  updateVaccine,
  deleteVaccine,
} from "../../services/vaccineService";

import Button from "../ui/Button";
import Input from "../ui/Input";
import EmptyState from "../ui/EmptyState";
import { Card } from "../ui/Card";

const emptyForm = {
  vaccine_name: "",
  application_date: new Date().toISOString().slice(0, 10),
  next_due_date: "",
  veterinarian: "",
  batch: "",
  laboratory: "",
  observations: "",
};

export default function VaccinesTab({ patientId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const data = await getVaccines(patientId);
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
      vaccine_name: row.vaccine_name || "",
      application_date: row.application_date?.slice(0, 10) || emptyForm.application_date,
      next_due_date: row.next_due_date?.slice(0, 10) || "",
      veterinarian: row.veterinarian || "",
      batch: row.batch || "",
      laboratory: row.laboratory || "",
      observations: row.observations || "",
    });
    setOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateVaccine(editingId, form);
      } else {
        await createVaccine({ ...form, patient_id: patientId });
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
    if (!confirm("¿Eliminar esta vacuna?")) return;
    await deleteVaccine(id);
    await load();
  }

  return (
    <Card>
      <div className="flex justify-between items-center p-6 border-b border-line">
        <div>
          <h2 className="text-2xl font-bold text-ink">Vacunación</h2>
          <p className="text-muted">Historial y certificado imprimible.</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              navigate(`/patients/${patientId}/vaccination-certificate`)
            }
          >
            <FileBadge2 size={16} /> Certificado
          </Button>

          <Button onClick={openNew}>
            <Plus size={16} /> Nueva vacuna
          </Button>
        </div>
      </div>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="bg-canvas rounded-xl p-4 m-6 grid md:grid-cols-3 gap-3"
        >
          <Input
            required
            placeholder="Vacuna"
            value={form.vaccine_name}
            onChange={(e) => setForm({ ...form, vaccine_name: e.target.value })}
          />

          <Input
            type="date"
            required
            value={form.application_date}
            onChange={(e) => setForm({ ...form, application_date: e.target.value })}
          />

          <Input
            type="date"
            placeholder="Próxima dosis"
            value={form.next_due_date}
            onChange={(e) => setForm({ ...form, next_due_date: e.target.value })}
          />

          <Input
            placeholder="Veterinario"
            value={form.veterinarian}
            onChange={(e) => setForm({ ...form, veterinarian: e.target.value })}
          />

          <Input
            placeholder="Lote"
            value={form.batch}
            onChange={(e) => setForm({ ...form, batch: e.target.value })}
          />

          <Input
            placeholder="Laboratorio"
            value={form.laboratory}
            onChange={(e) => setForm({ ...form, laboratory: e.target.value })}
          />

          <textarea
            className="w-full rounded-lg border border-line px-3 py-2 bg-white md:col-span-3"
            placeholder="Observaciones"
            value={form.observations}
            onChange={(e) => setForm({ ...form, observations: e.target.value })}
          />

          <div className="flex gap-2 md:col-span-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : editingId ? "Actualizar" : "Guardar vacunación"}
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
            icon={Syringe}
            title="Aún no hay vacunas registradas"
            description="Registra la primera vacunación con el botón de arriba."
          />
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-canvas">
                <tr>
                  <th className="p-3 text-left">Vacuna</th>
                  <th className="p-3 text-left">Aplicación</th>
                  <th className="p-3 text-left">Próxima</th>
                  <th className="p-3 text-left">Lote</th>
                  <th className="p-3 text-left">Veterinario</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr className="border-t border-line" key={row.id}>
                    <td className="p-3 font-medium">{row.vaccine_name}</td>
                    <td className="p-3">{row.application_date}</td>
                    <td className="p-3">{row.next_due_date || "—"}</td>
                    <td className="p-3">{row.batch || "—"}</td>
                    <td className="p-3">{row.veterinarian || "—"}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => openEdit(row)}>
                          <Pencil size={16} />
                        </Button>

                        <Button variant="ghost" onClick={() => handleDelete(row.id)}>
                          <Trash2 size={16} className="text-status-danger" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
