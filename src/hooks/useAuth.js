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

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        
        setUser({
          ...user,
          ...userData
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password, displayName, role = 'user') => {
    try {
      // Create user with email and password
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(user, { displayName });
      
      // Create user document in Firestore with additional fields
      await setDoc(doc(db, 'users', user.uid), {
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
      });
      
      return user;
    } catch (error) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const login = async (email, password) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login timestamp
      await setDoc(doc(db, 'users', user.uid), {
        lastLogin: serverTimestamp(),
        isActive: true
      }, { merge: true });
      
      return user;
    } catch (error) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const loginWithGoogle = async (selectedRole = 'user') => {
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      
      // Check if user document exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Create new user document for Google sign-in
        await setDoc(doc(db, 'users', user.uid), {
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
        });
      } else {
        // Update last login for existing user but don't change their role
        await setDoc(doc(db, 'users', user.uid), {
          lastLogin: serverTimestamp(),
          isActive: true
        }, { merge: true });
      }
      
      // Get the updated user data including role
      const updatedUserDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = updatedUserDoc.data();
      
      // Update the user state with the role information
      setUser({
        ...user,
        ...userData
      });
      
      return user;
    } catch (error) {
      throw new Error(getAuthErrorMessage(error.code));
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
      }
      
      await signOut(auth);
      setUser(null);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw new Error(getAuthErrorMessage(error.code));
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