export default function PatientSummary({
  patient,
}) {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

      <div className="bg-white border rounded-xl p-5">

        <h3 className="font-semibold">
          Sexo
        </h3>

        <p className="mt-2">
          {patient.sex || "-"}
        </p>

      </div>

      <div className="bg-white border rounded-xl p-5">

        <h3 className="font-semibold">
          Peso
        </h3>

        <p className="mt-2">
          {patient.weight || "-"} kg
        </p>

      </div>

      <div className="bg-white border rounded-xl p-5">

        <h3 className="font-semibold">
          Microchip
        </h3>

        <p className="mt-2">
          {patient.microchip || "-"}
        </p>

      </div>

      <div className="bg-white border rounded-xl p-5">

        <h3 className="font-semibold">
          Propietario
        </h3>

        <p className="mt-2">
          {patient.owner_name}
        </p>

      </div>

    </div>
  );
}