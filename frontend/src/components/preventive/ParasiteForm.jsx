import { useState, useEffect } from "react";
import { createParasite, updateParasite } from "../../services/parasiteService";

const emptyForm = {
    patient_id: null,
    type: "",
    product: "",
    application_date: new Date().toISOString().substring(0, 10),
    next_due_date: "",
    veterinarian: "",
    observations: ""
};

export default function ParasiteForm({ patientId, parasite, onSaved, onCancel }) {

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        ...emptyForm,
        patient_id: patientId,
    });

    const isEditing = Boolean(parasite?.id);

    useEffect(() => {

        if (parasite) {

            setForm({
                patient_id: parasite.patient_id ?? patientId,
                type: parasite.type || "",
                product: parasite.product || "",
                application_date: parasite.application_date
                    ? parasite.application_date.substring(0, 10)
                    : new Date().toISOString().substring(0, 10),
                next_due_date: parasite.next_due_date
                    ? parasite.next_due_date.substring(0, 10)
                    : "",
                veterinarian: parasite.veterinarian || "",
                observations: parasite.observations || ""
            });

        } else {

            setForm({
                ...emptyForm,
                patient_id: patientId,
            });

        }

    }, [parasite, patientId]);

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
                await updateParasite(parasite.id, form);
            } else {
                await createParasite(form);
            }

            onSaved?.();
            onCancel?.();

        } catch (err) {

            console.error(err);

            alert(
                isEditing
                    ? "Error al actualizar registro antiparasitario"
                    : "Error al guardar registro antiparasitario"
            );

        } finally {

            setLoading(false);

        }

    }

    return (

        <form onSubmit={handleSubmit} className="space-y-4">

            <input
                name="type"
                placeholder="Tipo (Desparasitación interna/externa)"
                value={form.type}
                onChange={handleChange}
                className="input"
                required
            />

            <input
                name="product"
                placeholder="Producto aplicado"
                value={form.product}
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
