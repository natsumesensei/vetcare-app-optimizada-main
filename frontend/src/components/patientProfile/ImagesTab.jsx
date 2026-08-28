import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Upload, Trash2, X } from "lucide-react";

import {
  getImages,
  uploadImage,
  deleteImage,
  getImageUrl,
} from "../../services/imageService";

import Button from "../ui/Button";
import Input from "../ui/Input";
import EmptyState from "../ui/EmptyState";
import { Card } from "../ui/Card";

export default function ImagesTab({ patientId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [description, setDescription] = useState("");
  const [veterinarian, setVeterinarian] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const fileInputRef = useRef(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getImages(patientId);
      setRows(data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (patientId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Solo se permiten archivos de imagen.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert("La imagen es demasiado grande (máximo 8 MB).");
      return;
    }

    setPreview(file);
  }

  async function handleUpload() {
    if (!preview) return;

    setUploading(true);
    try {
      await uploadImage(patientId, {
        file: preview,
        description,
        veterinarian,
      });

      setPreview(null);
      setDescription("");
      setVeterinarian("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      await load();
    } catch (err) {
      console.error(err);
      alert("Error al subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar esta imagen?")) return;
    await deleteImage(id);
    await load();
  }

  return (
    <Card>
      <div className="p-6 border-b border-line">
        <h2 className="text-2xl font-bold text-ink">Imágenes</h2>
        <p className="text-muted">
          Radiografías, fotos de heridas, resultados visuales, etc.
        </p>
      </div>

      {/* SUBIR NUEVA IMAGEN */}
      <div className="p-6 border-b border-line bg-canvas">
        <div className="grid md:grid-cols-3 gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            onChange={handleFileSelect}
            className="md:col-span-3 text-sm"
          />

          <Input
            placeholder="Descripción (ej. Radiografía de tórax)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Input
            placeholder="Veterinario"
            value={veterinarian}
            onChange={(e) => setVeterinarian(e.target.value)}
          />

          <Button onClick={handleUpload} disabled={!preview || uploading}>
            <Upload size={16} />
            {uploading ? "Subiendo..." : "Subir imagen"}
          </Button>
        </div>

        {preview && (
          <div className="mt-4">
            <p className="text-sm text-muted mb-2">Vista previa:</p>
            <img
              src={URL.createObjectURL(preview)}
              alt="Vista previa"
              className="h-32 rounded-lg border border-line object-cover"
            />
          </div>
        )}
      </div>

      {/* GALERÍA */}
      <div className="p-6">
        {loading ? (
          <p className="text-muted">Cargando...</p>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="Aún no hay imágenes registradas"
            description="Sube la primera imagen con el formulario de arriba."
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rows.map((img) => (
              <div
                key={img.id}
                className="border border-line rounded-xl overflow-hidden group relative"
              >
                <img
                  src={getImageUrl(img.filename)}
                  alt={img.description || "Imagen del paciente"}
                  className="w-full h-32 object-cover cursor-pointer"
                  onClick={() => setLightbox(img)}
                />

                <div className="p-2">
                  <p className="text-xs text-ink truncate">
                    {img.description || "Sin descripción"}
                  </p>
                  <p className="text-xs text-muted">
                    {img.uploaded_at?.slice(0, 10)}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(img.id)}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white text-status-danger p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition"
                  title="Eliminar imagen"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LIGHTBOX */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-6 right-6 text-white"
            onClick={() => setLightbox(null)}
          >
            <X size={28} />
          </button>

          <div className="max-w-3xl">
            <img
              src={getImageUrl(lightbox.filename)}
              alt={lightbox.description || "Imagen del paciente"}
              className="max-h-[80vh] rounded-lg mx-auto"
            />
            <p className="text-white text-center mt-3">
              {lightbox.description}
              {lightbox.veterinarian ? ` · Dr(a). ${lightbox.veterinarian}` : ""}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
