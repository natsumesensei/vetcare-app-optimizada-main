import { Camera } from "lucide-react";

export default function PhotoUploader({ image, setImage }) {
  function handleChange(e) {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result);
    };

    reader.readAsDataURL(file);
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">

      <h2 className="text-lg font-semibold mb-4">
        Fotografía
      </h2>

      <div className="flex flex-col items-center gap-4">

        <div className="w-44 h-44 rounded-full border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center bg-slate-100">

          {image ? (
            <img
              src={image}
              alt="Paciente"
              className="w-full h-full object-cover"
            />
          ) : (
            <Camera size={60} className="text-slate-400" />
          )}

        </div>

        <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition">

          Seleccionar imagen

          <input
            hidden
            type="file"
            accept="image/*"
            onChange={handleChange}
          />

        </label>

      </div>

    </div>
  );
}