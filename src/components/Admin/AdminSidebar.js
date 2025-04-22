import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiMenu,
  FiX,
  FiHome,
  FiUsers,
  FiSettings,
  FiPieChart,
  FiFlag,
  FiAlertCircle,
  FiHelpCircle,
  FiChevronLeft,
  FiChevronRight,
  FiShield,
  FiActivity,
  FiFileText,
  FiDatabase,
  FiList,
  FiLogOut,
  FiClock
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';

const AdminSidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: FiHome, label: 'Dashboard', path: '/admin' },
    { icon: FiUsers, label: 'User Management', path: '/admin/users' },
    { icon: FiPieChart, label: 'Analytics', path: '/admin/analytics' },
    { icon: FiFlag, label: 'Flagged Notes', path: '/admin/flagged' },
    { icon: FiShield, label: 'Content Moderation', path: '/admin/moderation' },
    { icon: FiList, label: 'System Logs', path: '/admin/system-logs' },
    { icon: FiClock, label: 'Version History', path: '/admin/version-history' },
    { icon: FiFileText, label: 'Reports', path: '/admin/reports' },
    { icon: FiDatabase, label: 'Backup & Restore', path: '/admin/backup' },
    { icon: FiSettings, label: 'Settings', path: '/admin/settings' },
    { icon: FiHelpCircle, label: 'Help Center', path: '/admin/help' },
    { icon: FiUsers, label: 'Groups', path: '/admin/groups' }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Successfully logged out');
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
      toast.error('Failed to log out');
    }
  };

  return (
    <motion.div
      initial={{ width: isOpen ? 240 : 80 }}
      animate={{ width: isOpen ? 240 : 80 }}
      className="bg-white border-r border-gray-200 h-screen sticky top-0 z-50"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {isOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-bold text-primary"
            >
              Admin Panel
            </motion.span>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {isOpen ? <FiChevronLeft /> : <FiChevronRight />}
          </motion.button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 mb-1 transition-colors ${
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="ml-3 font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex flex-col">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                {user?.displayName?.[0] || 'A'}
              </div>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="ml-3"
                >
                  <p className="text-sm font-medium text-gray-900">{user?.displayName || 'Admin User'}</p>
                  <p className="text-xs text-gray-500">{user?.email || 'admin@example.com'}</p>
                </motion.div>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <FiLogOut className="w-5 h-5" />
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="ml-3 font-medium"
                >
                  Logout
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminSidebar; 