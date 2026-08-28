import ParasiteForm from "./ParasiteForm";

export default function ParasiteModal({
    open,
    patientId,
    parasite,
    onClose,
    onSaved
}) {

    if (!open) return null;

    const isEditing = Boolean(parasite?.id);

    return (

        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">

            <div className="bg-white p-6 rounded-xl w-[600px]">

                <h2 className="text-xl font-bold mb-4">
                    {isEditing ? "Editar Control Parasitario" : "Control Parasitario"}
                </h2>

                <ParasiteForm
                    patientId={patientId}
                    parasite={parasite}
                    onSaved={onSaved}
                    onCancel={onClose}
                />

            </div>

        </div>

    );

}