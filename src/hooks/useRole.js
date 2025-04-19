import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './useAuth';

export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest'
};

export const useRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState(ROLES.GUEST);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(ROLES.GUEST);
      setLoading(false);
      return;
    }

    // Initial role fetch
    const fetchInitialRole = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setRole(userData.role || ROLES.USER);
        } else {
          setRole(ROLES.USER);
        }
      } catch (error) {
        console.error('Error fetching initial role:', error);
        setRole(ROLES.USER);
      }
      setLoading(false);
    };

    fetchInitialRole();

    // Real-time role updates
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          setRole(userData.role || ROLES.USER);
        } else {
          setRole(ROLES.USER);
        }
      },
      (error) => {
        console.error('Error in role subscription:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const isAdmin = role === ROLES.ADMIN;
  const isUser = role === ROLES.USER;
  const isGuest = role === ROLES.GUEST;

  const checkPermission = (requiredRole) => {
    const roleHierarchy = {
      [ROLES.ADMIN]: 3,
      [ROLES.USER]: 2,
      [ROLES.GUEST]: 1
    };

    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  };

  const getRoleLabel = (roleValue) => {
    switch (roleValue) {
      case ROLES.ADMIN:
        return 'Administrator';
      case ROLES.USER:
        return 'Regular User';
      case ROLES.GUEST:
        return 'Guest';
      default:
        return 'Unknown Role';
    }
  };

  return {
    role,
    isAdmin,
    isUser,
    isGuest,
    checkPermission,
    getRoleLabel,
    loading
  };
};

export default useRole; 