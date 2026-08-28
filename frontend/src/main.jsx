import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

import "./index.css";
import "./App.css";

import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster 
            position="top-right" 
            richColors 
            closeButton 
            toastOptions={{
              className: 'font-sans rounded-xl shadow-lg border-slate-100',
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
);