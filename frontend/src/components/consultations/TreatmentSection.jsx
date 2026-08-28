export default function TreatmentSection({
  form,
  setForm,
}) {
  function change(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  return (
    <div className="bg-white rounded-xl border p-6">

      <h2 className="text-xl font-bold mb-6">
        Tratamiento
      </h2>

      <textarea
        name="treatment"
        value={form.treatment}
        onChange={change}
        rows={6}
        placeholder="Medicamentos, dosis, recomendaciones..."
        className="w-full border rounded-lg p-3 resize-none"
      />

      <div className="mt-6">

        <label className="block mb-2 font-medium">
          Observaciones
        </label>

        <textarea
          name="observations"
          value={form.observations}
          onChange={change}
          rows={5}
          className="w-full border rounded-lg p-3 resize-none"
        />

      </div>

    </div>
  );
}