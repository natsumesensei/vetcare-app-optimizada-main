export default function DiagnosisSection({
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
        Diagnóstico
      </h2>

      <textarea
        name="diagnosis"
        value={form.diagnosis}
        onChange={change}
        rows={6}
        placeholder="Ingrese el diagnóstico clínico..."
        className="w-full border rounded-lg p-3 resize-none"
      />

    </div>
  );
}