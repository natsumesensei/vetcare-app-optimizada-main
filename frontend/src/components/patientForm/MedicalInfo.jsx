export default function MedicalInfo({ form, setForm }) {
  function update(field, value) {
    setForm({
      ...form,
      [field]: value,
    });
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">

      <h2 className="text-lg font-semibold mb-6">
        Información Médica
      </h2>

      <div className="space-y-5">

        <div>

          <label className="block mb-2 font-medium">
            Alergias
          </label>

          <textarea
            rows={3}
            className="w-full border rounded-lg p-3"
            value={form.allergies}
            onChange={(e) => update("allergies", e.target.value)}
          />

        </div>

        <div>

          <label className="block mb-2 font-medium">
            Observaciones
          </label>

          <textarea
            rows={5}
            className="w-full border rounded-lg p-3"
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
          />

        </div>

      </div>

    </div>
  );
}