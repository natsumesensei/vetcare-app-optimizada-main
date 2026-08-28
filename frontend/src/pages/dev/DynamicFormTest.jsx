import BaseCard from "../../core/components/BaseCard";
import BaseForm from "../../forms/BaseForm";
import consultationFields from "../../forms/consultationFields";

export default function DynamicFormTest() {

    const handleSubmit = (data) => {

        console.log(data);

        alert(JSON.stringify(data, null, 2));

    };

    return (

        <div className="p-6">

            <BaseCard

                title="Prueba Dynamic Form Engine"

            >

                <BaseForm

                    fields={consultationFields}

                    initialValues={{

                        date: "",

                        temperature: "",

                        weight: "",

                        heart_rate: "",

                        respiratory_rate: "",

                        diagnosis: "",

                        treatment: ""

                    }}

                    onSubmit={handleSubmit}

                />

            </BaseCard>

        </div>

    );

}