import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { FiPlus, FiGrid, FiList, FiPieChart, FiBarChart2, FiClock, FiStar, FiTag, FiFilter, FiArchive } from 'react-icons/fi';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import AuthNav from '../Navigation/AuthNav';
import StickyNote from '../Notes/StickyNote';

const Dashboard = () => {
  const [notes, setNotes] = useState([]);
  const [archivedNotes, setArchivedNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [filterColor, setFilterColor] = useState('all');
  const [sortBy, setSortBy] = useState('updated'); // 'updated', 'created', 'color'
  const [showArchived, setShowArchived] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    archived: 0,
    byColor: {},
    recentlyUpdated: [],
    averageLength: 0,
    activityByDay: {},
    tags: []
  });
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notes'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let allNotes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Separate active and archived notes
      const active = allNotes.filter(note => !note.isArchived);
      const archived = allNotes.filter(note => note.isArchived);

      // Apply sorting
      const sortedActive = sortNotes(active, sortBy);
      const sortedArchived = sortNotes(archived, sortBy);
      
      // Apply color filter if needed
      const filteredActive = filterColor !== 'all' 
        ? sortedActive.filter(note => note.color === filterColor)
        : sortedActive;
      
      const filteredArchived = filterColor !== 'all'
        ? sortedArchived.filter(note => note.color === filterColor)
        : sortedArchived;

      setNotes(filteredActive);
      setArchivedNotes(filteredArchived);
      
      // Calculate enhanced statistics
      calculateStats([...active, ...archived]);
    });

    return () => unsubscribe();
  }, [user, sortBy, filterColor]);

  const calculateStats = (notesData) => {
    const totalNotes = notesData.length;
    const archivedCount = notesData.filter(note => note.isArchived).length;
    const colorCount = notesData.reduce((acc, note) => {
      acc[note.color] = (acc[note.color] || 0) + 1;
      return acc;
    }, {});

    // Calculate activity by day
    const activityByDay = notesData.reduce((acc, note) => {
      const date = note.updatedAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Extract and count tags
    const tags = notesData.reduce((acc, note) => {
      const noteTags = note.content?.match(/#\w+/g) || [];
      noteTags.forEach(tag => {
        if (!acc.includes(tag)) acc.push(tag);
      });
      return acc;
    }, []);

    setStats({
      total: totalNotes,
      archived: archivedCount,
      byColor: colorCount,
      recentlyUpdated: notesData.filter(note => !note.isArchived).slice(0, 5),
      averageLength: Math.round(notesData.reduce((acc, note) => acc + (note.content?.length || 0), 0) / (totalNotes || 1)),
      activityByDay,
      tags
    });

    setLoading(false);
  };

  const sortNotes = (notes, sortType) => {
    switch (sortType) {
      case 'updated':
        return [...notes].sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
      case 'created':
        return [...notes].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      case 'color':
        return [...notes].sort((a, b) => (a.color || '').localeCompare(b.color || ''));
      default:
        return notes;
    }
  };

  const handleAddNote = async () => {
    try {
      const newNote = {
        userId: user.uid,
        title: 'New Note',
        content: '',
        color: 'yellow',
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'notes'), newNote);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleUpdateNote = async (updatedNote) => {
    try {
      const noteRef = doc(db, 'notes', updatedNote.id);
      await updateDoc(noteRef, {
        ...updatedNote,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleArchiveNote = async (note) => {
    try {
      const noteRef = doc(db, 'notes', note.id);
      await updateDoc(noteRef, {
        isArchived: !note.isArchived,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error archiving note:', error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteDoc(doc(db, 'notes', noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthNav />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Section */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white p-6 rounded-lg shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Active Notes</h3>
              <FiStar className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-primary">{stats.total - stats.archived}</p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white p-6 rounded-lg shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Archived Notes</h3>
              <FiArchive className="w-5 h-5 text-secondary" />
            </div>
            <p className="text-3xl font-bold text-secondary">{stats.archived}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white p-6 rounded-lg shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Popular Tags</h3>
              <FiTag className="w-5 h-5 text-accent" />
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-1 bg-accent/10 text-accent rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white p-6 rounded-lg shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <FiClock className="w-5 h-5 text-primary" />
            </div>
            <div className="text-sm text-gray-600">
              {stats.recentlyUpdated.slice(0, 3).map(note => (
                <div key={note.id} className="truncate">
                  {note.title}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Controls Section */}
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow">
          <div className="flex gap-4">
            {/* View Toggle */}
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                <FiGrid className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                <FiList className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-100 border-none rounded-lg px-3 py-2 text-sm text-gray-600 focus:ring-2 focus:ring-primary"
            >
              <option value="updated">Recently Updated</option>
              <option value="created">Recently Created</option>
              <option value="color">By Color</option>
            </select>

            {/* Color Filter */}
            <select
              value={filterColor}
              onChange={(e) => setFilterColor(e.target.value)}
              className="bg-gray-100 border-none rounded-lg px-3 py-2 text-sm text-gray-600 focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Colors</option>
              {Object.keys(stats.byColor).map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>

          {/* Archive Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              showArchived ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <FiArchive className="w-5 h-5" />
            <span>{showArchived ? 'Show Active' : 'Show Archived'}</span>
          </motion.button>
        </div>

        {/* Notes Grid/List */}
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4"
        }>
          <AnimatePresence>
            {(showArchived ? archivedNotes : notes).map((note, index) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <StickyNote
                  note={note}
                  onUpdate={handleUpdateNote}
                  onDelete={handleDeleteNote}
                  onArchive={handleArchiveNote}
                  isListView={viewMode === 'list'}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {!showArchived && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleAddNote}
            className="fixed bottom-8 right-8 p-4 rounded-full bg-primary text-white shadow-lg hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <FiPlus className="w-6 h-6" />
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 