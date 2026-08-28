import React from "react";

export default function BaseInput({

    label,

    value,

    onChange,

    type = "text",

    placeholder = "",

    required = false

}) {

    return (

        <div className="mb-4">

            <label className="block mb-1 font-medium">

                {label}

            </label>

            <input

                type={type}

                value={value}

                required={required}

                placeholder={placeholder}

                onChange={onChange}

                className="

                    w-full

                    border

                    rounded-lg

                    p-2

                    focus:ring-2

                    focus:ring-blue-500

                    outline-none

                "

            />

        </div>

    );

}