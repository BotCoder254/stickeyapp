import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiFlag, FiTrash2, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../LoadingSpinner';

const ContentModeration = () => {
  const [flaggedNotes, setFlaggedNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchFlaggedNotes();
  }, []);

  const fetchFlaggedNotes = async () => {
    try {
      setLoading(true);
      const notesRef = collection(db, 'notes');
      const snapshot = await getDocs(notesRef);
      const notes = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(note => note.flags && note.flags.length > 0);

      setFlaggedNotes(notes);
    } catch (error) {
      console.error('Error fetching flagged notes:', error);
      toast.error('Failed to fetch flagged notes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'notes', noteId));
        setFlaggedNotes(prev => prev.filter(note => note.id !== noteId));
        toast.success('Note deleted successfully');
        setShowModal(false);
      } catch (error) {
        console.error('Error deleting note:', error);
        toast.error('Failed to delete note');
      }
    }
  };

  const handleRestoreNote = async (noteId) => {
    try {
      const noteRef = doc(db, 'notes', noteId);
      await updateDoc(noteRef, {
        flags: [],
        flagReasons: [],
        reviewed: true,
        reviewedAt: new Date(),
        reviewedBy: 'admin' // You might want to pass the actual admin ID here
      });
      setFlaggedNotes(prev => prev.filter(note => note.id !== noteId));
      toast.success('Note restored successfully');
      setShowModal(false);
    } catch (error) {
      console.error('Error restoring note:', error);
      toast.error('Failed to restore note');
    }
  };

  const getFlagColor = (reason) => {
    switch (reason.toLowerCase()) {
      case 'spam':
        return 'bg-yellow-100 text-yellow-800';
      case 'inappropriate':
        return 'bg-red-100 text-red-800';
      case 'offensive':
        return 'bg-purple-100 text-purple-800';
      case 'violence':
        return 'bg-orange-100 text-orange-800';
      case 'harassment':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content Moderation</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {flaggedNotes.length} flagged {flaggedNotes.length === 1 ? 'note' : 'notes'}
          </span>
          <button
            onClick={fetchFlaggedNotes}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : flaggedNotes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <FiFlag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Flagged Content</h3>
          <p className="text-gray-500">There are no notes that have been flagged for review.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {flaggedNotes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {note.title || 'Untitled Note'}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {note.flags.length} {note.flags.length === 1 ? 'flag' : 'flags'}
                  </span>
                </div>
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {note.content}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {note.flagReasons?.map((reason, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getFlagColor(reason)}`}
                    >
                      {reason}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{note.userEmail}</span>
                  <span>{note.lastFlaggedAt?.toDate().toLocaleDateString()}</span>
                </div>
              </div>
              <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex justify-end space-x-3">
                <button
                  onClick={() => handleRestoreNote(note.id)}
                  className="px-3 py-1 text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Restore
                </button>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentModeration; 