import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import AudioRecorder from '../components/AudioRecorder';
import PitchStatistics from '../components/PitchStatistics';
import AudioSettings from '../components/AudioSettings';
import OnboardingFlow from '../components/OnboardingFlow';
import LearningPath from '../components/LearningPath';
import Achievements from '../components/Achievements';
import PracticeModes from '../components/PracticeModes';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import ExerciseBuilder from '../components/ExerciseBuilder';
import { useUserProfile } from '../components/UserProfileManager';
// Temporarily commented out to fix import errors
// import PitchHistoryGraph from '../components/PitchHistoryGraph';
// import PitchFeedback from '../components/PitchFeedback';
// import TargetPitchSettings from '../components/TargetPitchSettings';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  const { initializeProfile, profile } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'recording' | 'statistics' | 'learning' | 'achievements' | 'practice' | 'analytics' | 'builder'>('overview');

  // Handle settings changes
  const handleSettingsChange = (newSettings: any) => {
    console.log('Audio settings updated:', newSettings);
    // Settings are automatically applied via useAudioSettings hooks
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authApi.me();
        if (response.success && response.data?.user) {
          setUser(response.data.user);

          // Initialize user profile
          const userProfile = await initializeProfile(response.data.user.email, response.data.user.name);

          // Check if onboarding is needed
          if (userProfile && !userProfile.onboardingCompleted) {
            setShowOnboarding(true);
          }
        } else {
          navigate('/login');
        }
      } catch (err) {
        console.error('Dashboard auth check failed:', err);
        setError('Failed to connect to server. Please check if the backend is running.');
        // Don't immediately redirect - show error to user
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate, setUser, initializeProfile]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logout();
      navigate('/login');
    } catch (err) {
      setError('Logout failed');
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleExerciseSelect = (exercise: any) => {
    // In a real implementation, this would navigate to an exercise page
    console.log('Selected exercise:', exercise);
    // For now, switch to recording tab with exercise context
    setActiveTab('recording');
  };

  const handleSessionComplete = (session: any) => {
    console.log('Practice session completed:', session);
    // Update user progress
    if (profile && session.completed) {
      const completedExercises = [...(profile.progress?.completedExercises || [])];
      if (session.challenge?.id && !completedExercises.includes(session.challenge.id)) {
        completedExercises.push(session.challenge.id);
        // Update progress in real implementation
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Show onboarding flow if user hasn't completed it
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} user={user} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-800">Voice Training</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 md:space-x-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 md:px-4 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🏠 Overview
            </button>
            <button
              onClick={() => setActiveTab('recording')}
              className={`py-4 px-2 md:px-4 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                activeTab === 'recording'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🎤 Recording
            </button>
            <button
              onClick={() => setActiveTab('learning')}
              className={`py-4 px-2 md:px-4 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                activeTab === 'learning'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📚 Learning
            </button>
            <button
              onClick={() => setActiveTab('practice')}
              className={`py-4 px-2 md:px-4 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                activeTab === 'practice'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🎯 Challenges
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`py-4 px-2 md:px-4 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                activeTab === 'achievements'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🏆 Achievements
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-2 md:px-4 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Analytics
            </button>
            <button
              onClick={() => setActiveTab('builder')}
              className={`py-4 px-2 md:px-4 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                activeTab === 'builder'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ✨ Builder
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Welcome back, {user?.email ? user.email.split('@')[0] : 'User'}!
              </h2>

              {profile?.voiceProfile && profile.voiceProfile.voiceType !== 'unknown' && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {profile.voiceProfile.voiceType === 'soprano' ? '🎵' :
                         profile.voiceProfile.voiceType === 'alto' ? '🎤' :
                         profile.voiceProfile.voiceType === 'tenor' ? '🎙️' : '🔊'}
                      </span>
                      <div>
                        <div className="text-lg font-semibold text-blue-900 capitalize">
                          {profile.voiceProfile.voiceType} Voice
                        </div>
                        <div className="text-sm text-blue-700">
                          Range: {profile.voiceProfile.comfortableRange.min} - {profile.voiceProfile.comfortableRange.max} Hz
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-blue-600 font-medium">Confidence</div>
                      <div className="text-xl font-bold text-blue-900">{profile.voiceProfile.confidence}%</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="text-sm text-indigo-600 font-medium">Current Streak</div>
                  <div className="text-3xl font-bold text-indigo-900 mt-1">
                    {profile?.progress?.currentStreak || user?.streak_count || 0} days
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-600 font-medium">Total Sessions</div>
                  <div className="text-3xl font-bold text-green-900 mt-1">
                    {profile?.progress?.totalSessions || 0}
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-purple-600 font-medium">Avg. Accuracy</div>
                  <div className="text-3xl font-bold text-purple-900 mt-1">
                    {profile?.progress?.averagePitchAccuracy || 0}%
                  </div>
                </div>
              </div>

              {profile?.voiceProfile?.voiceType && profile.voiceProfile.voiceType !== 'unknown' && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-yellow-900 mb-2">🎯 Today's Tip:</div>
                  <div className="text-sm text-yellow-800">
                    {profile.voiceProfile.voiceType === 'soprano' && 'Focus on breath support for high notes and practice gentle warm-ups before singing.'}
                    {profile.voiceProfile.voiceType === 'alto' && 'Explore your rich middle range and practice smooth transitions between registers.'}
                    {profile.voiceProfile.voiceType === 'tenor' && 'Develop strong breath control and work on gradually expanding your upper range.'}
                    {profile.voiceProfile.voiceType === 'bass' && 'Focus on deep breathing from the diaphragm and practice resonance in your lower register.'}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <PitchStatistics />
            </div>
          </div>
        )}

        {/* Recording Tab */}
        {activeTab === 'recording' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Voice Recording Studio</h2>
              <p className="text-gray-600 mb-6">
                Record your voice for real-time pitch analysis and feedback
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">🎤 Recording Tips:</h3>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Find a quiet environment to minimize background noise</li>
                  <li>• Position yourself 6-12 inches from the microphone</li>
                  <li>• Speak or sing naturally and clearly</li>
                  <li>• Start with simple sustained notes for pitch detection</li>
                </ul>
              </div>

              <AudioRecorder
                onRecordingComplete={(blob) => {
                  console.log('Recording completed:', blob);
                  // TODO: Upload to backend in next step
                }}
              />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <AudioSettings onSettingsChange={handleSettingsChange} />
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Voice Analytics</h2>
              <p className="text-gray-600 mb-6">
                Track your progress and see how you're improving over time
              </p>

              <PitchStatistics />

              <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Detailed Analytics</h3>
                <p className="text-gray-600">
                  Advanced analytics and progress tracking coming soon...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Learning Path Tab */}
        {activeTab === 'learning' && (
          <LearningPath onExerciseSelect={handleExerciseSelect} />
        )}

        {/* Practice Challenges Tab */}
        {activeTab === 'practice' && (
          <PracticeModes onSessionComplete={handleSessionComplete} />
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <Achievements onAchievementUnlocked={(achievement) => {
            console.log('Achievement unlocked:', achievement);
          }} />
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <AdvancedAnalytics onExportData={() => {
            console.log('Exporting analytics data...');
          }} />
        )}

        {/* Exercise Builder Tab */}
        {activeTab === 'builder' && (
          <ExerciseBuilder
            onExerciseCreated={(exercise) => {
              console.log('Exercise created:', exercise);
            }}
            onTemplateSelected={(template) => {
              console.log('Template selected:', template);
              setActiveTab('practice');
            }}
          />
        )}

        {error && (
          <div className="mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
