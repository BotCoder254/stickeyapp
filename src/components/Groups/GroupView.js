import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { FiUsers, FiGrid, FiList } from 'react-icons/fi';
import LoadingSpinner from '../LoadingSpinner';
import StickyNote from '../Notes/StickyNote';

const GroupView = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupNotes, setGroupNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    if (user) {
      fetchUserGroups();
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupNotes();
    }
  }, [selectedGroup]);

  const fetchUserGroups = async () => {
    try {
      const groupsRef = collection(db, 'groups');
      const q = query(groupsRef, where('members', 'array-contains', user.email));
      const snapshot = await getDocs(q);
      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGroups(groupsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setLoading(false);
    }
  };

  const fetchGroupNotes = async () => {
    try {
      setLoading(true);
      const notesRef = collection(db, 'notes');
      const q = query(notesRef, where('groupId', '==', selectedGroup.id));
      const snapshot = await getDocs(q);
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGroupNotes(notesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching group notes:', error);
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Groups</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${
              viewMode === 'grid'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FiGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${
              viewMode === 'list'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FiList className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12">
          <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Groups Found</h3>
          <p className="text-gray-500">You are not a member of any groups yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Groups List */}
          <div className="flex overflow-x-auto pb-4 space-x-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedGroup(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg ${
                !selectedGroup
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              All Notes
            </motion.button>
            {groups.map(group => (
              <motion.button
                key={group.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedGroup(group)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg ${
                  selectedGroup?.id === group.id
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                {group.name}
              </motion.button>
            ))}
          </div>

          {/* Notes Grid/List */}
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`grid gap-6 ${
                viewMode === 'grid'
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1'
              }`}
            >
              {(selectedGroup ? groupNotes : []).map((note, index) => (
                <StickyNote
                  key={note.id}
                  note={note}
                  isListView={viewMode === 'list'}
                  index={index}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default GroupView; 