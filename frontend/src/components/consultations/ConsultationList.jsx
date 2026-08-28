import ConsultationCard from "./ConsultationCard";

export default function ConsultationList({

  consultations,

  onEdit,

  onDelete,

}) {

  if (!consultations.length) {

    return (

      <div className="bg-white rounded-xl border p-10 text-center">

        No existen consultas registradas.

      </div>

    );

  }

  return (

    <div className="space-y-6">

      {consultations.map((consultation) => (

        <ConsultationCard

          key={consultation.id}

          consultation={consultation}

          onEdit={onEdit}

          onDelete={onDelete}

        />

      ))}

    </div>

  );

}