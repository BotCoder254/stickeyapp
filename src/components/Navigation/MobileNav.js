import { motion } from 'framer-motion';
import { FiHome, FiArchive, FiBookmark, FiTrendingUp, FiSearch } from 'react-icons/fi';

const MobileNav = ({ 
  showArchived,
  showBookmarked,
  showAnalytics,
  setShowArchived,
  setShowBookmarked,
  setShowAnalytics,
  onSearchClick
}) => {
  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-100 z-50 safe-area-inset-bottom"
    >
      <div className="flex justify-around items-center h-16 px-2 max-w-7xl mx-auto">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setShowArchived(false);
            setShowBookmarked(false);
            setShowAnalytics(false);
          }}
          className={`flex flex-col items-center justify-center p-2 rounded-lg ${
            !showArchived && !showBookmarked && !showAnalytics
              ? 'text-primary'
              : 'text-gray-600'
          }`}
        >
          <FiHome className="w-5 h-5" />
          <span className="text-xs mt-1">Home</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setShowArchived(!showArchived);
            setShowBookmarked(false);
            setShowAnalytics(false);
          }}
          className={`flex flex-col items-center justify-center p-2 rounded-lg ${
            showArchived ? 'text-secondary' : 'text-gray-600'
          }`}
        >
          <FiArchive className="w-5 h-5" />
          <span className="text-xs mt-1">Archive</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setShowBookmarked(!showBookmarked);
            setShowArchived(false);
            setShowAnalytics(false);
          }}
          className={`flex flex-col items-center justify-center p-2 rounded-lg ${
            showBookmarked ? 'text-accent' : 'text-gray-600'
          }`}
        >
          <FiBookmark className="w-5 h-5" />
          <span className="text-xs mt-1">Saved</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setShowAnalytics(!showAnalytics);
            setShowArchived(false);
            setShowBookmarked(false);
          }}
          className={`flex flex-col items-center justify-center p-2 rounded-lg ${
            showAnalytics ? 'text-primary' : 'text-gray-600'
          }`}
        >
          <FiTrendingUp className="w-5 h-5" />
          <span className="text-xs mt-1">Stats</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onSearchClick}
          className="flex flex-col items-center justify-center p-2 rounded-lg text-gray-600"
        >
          <FiSearch className="w-5 h-5" />
          <span className="text-xs mt-1">Search</span>
        </motion.button>
      </div>

      <style>{`
        .safe-area-inset-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
    </motion.nav>
  );
};

export default MobileNav; 