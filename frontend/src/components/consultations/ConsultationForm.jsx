import { useState } from "react";
import { createConsultation } from "../../services/consultationService";


export default function ConsultationForm({
  patientId,
  onSaved,
  onCancel
}) {


  const [form, setForm] = useState({

    diagnosis: "",
    treatment: "",
    notes: ""

  });



  const [loading, setLoading] = useState(false);



  function handleChange(e) {

    setForm({

      ...form,

      [e.target.name]: e.target.value

    });

  }




  async function handleSubmit(e) {

    e.preventDefault();


    try {

      setLoading(true);


      console.log(
        "PACIENTE:",
        patientId
      );


      if (!patientId) {

        alert(
          "No existe paciente seleccionado"
        );

        return;

      }



      await createConsultation(

        Number(patientId),

        {

          diagnosis: form.diagnosis,

          treatment: form.treatment,

          notes: form.notes

        }

      );



      onSaved?.();

      onCancel?.();



    } catch(err) {


      console.error(
        "Error guardando consulta:",
        err
      );


      alert(
        "Error al guardar consulta"
      );


    } finally {


      setLoading(false);


    }

  }





  return (

    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >


      <input

        name="diagnosis"

        placeholder="Diagnóstico"

        value={form.diagnosis}

        onChange={handleChange}

        className="input"

        required

      />



      <input

        name="treatment"

        placeholder="Tratamiento"

        value={form.treatment}

        onChange={handleChange}

        className="input"

        required

      />



      <textarea

        name="notes"

        placeholder="Notas"

        value={form.notes}

        onChange={handleChange}

        className="input"

      />



      <div className="flex gap-2">


        <button

          type="submit"

          disabled={loading}

          className="bg-blue-600 text-white px-4 py-2 rounded"

        >

          {
            loading
            ? "Guardando..."
            : "Guardar"
          }


        </button>



        <button

          type="button"

          onClick={onCancel}

          className="bg-gray-400 text-white px-4 py-2 rounded"

        >

          Cancelar

        </button>



      </div>


    </form>

  );


}