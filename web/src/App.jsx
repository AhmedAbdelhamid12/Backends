import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoginScreen from './screens/LoginScreen';
import AdminDashboard from './screens/AdminDashboard';
import CoachDashboard from './screens/CoachDashboard';
import TraineeDashboard from './screens/TraineeDashboard';
import ParentDashboard from './screens/ParentDashboard';
import UsersPage from './screens/UsersPage';
import SessionsPage from './screens/SessionsPage';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

const DashboardRouter = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return null;

  const dashboards = {
    admin: <AdminDashboard />,
    coach: <CoachDashboard />,
    trainee: <TraineeDashboard />,
    parent: <ParentDashboard />,
  };

  return dashboards[user.role] || <div>Invalid role</div>;
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<LoginScreen />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Layout>
                      <DashboardRouter />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <PrivateRoute roles={['admin']}>
                    <Layout>
                      <UsersPage />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/sessions"
                element={
                  <PrivateRoute roles={['admin', 'coach']}>
                    <Layout>
                      <SessionsPage />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/unauthorized" element={<div style={{ textAlign: 'center', marginTop: '100px' }}><h1>Unauthorized Access</h1></div>} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
