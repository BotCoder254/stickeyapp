import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiRefreshCw, FiSearch } from 'react-icons/fi';
import LoadingSpinner from '../LoadingSpinner';

const EVENT_TYPE_COLORS = {
  login: 'bg-blue-100 text-blue-800',
  logout: 'bg-gray-100 text-gray-800',
  error: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  admin_action: 'bg-purple-100 text-purple-800',
  user_action: 'bg-green-100 text-green-800',
  system: 'bg-indigo-100 text-indigo-800'
};

const ITEMS_PER_PAGE = 20;

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [refreshKey]);

  const fetchLogs = async (startAfterDoc = null) => {
    try {
      setLoading(true);
      let q = query(
        collection(db, 'system_logs'),
        orderBy('timestamp', 'desc'),
        limit(ITEMS_PER_PAGE)
      );

      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }

      const querySnapshot = await getDocs(q);
      const newLogs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));

      setLogs(prevLogs => startAfterDoc ? [...prevLogs, ...newLogs] : newLogs);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === ITEMS_PER_PAGE);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (lastVisible) {
      fetchLogs(lastVisible);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      Object.values(log).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesType = selectedType === 'all' || log.eventType === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
        <button
          onClick={handleRefresh}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <FiRefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Events</option>
          {Object.keys(EVENT_TYPE_COLORS).map(type => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.timestamp?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${EVENT_TYPE_COLORS[log.eventType]}`}>
                      {log.eventType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.userId || 'System'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center my-4">
          <LoadingSpinner />
        </div>
      )}

      {!loading && hasMore && (
        <div className="flex justify-center mt-4">
          <button
            onClick={handleLoadMore}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Load More
          </button>
        </div>
      )}

      {!loading && filteredLogs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No logs found matching your criteria
        </div>
      )}
    </div>
  );
}