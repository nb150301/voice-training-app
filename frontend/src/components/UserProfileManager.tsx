/**
 * User Profile Manager
 * Handles user profile data, voice type information, and onboarding progress
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface VoiceProfile {
  voiceType: 'soprano' | 'alto' | 'tenor' | 'bass' | 'unknown';
  comfortableRange: {
    min: number;
    max: number;
  };
  confidence: number;
  detectedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  dailyReminder: boolean;
  practiceReminderTime: string;
  autoStartRecording: boolean;
  showTooltips: boolean;
}

export interface UserProgress {
  totalSessions: number;
  totalRecordingTime: number;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null;
  averagePitchAccuracy: number;
  completedExercises: string[];
  achievements: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string;
  voiceProfile: VoiceProfile | null;
  preferences: UserPreferences;
  progress: UserProgress;
  createdAt: string;
  updatedAt: string;
}

interface UserProfileStore {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateVoiceProfile: (voiceProfile: VoiceProfile) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  updateProgress: (progress: Partial<UserProgress>) => void;
  completeOnboarding: () => void;
  resetProfile: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  notifications: true,
  dailyReminder: true,
  practiceReminderTime: '19:00',
  autoStartRecording: false,
  showTooltips: true,
};

const defaultProgress: UserProgress = {
  totalSessions: 0,
  totalRecordingTime: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastPracticeDate: null,
  averagePitchAccuracy: 0,
  completedExercises: [],
  achievements: [],
};

export const useUserProfileStore = create<UserProfileStore>()(
  persist(
    (set, get) => ({
      profile: null,
      isLoading: false,
      error: null,

      setProfile: (profile) => set({ profile }),

      updateProfile: (updates) => {
        const currentProfile = get().profile;
        if (!currentProfile) return;

        const updatedProfile: UserProfile = {
          ...currentProfile,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        set({ profile: updatedProfile });
      },

      updateVoiceProfile: (voiceProfile) => {
        const currentProfile = get().profile;
        if (!currentProfile) return;

        const updatedProfile: UserProfile = {
          ...currentProfile,
          voiceProfile,
          updatedAt: new Date().toISOString(),
        };

        set({ profile: updatedProfile });
      },

      updatePreferences: (preferences) => {
        const currentProfile = get().profile;
        if (!currentProfile) return;

        const updatedProfile: UserProfile = {
          ...currentProfile,
          preferences: {
            ...currentProfile.preferences,
            ...preferences,
          },
          updatedAt: new Date().toISOString(),
        };

        set({ profile: updatedProfile });
      },

      updateProgress: (progress) => {
        const currentProfile = get().profile;
        if (!currentProfile) return;

        const updatedProfile: UserProfile = {
          ...currentProfile,
          progress: {
            ...currentProfile.progress,
            ...progress,
          },
          updatedAt: new Date().toISOString(),
        };

        set({ profile: updatedProfile });
      },

      completeOnboarding: () => {
        const currentProfile = get().profile;
        if (!currentProfile) return;

        const updatedProfile: UserProfile = {
          ...currentProfile,
          onboardingCompleted: true,
          onboardingCompletedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({ profile: updatedProfile });
      },

      resetProfile: () => set({ profile: null }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),
    }),
    {
      name: 'user-profile-storage',
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);

/**
 * Profile Management Hook
 */
