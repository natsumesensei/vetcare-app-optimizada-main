import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientProfile from "./pages/PatientProfile";
import PatientForm from "./pages/PatientForm";
import HistoryTimeline from "./components/history/HistoryTimeline";
import ConsultationPage from "./pages/ConsultationPage";
import EntityManager from "./pages/EntityManager";
import Laboratory from "./pages/Laboratory";
import Settings from "./pages/Settings";
import Invoices from "./pages/Invoices";
import InvoicePrint from "./pages/InvoicePrint";
import LabReportPrint from "./pages/LabReportPrint";
import PatientPrint from "./pages/PatientPrint";
import PrescriptionPrint from "./pages/PrescriptionPrint";
import VaccinationCertificate from "./pages/VaccinationCertificate";
import Anesthesia from "./pages/Anesthesia";

export default function App() {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={<Login />} />

      {/* Rutas de impresión directa (sin layout sidebar) */}
      <Route
        path="/invoices/:id/print"
        element={
          <ProtectedRoute>
            <InvoicePrint />
          </ProtectedRoute>
        }
      />
      <Route
        path="/labs/:id/print"
        element={
          <ProtectedRoute>
            <LabReportPrint />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients/:id/print"
        element={
          <ProtectedRoute>
            <PatientPrint />
          </ProtectedRoute>
        }
      />
      <Route
        path="/prescriptions/:id/print"
        element={
          <ProtectedRoute>
            <PrescriptionPrint />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients/:id/vaccination-certificate"
        element={
          <ProtectedRoute>
            <VaccinationCertificate />
          </ProtectedRoute>
        }
      />

      {/* Rutas principales con Layout global */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />

        {/* Pacientes */}
        <Route path="patients" element={<Patients />} />
        <Route path="patients/new" element={<PatientForm />} />
        <Route path="patients/:id" element={<PatientProfile />} />
        <Route path="patients/:id/edit" element={<PatientForm />} />
        <Route path="patients/:id/history" element={<HistoryTimeline />} />

        {/* Módulos clínicos y de gestión */}
        <Route path="anesthesia" element={<Anesthesia />} />
        <Route path="consultations" element={<ConsultationPage />} />
        <Route path="appointments" element={<EntityManager type="appointments" />} />
        <Route path="inventory" element={<EntityManager type="inventory" />} />
        <Route path="surgeries" element={<EntityManager type="surgeries" />} />
        <Route path="hospitalizations" element={<EntityManager type="hospitalizations" />} />
        <Route path="laboratory" element={<Laboratory />} />
        <Route path="reference-values" element={<Laboratory />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
