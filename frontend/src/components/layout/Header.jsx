import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import { getPatients } from "../../services/patientService";
import { useAuth } from "../../contexts/AuthContext";

export default function Header({ onToggle }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  const displayName = user?.name || "Administrador";
  const userInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const data = await getPatients(query.trim());
        const list = Array.isArray(data) ? data : data?.patients || [];
        setResults(list.slice(0, 6));
        setOpen(true);
      } catch (err) {
        console.error("Error buscando pacientes:", err);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  function goToPatient(patient) {
    const id = patient._id || patient.id;
    setOpen(false);
    setQuery("");
    navigate(`/patients/${id}`);
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {/* Lado izquierdo */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-slate-100 transition"
        >
          <Menu size={22} />
        </button>

        <div ref={boxRef} className="relative hidden md:block w-80">
          <div className="flex items-center bg-slate-100 rounded-lg px-3 py-2">
            <Search size={18} className="text-slate-500" />
            <input
              className="bg-transparent ml-2 outline-none w-full text-sm text-slate-800"
              placeholder="Buscar paciente..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query && setOpen(true)}
            />
          </div>

          {open && results.length > 0 && (
            <div className="absolute mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
              {results.map((p) => (
                <button
                  key={p._id || p.id}
                  type="button"
                  onClick={() => goToPatient(p)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex justify-between"
                >
                  <span className="font-medium text-slate-800">{p.name}</span>
                  <span className="text-slate-400">{p.species}</span>
                </button>
              ))}
            </div>
          )}

          {open && query.trim() && results.length === 0 && (
            <div className="absolute mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-3 text-sm text-slate-500">
              Sin resultados para "{query}"
            </div>
          )}
        </div>
      </div>

      {/* Lado derecho */}
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => navigate("/settings")}
          className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition"
          title="Ver configuración y perfil de usuario"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 font-bold text-white text-xs shadow-xs">
            {userInitials}
          </div>
          <div className="text-right">
            <p className="font-semibold text-sm text-slate-900 leading-tight">
              {displayName}
            </p>
            <p className="text-[11px] text-teal-700 font-medium">
              {user?.role ? user.role.toUpperCase() : "SESIÓN ACTIVA"}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}