export const useUserProfile = () => {
  const store = useUserProfileStore();

  const initializeProfile = async (email: string, name?: string) => {
    store.setLoading(true);
    store.setError(null);

    try {
      const existingProfile = store.profile;

      if (existingProfile && existingProfile.email === email) {
        // Profile already exists, just update last login
        store.updateProfile({ updatedAt: new Date().toISOString() });
        return existingProfile;
      }

      // Create new profile
      const newProfile: UserProfile = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        name,
        onboardingCompleted: false,
        voiceProfile: null,
        preferences: defaultPreferences,
        progress: defaultProgress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      store.setProfile(newProfile);
      return newProfile;
    } catch (error) {
      store.setError('Failed to initialize user profile');
      console.error('Profile initialization error:', error);
      return null;
    } finally {
      store.setLoading(false);
    }
  };

  const getVoiceTypeDescription = (voiceType: VoiceProfile['voiceType']) => {
    switch (voiceType) {
      case 'soprano':
        return 'High singing voice with brilliant, clear tone';
      case 'alto':
        return 'Mid-range voice with rich, warm tone';
      case 'tenor':
        return 'Higher male voice with bright, ringing quality';
      case 'bass':
        return 'Lowest voice type with deep, resonant tone';
      default:
        return 'Voice type not yet determined';
    }
  };

  const getVoiceTypeEmoji = (voiceType: VoiceProfile['voiceType']) => {
    switch (voiceType) {
      case 'soprano': return '🎵';
      case 'alto': return '🎤';
      case 'tenor': return '🎙️';
      case 'bass': return '🔊';
      default: return '❓';
    }
  };

  const getDifficultyForVoiceType = (voiceType: VoiceProfile['voiceType'], targetPitch: number) => {
    if (!voiceType || voiceType === 'unknown') return 'medium';

    const ranges = {
      soprano: { min: 500, max: 1200 },
      alto: { min: 350, max: 900 },
      tenor: { min: 200, max: 600 },
      bass: { min: 80, max: 350 },
    };

    const range = ranges[voiceType];
    if (targetPitch < range.min) return 'hard';
    if (targetPitch > range.max) return 'hard';
    if (targetPitch >= range.min * 1.2 && targetPitch <= range.max * 0.8) return 'easy';
    return 'medium';
  };

  const getPersonalizedTips = (voiceType: VoiceProfile['voiceType']) => {
    switch (voiceType) {
      case 'soprano':
        return [
          'Focus on breath support for high notes',
          'Practice descending scales to strengthen lower register',
          'Warm up with gentle humming before high-intensity practice',
        ];
      case 'alto':
        return [
          'Explore your rich middle range',
          'Practice smooth transitions between chest and head voice',
          'Work on projection and resonance',
        ];
      case 'tenor':
        return [
          'Develop strong breath control',
          'Practice vowel modification for higher notes',
          'Work on expanding your upper range gradually',
        ];
      case 'bass':
        return [
          'Focus on deep breathing from the diaphragm',
          'Practice resonance and projection in lower register',
          'Work on clarity and diction in low range',
        ];
      default:
        return [
          'Start with finding your comfortable speaking range',
          'Practice simple sustained notes',
          'Focus on steady breathing before pitch work',
        ];
    }
  };

  return {
    ...store,
    initializeProfile,
    getVoiceTypeDescription,
    getVoiceTypeEmoji,
    getDifficultyForVoiceType,
    getPersonalizedTips,
  };
};

/**
 * Session Tracking Hook
 */
export const useSessionTracking = () => {
  const { profile, updateProgress } = useUserProfile();

  const startSession = () => {
    if (!profile) return null;

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date().toISOString();

    return {
      sessionId,
      startTime,
      userId: profile.id,
    };
  };

  const endSession = (sessionData: any, duration: number, pitchAccuracy?: number) => {
    if (!profile) return;

    const updates: Partial<UserProgress> = {
      totalSessions: profile.progress.totalSessions + 1,
      totalRecordingTime: profile.progress.totalRecordingTime + Math.round(duration / 1000),
      lastPracticeDate: new Date().toISOString(),
    };

    // Update streak
    const today = new Date().toDateString();
    const lastPractice = profile.progress.lastPracticeDate
      ? new Date(profile.progress.lastPracticeDate).toDateString()
      : null;

    if (lastPractice === today) {
      // Already practiced today, streak remains
      updates.currentStreak = profile.progress.currentStreak;
    } else if (lastPractice === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()) {
      // Practiced yesterday, increment streak
      updates.currentStreak = profile.progress.currentStreak + 1;
      updates.longestStreak = Math.max(
        profile.progress.longestStreak,
        profile.progress.currentStreak + 1
      );
    } else {
      // Streak broken
      updates.currentStreak = 1;
    }

    // Update average pitch accuracy
    if (pitchAccuracy !== undefined) {
      const totalSessions = profile.progress.totalSessions + 1;
      const currentTotal = profile.progress.averagePitchAccuracy * profile.progress.totalSessions;
      updates.averagePitchAccuracy = Math.round(
        (currentTotal + pitchAccuracy) / totalSessions
      );
    }

    updateProgress(updates);
  };

  return {
    startSession,
    endSession,
  };
};