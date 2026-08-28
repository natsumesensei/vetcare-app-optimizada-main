export default function VaccineCard({

    vaccine,

    onEdit,

    onDelete

}) {

    return (

        <div className="bg-white border rounded-xl p-4 shadow-sm">

            <div className="flex justify-between">

                <div>

                    <h3 className="font-bold text-lg">

                        {vaccine.vaccine_name}

                    </h3>

                    <p className="text-sm text-gray-600">

                        Aplicada: {vaccine.application_date}

                    </p>

                    {vaccine.next_due_date && (

                        <p className="text-sm text-blue-600">

                            Próxima dosis: {vaccine.next_due_date}

                        </p>

                    )}

                    {vaccine.laboratory && (

                        <p className="text-sm">

                            Laboratorio: {vaccine.laboratory}

                        </p>

                    )}

                    {vaccine.batch && (

                        <p className="text-sm">

                            Lote: {vaccine.batch}

                        </p>

                    )}

                </div>

                <div className="flex flex-col gap-2">

                    <button

                        onClick={() => onEdit(vaccine)}

                        className="px-3 py-1 bg-yellow-500 text-white rounded"

                    >

                        Editar

                    </button>

                    <button

                        onClick={() => onDelete(vaccine.id)}

                        className="px-3 py-1 bg-red-600 text-white rounded"

                    >

                        Eliminar

                    </button>

                </div>

            </div>

            {vaccine.observations && (

                <div className="mt-4">

                    <strong>Observaciones</strong>

                    <p>{vaccine.observations}</p>

                </div>

            )}

        </div>

    );

}