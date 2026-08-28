import { useEffect, useState } from "react";

import api from "../api/apiClient";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Spinner from "../components/ui/Spinner";

export default function ReferenceValues() {
  const [species, setSpecies] = useState("dog");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (value) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/reference-values?species=${value}`);
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
      setError("No se pudieron cargar los valores de referencia.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(species);
  }, [species]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold tracking-widest text-brand-600">
          LABORATORIO
        </p>
        <h1 className="text-3xl font-bold text-ink">Valores de referencia</h1>
        <p className="text-muted">
          Rangos orientativos para perro y gato. El laboratorio de referencia tiene prioridad.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={species === "dog" ? "primary" : "outline"}
          onClick={() => setSpecies("dog")}
        >
          Perro
        </Button>
        <Button
          variant={species === "cat" ? "primary" : "outline"}
          onClick={() => setSpecies("cat")}
        >
          Gato
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          title="No se pudo cargar"
          action={
            <Button variant="outline" onClick={() => load(species)}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Card>
        {loading ? (
          <Spinner label="Cargando rangos…" />
        ) : rows.length === 0 ? (
          <EmptyState
            title="Sin valores para esta especie"
            description="Cuando existan rangos cargados, aparecerán en esta tabla."
          />
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-canvas text-muted">
                <tr>
                  <th className="p-3 text-left font-semibold">Categoría</th>
                  <th className="p-3 text-left font-semibold">Parámetro</th>
                  <th className="p-3 text-left font-semibold">Unidad</th>
                  <th className="p-3 text-left font-semibold">Mín.</th>
                  <th className="p-3 text-left font-semibold">Máx.</th>
                  <th className="p-3 text-left font-semibold">Fuente</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-line">
                    <td className="p-3 text-ink">{row.category}</td>
                    <td className="p-3 font-medium text-ink">{row.parameter}</td>
                    <td className="p-3 text-muted">{row.unit || "—"}</td>
                    <td className="p-3">{row.min_value ?? "—"}</td>
                    <td className="p-3">{row.max_value ?? "—"}</td>
                    <td className="p-3 text-xs text-muted">{row.source || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
