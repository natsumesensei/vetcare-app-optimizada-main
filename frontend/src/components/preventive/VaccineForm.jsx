import { useState, useEffect } from "react";
import { createVaccine, updateVaccine } from "../../services/vaccineService";

const emptyForm = {
    patient_id: null,
    vaccine_name: "",
    application_date: new Date().toISOString().substring(0, 10),
    next_due_date: "",
    veterinarian: "",
    batch: "",
    laboratory: "",
    observations: ""
};

export default function VaccineForm({ patientId, vaccine, onSaved, onCancel }) {

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        ...emptyForm,
        patient_id: patientId,
    });

    const isEditing = Boolean(vaccine?.id);

    // Si nos pasan una vacuna existente, precargar el formulario con sus datos
    useEffect(() => {

        if (vaccine) {

            setForm({
                patient_id: vaccine.patient_id ?? patientId,
                vaccine_name: vaccine.vaccine_name || "",
                application_date: vaccine.application_date
                    ? vaccine.application_date.substring(0, 10)
                    : new Date().toISOString().substring(0, 10),
                next_due_date: vaccine.next_due_date
                    ? vaccine.next_due_date.substring(0, 10)
                    : "",
                veterinarian: vaccine.veterinarian || "",
                batch: vaccine.batch || "",
                laboratory: vaccine.laboratory || "",
                observations: vaccine.observations || ""
            });

        } else {

            setForm({
                ...emptyForm,
                patient_id: patientId,
            });

        }

    }, [vaccine, patientId]);

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

            if (isEditing) {
                await updateVaccine(vaccine.id, form);
            } else {
                await createVaccine(form);
            }

            onSaved?.();

        } catch (err) {

            console.error(err);

            alert(
                isEditing
                    ? "Error al actualizar vacuna"
                    : "Error al guardar vacuna"
            );

        } finally {

            setLoading(false);

        }

    }

    return (

        <form onSubmit={handleSubmit} className="space-y-4">

            <input
                name="vaccine_name"
                placeholder="Nombre de la vacuna"
                value={form.vaccine_name}
                onChange={handleChange}
                className="input"
                required
            />

            <input
                type="date"
                name="application_date"
                value={form.application_date}
                onChange={handleChange}
                className="input"
            />

            <input
                type="date"
                name="next_due_date"
                value={form.next_due_date}
                onChange={handleChange}
                className="input"
            />

            <input
                name="veterinarian"
                placeholder="Veterinario"
                value={form.veterinarian}
                onChange={handleChange}
                className="input"
            />

            <input
                name="batch"
                placeholder="Lote"
                value={form.batch}
                onChange={handleChange}
                className="input"
            />

            <input
                name="laboratory"
                placeholder="Laboratorio"
                value={form.laboratory}
                onChange={handleChange}
                className="input"
            />

            <textarea
                name="observations"
                placeholder="Observaciones"
                value={form.observations}
                onChange={handleChange}
                className="input"
            />

            <div className="flex gap-2">

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    {loading
                        ? "Guardando..."
                        : isEditing
                            ? "Actualizar"
                            : "Guardar"}
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
