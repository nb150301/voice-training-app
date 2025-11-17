import { useState, useEffect } from 'react';
import { recordingsApi, type Recording } from '../lib/api';
import { PitchStats } from './PitchStatistics';
import { generateFeedback, getScoreColor, getScoreBgColor, getScoreIcon, type Feedback } from '../lib/feedback';

function calculateMedian(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function calculatePitchStats(recordings: Recording[]): PitchStats {
  const validPitches = recordings
    .map(r => r.pitch_hz)
    .filter((p): p is number => p !== undefined && p !== null && p > 0);

  if (validPitches.length === 0) {
    return {
      totalRecordings: recordings.length,
      recordingsWithPitch: 0,
      minPitch: null,
      maxPitch: null,
      avgPitch: null,
      medianPitch: null,
      pitchRange: null,
      dominantVoiceType: 'No data',
    };
  }

  const minPitch = Math.min(...validPitches);
  const maxPitch = Math.max(...validPitches);
  const avgPitch = validPitches.reduce((sum, p) => sum + p, 0) / validPitches.length;
  const medianPitch = calculateMedian(validPitches);

  const dominantVoiceType = avgPitch < 98 ? 'Bass' :
                           avgPitch < 130 ? 'Baritone' :
                           avgPitch < 165 ? 'Low Tenor' :
                           avgPitch < 261 ? 'Tenor' : 'High Voice';

  return {
    totalRecordings: recordings.length,
    recordingsWithPitch: validPitches.length,
    minPitch,
    maxPitch,
    avgPitch,
    medianPitch,
    pitchRange: maxPitch - minPitch,
    dominantVoiceType,
  };
}

export default function PitchFeedback() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    fetchRecordingsAndGenerateFeedback();
  }, []);

  const fetchRecordingsAndGenerateFeedback = async () => {
    try {
      setIsLoading(true);
      const response = await recordingsApi.list();
      if (response.data?.recordings) {
        setRecordings(response.data.recordings);
        const stats = calculatePitchStats(response.data.recordings);
        const generatedFeedback = generateFeedback(stats);
        setFeedback(generatedFeedback);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load recordings';
      setError(errorMessage);
      console.error('Error fetching recordings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Voice Feedback</h2>
        <p className="text-gray-600">Personalized analysis based on your {recordings.length} recording{recordings.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Score and Assessment */}
      <div className={`rounded-lg p-6 mb-6 ${getScoreBgColor(feedback.score)} border-2`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{getScoreIcon(feedback.score)}</span>
              <div>
                <h3 className={`text-2xl font-bold ${getScoreColor(feedback.score)}`}>
                  {feedback.assessment}
                </h3>
                <p className="text-gray-700 mt-1">{feedback.motivationalMessage}</p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(feedback.score)}`}>
              {feedback.score}
            </div>
            <div className={`text-sm font-medium ${getScoreColor(feedback.score)}`}>
              Score
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              feedback.score >= 90 ? 'bg-green-500' :
              feedback.score >= 80 ? 'bg-blue-500' :
              feedback.score >= 70 ? 'bg-indigo-500' :
              feedback.score >= 60 ? 'bg-yellow-500' : 'bg-orange-500'
            }`}
            style={{ width: `${feedback.score}%` }}
          />
        </div>
      </div>

      {/* Analysis Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Strengths */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Strengths
          </h4>
          <ul className="space-y-2">
            {feedback.strengths.map((strength, index) => (
              <li key={index} className="text-green-700 text-sm flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Areas to Improve
          </h4>
          <ul className="space-y-2">
            {feedback.improvements.map((improvement, index) => (
              <li key={index} className="text-yellow-700 text-sm flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                {improvement}
              </li>
            ))}
          </ul>
        </div>

        {/* Exercises */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H6zm-3 1a1 1 0 011-1h.01a1 1 0 110 2H4a1 1 0 01-1-1zm0 3a1 1 0 011-1h.01a1 1 0 110 2H4a1 1 0 01-1-1zm7 1a1 1 0 100 2h3a1 1 0 100-2h-3zm-3-1a1 1 0 100 2h.01a1 1 0 100-2H10z" clipRule="evenodd" />
            </svg>
            Recommended Exercises
          </h4>
          <ul className="space-y-2">
            {feedback.exercises.map((exercise, index) => (
              <li key={index} className="text-blue-700 text-sm flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                {exercise}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Next Goal */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 mb-6 border border-purple-200">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="font-semibold text-purple-800">Next Goal</h4>
            <p className="text-purple-700">{feedback.nextGoal}</p>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div>
        <button
          onClick={() => setShowTips(!showTips)}
          className="flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
        >
          <svg className={`w-5 h-5 transition-transform ${showTips ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          {showTips ? 'Hide' : 'Show'} Practice Tips
        </button>

        {showTips && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3">Practice Tips</h4>
            <ul className="space-y-2">
              {feedback.tips.map((tip, index) => (
                <li key={index} className="text-gray-700 text-sm flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">💡</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={fetchRecordingsAndGenerateFeedback}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Refresh Feedback
        </button>
      </div>
    </div>
  );
}