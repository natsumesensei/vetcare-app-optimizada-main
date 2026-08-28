import BaseInput from "../../core/components/BaseInput";

export default function NumberField({

label,

value,

onChange,

required=false

}){

return(

<BaseInput

type="number"

label={label}

value={value}

onChange={onChange}

required={required}

/>

);

}