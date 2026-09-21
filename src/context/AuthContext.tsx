import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  loginWithGoogle,
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
  savedSets: SavedRevisionSet[];
  savedSetsLoading: boolean;
  signIn: () => Promise<void>;
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
  const [savedSets, setSavedSets] = useState<SavedRevisionSet[]>([]);
  const [savedSetsLoading, setSavedSetsLoading] = useState<boolean>(false);

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
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await logoutUser();
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
        savedSets,
        savedSetsLoading,
        signIn,
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
