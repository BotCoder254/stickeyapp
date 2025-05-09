import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import SignUp from './components/SignUp';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard/Dashboard';
import Analytics from './components/Dashboard/Analytics';
import AdminDashboard from './components/Admin/AdminDashboard';
import UserManagement from './components/Admin/UserManagement';
import FlaggedNotes from './components/Admin/FlaggedNotes';
import ContentModeration from './components/Admin/ContentModeration';
import BackupRestore from './components/Admin/BackupRestore';
import SystemLogs from './components/Admin/SystemLogs';
import AdminRoute from './components/Admin/AdminRoute';
import SharedNote from './components/Notes/SharedNote';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import GroupManagement from './components/Admin/GroupManagement';
import GroupView from './components/Groups/GroupView';
import VersionHistoryManagement from './components/Admin/VersionHistoryManagement';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
  return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
      </MainLayout>
    );
  }

  return !user ? children : <Navigate to="/dashboard" />;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <MainLayout>
                <LandingPage />
              </MainLayout>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <MainLayout>
                  <AuthLayout>
                    <Login />
                  </AuthLayout>
                </MainLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <MainLayout>
                  <AuthLayout>
                    <SignUp />
                  </AuthLayout>
                </MainLayout>
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <MainLayout>
                  <AuthLayout>
                    <ResetPassword />
                  </AuthLayout>
                </MainLayout>
              </PublicRoute>
            }
          />

          {/* Private Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <UserLayout>
                  <Dashboard />
                </UserLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <PrivateRoute>
                <UserLayout>
                  <Analytics />
                </UserLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/groups"
            element={
              <PrivateRoute>
                <UserLayout>
                  <GroupView />
                </UserLayout>
              </PrivateRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminLayout>
                  <UserManagement />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/flagged"
            element={
              <AdminRoute>
                <AdminLayout>
                  <FlaggedNotes />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/moderation"
            element={
              <AdminRoute>
                <AdminLayout>
                  <ContentModeration />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/backup"
            element={
              <AdminRoute>
                <AdminLayout>
                  <BackupRestore />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/system-logs"
            element={
              <AdminRoute>
                <AdminLayout>
                  <SystemLogs />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/groups"
            element={
              <AdminRoute>
                <AdminLayout>
                  <GroupManagement />
                </AdminLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/version-history"
            element={
              <AdminRoute>
                <AdminLayout>
                  <VersionHistoryManagement />
                </AdminLayout>
              </AdminRoute>
            }
          />

          {/* Shared Note Route */}
          <Route
            path="/share/:shareId"
            element={
              <MainLayout>
                <SharedNote />
              </MainLayout>
            }
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
