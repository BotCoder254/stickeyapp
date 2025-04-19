import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export const EVENT_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  ERROR: 'error',
  WARNING: 'warning',
  ADMIN_ACTION: 'admin_action',
  USER_ACTION: 'user_action',
  SYSTEM: 'system'
};

export const logSystemEvent = async ({
  eventType,
  userId,
  description,
  metadata = {}
}) => {
  try {
    const logData = {
      eventType,
      userId,
      description,
      timestamp: serverTimestamp(),
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        platform: navigator.platform
      }
    };

    const logsRef = collection(db, 'system_logs');
    await addDoc(logsRef, logData);
  } catch (error) {
    console.error('Error logging system event:', error);
    // Don't throw the error - logging should not interrupt the main flow
  }
};

export const createSystemLogger = (userId) => {
  return {
    logLogin: (description = 'User logged in') =>
      logSystemEvent({
        eventType: EVENT_TYPES.LOGIN,
        userId,
        description
      }),

    logLogout: (description = 'User logged out') =>
      logSystemEvent({
        eventType: EVENT_TYPES.LOGOUT,
        userId,
        description
      }),

    logError: (description, metadata = {}) =>
      logSystemEvent({
        eventType: EVENT_TYPES.ERROR,
        userId,
        description,
        metadata
      }),

    logWarning: (description, metadata = {}) =>
      logSystemEvent({
        eventType: EVENT_TYPES.WARNING,
        userId,
        description,
        metadata
      }),

    logAdminAction: (description, metadata = {}) =>
      logSystemEvent({
        eventType: EVENT_TYPES.ADMIN_ACTION,
        userId,
        description,
        metadata
      }),

    logUserAction: (description, metadata = {}) =>
      logSystemEvent({
        eventType: EVENT_TYPES.USER_ACTION,
        userId,
        description,
        metadata
      }),

    logSystem: (description, metadata = {}) =>
      logSystemEvent({
        eventType: EVENT_TYPES.SYSTEM,
        userId,
        description,
        metadata
      })
  };
}; 