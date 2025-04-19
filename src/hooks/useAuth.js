import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { logSystemEvent, EVENT_TYPES } from '../utils/systemLogger';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};
          
          const enhancedUser = {
            ...user,
            ...userData
          };
          
          setUser(enhancedUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address');
    }
  };

  const validatePassword = (password) => {
    if (password.length < 6) {
      throw new Error('Password should be at least 6 characters long');
    }
  };

  const signup = async (email, password, displayName, role = 'user') => {
    try {
      validateEmail(email);
      validatePassword(password);

      // Create user with email and password
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(user, { displayName });
      
      // Create user document in Firestore with additional fields
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName,
        role,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        isActive: true,
        settings: {
          theme: 'light',
          notifications: true,
          emailNotifications: true
        }
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      // Log the signup event
      await logSystemEvent({
        eventType: EVENT_TYPES.USER_ACTION,
        userId: user.uid,
        description: 'User signed up'
      });
      
      return { ...user, ...userData };
    } catch (error) {
      console.error('Signup error:', error);
      throw new Error(getAuthErrorMessage(error.code || error.message));
    }
  };

  const login = async (email, password) => {
    try {
      validateEmail(email);
      validatePassword(password);

      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      // Update last login timestamp
      await setDoc(doc(db, 'users', user.uid), {
        lastLogin: serverTimestamp(),
        isActive: true
      }, { merge: true });

      // Log the login event
      await logSystemEvent({
        eventType: EVENT_TYPES.LOGIN,
        userId: user.uid,
        description: 'User logged in'
      });
      
      return { ...user, ...userData };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(getAuthErrorMessage(error.code || error.message));
    }
  };

  const loginWithGoogle = async (selectedRole = 'user') => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const { user } = await signInWithPopup(auth, provider);
      
      // Check if user document exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let userData;
      
      if (!userDoc.exists()) {
        // Create new user document for Google sign-in
        userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: selectedRole,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          isActive: true,
          provider: 'google',
          settings: {
            theme: 'light',
            notifications: true,
            emailNotifications: true
          }
        };
        await setDoc(doc(db, 'users', user.uid), userData);
      } else {
        // Update last login for existing user
        userData = userDoc.data();
        await setDoc(doc(db, 'users', user.uid), {
          lastLogin: serverTimestamp(),
          isActive: true
        }, { merge: true });
      }

      // Log the Google login event
      await logSystemEvent({
        eventType: EVENT_TYPES.LOGIN,
        userId: user.uid,
        description: 'User logged in with Google'
      });
      
      return { ...user, ...userData };
    } catch (error) {
      console.error('Google login error:', error);
      throw new Error(getAuthErrorMessage(error.code || error.message));
    }
  };

  const logout = async () => {
    try {
      // Update user's active status before signing out
      if (user?.uid) {
        await setDoc(doc(db, 'users', user.uid), {
          isActive: false,
          lastLogout: serverTimestamp()
        }, { merge: true });

        // Log the logout event
        await logSystemEvent({
          eventType: EVENT_TYPES.LOGOUT,
          userId: user.uid,
          description: 'User logged out'
        });
      }
      
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error(getAuthErrorMessage(error.code || error.message));
    }
  };

  const resetPassword = async (email) => {
    try {
      validateEmail(email);
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw new Error(getAuthErrorMessage(error.code || error.message));
    }
  };

  const getAuthErrorMessage = (code) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please try logging in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'This operation is not allowed. Please contact support.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please sign up first.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/popup-closed-by-user':
        return 'Google sign-in was cancelled. Please try again.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/requires-recent-login':
        return 'Please log in again to continue.';
      case 'auth/invalid-login-credentials':
        return 'Invalid login credentials. Please check your email and password.';
      default:
        return 'An error occurred during authentication. Please try again.';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signup,
        login,
        loginWithGoogle,
        logout,
        resetPassword,
        loading
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
}; 