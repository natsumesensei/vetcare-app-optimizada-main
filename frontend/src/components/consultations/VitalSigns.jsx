export default function VitalSigns({
  form,
  setForm,
}) {

  function change(e) {

    setForm({

      ...form,

      [e.target.name]: e.target.value,

    });

  }

  return (

    <div className="grid grid-cols-4 gap-4">

      <div>

        <label>Temperatura</label>

        <input

          name="temperature"

          value={form.temperature}

          onChange={change}

          className="w-full border rounded-lg p-2"

        />

      </div>

      <div>

        <label>FC</label>

        <input

          name="heart_rate"

          value={form.heart_rate}

          onChange={change}

          className="w-full border rounded-lg p-2"

        />

      </div>

      <div>

        <label>FR</label>

        <input

          name="respiratory_rate"

          value={form.respiratory_rate}

          onChange={change}

          className="w-full border rounded-lg p-2"

        />

      </div>

      <div>

        <label>Peso</label>

        <input

          name="weight"

          value={form.weight}

          onChange={change}

          className="w-full border rounded-lg p-2"

        />

      </div>

    </div>

  );

}