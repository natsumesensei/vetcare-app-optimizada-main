import React from "react";

export default function BaseModal({

    isOpen,

    title,

    children,

    onClose,

    width = "700px"

}) {

    if (!isOpen) return null;

    return (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

            <div
                className="bg-white rounded-xl shadow-xl p-6"
                style={{ width }}
            >

                <div className="flex justify-between items-center mb-5">

                    <h2 className="text-xl font-bold">

                        {title}

                    </h2>

                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-red-600 text-xl"
                    >

                        ✕

                    </button>

                </div>

                {children}

            </div>

        </div>

    );

}