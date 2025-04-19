import { Navigate } from 'react-router-dom';
import { useRole } from '../../hooks/useRole';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../LoadingSpinner';

const AdminRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || !user.role || user.role !== 'admin') {
    console.log('Access denied: User is not an admin', { user });
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute; 