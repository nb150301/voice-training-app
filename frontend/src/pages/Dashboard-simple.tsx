import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import AudioRecorder from '../components/AudioRecorder';
import PitchStatistics from '../components/PitchStatistics';

export default function DashboardSimple() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authApi.me();
        if (response.success && response.data?.user) {
          setUser(response.data.user);
        } else {
          navigate('/login');
        }
      } catch (err) {
        console.error('Dashboard auth check failed:', err);
        setError('Failed to connect to server. Please check if the backend is running.');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate, setUser]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logout();
      navigate('/login');
    } catch (err) {
      setError('Logout failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Welcome back, {user?.email}!
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="text-sm text-indigo-600 font-medium">Current Streak</div>
              <div className="text-3xl font-bold text-indigo-900 mt-1">
                {user?.streak_count || 0} days
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium">Total XP</div>
              <div className="text-3xl font-bold text-green-900 mt-1">
                {user?.total_xp || 0}
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-purple-600 font-medium">Level</div>
              <div className="text-3xl font-bold text-purple-900 mt-1">
                {user?.level || 1}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <PitchStatistics />
        </div>

        <AudioRecorder
          onRecordingComplete={(blob) => {
            console.log('Recording completed:', blob);
          }}
        />

        {error && (
          <div className="mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}