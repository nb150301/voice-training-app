import { useEffect, useState } from 'react';
import { recordingsApi, type Recording } from '../lib/api';
import { formatPitch, getPitchCategory, getPitchColor, getPitchBgColor } from '../lib/pitch';

export interface PitchStats {
  totalRecordings: number;
  recordingsWithPitch: number;
  minPitch: number | null;
  maxPitch: number | null;
  avgPitch: number | null;
  medianPitch: number | null;
  pitchRange: number | null;
  dominantVoiceType: string;
}

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

  // Determine dominant voice type based on average
  const dominantVoiceType = getPitchCategory(avgPitch);

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

export default function PitchStatistics() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PitchStats | null>(null);

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      setIsLoading(true);
      const response = await recordingsApi.list();
      if (response.data?.recordings) {
        setRecordings(response.data.recordings);
        const pitchStats = calculatePitchStats(response.data.recordings);
        setStats(pitchStats);
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
          <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
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

  if (!stats || stats.recordingsWithPitch === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Voice Statistics</h2>
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
          <p className="text-sm">No recordings with pitch data yet. Start recording to see your voice statistics!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Voice Statistics</h2>
        <p className="text-gray-600">
          Analysis of your {stats.recordingsWithPitch} recording{stats.recordingsWithPitch !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Average Pitch */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-indigo-900">Average Pitch</span>
            <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          </div>
          <p className={`text-2xl font-bold ${getPitchColor(stats.avgPitch || 0)}`}>
            {formatPitch(stats.avgPitch)}
          </p>
        </div>

        {/* Median Pitch */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-900">Median Pitch</span>
            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
            </svg>
          </div>
          <p className={`text-2xl font-bold ${getPitchColor(stats.medianPitch || 0)}`}>
            {formatPitch(stats.medianPitch)}
          </p>
        </div>

        {/* Voice Type */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Voice Type</span>
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          </div>
          <p className={`text-2xl font-bold ${getPitchColor(stats.avgPitch || 0)}`}>
            {stats.dominantVoiceType}
          </p>
        </div>
      </div>

      {/* Pitch Range */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-3">Pitch Range</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-sm text-gray-600">Lowest</span>
            <p className={`font-mono text-lg font-bold ${getPitchColor(stats.minPitch || 0)}`}>
              {formatPitch(stats.minPitch)}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Highest</span>
            <p className={`font-mono text-lg font-bold ${getPitchColor(stats.maxPitch || 0)}`}>
              {formatPitch(stats.maxPitch)}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Range</span>
            <p className="font-mono text-lg font-bold text-gray-800">
              {stats.pitchRange?.toFixed(1)} Hz
            </p>
          </div>
        </div>

        {/* Visual pitch range indicator */}
        {stats.minPitch && stats.maxPitch && stats.avgPitch && (
          <div className="mt-4">
            <div className="relative h-2 bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300 rounded-full">
              {/* Average marker */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-gray-800 rounded"
                style={{
                  left: `${((stats.avgPitch - stats.minPitch) / (stats.maxPitch - stats.minPitch)) * 100}%`,
                }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-600">
                  Avg
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        )}
      </div>

      {/* Consistency Score */}
      {stats.pitchRange !== null && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium text-green-800">
                Pitch Consistency: {stats.pitchRange < 20 ? 'Excellent' : stats.pitchRange < 40 ? 'Good' : 'Moderate'}
              </p>
              <p className="text-sm text-green-700">
                {stats.pitchRange < 20 && 'Your pitch is very consistent across recordings.'}
                {stats.pitchRange >= 20 && stats.pitchRange < 40 && 'Your pitch shows good consistency with some natural variation.'}
                {stats.pitchRange >= 40 && 'Continue practicing to improve pitch consistency.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
