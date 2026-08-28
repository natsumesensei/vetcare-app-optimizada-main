import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import { getPatientById, updatePatient, createPatient } from "../services/patientService";

export default function PatientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    species: "Perro",
    breed: "",
    gender: "Macho",
    birth_date: "",
    weight: "",
    microchip: "",
    photo: "",
    owner_name: "",
    owner_phone: "",
    owner_email: "",
    owner_address: "",
    allergies: "",
    notes: "",
  });

  useEffect(() => {
    if (isEditing && id) {
      async function fetchPatient() {
        try {
          const res = await getPatientById(id);
          const data = res?.data?.patient || res?.patient || res?.data || res;
          if (data) {
            const owner = data.owner || {};
            const rawDate = data.birth_date || data.birthDate || data.birthday || data.born_date || "";
            const formattedDate = rawDate ? rawDate.split("T")[0] : "";

            setFormData({
              name: data.name || "",
              species: data.species || "Perro",
              breed: data.breed || "",
              gender: data.gender || data.sex || "Macho",
              birth_date: formattedDate,
              weight: data.weight || "",
              microchip: data.microchip || data.chip || "",
              photo: data.photo || data.photo_url || data.image || data.image_url || "",
              owner_name: owner.name || data.owner_name || data.ownerName || "",
              owner_phone: owner.phone || data.owner_phone || data.phone || "",
              owner_email: owner.email || data.owner_email || data.email || "",
              owner_address: owner.address || data.owner_address || data.ownerAddress || "",
              allergies: data.allergies || "",
              notes: data.notes || data.observations || "",
            });
          }
        } catch (err) {
          console.error("Error al obtener paciente:", err);
        }
      }
      fetchPatient();
    }
  }, [id, isEditing]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400;
          const scaleFactor = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleFactor;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          setFormData((prev) => ({ ...prev, photo: compressedBase64 }));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formattedDate = formData.birth_date ? formData.birth_date : null;

      const payload = {
        name: formData.name,
        species: formData.species,
        breed: formData.breed,
        gender: formData.gender,
        sex: formData.gender,
        birth_date: formattedDate,
        birthDate: formattedDate,
        birthday: formattedDate,
        born_date: formattedDate,
        weight: formData.weight,
        microchip: formData.microchip,
        chip: formData.microchip,
        allergies: formData.allergies,
        notes: formData.notes,
        photo: formData.photo,
        photo_url: formData.photo,
        image: formData.photo,
        owner_name: formData.owner_name,
        owner_phone: formData.owner_phone,
        owner_email: formData.owner_email,
        owner_address: formData.owner_address,
        address: formData.owner_address,
        owner: {
          name: formData.owner_name,
          phone: formData.owner_phone,
          email: formData.owner_email,
          address: formData.owner_address,
          owner_address: formData.owner_address,
        },
      };

      console.log("PAYLOAD ENVIADO AL BACKEND:", payload);

      if (isEditing && id) {
        await updatePatient(id, payload);
        navigate(`/patients/${id}`);
      } else {
        const res = await createPatient(payload);
        const created = res?.data?.patient || res?.data || res;
        const newId = created?._id || created?.id;
        navigate(newId ? `/patients/${newId}` : "/patients");
      }
    } catch (err) {
      console.error("Error al guardar paciente:", err);
      alert("Hubo un error al guardar. Revisa la consola del navegador para más detalles.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft size={18} /> Cancelar y volver
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fotografía */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center gap-4">
          <div className="h-28 w-28 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
            {formData.photo ? (
              <img src={formData.photo} alt="Vista previa" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-slate-400 font-medium text-center px-2">Sin imagen</span>
            )}
          </div>
          <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition">
            <Upload size={16} /> Seleccionar imagen
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        </div>

        {/* Datos Generales */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Datos Generales</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Especie</label>
              <input
                type="text"
                name="species"
                value={formData.species}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Raza</label>
              <input
                type="text"
                name="breed"
                value={formData.breed}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Sexo</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-teal-600 bg-white"
              >
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha de Nacimiento</label>
              <input
                type="date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-teal-600 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Peso (kg)</label>
              <input
                type="text"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="Ej. 12.5"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-teal-600"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Número de Microchip</label>
              <input
                type="text"
                name="microchip"
                value={formData.microchip}
                onChange={handleChange}
                placeholder="Número de identificación o chip"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-teal-600"
              />
            </div>
          </div>
        </div>

        {/* Propietario */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Propietario</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre</label>
              <input
                type="text"
                name="owner_name"
                value={formData.owner_name}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Teléfono</label>
              <input
                type="text"
                name="owner_phone"
                value={formData.owner_phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                name="owner_email"
                value={formData.owner_email}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Dirección</label>
              <input
                type="text"
                name="owner_address"
                value={formData.owner_address}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-teal-600"
              />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Paciente"}
          </button>
        </div>
      </form>
    </div>
  );
}