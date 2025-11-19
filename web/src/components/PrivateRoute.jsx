import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  console.log('PrivateRoute check:', { loading, user: user?.name, role: user?.role });

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    console.log('No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    console.log('User role not authorized:', user.role, 'Required:', roles);
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default PrivateRoute;
