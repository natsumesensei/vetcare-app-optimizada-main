import { useState } from "react";

export default function useForm(initialValues = {}) {

    const [values, setValues] = useState(initialValues);

    const [errors, setErrors] = useState({});

    const [loading, setLoading] = useState(false);

    const handleChange = (name, value) => {

        setValues(prev => ({

            ...prev,

            [name]: value

        }));

    };

    const reset = () => {

        setValues(initialValues);

        setErrors({});

    };

    return {

        values,

        setValues,

        errors,

        setErrors,

        loading,

        setLoading,

        handleChange,

        reset

    };

}