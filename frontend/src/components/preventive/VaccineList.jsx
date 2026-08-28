import VaccineCard from "./VaccineCard";

export default function VaccineList({

    vaccines,

    onEdit,

    onDelete

}) {

    if (!vaccines.length) {

        return (

            <div className="text-center text-gray-500 py-10">

                No existen vacunas registradas.

            </div>

        );

    }

    return (

        <div className="space-y-4">

            {

                vaccines.map(vaccine => (

                    <VaccineCard

                        key={vaccine.id}

                        vaccine={vaccine}

                        onEdit={onEdit}

                        onDelete={onDelete}

                    />

                ))

            }

        </div>

    );

}