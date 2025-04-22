import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiClock, FiSearch, FiFilter, FiLock } from 'react-icons/fi';
import { lockVersionHistory } from '../../utils/versionHistory';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../LoadingSpinner';

const VersionHistoryManagement = () => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchVersions();
  }, []);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const notesRef = collection(db, 'notes');
      const notesSnapshot = await getDocs(notesRef);
      const notesData = notesSnapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = doc.data();
        return acc;
      }, {});

      const versionsRef = collection(db, 'note_versions');
      const versionsSnapshot = await getDocs(versionsRef);
      
      const allVersions = versionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        noteTitle: notesData[doc.data().noteId]?.title || 'Untitled Note',
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));

      // Sort versions by timestamp on the client side
      allVersions.sort((a, b) => b.timestamp - a.timestamp);
      
      setVersions(allVersions);
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast.error('Failed to fetch version history');
    } finally {
      setLoading(false);
    }
  };

  const handleLockHistory = async (noteId) => {
    if (window.confirm('Are you sure you want to lock this note\'s version history?')) {
      try {
        await lockVersionHistory(noteId);
        toast.success('Version history locked successfully');
        fetchVersions();
      } catch (error) {
        toast.error('Failed to lock version history');
      }
    }
  };

  const filteredVersions = versions.filter(version => {
    const matchesSearch = 
      (version.noteTitle?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (version.userId?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesUser = !selectedUser || version.userId === selectedUser;
    
    const matchesDate = (!dateRange.start || new Date(version.timestamp) >= new Date(dateRange.start)) &&
      (!dateRange.end || new Date(version.timestamp) <= new Date(dateRange.end));
    
    return matchesSearch && matchesUser && matchesDate;
  });

  const uniqueUsers = [...new Set(versions.map(v => v.userId))];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Version History Management</h1>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by note title or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          />
        </div>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
        >
          <option value="">All Users</option>
          {uniqueUsers.map(user => (
            <option key={user} value={user}>{user}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
        />
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Note Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVersions.map((version) => (
                  <motion.tr
                    key={`${version.noteId}-${version.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{version.noteTitle}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{version.userId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {version.timestamp.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleLockHistory(version.noteId)}
                        className="flex items-center px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        <FiLock className="w-4 h-4 mr-1" />
                        Lock History
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionHistoryManagement; 