import BaseInput from "../../core/components/BaseInput";

export default function TextField({

label,

value,

onChange,

required=false,

placeholder=""

}){

return(

<BaseInput

label={label}

value={value}

onChange={onChange}

required={required}

placeholder={placeholder}

/>

);

}