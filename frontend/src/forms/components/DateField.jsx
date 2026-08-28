import BaseInput from "../../core/components/BaseInput";

export default function DateField({

    label,

    value,

    onChange,

    required = false

}) {

    return (

        <BaseInput

            type="date"

            label={label}

            value={value}

            onChange={onChange}

            required={required}

        />

    );

}