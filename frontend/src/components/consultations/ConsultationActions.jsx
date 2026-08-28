export default function ConsultationActions({
  loading,
  onCancel,
}) {
  return (
    <div className="flex justify-end gap-4">

      <button
        type="button"
        onClick={onCancel}
        className="px-6 py-3 rounded-lg border"
      >
        Cancelar
      </button>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg"
      >
        {loading
          ? "Guardando..."
          : "Guardar Consulta"}
      </button>

    </div>
  );
}