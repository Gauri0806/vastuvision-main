import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import BlueprintAnalysis from './pages/BlueprintAnalysis';
import VastuAudit from './pages/VastuAudit';
import WorkspaceLauncher from './pages/WorkspaceLauncher';
import MyLibrary from './pages/MyLibrary';
import AccountSettings from './pages/AccountSettings';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="/blueprint"
            element={<ProtectedRoute><BlueprintAnalysis /></ProtectedRoute>}
          />
          <Route
            path="/vastu"
            element={<ProtectedRoute><VastuAudit /></ProtectedRoute>}
          />
          <Route
            path="/workspace"
            element={<ProtectedRoute><WorkspaceLauncher /></ProtectedRoute>}
          />
          <Route
            path="/library"
            element={<ProtectedRoute><MyLibrary /></ProtectedRoute>}
          />
          <Route
            path="/settings"
            element={<ProtectedRoute><AccountSettings /></ProtectedRoute>}
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
