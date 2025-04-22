import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const saveVersion = async (noteId, content, userId) => {
  try {
    const versionsRef = collection(db, 'note_versions');
    const versionData = {
      noteId,
      content,
      userId,
      timestamp: new Date(),
    };
    await addDoc(versionsRef, versionData);
  } catch (error) {
    console.error('Error saving version:', error);
    throw error;
  }
};

export const getVersionHistory = async (noteId) => {
  try {
    const versionsRef = collection(db, 'note_versions');
    const querySnapshot = await getDocs(versionsRef);
    
    // Filter and sort on the client side
    const versions = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          content: data.content,
          timestamp: data.timestamp?.toDate() || new Date()
        };
      })
      .filter(version => version.noteId === noteId)
      .sort((a, b) => b.timestamp - a.timestamp);

    return versions;
  } catch (error) {
    console.error('Error fetching version history:', error);
    throw error;
  }
};

export const restoreVersion = async (noteId, versionId) => {
  try {
    // Get all versions and find the one we want
    const versionsRef = collection(db, 'note_versions');
    const querySnapshot = await getDocs(versionsRef);
    const versionDoc = querySnapshot.docs.find(doc => doc.id === versionId);
    
    if (!versionDoc) {
      throw new Error('Version not found');
    }
    
    const versionData = versionDoc.data();
    const noteRef = doc(db, 'notes', noteId);

    // Handle the content based on its type
    let contentToRestore = versionData.content;
    
    // If content is a string that looks like an object, try to parse it
    if (typeof contentToRestore === 'string' && contentToRestore.trim().startsWith('{')) {
      try {
        contentToRestore = JSON.parse(contentToRestore);
      } catch (e) {
        console.error('Error parsing version content:', e);
      }
    }

    // If content is an object without a content property, wrap it
    if (typeof contentToRestore === 'object' && !contentToRestore.content) {
      contentToRestore = { content: JSON.stringify(contentToRestore) };
    }
    
    // Update the note with the restored content
    await updateDoc(noteRef, {
      content: contentToRestore,
      lastModified: new Date()
    });

    return {
      ...versionData,
      content: contentToRestore
    };
  } catch (error) {
    console.error('Error restoring version:', error);
    throw error;
  }
};

export const lockVersionHistory = async (noteId) => {
  try {
    const noteRef = doc(db, 'notes', noteId);
    await updateDoc(noteRef, {
      isVersionHistoryLocked: true,
      lockedAt: new Date()
    });
  } catch (error) {
    console.error('Error locking version history:', error);
    throw error;
  }
}; 



