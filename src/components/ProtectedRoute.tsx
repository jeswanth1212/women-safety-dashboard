import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, adminUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user || !adminUser) {
    // Only redirect if not already on login page
    if (location.pathname !== '/login') {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;