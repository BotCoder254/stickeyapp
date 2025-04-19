import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { FiPlus, FiGrid, FiList, FiPieChart, FiBarChart2, FiClock, FiStar, FiTag, FiFilter, FiArchive, FiBookmark, FiTrendingUp, FiFileText } from 'react-icons/fi';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { db, storage } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import AuthNav from '../Navigation/AuthNav';
import StickyNote from '../Notes/StickyNote';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import MobileNav from '../Navigation/MobileNav';
import { toast } from 'react-hot-toast';

const COLORS = ['#3A59D1', '#3D90D7', '#7AC6D2', '#B5FCCD'];

const Dashboard = () => {
  const [notes, setNotes] = useState([]);
  const [archivedNotes, setArchivedNotes] = useState([]);
  const [bookmarkedNotes, setBookmarkedNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [filterColor, setFilterColor] = useState('all');
  const [sortBy, setSortBy] = useState('updated'); // 'updated', 'created', 'color'
  const [showArchived, setShowArchived] = useState(false);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    archived: 0,
    bookmarked: 0,
    byColor: {},
    recentlyUpdated: [],
    averageLength: 0,
    activityByDay: {},
    tags: [],
    categoryDistribution: [],
    weeklyActivity: [],
    attachmentStats: {
      images: 0,
      audio: 0,
      files: 0
    },
    priorityDistribution: [],
    completionRate: 0,
    mostActiveHours: []
  });
  const { user } = useAuth();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

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

      // Separate notes by type
      const active = allNotes.filter(note => !note.isArchived);
      const archived = allNotes.filter(note => note.isArchived);
      const bookmarked = allNotes.filter(note => note.isBookmarked);

      // Apply sorting
      const sortedActive = sortNotes(active, sortBy);
      const sortedArchived = sortNotes(archived, sortBy);
      const sortedBookmarked = sortNotes(bookmarked, sortBy);
      
      // Apply color filter if needed
      const filteredActive = filterColor !== 'all' 
        ? sortedActive.filter(note => note.color === filterColor)
        : sortedActive;
      
      const filteredArchived = filterColor !== 'all'
        ? sortedArchived.filter(note => note.color === filterColor)
        : sortedArchived;

      const filteredBookmarked = filterColor !== 'all'
        ? sortedBookmarked.filter(note => note.color === filterColor)
        : sortedBookmarked;

      setNotes(filteredActive);
      setArchivedNotes(filteredArchived);
      setBookmarkedNotes(filteredBookmarked);
      
      // Calculate enhanced statistics
      calculateStats([...active, ...archived]);
    });

    return () => unsubscribe();
  }, [user, sortBy, filterColor]);

  const calculateStats = (notesData) => {
    const totalNotes = notesData.length;
    const archivedCount = notesData.filter(note => note.isArchived).length;
    const bookmarkedCount = notesData.filter(note => note.isBookmarked).length;
    
    // Color distribution
    const colorCount = notesData.reduce((acc, note) => {
      acc[note.color] = (acc[note.color] || 0) + 1;
      return acc;
    }, {});

    // Activity by day
    const activityByDay = notesData.reduce((acc, note) => {
      const date = note.updatedAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Weekly activity data
    const weeklyActivity = Object.entries(activityByDay)
      .slice(-7)
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        count
      }));

    // Category/Tag distribution
    const categoryDistribution = notesData.reduce((acc, note) => {
      const tags = note.content?.match(/#\w+/g) || [];
      tags.forEach(tag => {
        const category = acc.find(c => c.name === tag);
        if (category) {
          category.value++;
        } else {
          acc.push({ name: tag, value: 1 });
        }
      });
      return acc;
    }, []);

    // Attachment statistics
    const attachmentStats = notesData.reduce((acc, note) => {
      note.attachments?.forEach(attachment => {
        if (attachment.type.startsWith('image/')) acc.images++;
        else if (attachment.type.startsWith('audio/')) acc.audio++;
        else acc.files++;
      });
      return acc;
    }, { images: 0, audio: 0, files: 0 });

    // Priority distribution
    const priorityDistribution = notesData.reduce((acc, note) => {
      const priority = note.priority || 'normal';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    // Most active hours
    const mostActiveHours = notesData.reduce((acc, note) => {
      const hour = note.updatedAt?.toDate?.()?.getHours() || 0;
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    setStats({
      total: totalNotes,
      archived: archivedCount,
      bookmarked: bookmarkedCount,
      byColor: colorCount,
      recentlyUpdated: notesData.filter(note => !note.isArchived).slice(0, 5),
      averageLength: Math.round(notesData.reduce((acc, note) => acc + (note.content?.length || 0), 0) / (totalNotes || 1)),
      activityByDay,
      tags: categoryDistribution.map(c => c.name),
      categoryDistribution,
      weeklyActivity,
      attachmentStats,
      priorityDistribution: Object.entries(priorityDistribution).map(([name, value]) => ({ name, value })),
      mostActiveHours: Object.entries(mostActiveHours)
        .map(([hour, count]) => ({
          hour: `${hour}:00`,
          count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
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

  const handleFileUpload = async (files, noteId) => {
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const storageRef = ref(storage, `users/${user.uid}/notes/${noteId}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return {
          name: file.name,
          url: downloadURL,
          type: file.type,
          size: file.size,
          timestamp: new Date().toISOString(),
          path: storageRef.fullPath
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      return uploadedFiles;
    } catch (error) {
      console.error('Error uploading files:', error);
      return [];
    }
  };

  const handleDeleteFile = async (fileUrl, noteId) => {
    try {
      const note = notes.find(n => n.id === noteId) || archivedNotes.find(n => n.id === noteId);
      const attachment = note?.attachments?.find(a => a.url === fileUrl);
      
      if (attachment?.path) {
        const fileRef = ref(storage, attachment.path);
        await deleteObject(fileRef);
      }
      
      const noteRef = doc(db, 'notes', noteId);
      if (note) {
        const updatedAttachments = note.attachments.filter(a => a.url !== fileUrl);
        await updateDoc(noteRef, { attachments: updatedAttachments });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleAudioRecording = async (noteId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
        const file = new File([audioBlob], `recording-${Date.now()}.mp3`, { type: 'audio/mp3' });
        
        const uploadedFiles = await handleFileUpload([file], noteId);
        if (uploadedFiles.length > 0) {
          const noteRef = doc(db, 'notes', noteId);
          const note = notes.find(n => n.id === noteId) || archivedNotes.find(n => n.id === noteId);
          
          if (note) {
            const updatedAttachments = [...(note.attachments || []), ...uploadedFiles];
            await updateDoc(noteRef, { attachments: updatedAttachments });
          }
        }
      };

      return mediaRecorder;
    } catch (error) {
      console.error('Error starting audio recording:', error);
      return null;
    }
  };

  const handleUpdateNote = async (updatedNote) => {
    try {
      const noteRef = doc(db, 'notes', updatedNote.id);
      
      // Handle file attachments if present
      if (updatedNote.newFiles && updatedNote.newFiles.length > 0) {
        const uploadedFiles = await handleFileUpload(updatedNote.newFiles, updatedNote.id);
        updatedNote.attachments = [...(updatedNote.attachments || []), ...uploadedFiles];
        delete updatedNote.newFiles;
      }

      await updateDoc(noteRef, {
        ...updatedNote,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating note:', error);
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
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'notes'), newNote);
    } catch (error) {
      console.error('Error adding note:', error);
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
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleDuplicateNote = async (note) => {
    try {
      const duplicatedNote = {
        ...note,
        id: undefined,
        title: `${note.title} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      delete duplicatedNote.id;
      await addDoc(collection(db, 'notes'), duplicatedNote);
    } catch (error) {
      console.error('Error duplicating note:', error);
    }
  };

  const handleShareNote = async (note) => {
    try {
      // Create a shareable link or copy note content to clipboard
      const noteContent = `${note.title}\n\n${note.content}`;
      await navigator.clipboard.writeText(noteContent);
      alert('Note content copied to clipboard!');
    } catch (error) {
      console.error('Error sharing note:', error);
    }
  };

  const handleFlagNote = async (noteId, reason) => {
    try {
      const noteRef = doc(db, 'notes', noteId);
      await updateDoc(noteRef, {
        flags: arrayUnion({
          userId: user.uid,
          reason,
          timestamp: new Date().toISOString(),
        }),
      });
      toast.success('Note has been flagged for review');
    } catch (error) {
      console.error('Error flagging note:', error);
      toast.error('Failed to flag note');
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
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <AuthNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        {/* Analytics Toggle - Hide on mobile */}
        <div className="hidden lg:block mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              showAnalytics ? 'bg-primary text-white' : 'bg-white text-primary'
            } shadow-lg`}
          >
            <FiTrendingUp className="w-5 h-5" />
            <span>{showAnalytics ? 'Hide Analytics' : 'Show Analytics'}</span>
          </motion.button>
        </div>

        {/* Mobile Search */}
        <AnimatePresence>
          {showMobileSearch && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="lg:hidden mb-4"
            >
              <input
                type="text"
                placeholder="Search notes..."
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analytics Dashboard - Responsive Grid */}
        <AnimatePresence>
          {showAnalytics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 overflow-hidden"
            >
              {/* Weekly Activity Chart */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white p-4 lg:p-6 rounded-lg shadow-lg min-h-[300px]"
              >
                <h3 className="text-lg font-semibold mb-4">Weekly Activity</h3>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.weeklyActivity}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3A59D1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Category Distribution */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white p-4 lg:p-6 rounded-lg shadow-lg min-h-[300px]"
              >
                <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.categoryDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {stats.categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Attachment Statistics */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white p-4 lg:p-6 rounded-lg shadow-lg"
              >
                <h3 className="text-lg font-semibold mb-4">Attachments Overview</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{stats.attachmentStats.images}</p>
                    <p className="text-sm text-gray-600">Images</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-secondary">{stats.attachmentStats.audio}</p>
                    <p className="text-sm text-gray-600">Audio</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-accent">{stats.attachmentStats.files}</p>
                    <p className="text-sm text-gray-600">Files</p>
                  </div>
                </div>
              </motion.div>

              {/* Most Active Hours */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white p-4 lg:p-6 rounded-lg shadow-lg"
              >
                <h3 className="text-lg font-semibold mb-4">Most Active Hours</h3>
                <div className="space-y-3">
                  {stats.mostActiveHours.map(({ hour, count }) => (
                    <div key={hour} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-12">{hour}</span>
                      <div className="flex-grow bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all duration-300"
                          style={{
                            width: `${(count / Math.max(...stats.mostActiveHours.map(h => h.count))) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-16 text-right">{count} notes</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Statistics Section - Horizontal Scroll on Mobile */}
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

        {/* Add this style to your global CSS or in a style tag in your HTML */}
        <style>{`
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Controls Section - Simplified for Mobile */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 space-y-4 lg:space-y-0">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* View Toggle */}
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-gray-100'}`}
              >
                <FiGrid className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-100'}`}
              >
                <FiList className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Sort and Filter - Full Width on Mobile */}
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

        {/* Notes Grid/List - Responsive Layout */}
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6"
          : "space-y-4"
        }>
          <AnimatePresence>
            {(showArchived ? archivedNotes : showBookmarked ? bookmarkedNotes : notes).map((note, index) => (
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
                  onDuplicate={handleDuplicateNote}
                  onShare={handleShareNote}
                  onFileUpload={handleFileUpload}
                  onDeleteFile={handleDeleteFile}
                  onAudioRecord={handleAudioRecording}
                  onBookmark={handleBookmarkNote}
                  onFlag={handleFlagNote}
                  isListView={viewMode === 'list'}
                  index={index}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add Note Button - Adjusted for Mobile */}
        {!showArchived && !showBookmarked && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleAddNote}
            className="fixed bottom-20 lg:bottom-8 right-8 p-4 rounded-full bg-primary text-white shadow-lg z-10"
          >
            <FiPlus className="w-6 h-6" />
          </motion.button>
        )}

        {/* Mobile Navigation */}
        <MobileNav
          showArchived={showArchived}
          showBookmarked={showBookmarked}
          showAnalytics={showAnalytics}
          setShowArchived={setShowArchived}
          setShowBookmarked={setShowBookmarked}
          setShowAnalytics={setShowAnalytics}
          onSearchClick={() => setShowMobileSearch(!showMobileSearch)}
        />
      </div>
    </div>
  );
};

export default Dashboard; 