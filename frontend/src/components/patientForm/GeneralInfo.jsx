export default function GeneralInfo({ form, setForm }) {

  function update(field, value) {
    setForm({
      ...form,
      [field]: value,
    });
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">

      <h2 className="text-lg font-semibold mb-6">
        Datos Generales
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        <div>
          <label className="block mb-2 font-medium">
            Nombre
          </label>

          <input
            className="w-full border rounded-lg p-3"
            value={form.name}
            onChange={(e)=>update("name",e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Especie
          </label>

          <select
            className="w-full border rounded-lg p-3"
            value={form.species}
            onChange={(e)=>update("species",e.target.value)}
          >
            <option value="">Seleccione</option>
            <option>Perro</option>
            <option>Gato</option>
            <option>Ave</option>
            <option>Conejo</option>
            <option>Reptil</option>
            <option>Otro</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Raza
          </label>

          <input
            className="w-full border rounded-lg p-3"
            value={form.breed}
            onChange={(e)=>update("breed",e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Sexo
          </label>

          <select
            className="w-full border rounded-lg p-3"
            value={form.sex}
            onChange={(e)=>update("sex",e.target.value)}
          >
            <option value="">Seleccione</option>
            <option>Macho</option>
            <option>Hembra</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Fecha nacimiento
          </label>

          <input
            type="date"
            className="w-full border rounded-lg p-3"
            value={form.birthdate}
            onChange={(e)=>update("birthdate",e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Color
          </label>

          <input
            className="w-full border rounded-lg p-3"
            value={form.color}
            onChange={(e)=>update("color",e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Peso (kg)
          </label>

          <input
            type="number"
            step="0.01"
            className="w-full border rounded-lg p-3"
            value={form.weight}
            onChange={(e)=>update("weight",e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Microchip
          </label>

          <input
            className="w-full border rounded-lg p-3"
            value={form.microchip}
            onChange={(e)=>update("microchip",e.target.value)}
          />
        </div>

      </div>

    </div>
  );
}