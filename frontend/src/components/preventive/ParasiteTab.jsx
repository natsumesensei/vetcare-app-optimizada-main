import { useEffect, useState } from "react";

import {
    getParasites,
    deleteParasite
} from "../../services/parasiteService";

import ParasiteModal from "./ParasiteModal";

export default function ParasiteTab({ patientId }) {

    const [data, setData] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedParasite, setSelectedParasite] = useState(null);

    async function load() {

        const res = await getParasites(patientId);

        setData(res);

    }

    useEffect(() => {

        if (patientId) load();

    }, [patientId]);

    async function remove(id) {

        if (!confirm("¿Eliminar registro antiparasitario?")) return;

        await deleteParasite(id);

        load();

    }

    function openNew() {
        setSelectedParasite(null);
        setOpen(true);
    }

    function openEdit(parasite) {
        setSelectedParasite(parasite);
        setOpen(true);
    }

    return (

        <div className="space-y-4">

            {/* HEADER */}
            <div className="flex justify-between items-center">

                <h2 className="font-bold text-lg">
                    Control Parasitario
                </h2>

                <button
                    onClick={openNew}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                >
                    Nuevo
                </button>

            </div>

            {/* LISTA */}
            {data.map(p => (

                <div key={p.id} className="border p-3 rounded flex justify-between items-start">

                    <div className="space-y-1">

                        <p className="font-bold">{p.type}</p>

                        <p className="text-sm">
                            Producto: {p.product}
                        </p>

                        <p className="text-sm">
                            Fecha: {p.application_date}
                        </p>

                        {p.next_due_date && (
                            <p className="text-sm">
                                Próxima dosis: {p.next_due_date}
                            </p>
                        )}

                        {p.veterinarian && (
                            <p className="text-sm">
                                Veterinario: {p.veterinarian}
                            </p>
                        )}

                        {p.observations && (
                            <p className="text-sm text-slate-600">
                                Obs: {p.observations}
                            </p>
                        )}

                    </div>

                    <div className="flex gap-3">

                        <button
                            onClick={() => openEdit(p)}
                            className="text-blue-600"
                        >
                            Editar
                        </button>

                        <button
                            onClick={() => remove(p.id)}
                            className="text-red-600"
                        >
                            Eliminar
                        </button>

                    </div>

                </div>

            ))}

            {/* MODAL */}
            <ParasiteModal
                open={open}
                patientId={patientId}
                parasite={selectedParasite}
                onClose={() => setOpen(false)}
                onSaved={() => {
                    setOpen(false);
                    load();
                }}
            />

        </div>

    );

}