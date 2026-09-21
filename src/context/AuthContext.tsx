import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  loginWithGoogle,
  loginAsGuest,
  logoutUser,
  subscribeToUserProfile,
  subscribeToSavedRevisionSets,
  saveRevisionSet,
  updateRevisionSetProgress,
  deleteSavedRevisionSet,
  updateUserStats,
} from '../lib/firebase';
import { UserProfile, SavedRevisionSet, RevisionQuestion, RevisionDiagram, Difficulty } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signingIn: boolean;
  authError: string | null;
  clearAuthError: () => void;
  savedSets: SavedRevisionSet[];
  savedSetsLoading: boolean;
  signIn: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  saveSet: (
    topic: string,
    difficulty: Difficulty,
    questions: RevisionQuestion[],
    diagram?: RevisionDiagram | null
  ) => Promise<string>;
  updateSetProgress: (
    setId: string,
    knewCount: number,
    reviseCount: number,
    questions: RevisionQuestion[]
  ) => Promise<void>;
  deleteSet: (setId: string) => Promise<void>;
  recordGenerated: (count: number) => Promise<void>;
  recordReviewed: (reviewedDelta: number, masteredDelta: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [signingIn, setSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [savedSets, setSavedSets] = useState<SavedRevisionSet[]>([]);
  const [savedSetsLoading, setSavedSetsLoading] = useState<boolean>(false);

  const clearAuthError = () => setAuthError(null);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to user profile and saved sets when authenticated
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setSavedSets([]);
      setSavedSetsLoading(false);
      return;
    }

    setSavedSetsLoading(true);

    const unsubProfile = subscribeToUserProfile(
      user.uid,
      (p) => setProfile(p),
      (err) => console.error('Error fetching profile:', err)
    );

    const unsubSets = subscribeToSavedRevisionSets(
      user.uid,
      (sets) => {
        setSavedSets(sets);
        setSavedSetsLoading(false);
      },
      (err) => {
        console.error('Error fetching sets:', err);
        setSavedSetsLoading(false);
      }
    );

    return () => {
      unsubProfile();
      unsubSets();
    };
  }, [user]);

  const signIn = async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error('Sign in failed:', error);
      let userFriendlyMessage = 'Google Sign-in was not completed. Please try again.';
      const code = error?.code || '';
      const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

      if (code === 'auth/popup-blocked') {
        userFriendlyMessage = isInIframe
          ? 'Browser pop-ups are restricted inside this preview frame. Please open the app in a new tab to authenticate, or click "Continue as Guest".'
          : 'Your browser blocked the Google sign-in window. Please allow pop-ups for this site and retry.';
      } else if (code === 'auth/popup-closed-by-user') {
        userFriendlyMessage = 'Sign-in window was closed before completing. Click Sign In to try again.';
      } else if (code === 'auth/unauthorized-domain') {
        userFriendlyMessage = 'This preview domain is pending authorization in Firebase Console. Click "Open in New Tab" or use Guest Mode to save progress locally.';
      } else if (code === 'auth/cancelled-popup-request') {
        userFriendlyMessage = 'Another sign-in prompt is already active. Please finish or close the other window.';
      } else if (error?.message) {
        userFriendlyMessage = error.message;
      }
      setAuthError(userFriendlyMessage);
      throw error;
    } finally {
      setSigningIn(false);
    }
  };

  const signInAsGuest = async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await loginAsGuest();
    } catch (error: any) {
      console.error('Guest sign-in failed:', error);
      setAuthError(error.message || 'Could not start guest session.');
      throw error;
    } finally {
      setSigningIn(false);
    }
  };

  const signOut = async () => {
    try {
      await logoutUser();
      setAuthError(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  const saveSet = async (
    topic: string,
    difficulty: Difficulty,
    questions: RevisionQuestion[],
    diagram?: RevisionDiagram | null
  ): Promise<string> => {
    if (!user) {
      throw new Error('You must be signed in to save revision sets to the cloud.');
    }

    const setId = `set-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const knewCount = questions.filter((q) => q.recallStatus === 'knew').length;
    const reviseCount = questions.filter((q) => q.recallStatus === 'revise').length;

    const setData: any = {
      topic: topic.trim() || 'Untitled Study Set',
      difficulty,
      questionCount: questions.length,
      knewCount,
      reviseCount,
      questions,
    };
    if (diagram) {
      setData.diagram = diagram;
    }

    await saveRevisionSet(user.uid, setId, setData);

    return setId;
  };

  const updateSetProgress = async (
    setId: string,
    knewCount: number,
    reviseCount: number,
    questions: RevisionQuestion[]
  ) => {
    if (!user) return;
    await updateRevisionSetProgress(user.uid, setId, knewCount, reviseCount, questions);
  };

  const deleteSet = async (setId: string) => {
    if (!user) return;
    await deleteSavedRevisionSet(user.uid, setId);
  };

  const recordGenerated = async (count: number) => {
    if (!user) return;
    await updateUserStats(user.uid, { generated: count });
  };

  const recordReviewed = async (reviewedDelta: number, masteredDelta: number) => {
    if (!user) return;
    await updateUserStats(user.uid, { reviewed: reviewedDelta, mastered: masteredDelta });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signingIn,
        authError,
        clearAuthError,
        savedSets,
        savedSetsLoading,
        signIn,
        signInAsGuest,
        signOut,
        saveSet,
        updateSetProgress,
        deleteSet,
        recordGenerated,
        recordReviewed,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
