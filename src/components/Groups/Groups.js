import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { FiUsers, FiPlus, FiX, FiUserPlus, FiUserMinus } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../LoadingSpinner';

const Groups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const groupsRef = collection(db, 'groups');
      const q = query(groupsRef, where('members', 'array-contains', user.email));
      const snapshot = await getDocs(q);
      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGroups(groupsData);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      setLoading(true);
      const groupData = {
        name: newGroupName.trim(),
        description: newGroupDescription.trim(),
        createdBy: user.email,
        createdAt: new Date(),
        members: [user.email],
        roles: {
          [user.email]: 'owner'
        }
      };

      await addDoc(collection(db, 'groups'), groupData);
      toast.success('Group created successfully');
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDescription('');
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) {
      toast.error('Member email is required');
      return;
    }

    try {
      setLoading(true);
      const groupRef = doc(db, 'groups', selectedGroup.id);
      await updateDoc(groupRef, {
        members: arrayUnion(newMemberEmail.trim()),
        roles: {
          ...selectedGroup.roles,
          [newMemberEmail.trim()]: 'member'
        }
      });
      toast.success('Member added successfully');
      setShowAddMemberModal(false);
      setNewMemberEmail('');
      fetchGroups();
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (groupId, memberEmail) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        setLoading(true);
        const groupRef = doc(db, 'groups', groupId);
        await updateDoc(groupRef, {
          members: arrayRemove(memberEmail)
        });
        toast.success('Member removed successfully');
        fetchGroups();
      } catch (error) {
        console.error('Error removing member:', error);
        toast.error('Failed to remove member');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Groups</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary transition-colors"
        >
          <FiPlus className="w-5 h-5 mr-2" />
          Create Group
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12">
          <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Groups Found</h3>
          <p className="text-gray-500">Create a group to start collaborating.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{group.name}</h3>
                <p className="text-gray-600 mb-4">{group.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {group.members.map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center px-2 py-1 bg-gray-100 rounded-full"
                    >
                      <span className="text-xs text-gray-600">{member}</span>
                      {group.roles[user.email] === 'owner' && member !== user.email && (
                        <button
                          onClick={() => handleRemoveMember(group.id, member)}
                          className="ml-2 text-gray-400 hover:text-red-500"
                        >
                          <FiUserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {group.roles[user.email] === 'owner' && (
                  <button
                    onClick={() => {
                      setSelectedGroup(group);
                      setShowAddMemberModal(true);
                    }}
                    className="flex items-center text-sm text-primary hover:text-secondary"
                  >
                    <FiUserPlus className="w-4 h-4 mr-1" />
                    Add Member
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateModal && (
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
                <h2 className="text-xl font-bold text-gray-900">Create New Group</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateGroup}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newGroupDescription}
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      rows="3"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-white bg-primary rounded-md hover:bg-secondary disabled:opacity-50"
                  >
                    {loading ? <LoadingSpinner /> : 'Create Group'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMemberModal && (
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
                <h2 className="text-xl font-bold text-gray-900">Add Member</h2>
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddMember}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-white bg-primary rounded-md hover:bg-secondary disabled:opacity-50"
                  >
                    {loading ? <LoadingSpinner /> : 'Add Member'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Groups; 
