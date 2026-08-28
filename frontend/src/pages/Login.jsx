import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Sparkles } from "lucide-react";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Label from "@/components/ui/Label";
import Alert from "@/components/ui/Alert";

import api from "@/api/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/vetnestor-logo.png";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState(() => localStorage.getItem("last_login_email") || "admin@clinica.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e?.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Por favor, completa correo y contraseña.");
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post("/auth/login", { email: email.trim(), password });
      localStorage.setItem("last_login_email", email.trim());
      login(data.user, data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  }

  function autofillDemo() {
    setEmail("admin@clinica.com");
    setPassword("admin123");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white w-full rounded-2xl shadow-xl border border-slate-200 p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <img src={logo} alt="Vet Nestor" className="w-14 h-14 rounded-full object-cover border border-slate-200 shadow-sm" />
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                Vet Nestor
              </h1>
              <p className="text-xs text-slate-500">Gestión Clínica Veterinaria Integral</p>
              <p className="text-[11px] text-slate-400">San Pedro de Macorís, RD · 849-806-6352</p>
            </div>
          </div>

          {error && (
            <div className="mb-4">
              <Alert type="error">{error}</Alert>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label>Correo electrónico</Label>
              <Input
                type="email"
                placeholder="admin@clinica.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <Label>Contraseña</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <Button
              className="w-full h-11 text-base font-semibold bg-teal-600 hover:bg-teal-700 text-white mt-2"
              type="submit"
              disabled={loading}
            >
              {loading ? "Iniciando sesión..." : "Acceder al sistema"}
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={autofillDemo}
              className="inline-flex items-center gap-2 text-xs font-medium text-teal-700 hover:text-teal-900 bg-teal-50 px-3 py-1.5 rounded-lg transition"
            >
              <Sparkles size={14} /> Usar credenciales demo (admin@clinica.com / admin123)
            </button>
          </div>
        </form>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={14} />
          <span>Acceso seguro y encriptado · VetCare Pro</span>
        </div>
      </div>
    </div>
  );
}
