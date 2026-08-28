export default function SelectField({

    label,

    value,

    onChange,

    options = [],

    required = false

}) {

    return (

        <div className="mb-4">

            <label className="block mb-1 font-medium">

                {label}

            </label>

            <select

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

            >

                <option value="">

                    Seleccione...

                </option>

                {

                    options.map(option => (

                        <option

                            key={option.value}

                            value={option.value}

                        >

                            {option.label}

                        </option>

                    ))

                }

            </select>

        </div>

    );

}