import BaseForm from "../../forms/BaseForm";
import consultationFields from "../../forms/consultationFields";

export default function ConsultationFormV2({

    initialValues = {},

    onSubmit

}) {

    return (

        <BaseForm

            fields={consultationFields}

            initialValues={{

                date: "",

                temperature: "",

                weight: "",

                heart_rate: "",

                diagnosis: "",

                treatment: "",

                ...initialValues

            }}

            onSubmit={onSubmit}

            submitText="Guardar Consulta"

        />

    );

}