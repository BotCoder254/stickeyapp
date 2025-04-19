import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiUpload, FiX, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../LoadingSpinner';

const BackupRestore = () => {
  const [loading, setLoading] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleBackup = async () => {
    try {
      setLoading(true);
      const data = {};
      const collections = ['users', 'notes', 'activity_logs'];

      for (const collectionName of collections) {
        const querySnapshot = await getDocs(collection(db, collectionName));
        data[collectionName] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      // Create and download backup file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Backup created successfully');
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const batch = writeBatch(db);
          
          // Restore each collection
          for (const [collectionName, documents] of Object.entries(data)) {
            for (const document of documents) {
              const { id, ...docData } = document;
              const docRef = doc(db, collectionName, id);
              batch.set(docRef, docData);
            }
          }

          await batch.commit();
          toast.success('Data restored successfully');
          setShowRestoreModal(false);
          setSelectedFile(null);
        } catch (error) {
          console.error('Error restoring data:', error);
          toast.error('Failed to restore data');
        }
      };

      reader.readAsText(selectedFile);
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Failed to read backup file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Backup & Restore</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Backup Data</h2>
            <div className="p-2 rounded-full bg-primary/10">
              <FiDownload className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-gray-600 mb-6">
            Create a backup of all user data, notes, and activity logs.
          </p>
          <button
            onClick={handleBackup}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
          >
            {loading ? <LoadingSpinner /> : 'Create Backup'}
          </button>
        </motion.div>

        {/* Restore Card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Restore Data</h2>
            <div className="p-2 rounded-full bg-primary/10">
              <FiUpload className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-gray-600 mb-6">
            Restore data from a previous backup file.
          </p>
          <button
            onClick={() => setShowRestoreModal(true)}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
          >
            Restore from Backup
          </button>
        </motion.div>
      </div>

      {/* Restore Modal */}
      <AnimatePresence>
        {showRestoreModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Restore Data</h2>
                <button
                  onClick={() => setShowRestoreModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FiUpload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">JSON backup file</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".json"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                    />
                  </label>
                </div>
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected file: {selectedFile.name}
                  </p>
                )}
              </div>

              {selectedFile && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <div className="flex items-start">
                    <FiAlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Warning: This will overwrite existing data. Make sure you have a backup before proceeding.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowRestoreModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestore}
                  disabled={!selectedFile || loading}
                  className="px-4 py-2 text-white bg-primary rounded-md hover:bg-secondary disabled:opacity-50"
                >
                  {loading ? (
                    <LoadingSpinner />
                  ) : (
                    <span className="flex items-center">
                      <FiCheck className="w-4 h-4 mr-2" />
                      Restore
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BackupRestore; 