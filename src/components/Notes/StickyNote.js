import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit2, FiTrash2, FiMoreVertical, FiCheck, FiX, FiStar, FiLock, FiBookmark, 
  FiArchive, FiCalendar, FiClock, FiAlertCircle, FiPaperclip, FiUpload, FiMic, 
  FiPlay, FiPause, FiDownload, FiFile, FiFlag, FiUsers, FiCopy, FiShare2, FiHash } from 'react-icons/fi';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../LoadingSpinner';

const colorClasses = {
  yellow: 'bg-yellow-200',
  blue: 'bg-blue-200',
  green: 'bg-green-200',
  pink: 'bg-pink-200',
  purple: 'bg-purple-200',
  orange: 'bg-orange-200',
  red: 'bg-red-200',
  indigo: 'bg-indigo-200',
  teal: 'bg-teal-200',
  lime: 'bg-lime-200'
};

const fontFamilies = {
  sans: 'font-sans',
  serif: 'font-serif',
  mono: 'font-mono',
  cursive: 'font-["Segoe Script"]',
  handwritten: 'font-["Comic Sans MS"]'
};

const fontSizes = {
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
};

const AudioWaveform = ({ isRecording }) => {
  return (
    <div className="flex items-center gap-1 h-8">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-red-500 rounded-full"
          animate={{
            height: isRecording ? [8, 24, 8] : 8
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
            delay: i * 0.1
          }}
        />
      ))}
    </div>
  );
};

