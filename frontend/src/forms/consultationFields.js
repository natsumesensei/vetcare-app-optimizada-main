const consultationFields = [

    {
        name: "date",
        label: "Fecha",
        type: "date",
        required: true
    },

    {
        name: "temperature",
        label: "Temperatura (°C)",
        type: "number"
    },

    {
        name: "weight",
        label: "Peso (kg)",
        type: "number"
    },

    {
        name: "heart_rate",
        label: "Frecuencia Cardíaca",
        type: "number"
    },

    {
        name: "respiratory_rate",
        label: "Frecuencia Respiratoria",
        type: "number"
    },

    {
        name: "diagnosis",
        label: "Diagnóstico",
        type: "textarea"
    },

    {
        name: "treatment",
        label: "Tratamiento",
        type: "textarea"
    }

];

export default consultationFields;