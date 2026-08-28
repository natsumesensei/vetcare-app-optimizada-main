import BaseButton from "../core/components/BaseButton";

export default function FormActions({

    onCancel,

    loading = false,

    submitText = "Guardar"

}) {

    return (

        <div className="flex justify-end gap-3 mt-6">

            <BaseButton

                variant="secondary"

                onClick={onCancel}

                type="button"

            >

                Cancelar

            </BaseButton>

            <BaseButton

                type="submit"

                disabled={loading}

            >

                {loading ? "Guardando..." : submitText}

            </BaseButton>

        </div>

    );

}