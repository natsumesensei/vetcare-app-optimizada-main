export default function FormSection({

    title,

    children

}){

    return(

        <div className="bg-white rounded-xl border p-5 mb-6">

            <h3 className="text-lg font-semibold mb-4">

                {title}

            </h3>

            {children}

        </div>

    );

}