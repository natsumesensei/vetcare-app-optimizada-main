export default function TextareaField({

    label,

    value,

    onChange,

    required = false,

    rows = 4

}) {

    return (

        <div className="mb-4">

            <label className="block mb-1 font-medium">

                {label}

            </label>

            <textarea

                rows={rows}

                value={value}

                required={required}

                onChange={onChange}

                className="

                    w-full

                    border

                    rounded-lg

                    p-2

                    outline-none

                    focus:ring-2

                    focus:ring-blue-500

                "

            />

        </div>

    );

}