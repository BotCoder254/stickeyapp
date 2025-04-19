import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiClock, FiUser } from 'react-icons/fi';

const SharedNote = () => {
  const { shareId } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSharedNote = async () => {
      try {
        const notesRef = collection(db, 'notes');
        const q = query(notesRef, where('shareId', '==', shareId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setError('Note not found or sharing has been disabled.');
          setLoading(false);
          return;
        }

        const noteData = {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data()
        };

        setNote(noteData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching shared note:', error);
        setError('Failed to load the shared note. Please try again later.');
        setLoading(false);
      }
    };

    fetchSharedNote();
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Oops!</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-white rounded-lg shadow-lg overflow-hidden`}
        >
          {/* Note Header */}
          <div className="border-b border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900">{note.title}</h1>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <FiUser className="mr-2" />
              <span>Shared by {note.userEmail}</span>
              <FiClock className="ml-4 mr-2" />
              <span>
                {new Date(note.sharedAt?.toDate()).toLocaleDateString()} at{' '}
                {new Date(note.sharedAt?.toDate()).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Note Content */}
          <div className="p-6">
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{note.content}</p>
            </div>

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {note.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Attachments */}
            {note.attachments && note.attachments.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Attachments
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {note.attachments.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      {attachment.type.startsWith('image/') ? (
                        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-100">
                          <img
                            src={attachment.url}
                            alt={attachment.name}
                            className="object-cover group-hover:opacity-75"
                          />
                        </div>
                      ) : (
                        <div className="aspect-w-1 aspect-h-1 w-full flex items-center justify-center rounded-lg bg-gray-100 group-hover:bg-gray-200">
                          <span className="text-sm text-gray-600">
                            {attachment.name}
                          </span>
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SharedNote; 