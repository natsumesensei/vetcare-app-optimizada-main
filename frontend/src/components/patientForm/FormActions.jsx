import Button from "../ui/Button";

export default function FormActions({
  loading,
  onCancel,
}) {
  return (
    <div className="flex justify-end gap-4">

      <Button
        type="button"
        onClick={onCancel}
      >
        Cancelar
      </Button>

      <Button
        type="submit"
        disabled={loading}
      >
        {loading
          ? "Guardando..."
          : "Guardar Paciente"}
      </Button>

    </div>
  );
}