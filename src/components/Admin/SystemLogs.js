import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, limit, startAfter, getDocs, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiClock, FiRefreshCw } from 'react-icons/fi';
import LoadingSpinner from '../LoadingSpinner';

const LOGS_PER_PAGE = 20;

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterType, setFilterType] = useState('all');
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchLogs = async (isInitial = false) => {
    try {
      setLoading(true);
      let q = query(
        collection(db, 'system_logs'),
        orderBy(sortField, sortDirection),
        limit(LOGS_PER_PAGE)
      );

      if (!isInitial && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      if (filterType !== 'all') {
        q = query(q, where('eventType', '==', filterType));
      }

      const snapshot = await getDocs(q);
      const newLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setHasMore(newLogs.length === LOGS_PER_PAGE);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

      if (isInitial) {
        setLogs(newLogs);
      } else {
        setLogs(prev => [...prev, ...newLogs]);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(true);
  }, [sortField, sortDirection, filterType]);

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      log.eventType.toLowerCase().includes(searchLower) ||
      log.userId.toLowerCase().includes(searchLower) ||
      log.description.toLowerCase().includes(searchLower)
    );
  });

  const getEventTypeColor = (eventType) => {
    switch (eventType.toLowerCase()) {
      case 'login':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'admin_action':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
        <button
          onClick={() => fetchLogs(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <FiRefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Search and Filter Bar */}
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="all">All Events</option>
              <option value="login">Login Events</option>
              <option value="error">Errors</option>
              <option value="warning">Warnings</option>
              <option value="admin_action">Admin Actions</option>
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('timestamp')}
                >
                  <div className="flex items-center gap-2">
                    Timestamp
                    {sortField === 'timestamp' && (
                      sortDirection === 'desc' ? <FiChevronDown /> : <FiChevronUp />
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('eventType')}
                >
                  <div className="flex items-center gap-2">
                    Event Type
                    {sortField === 'eventType' && (
                      sortDirection === 'desc' ? <FiChevronDown /> : <FiChevronUp />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.timestamp?.toDate()).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEventTypeColor(log.eventType)}`}>
                        {log.eventType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {log.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.userId}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Load More Button */}
        {hasMore && !loading && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => fetchLogs(false)}
              className="w-full py-2 text-sm text-primary hover:text-secondary"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemLogs; 