const StickyNote = ({ note, onUpdate, onDelete, onArchive, onDuplicate, onShare, onFileUpload, onDeleteFile, onAudioRecord, onBookmark, onFlag, isListView = false, index }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [color, setColor] = useState(note.color || 'yellow');
  const [tags, setTags] = useState([]);
  const [charCount, setCharCount] = useState(0);
  const [isPinned, setIsPinned] = useState(note.isPinned || false);
  const [isLocked, setIsLocked] = useState(note.isLocked || false);
  const [priority, setPriority] = useState(note.priority || 'normal');
  const [dueDate, setDueDate] = useState(note.dueDate || '');
  const [images, setImages] = useState(note.images || []);
  const [isArchived, setIsArchived] = useState(note.isArchived || false);
  const [isBookmarked, setIsBookmarked] = useState(note.isBookmarked || false);
  const [labels, setLabels] = useState(note.labels || []);
  const [reminder, setReminder] = useState(note.reminder || null);
  const [fontFamily, setFontFamily] = useState(note.fontFamily || 'sans');
  const [fontSize, setFontSize] = useState(note.fontSize || 'base');
  const [isBold, setIsBold] = useState(note.isBold || false);
  const [isItalic, setIsItalic] = useState(note.isItalic || false);
  const fileInputRef = useRef(null);
  const settingsRef = useRef(null);
  const menuTimeoutRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState({});
  const mediaRecorderRef = useRef(null);
  const audioPlayersRef = useRef({});
  const timerRef = useRef(null);
  const dropZoneRef = useRef(null);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(note.groupId || '');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const extractedTags = content.match(/#\w+/g) || [];
    setTags(extractedTags);
    setCharCount(content.length);
  }, [content]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        closeSettingsMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (menuTimeoutRef.current) {
        clearTimeout(menuTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordingTime(0);
    }

    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  useEffect(() => {
    fetchUserGroups();
  }, [user]);

  useEffect(() => {
    if (note.groupId) {
      fetchCurrentGroup();
    }
  }, [note.groupId]);

  const fetchUserGroups = async () => {
    try {
      setLoading(true);
      const groupsRef = collection(db, 'groups');
      const q = query(groupsRef, where('members', 'array-contains', user.email));
      const snapshot = await getDocs(q);
      const groups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUserGroups(groups);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentGroup = async () => {
    try {
      if (!note.groupId) return;
      const groupRef = doc(db, 'groups', note.groupId);
      const groupSnap = await getDoc(groupRef);
      if (groupSnap.exists()) {
        setCurrentGroup(groupSnap.data());
      }
    } catch (error) {
      console.error('Error fetching group:', error);
    }
  };

  const handleAddToGroup = async (groupId) => {
    try {
      if (note.groupId) {
        toast.error('Note is already in a group. Remove it first.');
        return;
      }

      const noteRef = doc(db, 'notes', note.id);
      await updateDoc(noteRef, {
        groupId: groupId,
        lastModified: serverTimestamp()
      });
      toast.success('Added to group successfully');
      setShowGroupModal(false);
      if (onUpdate) {
        onUpdate({ ...note, groupId });
      }
    } catch (error) {
      console.error('Error adding to group:', error);
      toast.error('Failed to add to group');
    }
  };

  const handleRemoveFromGroup = async () => {
    try {
      const noteRef = doc(db, 'notes', note.id);
      await updateDoc(noteRef, {
        groupId: null,
        lastModified: serverTimestamp()
      });
      
      // Update local state
      setSelectedGroup('');
      setCurrentGroup(null);
      setShowGroupModal(false);
      
      // Show success message
      toast.success('Removed from group');
      
      // Update parent component
      if (onUpdate) {
        onUpdate({
          ...note,
          groupId: null
        });
      }
    } catch (error) {
      console.error('Error removing from group:', error);
      toast.error('Failed to remove from group');
    }
  };

  const openSettingsMenu = () => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
    }
    setShowSettings(true);
  };

  const closeSettingsMenu = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setShowSettings(false);
    }, 150);
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const handleSave = () => {
    onUpdate({
      ...note,
      title,
      content,
      color,
      isPinned,
      isLocked,
      priority,
      dueDate,
      images,
      isArchived,
      isBookmarked,
      labels,
      reminder,
      fontFamily,
      fontSize,
      isBold,
      isItalic,
      updatedAt: new Date(),
      order: index
    });
    setIsEditing(false);
    setShowSettings(false);
  };

  const handleCancel = () => {
    setTitle(note.title);
    setContent(note.content);
    setColor(note.color || 'yellow');
    setIsPinned(note.isPinned || false);
    setIsLocked(note.isLocked || false);
    setPriority(note.priority || 'normal');
    setDueDate(note.dueDate || '');
    setImages(note.images || []);
    setIsArchived(note.isArchived || false);
    setIsBookmarked(note.isBookmarked || false);
    setLabels(note.labels || []);
    setReminder(note.reminder || null);
    setFontFamily(note.fontFamily || 'sans');
    setFontSize(note.fontSize || 'base');
    setIsBold(note.isBold || false);
    setIsItalic(note.isItalic || false);
    setIsEditing(false);
    setShowSettings(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const promises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(newImages => {
      setImages([...images, ...newImages]);
    });
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleArchive = () => {
    setShowSettings(false);
    onArchive(note);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.add('border-primary');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('border-primary');
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('border-primary');

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const uploadedFiles = await onFileUpload(files, note.id);
      if (uploadedFiles.length > 0) {
        onUpdate({
          ...note,
          attachments: [...(note.attachments || []), ...uploadedFiles]
        });
      }
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const uploadedFiles = await onFileUpload(files, note.id);
      if (uploadedFiles.length > 0) {
        onUpdate({
          ...note,
          attachments: [...(note.attachments || []), ...uploadedFiles]
        });
      }
    }
  };

  const startRecording = async () => {
    const mediaRecorder = await onAudioRecord(note.id);
    if (mediaRecorder) {
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleAudioPlayback = (audioUrl) => {
    if (!audioPlayersRef.current[audioUrl]) {
      const audio = new Audio(audioUrl);
      audioPlayersRef.current[audioUrl] = audio;
      audio.addEventListener('ended', () => {
        setIsPlaying(prev => ({ ...prev, [audioUrl]: false }));
      });
    }

    const audio = audioPlayersRef.current[audioUrl];
    if (isPlaying[audioUrl]) {
      audio.pause();
      setIsPlaying(prev => ({ ...prev, [audioUrl]: false }));
    } else {
      audio.play();
      setIsPlaying(prev => ({ ...prev, [audioUrl]: true }));
    }
  };

  const handleBookmark = () => {
    setShowSettings(false);
    onBookmark(note);
  };

  const handleFlag = () => {
    if (!flagReason) {
      toast.error('Please select a reason for flagging this note');
      return;
    }
    onFlag(note.id, flagReason);
    setShowFlagModal(false);
    setFlagReason('');
    setShowSettings(false);
    toast.success('Note has been flagged for review');
  };

  const SettingsMenu = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3;
    const totalPages = 4;

    const renderSettingsPage = () => {
      switch (currentPage) {
        case 1:
          return (
            <>
              {/* Text Styling */}
              <div className="space-y-3">
                <span className="text-sm font-medium block">Text Style</span>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                  >
                    <option value="sans">Sans-serif</option>
                    <option value="serif">Serif</option>
                    <option value="mono">Monospace</option>
                    <option value="cursive">Cursive</option>
                    <option value="handwritten">Handwritten</option>
                  </select>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                  >
                    <option value="sm">Small</option>
                    <option value="base">Normal</option>
                    <option value="lg">Large</option>
                    <option value="xl">Extra Large</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsBold(!isBold)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      isBold ? 'bg-primary/10 text-primary' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    Bold
                  </button>
                  <button
                    onClick={() => setIsItalic(!isItalic)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      isItalic ? 'bg-primary/10 text-primary' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    Italic
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t border-gray-100 pt-3">
                <div className="flex flex-wrap gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsPinned(!isPinned)}
                    className={`p-2 rounded-lg flex items-center gap-2 ${
                      isPinned ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'
                    }`}
                  >
                    <FiStar className="w-4 h-4" />
                    <span className="text-sm">Pin</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className={`p-2 rounded-lg flex items-center gap-2 ${
                      isBookmarked ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'
                    }`}
                  >
                    <FiBookmark className="w-4 h-4" />
                    <span className="text-sm">Bookmark</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsLocked(!isLocked)}
                    className={`p-2 rounded-lg flex items-center gap-2 ${
                      isLocked ? 'bg-gray-100 text-gray-600' : 'hover:bg-gray-100'
                    }`}
                  >
                    <FiLock className="w-4 h-4" />
                    <span className="text-sm">Lock</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowFlagModal(true)}
                    className="p-2 rounded-lg flex items-center gap-2 text-red-600 hover:bg-red-50"
                  >
                    <FiFlag className="w-4 h-4" />
                    <span className="text-sm">Flag</span>
                  </motion.button>
                </div>
              </div>
            </>
          );
        case 2:
          return (
            <>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Priority</span>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Due Date</span>
                    <input
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                    />
                  </div>
                </div>

                {/* Colors */}
                <div className="border-t border-gray-100 pt-3">
                  <span className="text-sm font-medium block mb-2">Color</span>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.keys(colorClasses).map((colorOption) => (
                      <motion.button
                        key={colorOption}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setColor(colorOption)}
                        className={`w-8 h-8 rounded-lg ${colorClasses[colorOption]} ${
                          color === colorOption ? 'ring-2 ring-gray-600' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          );
        case 3:
          return (
            <>
              {/* Labels */}
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium block mb-2">Labels</span>
                  <div className="flex flex-wrap gap-2">
                    {labels.map((label, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 rounded-lg text-sm flex items-center gap-1"
                      >
                        {label}
                        <button
                          onClick={() => setLabels(labels.filter((_, i) => i !== index))}
                          className="hover:text-red-500"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={() => {
                        const label = prompt('Enter new label:');
                        if (label) setLabels([...labels, label]);
                      }}
                      className="px-2 py-1 border border-dashed border-gray-300 rounded-lg text-sm hover:border-primary hover:text-primary"
                    >
                      + Add Label
                    </button>
                  </div>
                </div>

                {/* Additional Actions */}
                <div className="border-t border-gray-100 pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onDuplicate(note)}
                      className="p-2 rounded-lg flex items-center gap-2 hover:bg-gray-100"
                    >
                      <FiCopy className="w-4 h-4" />
                      <span className="text-sm">Duplicate</span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleShare}
                      className="p-2 rounded-lg flex items-center gap-2 hover:bg-gray-100"
                    >
                      <FiShare2 className="w-4 h-4" />
                      <span className="text-sm">Share</span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleArchive}
                      className={`p-2 rounded-lg flex items-center gap-2 ${
                        note.isArchived ? 'bg-secondary/10 text-secondary' : 'hover:bg-gray-100'
                      }`}
                    >
                      <FiArchive className="w-4 h-4" />
                      <span className="text-sm">{note.isArchived ? 'Restore' : 'Archive'}</span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const time = prompt('Set reminder (minutes):', '5');
                        if (time) setReminder(new Date(Date.now() + parseInt(time) * 60000));
                      }}
                      className="p-2 rounded-lg flex items-center gap-2 hover:bg-gray-100"
                    >
                      <FiClock className="w-4 h-4" />
                      <span className="text-sm">Reminder</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </>
          );
        case 4:
          return <AttachmentsSection />;
        default:
          return null;
      }
    };

    return (
      <motion.div
        ref={settingsRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2 }}
        className="absolute top-12 right-0 bg-white rounded-lg shadow-lg p-4 z-10 min-w-[250px]"
      >
        <div className="space-y-4">
          {renderSettingsPage()}

          {/* Pagination */}
          <div className="flex justify-center items-center gap-2 pt-4 border-t border-gray-100">
            {[...Array(totalPages)].map((_, index) => (
              <motion.button
                key={index}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCurrentPage(index + 1)}
                className={`w-2 h-2 rounded-full ${
                  currentPage === index + 1 ? 'bg-primary' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Group Settings */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Group</h3>
            <div className="flex items-center space-x-2">
              {currentGroup ? (
                <>
                  <div className="flex-1 px-3 py-1.5 text-sm bg-gray-100 rounded-md">
                    <span className="text-gray-700">{currentGroup.name}</span>
                  </div>
                  <button
                    onClick={handleRemoveFromGroup}
                    className="flex items-center px-3 py-1.5 text-sm text-red-600 bg-red-100 rounded-md hover:bg-red-200"
                  >
                    <FiX className="w-4 h-4 mr-2" />
                    Remove
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowGroupModal(true)}
                  className="flex items-center px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <FiUsers className="w-4 h-4 mr-2" />
                  Add to Group
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const handleShare = async () => {
    try {
      // Generate a unique sharing URL
      const shareId = Math.random().toString(36).substring(2, 15);
      const shareUrl = `${window.location.origin}/share/${shareId}`;
      
      // Update the note with sharing information
      const updatedNote = {
        ...note,
        shared: true,
        shareId,
        shareUrl,
        sharedAt: new Date()
      };
      
      await onUpdate(updatedNote);
      
      // Create a share dialog with options
      const shareData = {
        title: note.title,
        text: note.content,
        url: shareUrl
      };

      if (navigator.share && navigator.canShare(shareData)) {
        // Use native sharing if available
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(shareUrl);
        alert('Share link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing note:', error);
      alert('Failed to share note. Please try again.');
    }
  };

  const AttachmentsSection = () => (
    <div className="border-t border-gray-100 pt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Attachments</span>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            className="hidden"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <FiUpload className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-1.5 rounded-lg flex items-center gap-2 ${
              isRecording ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'
            }`}
          >
            <FiMic className="w-4 h-4" />
            {isRecording && (
              <>
                <AudioWaveform isRecording={isRecording} />
                <span className="text-sm">{recordingTime}s</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-200 rounded-lg p-4 mb-2 transition-colors"
      >
        <div className="text-center text-sm text-gray-500">
          Drag and drop files here
        </div>
      </div>

      {/* Attachments Grid */}
      {note.attachments && note.attachments.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {note.attachments.map((attachment, index) => (
            <div key={index} className="relative group">
              {attachment.type.startsWith('image/') ? (
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="w-full h-24 object-cover rounded-lg"
                />
              ) : attachment.type.startsWith('audio/') ? (
                <div className="flex items-center justify-center h-24 bg-gray-100 rounded-lg">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleAudioPlayback(attachment.url)}
                    className="p-2 rounded-full bg-white shadow-md"
                  >
                    {isPlaying[attachment.url] ? (
                      <FiPause className="w-6 h-6 text-primary" />
                    ) : (
                      <FiPlay className="w-6 h-6 text-primary" />
                    )}
                  </motion.button>
                  {isPlaying[attachment.url] && <AudioWaveform isRecording={true} />}
                </div>
              ) : (
                <div className="flex items-center justify-center h-24 bg-gray-100 rounded-lg">
                  <FiFile className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                <motion.a
                  whileTap={{ scale: 0.95 }}
                  href={attachment.url}
                  download={attachment.name}
                  className="p-1.5 rounded-full bg-white text-primary"
                >
                  <FiDownload className="w-4 h-4" />
                </motion.a>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onDeleteFile(attachment.url, note.id)}
                  className="p-1.5 rounded-full bg-white text-red-500"
                >
                  <FiTrash2 className="w-4 h-4" />
                </motion.button>
              </div>
              <div className="text-xs text-gray-500 mt-1 truncate">
                {attachment.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const GroupModal = () => (
    <AnimatePresence>
      {showGroupModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowGroupModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-semibold mb-4">Add to Group</h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            ) : userGroups.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                You are not a member of any groups
              </p>
            ) : (
              <div className="space-y-2">
                {userGroups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => handleAddToGroup(group.id)}
                    className="w-full p-3 text-left rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <div className="font-medium">{group.name}</div>
                    <div className="text-sm text-gray-500">
                      {group.members.length} members
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowGroupModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (isListView) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`${colorClasses[color]} rounded-lg shadow-lg p-4 relative ${
          isPinned ? 'ring-2 ring-primary' : ''
        } ${note.isArchived ? 'opacity-75' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isPinned && <FiStar className="text-primary" />}
              {isLocked && <FiLock className="text-gray-600" />}
              {note.isBookmarked && <FiBookmark className="text-primary" />}
              {priority !== 'normal' && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                }`}>
                  {priority}
                </span>
              )}
              <h3 className={`font-bold text-lg ${fontFamilies[fontFamily]} ${isBold ? 'font-bold' : ''} ${
                isItalic ? 'italic' : ''
              }`}>
                {title}
              </h3>
            </div>
            <p className="text-gray-700 truncate max-w-xl">{content}</p>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {tags.map((tag, index) => (
                  <span key={index} className="text-xs bg-white/50 px-1.5 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
              <div className="flex items-center">
                <FiClock className="w-4 h-4 mr-1" />
                <span>{formatDate(note.updatedAt)}</span>
              </div>
              {dueDate && (
                <div className="flex items-center">
                  <FiAlertCircle className="w-4 h-4 mr-1" />
                  <span>{formatDate(dueDate)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-full hover:bg-white/20"
              disabled={isLocked}
            >
              <FiEdit2 className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleBookmark}
              className={`p-2 rounded-full hover:bg-white/20 ${note.isBookmarked ? 'text-primary' : ''}`}
            >
              <FiBookmark className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleArchive}
              className={`p-2 rounded-full hover:bg-white/20 ${note.isArchived ? 'text-primary' : ''}`}
            >
              <FiArchive className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(note.id)}
              className="p-2 rounded-full hover:bg-white/20"
              disabled={isLocked}
            >
              <FiTrash2 className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        whileHover={{ scale: 1.02 }}
        className={`${colorClasses[color]} rounded-lg shadow-lg p-4 relative min-h-[200px] flex flex-col ${
          isPinned ? 'ring-2 ring-primary' : ''
        } ${note.isArchived ? 'opacity-75' : ''}`}
      >
        {isEditing ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`flex-grow bg-transparent border-b border-gray-600 px-2 py-1 focus:outline-none focus:border-primary ${
                  fontFamilies[fontFamily]
                } ${fontSizes[fontSize]} ${isBold ? 'font-bold' : ''} ${isItalic ? 'italic' : ''}`}
                placeholder="Title"
              />
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleSettings}
                  className="p-2 rounded-full hover:bg-white/20"
                >
                  <FiMoreVertical className="w-5 h-5" />
                </motion.button>
                <AnimatePresence>
                  {showSettings && <SettingsMenu />}
                </AnimatePresence>
              </div>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`bg-transparent flex-grow resize-none mb-4 px-2 py-1 focus:outline-none ${
                fontFamilies[fontFamily]
              } ${fontSizes[fontSize]} ${isBold ? 'font-bold' : ''} ${isItalic ? 'italic' : ''}`}
              placeholder="Write your note here... Use #tags for organization"
            />
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img src={image} alt="" className="w-16 h-16 object-cover rounded-lg" />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between items-center text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <FiHash className="w-4 h-4 mr-1" />
                  <span>{tags.length}</span>
                </div>
                <div className="flex items-center">
                  <FiPaperclip className="w-4 h-4 mr-1" />
                  <span>{charCount}</span>
                </div>
                {reminder && (
                  <div className="flex items-center">
                    <FiClock className="w-4 h-4 mr-1" />
                    <span>{formatDate(reminder)}</span>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSave}
                  className="p-2 rounded-full hover:bg-white/20"
                >
                  <FiCheck className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCancel}
                  className="p-2 rounded-full hover:bg-white/20"
                >
                  <FiX className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-2 flex-grow">
                {isPinned && <FiStar className="text-primary" />}
                {isLocked && <FiLock className="text-gray-600" />}
                {note.isBookmarked && <FiBookmark className="text-primary" />}
                {priority !== 'normal' && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {priority}
                  </span>
                )}
                <h3 className={`font-bold text-lg ${fontFamilies[fontFamily]} ${isBold ? 'font-bold' : ''} ${
                  isItalic ? 'italic' : ''
                }`}>
                  {title}
                </h3>
              </div>
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleSettings}
                  className="p-2 rounded-full hover:bg-white/20"
                >
                  <FiMoreVertical className="w-5 h-5" />
                </motion.button>
                <AnimatePresence>
                  {showSettings && <SettingsMenu />}
                </AnimatePresence>
              </div>
            </div>
            <p className={`flex-grow whitespace-pre-wrap ${fontFamilies[fontFamily]} ${fontSizes[fontSize]} ${
              isBold ? 'font-bold' : ''
            } ${isItalic ? 'italic' : ''}`}>
              {content}
            </p>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 my-2">
                {images.map((image, index) => (
                  <img key={index} src={image} alt="" className="w-16 h-16 object-cover rounded-lg" />
                ))}
              </div>
            )}
            {(tags.length > 0 || labels.length > 0) && (
              <div className="flex flex-wrap gap-1 mb-2">
                {tags.map((tag, index) => (
                  <span key={`tag-${index}`} className="text-xs bg-white/50 px-1.5 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
                {labels.map((label, index) => (
                  <span key={`label-${index}`} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    {label}
                  </span>
                ))}
              </div>
            )}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <FiCalendar className="w-4 h-4 mr-1" />
                  <span>{formatDate(note.updatedAt)}</span>
                </div>
                {dueDate && (
                  <div className="flex items-center">
                    <FiAlertCircle className="w-4 h-4 mr-1" />
                    <span>{formatDate(dueDate)}</span>
                  </div>
                )}
                {reminder && (
                  <div className="flex items-center">
                    <FiClock className="w-4 h-4 mr-1" />
                    <span>{formatDate(reminder)}</span>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-full hover:bg-white/20"
                  disabled={isLocked}
                >
                  <FiEdit2 className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDelete(note.id)}
                  className="p-2 rounded-full hover:bg-white/20"
                  disabled={isLocked}
                >
                  <FiTrash2 className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </>
        )}
        
        {isEditing && <AttachmentsSection />}

        {/* Mobile Actions */}
        {!isListView && (
          <div className="flex sm:hidden items-center gap-2 mt-4">
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-full transition-colors ${
                isBookmarked ? 'bg-primary/20 text-primary' : 'hover:bg-black/10'
              }`}
            >
              <FiBookmark className="w-5 h-5" />
            </button>
            <button
              onClick={handleArchive}
              className={`p-2 rounded-full transition-colors ${
                isArchived ? 'bg-gray-200' : 'hover:bg-black/10'
              }`}
            >
              <FiArchive className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(note.id)}
              className="p-2 hover:bg-black/10 rounded-full transition-colors text-red-500"
            >
              <FiTrash2 className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Flag Modal */}
        <AnimatePresence>
          {showFlagModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowFlagModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl p-6 w-full max-w-md"
              >
                <h3 className="text-lg font-semibold mb-4">Flag Note</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Please select a reason for flagging this note. This will be reviewed by administrators.
                </p>
                <select
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select a reason</option>
                  <option value="spam">Spam</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="offensive">Offensive Content</option>
                  <option value="violence">Violence</option>
                  <option value="harassment">Harassment</option>
                  <option value="other">Other</option>
                </select>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowFlagModal(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFlag}
                    disabled={!flagReason}
                    className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Flag
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <GroupModal />
    </>
  );
};

export default StickyNote; 