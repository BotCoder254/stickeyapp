import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiBookmark } from 'react-icons/fi';

const LandingNav = () => {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex-shrink-0 flex items-center"
            >
              <Link to="/" className="flex items-center space-x-2">
                <FiBookmark className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold text-primary">StickyNotes</span>
              </Link>
            </motion.div>
          </div>
          <div className="flex items-center space-x-4">
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary hover:text-secondary"
              >
                Sign In
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                to="/signup"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Get Started
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LandingNav; 