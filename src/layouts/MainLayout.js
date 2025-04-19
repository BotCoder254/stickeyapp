import { motion } from 'framer-motion';

const MainLayout = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`min-h-screen bg-gray-50 ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default MainLayout; 