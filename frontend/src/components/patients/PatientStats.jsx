import {
  PawPrint,
  Dog,
  Cat,
  Users,
} from "lucide-react";

import StatCard from "./StatCard";

export default function PatientStats({ patients }) {

  const dogs = patients.filter(
    p => p.species?.toLowerCase() === "perro"
  ).length;

  const cats = patients.filter(
    p => p.species?.toLowerCase() === "gato"
  ).length;

  const owners = new Set(
    patients.map(p => p.owner_name)
  ).size;

  return (

    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

      <StatCard
        title="Pacientes"
        value={patients.length}
        icon={<PawPrint size={28} />}
        color="bg-blue-600"
      />

      <StatCard
        title="Perros"
        value={dogs}
        icon={<Dog size={28} />}
        color="bg-green-600"
      />

      <StatCard
        title="Gatos"
        value={cats}
        icon={<Cat size={28} />}
        color="bg-orange-500"
      />

      <StatCard
        title="Propietarios"
        value={owners}
        icon={<Users size={28} />}
        color="bg-purple-600"
      />

    </div>

  );

}