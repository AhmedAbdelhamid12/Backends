import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import cache from './services/cacheService';
import { HomePage } from './pages/HomePage';
import LoginScreen from './screens/LoginScreen';
import AdminDashboard from './screens/AdminDashboard';
import CoachDashboard from './screens/CoachDashboard';
import TraineeDashboard from './screens/TraineeDashboard';
import ParentDashboard from './screens/ParentDashboard';
import UsersPage from './screens/UsersPage';
import SessionsPage from './screens/SessionsPage';
import SubscriptionsPage from './screens/SubscriptionsPage';
import ProgressPage from './screens/ProgressPage';
import AchievementsPage from './screens/AchievementsPage';
import TeamsPage from './screens/TeamsPage';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

/**
 * Enhanced DashboardRouter - Renders dashboard based on user role
 * Features:
 * - Role-based dashboard selection
 * - Loading state handling
 * - Memoized for performance
 */
const DashboardRouter = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;

  const dashboards = {
    admin: AdminDashboard,
    coach: CoachDashboard,
    trainee: TraineeDashboard,
    parent: ParentDashboard,
  };

  const DashboardComponent = dashboards[user.role];
  if (!DashboardComponent) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#e74c3c'
      }}>
        Invalid user role: {user.role}
      </div>
    );
  }

  return <DashboardComponent />;
};

/**
 * App Component - Main application router with cache initialization
 * Features:
 * - Centralized route management
 * - Error boundary wrapping
 * - Provider composition
 * - Role-based access control
 * - Redis-like cache initialization
 */
function App() {
  // Initialize cache service on app mount
  useEffect(() => {
    cache.initIndexedDB().then(() => {
      console.log('✅ Cache service initialized successfully');
    }).catch(error => {
      console.warn('⚠️ Cache initialization failed, using memory cache:', error);
    });
  }, []);
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/unauthorized" element={
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100vh',
                  textAlign: 'center'
                }}>
                  <h1 style={{ color: '#e74c3c' }}>401 Unauthorized</h1>
                  <p>You do not have permission to access this resource</p>
                  <a href="/dashboard" style={{ marginTop: '20px', color: '#3498db' }}>Back to Dashboard</a>
                </div>
              } />

              {/* Dashboard Routes */}
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

              {/* Admin Routes */}
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
                path="/subscriptions"
                element={
                  <PrivateRoute roles={['admin']}>
                    <Layout>
                      <SubscriptionsPage />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/teams"
                element={
                  <PrivateRoute roles={['admin', 'coach']}>
                    <Layout>
                      <TeamsPage />
                    </Layout>
                  </PrivateRoute>
                }
              />

              {/* Shared Routes */}
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
              <Route
                path="/progress"
                element={
                  <PrivateRoute roles={['admin', 'coach', 'trainee']}>
                    <Layout>
                      <ProgressPage />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/achievements"
                element={
                  <PrivateRoute roles={['admin', 'coach', 'trainee']}>
                    <Layout>
                      <AchievementsPage />
                    </Layout>
                  </PrivateRoute>
                }
              />

              {/* Homepage */}
              <Route path="/" element={<HomePage />} />
              <Route path="/home" element={<HomePage />} />

              {/* Default route - catch all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;