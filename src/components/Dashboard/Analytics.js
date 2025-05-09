import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FiStar, FiArchive, FiBookmark, FiClock, FiFileText } from 'react-icons/fi';

const COLORS = ['#3A59D1', '#3D90D7', '#7AC6D2', '#B5FCCD'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    archived: 0,
    bookmarked: 0,
    byColor: {},
    recentlyUpdated: [],
    averageLength: 0,
    activityByDay: {},
    tags: [],
    categoryDistribution: [],
    weeklyActivity: [],
    attachmentStats: {
      images: 0,
      audio: 0,
      files: 0
    },
    priorityDistribution: [],
    completionRate: 0,
    mostActiveHours: []
  });

  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notes'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let allNotes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      calculateStats(allNotes);
    });

    return () => unsubscribe();
  }, [user]);

  const calculateStats = (notesData) => {
    const totalNotes = notesData.length;
    const archivedCount = notesData.filter(note => note.isArchived).length;
    const bookmarkedCount = notesData.filter(note => note.isBookmarked).length;
    
    // Color distribution
    const colorCount = notesData.reduce((acc, note) => {
      acc[note.color] = (acc[note.color] || 0) + 1;
      return acc;
    }, {});

    // Activity by day
    const activityByDay = notesData.reduce((acc, note) => {
      const date = note.updatedAt?.toDate?.()?.toLocaleDateString() || new Date().toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Weekly activity data
    const weeklyActivity = Object.entries(activityByDay)
      .slice(-7)
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        count
      }));

    // Category/Tag distribution
    const categoryDistribution = notesData.reduce((acc, note) => {
      const tags = note.content?.match(/#\w+/g) || [];
      tags.forEach(tag => {
        const category = acc.find(c => c.name === tag);
        if (category) {
          category.value++;
        } else {
          acc.push({ name: tag, value: 1 });
        }
      });
      return acc;
    }, []);

    // Attachment statistics
    const attachmentStats = notesData.reduce((acc, note) => {
      note.attachments?.forEach(attachment => {
        if (attachment.type.startsWith('image/')) acc.images++;
        else if (attachment.type.startsWith('audio/')) acc.audio++;
        else acc.files++;
      });
      return acc;
    }, { images: 0, audio: 0, files: 0 });

    // Priority distribution
    const priorityDistribution = notesData.reduce((acc, note) => {
      const priority = note.priority || 'normal';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    // Most active hours
    const mostActiveHours = notesData.reduce((acc, note) => {
      const hour = note.updatedAt?.toDate?.()?.getHours() || 0;
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    setStats({
      total: totalNotes,
      archived: archivedCount,
      bookmarked: bookmarkedCount,
      byColor: colorCount,
      recentlyUpdated: notesData.filter(note => !note.isArchived).slice(0, 5),
      averageLength: Math.round(notesData.reduce((acc, note) => acc + (note.content?.length || 0), 0) / (totalNotes || 1)),
      activityByDay,
      tags: categoryDistribution.map(c => c.name),
      categoryDistribution,
      weeklyActivity,
      attachmentStats,
      priorityDistribution: Object.entries(priorityDistribution).map(([name, value]) => ({ name, value })),
      mostActiveHours: Object.entries(mostActiveHours)
        .map(([hour, count]) => ({
          hour: `${hour}:00`,
          count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Total Notes</h3>
            <FiFileText className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-primary">{stats.total}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Archived</h3>
            <FiArchive className="w-5 h-5 text-secondary" />
          </div>
          <p className="text-3xl font-bold text-secondary">{stats.archived}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Bookmarked</h3>
            <FiBookmark className="w-5 h-5 text-accent" />
          </div>
          <p className="text-3xl font-bold text-accent">{stats.bookmarked}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <FiClock className="w-5 h-5 text-primary" />
          </div>
          <div className="text-sm text-gray-600">
            {stats.recentlyUpdated.slice(0, 3).map(note => (
              <div key={note.id} className="truncate">
                {note.title}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Weekly Activity Chart */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-lg shadow-lg min-h-[300px]"
        >
          <h3 className="text-lg font-semibold mb-4">Weekly Activity</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyActivity}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3A59D1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-lg shadow-lg min-h-[300px]"
        >
          <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoryDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {stats.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Attachment Statistics */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <h3 className="text-lg font-semibold mb-4">Attachments Overview</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{stats.attachmentStats.images}</p>
              <p className="text-sm text-gray-600">Images</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-secondary">{stats.attachmentStats.audio}</p>
              <p className="text-sm text-gray-600">Audio</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-accent">{stats.attachmentStats.files}</p>
              <p className="text-sm text-gray-600">Files</p>
            </div>
          </div>
        </motion.div>

        {/* Most Active Hours */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <h3 className="text-lg font-semibold mb-4">Most Active Hours</h3>
          <div className="space-y-3">
            {stats.mostActiveHours.map(({ hour, count }) => (
              <div key={hour} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-12">{hour}</span>
                <div className="flex-grow bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2 transition-all duration-300"
                    style={{
                      width: `${(count / Math.max(...stats.mostActiveHours.map(h => h.count))) * 100}%`
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-16 text-right">{count} notes</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics; 