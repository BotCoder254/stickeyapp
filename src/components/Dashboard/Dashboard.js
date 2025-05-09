import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, arrayUnion, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { FiPlus, FiGrid, FiList, FiStar, FiTag, FiFilter, FiArchive, FiBookmark, FiClock } from 'react-icons/fi';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { db, storage } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import StickyNote from '../Notes/StickyNote';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [filterColor, setFilterColor] = useState('all');
  const [sortBy, setSortBy] = useState('updated');
  const [stats, setStats] = useState({
    total: 0,
    archived: 0,
    bookmarked: 0,
    byColor: {},
    recentlyUpdated: []
  });
  const [noteOrder, setNoteOrder] = useState([]);

  const { user } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentView = searchParams.get('view') || 'all';

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

      // Apply sorting
      const sortedNotes = sortNotes(allNotes, sortBy);
      
      // Apply color filter if needed
      const filteredNotes = filterColor !== 'all' 
        ? sortedNotes.filter(note => note.color === filterColor)
        : sortedNotes;

      // Filter notes based on current view
      let displayNotes;
      switch (currentView) {
        case 'archived':
          displayNotes = filteredNotes.filter(note => note.isArchived);
          break;
        case 'bookmarked':
          displayNotes = filteredNotes.filter(note => note.isBookmarked);
          break;
        default:
          displayNotes = filteredNotes.filter(note => !note.isArchived);
      }

      // Apply custom order if exists
      const orderRef = doc(db, 'users', user.uid);
      getDoc(orderRef).then((doc) => {
        if (doc.exists() && doc.data().noteOrder) {
          const savedOrder = doc.data().noteOrder;
          displayNotes.sort((a, b) => {
            const indexA = savedOrder.indexOf(a.id);
            const indexB = savedOrder.indexOf(b.id);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          });
        }
        setNotes(displayNotes);
        setNoteOrder(displayNotes.map(note => note.id));
      });

      // Calculate basic statistics
      const totalNotes = allNotes.length;
      const archivedCount = allNotes.filter(note => note.isArchived).length;
      const bookmarkedCount = allNotes.filter(note => note.isBookmarked).length;
      const colorCount = allNotes.reduce((acc, note) => {
        acc[note.color] = (acc[note.color] || 0) + 1;
      return acc;
    }, {});

    setStats({
      total: totalNotes,
      archived: archivedCount,
      bookmarked: bookmarkedCount,
      byColor: colorCount,
        recentlyUpdated: allNotes.filter(note => !note.isArchived).slice(0, 5)
    });

    setLoading(false);
    });

    return () => unsubscribe();
  }, [user, sortBy, filterColor, currentView]);

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

  const handleUpdateNote = async (updatedNote) => {
    try {
      const noteRef = doc(db, 'notes', updatedNote.id);
      await updateDoc(noteRef, {
        ...updatedNote,
        updatedAt: new Date()
      });
      toast.success('Note updated');
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
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
        isBookmarked: false,
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'notes'), newNote);
      toast.success('Note created');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to create note');
    }
  };

  const handleArchiveNote = async (note) => {
    try {
      const noteRef = doc(db, 'notes', note.id);
      const isArchived = !note.isArchived;
      await updateDoc(noteRef, {
        isArchived,
        updatedAt: new Date()
      });
      toast.success(isArchived ? 'Note archived' : 'Note restored');
    } catch (error) {
      console.error('Error archiving note:', error);
      toast.error('Failed to archive note');
    }
  };

  const handleBookmarkNote = async (note) => {
    try {
      const noteRef = doc(db, 'notes', note.id);
      const isBookmarked = !note.isBookmarked;
      await updateDoc(noteRef, {
        isBookmarked,
        updatedAt: new Date()
      });
      toast.success(isBookmarked ? 'Note bookmarked' : 'Bookmark removed');
    } catch (error) {
      console.error('Error bookmarking note:', error);
      toast.error('Failed to bookmark note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteDoc(doc(db, 'notes', noteId));
      toast.success('Note deleted');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(notes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setNotes(items);
    const newOrder = items.map(note => note.id);
    setNoteOrder(newOrder);

    // Save the new order to Firestore
    try {
      const orderRef = doc(db, 'users', user.uid);
      await setDoc(orderRef, { noteOrder: newOrder }, { merge: true });
    } catch (error) {
      console.error('Error saving note order:', error);
      toast.error('Failed to save note order');
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              {currentView === 'archived' ? 'Archived Notes' :
               currentView === 'bookmarked' ? 'Bookmarked Notes' : 'My Notes'}
            </h1>
            {currentView === 'archived' ? <FiArchive className="w-6 h-6 text-secondary" /> :
             currentView === 'bookmarked' ? <FiBookmark className="w-6 h-6 text-accent" /> :
             <FiStar className="w-6 h-6 text-primary" />}
          </div>
          <p className="text-gray-600">
            {notes.length} {currentView === 'archived' ? 'archived' :
                          currentView === 'bookmarked' ? 'bookmarked' : 'active'} notes
          </p>
        </div>

        <div className="flex items-center gap-4 mt-4 lg:mt-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${
                viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-600'
              }`}
            >
              <FiGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${
                viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-600'
              }`}
            >
              <FiList className="w-5 h-5" />
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddNote}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
          >
            <FiPlus className="w-5 h-5" />
            <span>New Note</span>
          </motion.button>
        </div>
                </div>

      {/* Statistics Section */}
        <div className="mb-6">
          <div className="flex lg:grid lg:grid-cols-4 gap-4 overflow-x-auto pb-4 lg:pb-0 lg:overflow-x-visible -mx-4 px-4 lg:mx-0 lg:px-0 hide-scrollbar">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white p-4 lg:p-6 rounded-lg shadow-lg flex-shrink-0 w-[200px] sm:w-[250px] lg:w-auto"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Active Notes</h3>
                <FiStar className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold text-primary">{stats.total - stats.archived}</p>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white p-4 lg:p-6 rounded-lg shadow-lg flex-shrink-0 w-[200px] sm:w-[250px] lg:w-auto"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Archived Notes</h3>
                <FiArchive className="w-5 h-5 text-secondary" />
              </div>
              <p className="text-3xl font-bold text-secondary">{stats.archived}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white p-4 lg:p-6 rounded-lg shadow-lg flex-shrink-0 w-[200px] sm:w-[250px] lg:w-auto"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Bookmarked</h3>
                <FiBookmark className="w-5 h-5 text-accent" />
              </div>
              <p className="text-3xl font-bold text-accent">{stats.bookmarked}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white p-4 lg:p-6 rounded-lg shadow-lg flex-shrink-0 w-[200px] sm:w-[250px] lg:w-auto"
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
        </div>

      {/* Controls Section */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 space-y-4 lg:space-y-0">
          <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Sort and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto bg-gray-100 rounded-lg px-3 py-2 text-sm"
              >
                <option value="updated">Recently Updated</option>
                <option value="created">Recently Created</option>
                <option value="color">By Color</option>
              </select>

              <select
                value={filterColor}
                onChange={(e) => setFilterColor(e.target.value)}
                className="w-full sm:w-auto bg-gray-100 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Colors</option>
                {Object.keys(stats.byColor).map(color => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

      {/* Notes Grid/List */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="notes-list" type="note">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`${
                viewMode === 'grid' 
                  ? "grid-container"
                  : "space-y-4"
              }`}
              style={{ minHeight: '200px' }}
            >
              {notes.map((note, index) => (
                <Draggable 
                  key={note.id} 
                  draggableId={note.id} 
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`${viewMode === 'grid' ? 'grid-item' : ''} ${
                        snapshot.isDragging ? 'dragging' : ''
                      }`}
                      style={{
                        ...provided.draggableProps.style,
                        transform: snapshot.isDragging
                          ? provided.draggableProps.style?.transform
                          : 'none'
                      }}
                    >
                      <motion.div
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
                          onBookmark={handleBookmarkNote}
                          isListView={viewMode === 'list'}
                          index={index}
                        />
                      </motion.div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add Note Button */}
      {currentView === 'all' && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleAddNote}
          className="fixed bottom-20 lg:bottom-8 right-8 p-4 rounded-full bg-primary text-white shadow-lg z-10"
        >
          <FiPlus className="w-6 h-6" />
        </motion.button>
      )}

      {/* Hide scrollbar style */}
      <style>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .grid-container {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1rem;
          min-height: 200px;
          padding: 1rem 0;
          position: relative;
        }
        @media (min-width: 640px) {
          .grid-container {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .grid-container {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (min-width: 1280px) {
          .grid-container {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        .grid-item {
          width: 100%;
          break-inside: avoid;
          page-break-inside: avoid;
          transform: translate3d(0, 0, 0);
          position: relative;
        }
        .dragging {
          position: relative;
          z-index: 9999;
          pointer-events: auto;
          cursor: grabbing;
          transform-origin: 0 0;
          box-shadow: 0 5px 15px rgba(0,0,0,0.15);
        }
        .grid-container > * {
          min-height: 0;
          transform: translate3d(0, 0, 0);
          will-change: transform;
        }
      `}</style>
    </div>
  );
};

export default Dashboard; 