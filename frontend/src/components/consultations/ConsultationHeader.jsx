export default function ConsultationHeader({
  form,
  setForm,
}) {


  function change(e) {

    setForm({

      ...form,

      [e.target.name]: e.target.value,

    });

  }



  function formatDate(value) {

    if (!value) return "";

    return value.substring(0, 10);

  }



  return (

    <div className="bg-white rounded-xl border p-6">


      <h2 className="text-xl font-bold mb-6">

        Información General

      </h2>



      <div className="grid grid-cols-2 gap-6">



        <div>


          <label className="block mb-2 font-medium">

            Fecha

          </label>



          <input

            type="date"

            name="date"

            value={formatDate(form.date)}

            onChange={change}

            className="w-full border rounded-lg p-3"

          />


        </div>




        <div>


          <label className="block mb-2 font-medium">

            Veterinario

          </label>



          <input

            type="text"

            name="veterinarian"

            value={form.veterinarian || ""}

            onChange={change}

            placeholder="Dr. Juan Pérez"

            className="w-full border rounded-lg p-3"

          />


        </div>



      </div>





      <div className="mt-6">


        <label className="block mb-2 font-medium">

          Motivo de la consulta

        </label>



        <textarea

          name="reason"

          value={form.reason || ""}

          onChange={change}

          rows={4}

          placeholder="Describa el motivo de consulta..."

          className="w-full border rounded-lg p-3 resize-none"

        />


      </div>




    </div>

  );

}