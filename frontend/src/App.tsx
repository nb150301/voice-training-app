import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load dashboards to prevent Phase 5 components from blocking /login route
const DashboardEnhanced = lazy(() => import('./pages/Dashboard'));
const DashboardSimple = lazy(() => import('./pages/Dashboard-simple'));

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
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-gray-600">Loading...</div></div>}>
                <DashboardEnhanced />
              </Suspense>
            </ProtectedRoute>
          }
        />
        {/* Fallback to simple dashboard for compatibility */}
        <Route
          path="/dashboard-simple"
          element={
            <ProtectedRoute>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-gray-600">Loading...</div></div>}>
                <DashboardSimple />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
