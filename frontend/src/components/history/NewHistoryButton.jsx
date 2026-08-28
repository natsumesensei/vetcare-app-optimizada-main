export default function NewHistoryButton({ onClick }) {
  return (
    <button
      onClick={() => {
        console.log("CLICK");
        onClick();
      }}
      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
    >
      Nueva Consulta
    </button>
  );
}