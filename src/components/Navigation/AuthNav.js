import { useState, useRef, useEffect } from 'react';
import { FiLogOut, FiUser, FiSearch, FiX } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';

const AuthNav = () => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [allNotes, setAllNotes] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch all notes once when component mounts
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const notesRef = collection(db, 'notes');
        const q = query(notesRef, where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        const notes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllNotes(notes);
      } catch (error) {
        console.error('Error fetching notes:', error);
      }
    };

    if (user) {
      fetchNotes();
    }
  }, [user]);

  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setSearchQuery(searchTerm);

    if (searchTerm.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    // Client-side filtering
    const filteredResults = allNotes
      .filter(note => {
        const titleMatch = note.title?.toLowerCase().includes(searchTerm);
        const contentMatch = note.content?.toLowerCase().includes(searchTerm);
        const tagMatch = note.tags?.some(tag => 
          tag.toLowerCase().includes(searchTerm)
        );
        return titleMatch || contentMatch || tagMatch;
      })
      .map(note => ({
        ...note,
        matchType: note.title?.toLowerCase().includes(searchTerm) ? 'title' : 'content'
      }))
      .slice(0, 5);

    setSearchResults(filteredResults);
    setIsSearching(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex-shrink-0 flex items-center"
            >
              <span className="text-2xl font-bold text-primary">StickyNotes</span>
            </motion.div>
          </div>

          {/* Global Search */}
          <div className="flex-1 max-w-2xl mx-8 flex items-center relative" ref={searchRef}>
            <div className="w-full relative">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search notes..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setShowResults(false);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FiX />
                  </motion.button>
                )}
              </div>

              <AnimatePresence>
                {showResults && (searchResults.length > 0 || isSearching) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute w-full mt-2 bg-white rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
                  >
                    {isSearching ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto"></div>
                      </div>
                    ) : (
                      <div className="py-2">
                        {searchResults.map((result) => (
                          <motion.div
                            key={result.id}
                            whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                            className="px-4 py-2 cursor-pointer"
                          >
                            <div className="font-medium">{result.title}</div>
                            {result.matchType === 'content' && (
                              <div className="text-sm text-gray-600 truncate">
                                {result.content}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FiUser className="text-gray-600" />
              <span className="text-gray-800">{user?.email}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <FiLogOut className="mr-2" />
              Logout
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AuthNav; 