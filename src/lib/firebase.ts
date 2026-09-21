import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  query,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  OperationType,
  FirestoreErrorInfo,
  UserProfile,
  SavedRevisionSet,
  RevisionQuestion,
} from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

/* CRITICAL: The app will break without this line */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard error handler conforming to FirestoreErrorInfo
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test helper
export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline status check:', error.message);
    }
  }
}

// Authentication helpers
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await syncUserProfile(result.user);
    return result.user;
  } catch (err) {
    console.error('Sign-in error:', err);
    throw err;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Sign-out error:', err);
    throw err;
  }
}

// User profile synchronization
export async function syncUserProfile(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const path = `users/${user.uid}`;

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Learner',
        photoURL: user.photoURL || '',
        totalQuestionsGenerated: 0,
        totalReviewed: 0,
        totalMastered: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, {
        displayName: user.displayName || snap.data().displayName || 'Learner',
        photoURL: user.photoURL || snap.data().photoURL || '',
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Increment user lifetime stats
export async function updateUserStats(
  userId: string,
  stats: {
    generated?: number;
    reviewed?: number;
    mastered?: number;
  }
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const path = `users/${userId}`;

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      await updateDoc(userRef, {
        totalQuestionsGenerated: (data.totalQuestionsGenerated || 0) + (stats.generated || 0),
        totalReviewed: (data.totalReviewed || 0) + (stats.reviewed || 0),
        totalMastered: (data.totalMastered || 0) + (stats.mastered || 0),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Save a revision set to cloud
export async function saveRevisionSet(
  userId: string,
  setId: string,
  setData: {
    topic: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    questionCount: number;
    knewCount: number;
    reviseCount: number;
    questions: RevisionQuestion[];
  }
): Promise<void> {
  const path = `users/${userId}/revision_sets/${setId}`;
  const setRef = doc(db, 'users', userId, 'revision_sets', setId);

  try {
    await setDoc(setRef, {
      id: setId,
      ownerId: userId,
      topic: setData.topic || 'General Study Notes',
      difficulty: setData.difficulty,
      questionCount: setData.questionCount,
      knewCount: setData.knewCount,
      reviseCount: setData.reviseCount,
      questions: setData.questions,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Update progress on an existing revision set
export async function updateRevisionSetProgress(
  userId: string,
  setId: string,
  knewCount: number,
  reviseCount: number,
  questions: RevisionQuestion[]
): Promise<void> {
  const path = `users/${userId}/revision_sets/${setId}`;
  const setRef = doc(db, 'users', userId, 'revision_sets', setId);

  try {
    await updateDoc(setRef, {
      knewCount,
      reviseCount,
      questions,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Delete a saved revision set
export async function deleteSavedRevisionSet(userId: string, setId: string): Promise<void> {
  const path = `users/${userId}/revision_sets/${setId}`;
  const setRef = doc(db, 'users', userId, 'revision_sets', setId);

  try {
    await deleteDoc(setRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Real-time subscription to user's saved revision sets
export function subscribeToSavedRevisionSets(
  userId: string,
  onData: (sets: SavedRevisionSet[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const path = `users/${userId}/revision_sets`;
  const q = query(collection(db, 'users', userId, 'revision_sets'));

  return onSnapshot(
    q,
    (snapshot) => {
      const sets: SavedRevisionSet[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        sets.push({
          id: d.id || docSnap.id,
          ownerId: d.ownerId,
          topic: d.topic,
          difficulty: d.difficulty,
          questionCount: d.questionCount,
          knewCount: d.knewCount || 0,
          reviseCount: d.reviseCount || 0,
          questions: d.questions || [],
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : new Date().toISOString(),
          updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : new Date().toISOString(),
        });
      });
      // Sort newest first
      sets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(sets);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// Real-time subscription to user profile
export function subscribeToUserProfile(
  userId: string,
  onData: (profile: UserProfile | null) => void,
  onError?: (error: unknown) => void
): () => void {
  const path = `users/${userId}`;
  const userRef = doc(db, 'users', userId);

  return onSnapshot(
    userRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      const d = snapshot.data();
      onData({
        id: d.id,
        email: d.email,
        displayName: d.displayName,
        photoURL: d.photoURL,
        totalQuestionsGenerated: d.totalQuestionsGenerated || 0,
        totalReviewed: d.totalReviewed || 0,
        totalMastered: d.totalMastered || 0,
        createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : new Date().toISOString(),
      });
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
