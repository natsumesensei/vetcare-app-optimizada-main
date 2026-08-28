import { Component } from "react";
import { AlertOctagon, RefreshCw, Home } from "lucide-react";
import Button from "./ui/Button";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Aquí es el único lugar donde queremos ver el detalle técnico completo.
    console.error("ErrorBoundary atrapó un error:", error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center bg-white border border-line rounded-2xl shadow-card p-8">
          <div className="w-12 h-12 rounded-full bg-status-dangerBg text-status-danger flex items-center justify-center mx-auto mb-4">
            <AlertOctagon size={22} />
          </div>

          <h2 className="text-lg font-bold text-ink">
            Algo salió mal en esta sección
          </h2>

          <p className="text-sm text-muted mt-2">
            El resto de la aplicación sigue funcionando. Puedes reintentar
            aquí o volver al inicio.
          </p>

          <div className="flex gap-3 justify-center mt-6">
            <Button variant="outline" onClick={() => (window.location.href = "/")}>
              <Home size={16} />
              Ir al inicio
            </Button>

            <Button onClick={this.reset}>
              <RefreshCw size={16} />
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
