export default function StatCard({
  title,
  value,
  icon,
  color = "bg-blue-500",
}) {
  return (
    <div className="bg-white rounded-xl border shadow-sm p-5 flex items-center justify-between">

      <div>

        <p className="text-sm text-slate-500">
          {title}
        </p>

        <h2 className="text-3xl font-bold mt-2">
          {value}
        </h2>

      </div>

      <div
        className={`${color} w-14 h-14 rounded-xl flex items-center justify-center text-white`}
      >
        {icon}
      </div>

    </div>
  );
}