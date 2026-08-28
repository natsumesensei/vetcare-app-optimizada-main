export default function OwnerInfo({ form, setForm }) {

  function update(field,value){
    setForm({
      ...form,
      [field]:value
    });
  }

  return(
    <div className="bg-white rounded-xl border border-slate-200 p-6">

      <h2 className="text-lg font-semibold mb-6">
        Propietario
      </h2>

      <div className="grid md:grid-cols-2 gap-5">

        <div>

          <label className="block mb-2 font-medium">
            Nombre
          </label>

          <input
            className="w-full border rounded-lg p-3"
            value={form.owner_name}
            onChange={(e)=>update("owner_name",e.target.value)}
          />

        </div>

        <div>

          <label className="block mb-2 font-medium">
            Teléfono
          </label>

          <input
            className="w-full border rounded-lg p-3"
            value={form.owner_phone}
            onChange={(e)=>update("owner_phone",e.target.value)}
          />

        </div>

        <div>

          <label className="block mb-2 font-medium">
            Email
          </label>

          <input
            type="email"
            className="w-full border rounded-lg p-3"
            value={form.owner_email}
            onChange={(e)=>update("owner_email",e.target.value)}
          />

        </div>

        <div>

          <label className="block mb-2 font-medium">
            Dirección
          </label>

          <input
            className="w-full border rounded-lg p-3"
            value={form.address || ""}
            onChange={(e)=>update("address",e.target.value)}
          />

        </div>

      </div>

    </div>
  );
}