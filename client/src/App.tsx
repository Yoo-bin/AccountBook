import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './hooks/useAuthStore';
import { socketService } from './services/socket';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AccountBookPage from './pages/AccountBookPage';
import InvitationPage from './pages/InvitationPage';

function App() {
  const { isAuthenticated, token, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect(token);
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, token]);

  return (
    <Routes>
      <Route
        path="/login"
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/register"
        element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/"
        element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/accountbook/:id"
        element={isAuthenticated ? <AccountBookPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/invitation/:token"
        element={isAuthenticated ? <InvitationPage /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default App;
