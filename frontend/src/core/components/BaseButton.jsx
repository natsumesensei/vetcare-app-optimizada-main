import React from "react";

export default function BaseButton({

    children,

    onClick,

    type = "button",

    variant = "primary",

    disabled = false

}) {

    const variants = {

        primary:
            "bg-blue-600 hover:bg-blue-700 text-white",

        secondary:
            "bg-gray-600 hover:bg-gray-700 text-white",

        success:
            "bg-green-600 hover:bg-green-700 text-white",

        danger:
            "bg-red-600 hover:bg-red-700 text-white",

        warning:
            "bg-yellow-500 hover:bg-yellow-600 text-white"

    };

    return (

        <button

            type={type}

            onClick={onClick}

            disabled={disabled}

            className={`

                px-4
                py-2
                rounded-lg
                font-medium
                transition

                ${variants[variant]}

                ${disabled ? "opacity-50 cursor-not-allowed" : ""}

            `}

        >

            {children}

        </button>

    );

}