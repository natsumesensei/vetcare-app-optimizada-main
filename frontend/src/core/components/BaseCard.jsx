import React from "react";

export default function BaseCard({

    title,

    subtitle,

    children,

    footer

}) {

    return (

        <div className="bg-white rounded-xl shadow-md p-5 mb-4">

            {title && (

                <div className="mb-4">

                    <h2 className="text-lg font-bold">

                        {title}

                    </h2>

                    {subtitle && (

                        <p className="text-gray-500">

                            {subtitle}

                        </p>

                    )}

                </div>

            )}

            <div>

                {children}

            </div>

            {footer && (

                <div className="mt-4 pt-4 border-t">

                    {footer}

                </div>

            )}

        </div>

    );

}