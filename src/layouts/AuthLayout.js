import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const StickyNote = ({ color, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`w-32 h-32 rounded-lg shadow-lg ${color} transform rotate-3 absolute`}
    />
  );
};

const AuthLayout = ({ children }) => {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-light'];
    const positions = [
      { top: '20%', left: '20%' },
      { top: '40%', left: '40%' },
      { top: '60%', left: '30%' },
      { top: '30%', left: '50%' }
    ];

    setNotes(
      colors.map((color, index) => ({
        id: index,
        color,
        style: positions[index],
        delay: index * 0.2
      }))
    );
  }, []);

  return (
    <div className="min-h-screen flex">
      {/* Preview Animation Side */}
      <div className="hidden lg:flex w-1/2 bg-gray-100 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          {notes.map((note) => (
            <motion.div
              key={note.id}
              style={note.style}
              animate={{
                y: [0, -10, 0],
                rotate: [3, -3, 3]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: note.delay
              }}
            >
              <StickyNote color={note.color} delay={note.delay} />
            </motion.div>
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-8 text-center bg-gradient-to-t from-gray-100">
          <h2 className="text-3xl font-bold text-primary mb-2">
            Sticky Notes App
          </h2>
          <p className="text-gray-600">
            Organize your thoughts with beautiful sticky notes
          </p>
        </div>
      </div>

      {/* Auth Forms Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout; 