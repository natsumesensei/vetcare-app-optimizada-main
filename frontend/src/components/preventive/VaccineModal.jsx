import VaccineForm from "./VaccineForm";

export default function VaccineModal({ open, patientId, vaccine, onClose, onSaved }) {

    if (!open) return null;

    const isEditing = Boolean(vaccine?.id);

    return (

        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">

            <div className="bg-white p-6 rounded-xl w-[600px]">

                <h2 className="text-xl font-bold mb-4">
                    {isEditing ? "Editar Vacuna" : "Nueva Vacuna"}
                </h2>

                <VaccineForm
                    patientId={patientId}
                    vaccine={vaccine}
                    onSaved={onSaved}
                    onCancel={onClose}
                />

            </div>

        </div>

    );

}