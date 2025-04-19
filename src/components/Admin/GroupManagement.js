import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FiUsers, FiPlus, FiTrash2, FiEdit2, FiSearch, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../LoadingSpinner';

const GroupManagement = () => {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchGroups();
    fetchUsers();
  }, []);

  const fetchGroups = async () => {
    try {
      const groupsRef = collection(db, 'groups');
      const snapshot = await getDocs(groupsRef);
      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGroups(groupsData);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const handleCreateGroup = async () => {
    try {
      if (!groupName.trim()) {
        toast.error('Please enter a group name');
        return;
      }

      const groupData = {
        name: groupName,
        members: selectedUsers,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (selectedGroup) {
        // Update existing group
        await updateDoc(doc(db, 'groups', selectedGroup.id), groupData);
        toast.success('Group updated successfully');
      } else {
        // Create new group
        await addDoc(collection(db, 'groups'), groupData);
        toast.success('Group created successfully');
      }

      setShowModal(false);
      setGroupName('');
      setSelectedUsers([]);
      setSelectedGroup(null);
      fetchGroups();
    } catch (error) {
      console.error('Error managing group:', error);
      toast.error('Failed to manage group');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      try {
        await deleteDoc(doc(db, 'groups', groupId));
        toast.success('Group deleted successfully');
        fetchGroups();
      } catch (error) {
        console.error('Error deleting group:', error);
        toast.error('Failed to delete group');
      }
    }
  };

  const handleEditGroup = (group) => {
    setSelectedGroup(group);
    setGroupName(group.name);
    setSelectedUsers(group.members || []);
    setShowModal(true);
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Group Management</h1>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
        >
          <FiPlus className="w-5 h-5 mr-2" />
          Create Group
        </motion.button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12">
          <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Groups Created</h3>
          <p className="text-gray-500">Create your first group to start organizing users.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map(group => (
            <motion.div
              key={group.id}
              layout
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">{group.name}</h3>
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEditGroup(group)}
                    className="p-2 text-gray-600 hover:text-primary rounded-full hover:bg-gray-100"
                  >
                    <FiEdit2 className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDeleteGroup(group.id)}
                    className="p-2 text-red-600 hover:text-red-700 rounded-full hover:bg-red-50"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-500">
                  {group.members?.length || 0} members
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.members?.map((member, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                    >
                      {member}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Group Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-6">
                {selectedGroup ? 'Edit Group' : 'Create New Group'}
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                    placeholder="Enter group name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Members
                  </label>
                  <div className="relative mb-4">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                      placeholder="Search users..."
                    />
                  </div>

                  <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                    {filteredUsers.map(user => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                            {user.displayName?.[0] || user.email[0].toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {user.displayName || user.email}
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.email)}
                            onChange={() => {
                              setSelectedUsers(prev =>
                                prev.includes(user.email)
                                  ? prev.filter(email => email !== user.email)
                                  : [...prev, user.email]
                              );
                            }}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-secondary"
                >
                  {selectedGroup ? 'Update Group' : 'Create Group'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupManagement; 

