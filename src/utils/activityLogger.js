import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export const ACTIVITY_TYPES = {
  NOTE_CREATE: 'note_create',
  NOTE_UPDATE: 'note_update',
  NOTE_DELETE: 'note_delete',
  NOTE_ARCHIVE: 'note_archive',
  NOTE_RESTORE: 'note_restore',
  NOTE_SHARE: 'note_share',
  FILE_UPLOAD: 'file_upload',
  FILE_DELETE: 'file_delete',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_SETTINGS_UPDATE: 'user_settings_update',
};

export const logActivity = async ({
  userId,
  userEmail,
  type,
  details = {},
  metadata = {}
}) => {
  try {
    const activityData = {
      userId,
      userEmail,
      type,
      details,
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        timestamp: serverTimestamp()
      }
    };

    const activityRef = collection(db, 'activity_logs');
    await addDoc(activityRef, activityData);
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw the error - logging should not interrupt the main flow
  }
};

export const createActivityLogger = (userId, userEmail) => {
  return {
    logNoteCreate: (noteId, title) => 
      logActivity({
        userId,
        userEmail,
        type: ACTIVITY_TYPES.NOTE_CREATE,
        details: { noteId, title }
      }),

    logNoteUpdate: (noteId, changes) =>
      logActivity({
        userId,
        userEmail,
        type: ACTIVITY_TYPES.NOTE_UPDATE,
        details: { noteId, changes }
      }),

    logNoteDelete: (noteId) =>
      logActivity({
        userId,
        userEmail,
        type: ACTIVITY_TYPES.NOTE_DELETE,
        details: { noteId }
      }),

    logNoteArchive: (noteId) =>
      logActivity({
        userId,
        userEmail,
        type: ACTIVITY_TYPES.NOTE_ARCHIVE,
        details: { noteId }
      }),

    logNoteRestore: (noteId) =>
      logActivity({
        userId,
        userEmail,
        type: ACTIVITY_TYPES.NOTE_RESTORE,
        details: { noteId }
      }),

    logNoteShare: (noteId, shareId) =>
      logActivity({
        userId,
        userEmail,
        type: ACTIVITY_TYPES.NOTE_SHARE,
        details: { noteId, shareId }
      }),

    logFileUpload: (noteId, fileDetails) =>
      logActivity({
        userId,
        userEmail,
        type: ACTIVITY_TYPES.FILE_UPLOAD,
        details: { noteId, fileDetails }
      }),

    logFileDelete: (noteId, fileDetails) =>
      logActivity({
        userId,
        userEmail,
        type: ACTIVITY_TYPES.FILE_DELETE,
        details: { noteId, fileDetails }
      }),

    logUserLogin: () =>
      logActivity({
        userId,
        userEmail,
        type: ACTIVITY_TYPES.USER_LOGIN
      }),

    logUserLogout: () =>
      logActivity({
        userId,
        userEmail,
        type: ACTIVITY_TYPES.USER_LOGOUT
      }),

    logUserSettingsUpdate: (changes) =>
      logActivity({
        userId,
        userEmail,
        type: ACTIVITY_TYPES.USER_SETTINGS_UPDATE,
        details: { changes }
      })
  };
}; 