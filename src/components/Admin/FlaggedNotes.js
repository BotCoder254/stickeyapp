import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, arrayRemove, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiTrash2 } from 'react-icons/fi';
import { db } from '../../config/firebase';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../LoadingSpinner';

const FlaggedNotes = () => {
  const [flaggedNotes, setFlaggedNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'notes'),
      where('flags', '!=', [])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(note => note.flags && note.flags.length > 0);
      
      setFlaggedNotes(notes);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching flagged notes:', error);
      toast.error('Failed to fetch flagged notes');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDismissFlag = async (noteId, flag) => {
    try {
      const noteRef = doc(db, 'notes', noteId);
      await updateDoc(noteRef, {
        flags: arrayRemove(flag)
      });
      toast.success('Flag dismissed successfully');
    } catch (error) {
      console.error('Error dismissing flag:', error);
      toast.error('Failed to dismiss flag');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'notes', noteId));
        toast.success('Note deleted successfully');
      } catch (error) {
        console.error('Error deleting note:', error);
        toast.error('Failed to delete note');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Flagged Notes</h1>
      
      {flaggedNotes.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          No flagged notes found
        </div>
      ) : (
        <AnimatePresence>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flaggedNotes.map(note => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-2">{note.title}</h2>
                  <p className="text-gray-600 line-clamp-3">{note.content}</p>
                </div>

                <div className="space-y-4">
                  {note.flags.map((flag, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between bg-red-50 p-3 rounded-md"
                    >
                      <div>
                        <p className="text-red-600 font-medium">{flag.reason}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(flag.timestamp).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Reported by: {flag.reportedBy}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDismissFlag(note.id, flag)}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <FiX size={20} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    <FiTrash2 />
                    Delete Note
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default FlaggedNotes; 
