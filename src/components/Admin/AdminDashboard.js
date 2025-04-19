import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  FiUsers, FiActivity, FiTrendingUp, FiPieChart,
  FiClock, FiHardDrive, FiShare2, FiTag
} from 'react-icons/fi';

const COLORS = ['#3A59D1', '#3D90D7', '#7AC6D2', '#B5FCCD', '#FF6B6B', '#4ECDC4'];

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalNotes: 0,
    notesCreatedToday: 0,
    storageUsed: 0,
    sharingStats: 0,
    userActivity: [],
    noteDistribution: [],
    tagUsage: [],
    dailyEngagement: [],
    attachmentTypes: [],
    userGrowth: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week'); // week, month, year

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      // Fetch users
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const totalUsers = usersSnapshot.size;

      // Fetch notes
      const notesRef = collection(db, 'notes');
      const notesSnapshot = await getDocs(notesRef);
      const totalNotes = notesSnapshot.size;

      // Calculate active users (users with activity in last 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const activityRef = collection(db, 'activity_logs');
      const activeUsersQuery = query(
        activityRef,
        where('timestamp', '>=', yesterday)
      );
      const activeUsersSnapshot = await getDocs(activeUsersQuery);
      const activeUsers = new Set(
        activeUsersSnapshot.docs.map(doc => doc.data().userId)
      ).size;

      // Calculate notes created today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayNotesQuery = query(
        notesRef,
        where('createdAt', '>=', today)
      );
      const todayNotesSnapshot = await getDocs(todayNotesQuery);
      const notesCreatedToday = todayNotesSnapshot.size;

      // Generate mock data for charts
      const mockUserActivity = generateMockTimeData(dateRange);
      const mockNoteDistribution = [
        { name: 'Text Only', value: 45 },
        { name: 'With Images', value: 25 },
        { name: 'With Files', value: 15 },
        { name: 'With Audio', value: 10 },
        { name: 'With Links', value: 5 }
      ];
      const mockTagUsage = [
        { name: '#work', count: 120 },
        { name: '#personal', count: 90 },
        { name: '#important', count: 75 },
        { name: '#todo', count: 60 },
        { name: '#meeting', count: 45 }
      ];

      setStats({
        totalUsers,
        activeUsers,
        totalNotes,
        notesCreatedToday,
        storageUsed: calculateStorageUsed(notesSnapshot.docs),
        sharingStats: calculateSharingStats(notesSnapshot.docs),
        userActivity: mockUserActivity,
        noteDistribution: mockNoteDistribution,
        tagUsage: mockTagUsage,
        dailyEngagement: generateMockTimeData(dateRange),
        attachmentTypes: [
          { type: 'Images', count: 234 },
          { type: 'Documents', count: 145 },
          { type: 'Audio', count: 67 }
        ],
        userGrowth: generateMockTimeData(dateRange)
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  const calculateStorageUsed = (notes) => {
    return notes.reduce((total, note) => {
      const attachments = note.data().attachments || [];
      return total + attachments.reduce((size, att) => size + (att.size || 0), 0);
    }, 0);
  };

  const calculateSharingStats = (notes) => {
    return notes.reduce((total, note) => {
      return total + (note.data().shared ? 1 : 0);
    }, 0);
  };

  const generateMockTimeData = (range) => {
    const data = [];
    const points = range === 'week' ? 7 : range === 'month' ? 30 : 12;
    const today = new Date();

    for (let i = points - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      data.push({
        date: date.toLocaleDateString(),
        value: Math.floor(Math.random() * 100) + 20
      });
    }

    return data;
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white p-6 rounded-lg shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="mt-4 flex gap-4">
          <button
            onClick={() => setDateRange('week')}
            className={`px-4 py-2 rounded-lg ${
              dateRange === 'week'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-4 py-2 rounded-lg ${
              dateRange === 'month'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setDateRange('year')}
            className={`px-4 py-2 rounded-lg ${
              dateRange === 'year'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600'
            }`}
          >
            Year
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={FiUsers}
          color="bg-primary"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={FiActivity}
          color="bg-green-500"
        />
        <StatCard
          title="Total Notes"
          value={stats.totalNotes}
          icon={FiTrendingUp}
          color="bg-blue-500"
        />
        <StatCard
          title="Notes Today"
          value={stats.notesCreatedToday}
          icon={FiClock}
          color="bg-purple-500"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Activity Chart */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <h3 className="text-lg font-semibold mb-4">User Activity</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.userActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3A59D1"
                  fill="#3A59D1"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Note Distribution Chart */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <h3 className="text-lg font-semibold mb-4">Note Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.noteDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {stats.noteDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Tag Usage Chart */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <h3 className="text-lg font-semibold mb-4">Popular Tags</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.tagUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3A59D1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* User Growth Chart */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <h3 className="text-lg font-semibold mb-4">User Growth</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3A59D1"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <h3 className="text-lg font-semibold mb-4">Storage Usage</h3>
          <div className="flex items-center justify-between">
            <FiHardDrive className="w-8 h-8 text-primary" />
            <div className="text-right">
              <p className="text-2xl font-bold">
                {(stats.storageUsed / (1024 * 1024)).toFixed(2)} MB
              </p>
              <p className="text-sm text-gray-600">Total Storage Used</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <h3 className="text-lg font-semibold mb-4">Sharing Activity</h3>
          <div className="flex items-center justify-between">
            <FiShare2 className="w-8 h-8 text-secondary" />
            <div className="text-right">
              <p className="text-2xl font-bold">{stats.sharingStats}</p>
              <p className="text-sm text-gray-600">Notes Shared</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <h3 className="text-lg font-semibold mb-4">Tag Analytics</h3>
          <div className="flex items-center justify-between">
            <FiTag className="w-8 h-8 text-accent" />
            <div className="text-right">
              <p className="text-2xl font-bold">{stats.tagUsage.length}</p>
              <p className="text-sm text-gray-600">Unique Tags Used</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard; 