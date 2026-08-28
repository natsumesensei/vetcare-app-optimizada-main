import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {

  const { user, loading } = useAuth();

  // Mientras se verifica si hay una sesión guardada, no mostrar nada todavía
  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;

}
