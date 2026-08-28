export default function PatientAvatar({ patient }) {
  if (patient.photo) {
    return (
      <img
        src={patient.photo}
        alt={patient.name}
        className="w-11 h-11 rounded-full object-cover"
      />
    );
  }

  const initials = patient.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
      {initials}
    </div>
  );
}