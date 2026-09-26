import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useMemo } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import GuestRoute from './components/auth/GuestRoute';
import ImpersonationBanner from './components/admin/ImpersonationBanner';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Patients from './pages/Patients';
import PatientForm from './pages/PatientForm';
import PatientProfile from './pages/PatientProfile';
import PatientPlanHistory from './pages/PatientPlanHistory';
import Templates from './pages/Templates';
import TemplateBuilder from './pages/TemplateBuilder';
import ServiceTypes from './pages/ServiceTypes';
import ServiceTypeForm from './pages/ServiceTypeForm';
import Rooms from './pages/Rooms';
import RoomForm from './pages/RoomForm';
import Plans from './pages/Plans';
import PlanForm from './pages/PlanForm';
import Schedule from './pages/Schedule';
import Users from './pages/Users';
import UserForm from './pages/UserForm';
import TreatmentCycleForm from './pages/TreatmentCycleForm';
import TreatmentCycleDetails from './pages/TreatmentCycleDetails';
import EvaluationForm from './pages/EvaluationForm';
import AppointmentForm from './pages/AppointmentForm';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminClinics from './pages/admin/AdminClinics';
import AdminClinicForm from './pages/admin/AdminClinicForm';
import AdminClinicUsers from './pages/admin/AdminClinicUsers';
import { buildBrandCssVariables, ADMIN_BRAND_CSS } from './utils/colors';

// Base URL do frontend - definida em .env (VITE_BASE_URL)
const BASE_URL = (import.meta.env.VITE_BASE_URL || '/fisio/app/').replace(/\/$/, '');

function ThemedRoutes() {
  const { isAdmin, isImpersonating, impersonatedTenant, user } = useAuth();

  // Admin = laranja; clínicas usam a cor primária definida no tenant (ou azul padrão);
  // impersonação herda a cor do cliente visualizado.
  const themeStyle = useMemo(() => {
    if (isAdmin && !isImpersonating) {
      return ADMIN_BRAND_CSS;
    }
    const tenantColor = isImpersonating
      ? impersonatedTenant?.primary_color
      : user?.tenant?.primary_color;
    return buildBrandCssVariables(tenantColor);
  }, [isAdmin, isImpersonating, impersonatedTenant, user]);

  return (
    <div style={themeStyle} className="min-h-screen">
      <ImpersonationBanner />
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/clientes"
          element={
            <AdminRoute>
              <AdminClinics />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/clientes/novo"
          element={
            <AdminRoute>
              <AdminClinicForm />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/clientes/:id/editar"
          element={
            <AdminRoute>
              <AdminClinicForm />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/clientes/:id/usuarios"
          element={
            <AdminRoute>
              <AdminClinicUsers />
            </AdminRoute>
          }
        />

        {/* Clinic routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agenda"
          element={
            <ProtectedRoute>
              <Schedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pacientes"
          element={
            <ProtectedRoute>
              <Patients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pacientes/novo"
          element={
            <ProtectedRoute>
              <PatientForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pacientes/:id/editar"
          element={
            <ProtectedRoute>
              <PatientForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pacientes/:patientId/ciclos/novo"
          element={
            <ProtectedRoute>
              <TreatmentCycleForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pacientes/:id"
          element={
            <ProtectedRoute>
              <PatientProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pacientes/:patientId/planos/:patientPlanId"
          element={
            <ProtectedRoute>
              <PatientPlanHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/modelos"
          element={
            <ProtectedRoute>
              <Templates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/modelos/novo"
          element={
            <ProtectedRoute>
              <TemplateBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/modelos/:id/editar"
          element={
            <ProtectedRoute>
              <TemplateBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tipos-atendimento"
          element={
            <ProtectedRoute>
              <ServiceTypes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tipos-atendimento/novo"
          element={
            <ProtectedRoute>
              <ServiceTypeForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tipos-atendimento/:id/editar"
          element={
            <ProtectedRoute>
              <ServiceTypeForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/salas"
          element={
            <ProtectedRoute>
              <Rooms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/salas/novo"
          element={
            <ProtectedRoute>
              <RoomForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/salas/:id/editar"
          element={
            <ProtectedRoute>
              <RoomForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/planos"
          element={
            <ProtectedRoute>
              <Plans />
            </ProtectedRoute>
          }
        />
        <Route
          path="/planos/novo"
          element={
            <ProtectedRoute>
              <PlanForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/planos/:id/editar"
          element={
            <ProtectedRoute>
              <PlanForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/funcionarios"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/funcionarios/novo"
          element={
            <ProtectedRoute>
              <UserForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/funcionarios/:id/editar"
          element={
            <ProtectedRoute>
              <UserForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ciclos/:id"
          element={
            <ProtectedRoute>
              <TreatmentCycleDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ciclos/:cicloId/avaliacoes/novo"
          element={
            <ProtectedRoute>
              <EvaluationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ciclos/:cicloId/atendimentos/novo"
          element={
            <ProtectedRoute>
              <AppointmentForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/avaliacoes/:id"
          element={
            <ProtectedRoute>
              <EvaluationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/atendimentos/:id"
          element={
            <ProtectedRoute>
              <AppointmentForm />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={BASE_URL}>
        <ThemedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
