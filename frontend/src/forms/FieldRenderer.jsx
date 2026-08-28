import TextField from "./components/TextField";
import NumberField from "./components/NumberField";
import TextareaField from "./components/TextareaField";
import SelectField from "./components/SelectField";
import DateField from "./components/DateField";

export default function FieldRenderer(props) {

    switch (props.type) {

        case "number":
            return <NumberField {...props} />;

        case "textarea":
            return <TextareaField {...props} />;

        case "select":
            return <SelectField {...props} />;

        case "date":
            return <DateField {...props} />;

        default:
            return <TextField {...props} />;
    }

}