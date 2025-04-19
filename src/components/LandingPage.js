import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiEdit3, FiShare2, FiCloud } from 'react-icons/fi';
import LandingNav from './Navigation/LandingNav';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="p-6 bg-white rounded-lg shadow-lg"
  >
    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </motion.div>
);

const LandingPage = () => {
  const features = [
    {
      icon: FiEdit3,
      title: 'Easy to Use',
      description: 'Create and organize your notes with a simple and intuitive interface.'
    },
    {
      icon: FiShare2,
      title: 'Share Notes',
      description: 'Collaborate with others by sharing your notes and ideas.'
    },
    {
      icon: FiCloud,
      title: 'Cloud Sync',
      description: 'Access your notes from anywhere with automatic cloud synchronization.'
    }
  ];

  return (
    <div className="min-h-screen">
      <LandingNav />
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto px-6 py-20">
          <div className="flex flex-col lg:flex-row items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:w-1/2"
            >
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
                Organize Your Thoughts with Sticky Notes
              </h1>
              <p className="text-lg text-white/90 mb-8">
                A simple and beautiful way to keep track of your ideas, tasks, and reminders.
              </p>
              <Link
                to="/signup"
                className="inline-block bg-white text-primary font-semibold px-8 py-3 rounded-lg hover:bg-light transition-colors"
              >
                Get Started
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:w-1/2 mt-10 lg:mt-0"
            >
              {/* Preview Animation */}
              <div className="relative w-full h-96">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      top: `${20 + i * 10}%`,
                      left: `${20 + i * 10}%`,
                      zIndex: 3 - i
                    }}
                    animate={{
                      y: [0, -10, 0],
                      rotate: [0, -5, 0]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: i * 0.2
                    }}
                  >
                    <div className={`w-64 h-64 rounded-lg shadow-xl ${
                      i === 0 ? 'bg-light' : i === 1 ? 'bg-accent' : 'bg-secondary'
                    } p-6`}>
                      <div className="w-full h-4 bg-white/20 rounded mb-4" />
                      <div className="w-2/3 h-4 bg-white/20 rounded" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Choose Our App?
          </h2>
          <p className="text-lg text-gray-600">
            Discover the features that make our sticky notes app stand out.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <FeatureCard {...feature} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-50">
        <div className="container mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Join thousands of users who trust our app for their note-taking needs.
            </p>
            <Link
              to="/signup"
              className="inline-block bg-primary text-white font-semibold px-8 py-3 rounded-lg hover:bg-secondary transition-colors"
            >
              Create Your Account
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 