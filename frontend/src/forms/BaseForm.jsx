import { useState, useEffect } from "react";
import FieldRenderer from "./FieldRenderer";
import FormActions from "./FormActions";

export default function BaseForm({

    fields,

    initialValues,

    onSubmit,

    onCancel,

    submitText = "Guardar"

}) {

    const [formData, setFormData] = useState(initialValues);

    useEffect(() => {

        setFormData(initialValues);

    }, [initialValues]);

    const handleChange = (name, value) => {

        setFormData(prev => ({

            ...prev,

            [name]: value

        }));

    };

    const submit = (e) => {

        e.preventDefault();

        onSubmit(formData);

    };

    return (

        <form onSubmit={submit}>

            {

                fields.map(field => (

                    <FieldRenderer

                        key={field.name}

                        {...field}

                        value={formData[field.name] ?? ""}

                        onChange={(e) =>

                            handleChange(field.name, e.target.value)

                        }

                    />

                ))

            }

            <FormActions

                onCancel={onCancel}

                submitText={submitText}

            />

        </form>

    );

}