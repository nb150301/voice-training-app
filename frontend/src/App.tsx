import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardEnhanced from './components/DashboardEnhanced';
import DashboardSimple from './pages/Dashboard-simple';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardEnhanced />
            </ProtectedRoute>
          }
        />
        {/* Fallback to simple dashboard for compatibility */}
        <Route
          path="/dashboard-simple"
          element={
            <ProtectedRoute>
              <DashboardSimple />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
