import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit2, FiTrash2, FiCheck, FiX, FiCalendar, FiClock, FiHash, FiPaperclip, FiStar, FiAlertCircle, FiLock, FiImage, FiMoreVertical, FiArchive, FiShare2, FiCopy, FiTag, FiBookmark, FiFlag, FiType, FiAlignLeft } from 'react-icons/fi';

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

const StickyNote = ({ note, onUpdate, onDelete, onDuplicate, onArchive, onShare, isListView = false, index }) => {
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

  const SettingsMenu = () => (
    <motion.div
      ref={settingsRef}
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2 }}
      className="absolute top-12 right-0 bg-white rounded-lg shadow-lg p-4 z-10 min-w-[250px]"
    >
      <div className="space-y-4">
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
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3">
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

        {/* Labels */}
        <div className="border-t border-gray-100 pt-3">
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
              onClick={() => onShare(note)}
              className="p-2 rounded-lg flex items-center gap-2 hover:bg-gray-100"
            >
              <FiShare2 className="w-4 h-4" />
              <span className="text-sm">Share</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsArchived(!isArchived);
                onArchive(note);
              }}
              className="p-2 rounded-lg flex items-center gap-2 hover:bg-gray-100"
            >
              <FiArchive className="w-4 h-4" />
              <span className="text-sm">Archive</span>
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

        {/* Images */}
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Images</span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg hover:bg-gray-100"
            >
              <FiImage className="w-4 h-4" />
            </motion.button>
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img src={image} alt="" className="w-12 h-12 object-cover rounded-lg" />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 p-0.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (isListView) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        whileHover={{ scale: 1.02 }}
        className={`${colorClasses[color]} rounded-lg shadow-lg p-4 flex items-center justify-between ${isPinned ? 'ring-2 ring-primary' : ''}`}
      >
        <div className="flex-grow">
          <div className="flex items-center gap-2 mb-1">
            {isPinned && <FiStar className="text-primary" />}
            {isLocked && <FiLock className="text-gray-600" />}
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
            onClick={() => onDelete(note.id)}
            className="p-2 rounded-full hover:bg-white/20"
            disabled={isLocked}
          >
            <FiTrash2 className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.02 }}
      className={`${colorClasses[color]} rounded-lg shadow-lg p-4 relative min-h-[200px] flex flex-col ${
        isPinned ? 'ring-2 ring-primary' : ''
      } ${isArchived ? 'opacity-75' : ''}`}
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
              {isBookmarked && <FiBookmark className="text-primary" />}
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
    </motion.div>
  );
};

export default StickyNote; 