import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiFilter, FiClock, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const ACTIVITY_TYPES = {
  NOTE_CREATED: 'Created note',
  NOTE_UPDATED: 'Updated note',
  NOTE_DELETED: 'Deleted note',
  NOTE_ARCHIVED: 'Archived note',
  NOTE_RESTORED: 'Restored note',
  FILE_UPLOADED: 'Uploaded file',
  FILE_DELETED: 'Deleted file',
  RECORDING_ADDED: 'Added recording',
  RECORDING_DELETED: 'Deleted recording'
};

const ActivityLog = ({ userId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      let activityQuery = query(
        collection(db, 'activities'),
        where('userId', '==', userId),
        orderBy('timestamp', sortOrder),
        limit(100)
      );

      if (filter !== 'all') {
        activityQuery = query(
          collection(db, 'activities'),
          where('userId', '==', userId),
          where('type', '==', filter),
          orderBy('timestamp', sortOrder),
          limit(100)
        );
      }

      const snapshot = await getDocs(activityQuery);
      const activityData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setActivities(activityData);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activity log. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [userId, filter, sortOrder]);

  const getActivityDescription = (activity) => {
    const description = ACTIVITY_TYPES[activity.type] || 'Performed action';
    return `${description} "${activity.details?.title || 'Untitled'}"`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 m-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Activity Log</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            <FiClock className="w-4 h-4" />
            {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </button>
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <FiFilter className="w-4 h-4" />
              Filter
              {showFilters ? (
                <FiChevronUp className="w-4 h-4" />
              ) : (
                <FiChevronDown className="w-4 h-4" />
              )}
            </button>
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10"
                >
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setFilter('all');
                        setShowFilters(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        filter === 'all'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      All Activities
                    </button>
                    {Object.entries(ACTIVITY_TYPES).map(([type, label]) => (
                      <button
                        key={type}
                        onClick={() => {
                          setFilter(type);
                          setShowFilters(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          filter === type
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-center py-4">{error}</div>
      )}

      {!loading && !error && activities.length === 0 && (
        <div className="text-gray-500 text-center py-4">
          No activities found
        </div>
      )}

      <div className="space-y-2">
        {activities.map((activity) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 bg-gray-50 rounded-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-800">
                  {getActivityDescription(activity)}
                </p>
                <p className="text-sm text-gray-500">
                  {formatTimestamp(activity.timestamp)}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLog; 
