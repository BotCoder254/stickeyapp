import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiUser, FiCheck, FiX, FiLock, FiRotateCcw } from 'react-icons/fi';
import { getVersionHistory, restoreVersion, lockVersionHistory } from '../../utils/versionHistory';
import { useAuth } from '../../hooks/useAuth';
import { useRole } from '../../hooks/useRole';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../LoadingSpinner';
import { format } from 'date-fns';

const VersionHistory = ({ noteId, isOpen, onClose, onVersionRestore }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (isOpen && noteId) {
      fetchVersions();
    }
  }, [isOpen, noteId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const versionHistory = await getVersionHistory(noteId);
      setVersions(versionHistory);
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId) => {
    try {
      setRestoring(true);
      const restoredVersion = await restoreVersion(noteId, versionId);
      if (onVersionRestore) {
        onVersionRestore(restoredVersion);
      }
      toast.success('Version restored successfully');
      onClose();
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error('Failed to restore version');
    } finally {
      setRestoring(false);
    }
  };

  const handleLock = async () => {
    if (window.confirm('Are you sure you want to lock the version history? This cannot be undone.')) {
      try {
        await lockVersionHistory(noteId);
        toast.success('Version history locked successfully');
        onClose();
      } catch (error) {
        toast.error('Failed to lock version history');
      }
    }
  };

  const formatContent = (content) => {
    if (!content) return '';
    
    // If content is already a string, try to parse it
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        // If parsed successfully, return the content property or stringify the whole object
        return typeof parsed.content === 'string' ? parsed.content : JSON.stringify(parsed, null, 2);
      } catch (e) {
        // If parsing fails, return the original string
        return content;
      }
    }
    
    // If content is an object, return its content property or stringify it
    if (typeof content === 'object') {
      return content.content || JSON.stringify(content, null, 2);
    }
    
    return String(content);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col relative"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Version History</h2>
          <div className="flex items-center space-x-2">
            {isAdmin && (
              <button
                onClick={handleLock}
                className="flex items-center px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                <FiLock className="w-4 h-4 mr-1" />
                Lock History
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : versions.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            No version history available
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {versions.map((version) => (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border ${
                    selectedVersion?.id === version.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <FiClock className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {format(version.timestamp, 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedVersion(version)}
                        className="text-sm text-primary hover:text-secondary"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleRestore(version.id)}
                        disabled={restoring}
                        className="flex items-center px-2 py-1 text-sm text-white bg-primary rounded hover:bg-secondary disabled:opacity-50"
                      >
                        <FiRotateCcw className="w-4 h-4 mr-1" />
                        Restore
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <FiUser className="mr-2" />
                    <span>{version.userId || 'Unknown User'}</span>
                  </div>
                  {selectedVersion?.id === version.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {formatContent(version.content)}
                      </pre>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VersionHistory; 

