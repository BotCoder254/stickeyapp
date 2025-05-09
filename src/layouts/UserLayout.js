import { useState } from 'react';
import UserSidebar from '../components/Navigation/UserSidebar';
import { motion } from 'framer-motion';

const UserLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      <UserSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 overflow-auto"
      >
        {children}
      </motion.main>
    </div>
  );
};

export default UserLayout; 