import Button from "../ui/Button";

export default function Pagination({
  page = 1,
  totalPages = 1,
  onPrevious,
  onNext,
}) {
  return (
    <div className="flex justify-between items-center mt-6">

      <Button
        type="button"
        onClick={onPrevious}
        disabled={page <= 1}
      >
        Anterior
      </Button>

      <span className="text-sm text-slate-500">
        Página {page} de {totalPages}
      </span>

      <Button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages}
      >
        Siguiente
      </Button>

    </div>
  );
}