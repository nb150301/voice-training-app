/**
 * Advanced Analytics and Performance Tracking
 * UI/UX Phase 3: Advanced Features
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  ResponsiveCard,
  ResponsiveText,
  ResponsiveButton,
  ResponsiveGrid,
} from './ui/ResponsiveLayout';
import { useResponsiveBreakpoints } from '../../hooks/useResponsiveBreakpoints';
import { useUserProfile } from './UserProfileManager';

interface SessionData {
  date: string;
  duration: number;
  accuracy: number;
  exercises: string[];
  voiceType: string;
  improvementAreas: string[];
}

interface PerformanceMetric {
  label: string;
  value: number;
  previousValue?: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
  color: string;
}

interface WeeklyProgress {
  week: string;
  sessions: number;
  avgAccuracy: number;
  totalMinutes: number;
  streak: number;
}

interface VoiceRangeAnalysis {
  comfortableMin: number;
  comfortableMax: number;
  expandedMin: number;
  expandedMax: number;
  consistency: number;
  timeInRange: number;
}

interface AdvancedAnalyticsProps {
  onExportData?: () => void;
}

export default function AdvancedAnalytics({ onExportData }: AdvancedAnalyticsProps) {
  const { profile } = useUserProfile();
  const { isMobile } = useResponsiveBreakpoints();
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedMetric, setSelectedMetric] = useState<'accuracy' | 'range' | 'consistency' | 'progress'>('accuracy');

  // Simulate historical session data
  const generateHistoricalData = (): SessionData[] => {
    const sessions: SessionData[] = [];
    const now = new Date();
    const voiceType = profile?.voiceProfile?.voiceType || 'unknown';

    for (let i = 0; i < 90; i++) {
      const sessionDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);

      // Skip some days for realism
      if (Math.random() > 0.7) continue;

      const accuracy = Math.min(100, Math.max(60,
        75 + Math.random() * 20 + (i < 30 ? i * 0.5 : 0) // Improvement trend
      ));

      sessions.push({
        date: sessionDate.toISOString().split('T')[0],
        duration: Math.floor(Math.random() * 20 + 10) * 60, // 10-30 minutes
        accuracy,
        exercises: ['sustained-note-c', 'pitch-matching', 'major-arpeggios'].slice(0, Math.floor(Math.random() * 3) + 1),
        voiceType,
        improvementAreas: accuracy < 75 ? ['pitch stability', 'breath support'] : [],
      });
    }

    return sessions.reverse();
  };

  const sessionData = useMemo(() => generateHistoricalData(), [profile]);

  // Calculate weekly progress
  const weeklyProgress = useMemo((): WeeklyProgress[] => {
    const weeks: WeeklyProgress[] = [];
    const now = new Date();

    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      const weekSessions = sessionData.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= weekStart && sessionDate < weekEnd;
      });

      if (weekSessions.length === 0) {
        weeks.push({
          week: `Week ${8 - i}`,
          sessions: 0,
          avgAccuracy: 0,
          totalMinutes: 0,
          streak: 0,
        });
        continue;
      }

      const avgAccuracy = weekSessions.reduce((sum, s) => sum + s.accuracy, 0) / weekSessions.length;
      const totalMinutes = weekSessions.reduce((sum, s) => sum + (s.duration / 60), 0);

      weeks.push({
        week: `Week ${8 - i}`,
        sessions: weekSessions.length,
        avgAccuracy: Math.round(avgAccuracy),
        totalMinutes: Math.round(totalMinutes),
        streak: weekSessions.length, // Simplified streak calculation
      });
    }

    return weeks;
  }, [sessionData]);

  // Performance metrics calculation
  const performanceMetrics = useMemo((): PerformanceMetric[] => {
    const recentSessions = sessionData.slice(-7);
    const previousSessions = sessionData.slice(-14, -7);

    const currentAccuracy = recentSessions.length > 0
      ? recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length
      : 0;

    const previousAccuracy = previousSessions.length > 0
      ? previousSessions.reduce((sum, s) => sum + s.accuracy, 0) / previousSessions.length
      : currentAccuracy;

    const currentSessions = recentSessions.length;
    const previousSessionsCount = previousSessions.length;

    const currentMinutes = recentSessions.reduce((sum, s) => sum + (s.duration / 60), 0);
    const previousMinutes = previousSessions.reduce((sum, s) => sum + (s.duration / 60), 0);

    const currentStreak = profile?.progress?.currentStreak || 0;
    const voiceRange = profile?.voiceProfile?.comfortableRange;
    const currentRange = voiceRange ? voiceRange.max - voiceRange.min : 0;

    return [
      {
        label: 'Average Accuracy',
        value: Math.round(currentAccuracy),
        previousValue: Math.round(previousAccuracy),
        trend: currentAccuracy > previousAccuracy + 2 ? 'up' : currentAccuracy < previousAccuracy - 2 ? 'down' : 'stable',
        unit: '%',
        color: 'text-green-600',
      },
      {
        label: 'Weekly Sessions',
        value: currentSessions,
        previousValue: previousSessionsCount,
        trend: currentSessions > previousSessionsCount ? 'up' : currentSessions < previousSessionsCount ? 'down' : 'stable',
        unit: '',
        color: 'text-blue-600',
      },
      {
        label: 'Practice Time',
        value: Math.round(currentMinutes),
        previousValue: Math.round(previousMinutes),
        trend: currentMinutes > previousMinutes + 10 ? 'up' : currentMinutes < previousMinutes - 10 ? 'down' : 'stable',
        unit: 'min',
        color: 'text-purple-600',
      },
      {
        label: 'Current Streak',
        value: currentStreak,
        trend: 'stable',
        unit: 'days',
        color: 'text-orange-600',
      },
      {
        label: 'Voice Range',
        value: Math.round(currentRange),
        trend: 'stable',
        unit: 'Hz',
        color: 'text-indigo-600',
      },
    ];
  }, [sessionData, profile]);

  // Voice range analysis
  const voiceRangeAnalysis = useMemo((): VoiceRangeAnalysis => {
    const voiceProfile = profile?.voiceProfile;
    if (!voiceProfile || voiceProfile.voiceType === 'unknown') {
      return {
        comfortableMin: 0,
        comfortableMax: 0,
        expandedMin: 0,
        expandedMax: 0,
        consistency: 0,
        timeInRange: 0,
      };
    }

    // Simulate expanded range based on practice
    const rangeExpansion = Math.min(100, (profile?.progress?.totalSessions || 0) * 2);

    return {
      comfortableMin: voiceProfile.comfortableRange.min,
      comfortableMax: voiceProfile.comfortableRange.max,
      expandedMin: Math.max(50, voiceProfile.comfortableRange.min - rangeExpansion / 2),
      expandedMax: voiceProfile.comfortableRange.max + rangeExpansion,
      consistency: voiceProfile.confidence,
      timeInRange: Math.min(90, 70 + (profile?.progress?.averagePitchAccuracy || 0) / 5),
    };
  }, [profile]);

  // Exercise completion analysis
  const exerciseAnalysis = useMemo(() => {
    const beginnerExercises = ['sustained-note-c', 'five-note-scale', 'pitch-matching'];
    const intermediateExercises = ['major-arpeggios', 'interval-jumps', 'vibrato-control'];
    const advancedExercises = ['coloratura-runs', 'wide-leaps', 'dynamic-control'];

    const completedExercises = profile?.progress?.completedExercises || [];

    return {
      beginner: completedExercises.filter(id => beginnerExercises.includes(id)).length,
      intermediate: completedExercises.filter(id => intermediateExercises.includes(id)).length,
      advanced: completedExercises.filter(id => advancedExercises.includes(id)).length,
      total: completedExercises.length,
    };
  }, [profile]);

  // Calculate improvement recommendations
  const improvementRecommendations = useMemo(() => {
    const recommendations: string[] = [];
    const avgAccuracy = performanceMetrics[0].value;
    const weeklySessions = performanceMetrics[1].value;
    const currentStreak = performanceMetrics[3].value;

    if (avgAccuracy < 80) {
      recommendations.push('Focus on pitch accuracy exercises - try the pitch matching challenges');
    }

    if (weeklySessions < 3) {
      recommendations.push('Increase practice frequency to at least 3 sessions per week');
    }

    if (currentStreak < 7) {
      recommendations.push('Build consistency - aim for a 7-day practice streak');
    }

    if (exerciseAnalysis.beginner === 3 && exerciseAnalysis.intermediate < 1) {
      recommendations.push('Ready for intermediate exercises! Try the major arpeggios challenge');
    }

    if (voiceRangeAnalysis.consistency < 80) {
      recommendations.push('Work on voice consistency through sustained note exercises');
    }

    if (recommendations.length === 0) {
      recommendations.push('Great progress! Consider advanced expression challenges');
    }

    return recommendations;
  }, [performanceMetrics, exerciseAnalysis, voiceRangeAnalysis]);

  const getTrendIcon = (trend: PerformanceMetric['trend']) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: PerformanceMetric['trend']) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <ResponsiveCard>
        <div className="flex justify-center gap-2">
          {(['week', 'month', 'quarter', 'year'] as const).map(range => (
            <button
              key={range}
              onClick={() => setSelectedTimeRange(range)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all
                ${selectedTimeRange === range
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </ResponsiveCard>

      {/* Performance Metrics */}
      <ResponsiveCard>
        <ResponsiveText size="lg" weight="semibold" className="mb-4">
          Performance Overview
        </ResponsiveText>
        <ResponsiveGrid cols={{ mobile: 2, tablet: 3, desktop: 5 }} gap={4}>
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-2xl">{getTrendIcon(metric.trend)}</span>
                <ResponsiveText size="2xl" weight="bold" className={metric.color}>
                  {metric.value}{metric.unit}
                </ResponsiveText>
              </div>
              <ResponsiveText size="sm" weight="medium" className="text-gray-700">
                {metric.label}
              </ResponsiveText>
              {metric.previousValue !== undefined && (
                <ResponsiveText size="xs" className={getTrendColor(metric.trend)}>
                  {metric.trend === 'up' && '+'}
                  {metric.value - metric.previousValue} vs last period
                </ResponsiveText>
              )}
            </div>
          ))}
        </ResponsiveGrid>
      </ResponsiveCard>

      {/* Voice Range Analysis */}
      <ResponsiveCard>
        <ResponsiveText size="lg" weight="semibold" className="mb-4">
          Voice Range Development
        </ResponsiveText>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <ResponsiveText size="md" weight="medium" className="text-blue-900 mb-2">
                Comfortable Range
              </ResponsiveText>
              <div className="text-2xl font-bold text-blue-900">
                {voiceRangeAnalysis.comfortableMin} - {voiceRangeAnalysis.comfortableMax} Hz
              </div>
              <div className="text-sm text-blue-700 mt-1">
                Width: {voiceRangeAnalysis.comfortableMax - voiceRangeAnalysis.comfortableMin} Hz
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <ResponsiveText size="md" weight="medium" className="text-purple-900 mb-2">
                Expanded Range
              </ResponsiveText>
              <div className="text-2xl font-bold text-purple-900">
                {voiceRangeAnalysis.expandedMin} - {voiceRangeAnalysis.expandedMax} Hz
              </div>
              <div className="text-sm text-purple-700 mt-1">
                Width: {Math.round(voiceRangeAnalysis.expandedMax - voiceRangeAnalysis.expandedMin)} Hz
              </div>
            </div>
          </div>

          {/* Visual Range Representation */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <ResponsiveText size="sm" weight="medium" className="text-gray-700 mb-3">
              Range Visualization
            </ResponsiveText>
            <div className="relative h-12 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                style={{
                  left: `${((voiceRangeAnalysis.expandedMin - 50) / 1150) * 100}%`,
                  width: `${((voiceRangeAnalysis.expandedMax - voiceRangeAnalysis.expandedMin) / 1150) * 100}%`,
                }}
              />
              <div
                className="absolute h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-500"
                style={{
                  left: `${((voiceRangeAnalysis.comfortableMin - 50) / 1150) * 100}%`,
                  width: `${((voiceRangeAnalysis.comfortableMax - voiceRangeAnalysis.comfortableMin) / 1150) * 100}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>50 Hz</span>
              <span>1200 Hz</span>
            </div>
            <div className="flex justify-center gap-6 text-sm mt-3">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-blue-500 rounded"></span>
                Comfortable
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-purple-500 rounded"></span>
                Expanded
              </span>
            </div>
          </div>
        </div>
      </ResponsiveCard>

      {/* Exercise Progress */}
      <ResponsiveCard>
        <ResponsiveText size="lg" weight="semibold" className="mb-4">
          Exercise Progress
        </ResponsiveText>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <ResponsiveText size="2xl" weight="bold" className="text-green-900">
                {exerciseAnalysis.beginner}/3
              </ResponsiveText>
              <ResponsiveText size="sm" weight="medium" className="text-green-700">
                Beginner
              </ResponsiveText>
              <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${(exerciseAnalysis.beginner / 3) * 100}%` }}
                />
              </div>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <ResponsiveText size="2xl" weight="bold" className="text-yellow-900">
                {exerciseAnalysis.intermediate}/3
              </ResponsiveText>
              <ResponsiveText size="sm" weight="medium" className="text-yellow-700">
                Intermediate
              </ResponsiveText>
              <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all"
                  style={{ width: `${(exerciseAnalysis.intermediate / 3) * 100}%` }}
                />
              </div>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <ResponsiveText size="2xl" weight="bold" className="text-red-900">
                {exerciseAnalysis.advanced}/3
              </ResponsiveText>
              <ResponsiveText size="sm" weight="medium" className="text-red-700">
                Advanced
              </ResponsiveText>
              <div className="w-full bg-red-200 rounded-full h-2 mt-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${(exerciseAnalysis.advanced / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="text-center">
            <ResponsiveText size="lg" weight="medium" className="text-indigo-900">
              {exerciseAnalysis.total} of 9 Exercises Completed
            </ResponsiveText>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all"
                style={{ width: `${(exerciseAnalysis.total / 9) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </ResponsiveCard>

      {/* Weekly Progress Chart */}
      <ResponsiveCard>
        <ResponsiveText size="lg" weight="semibold" className="mb-4">
          Weekly Progress
        </ResponsiveText>

        <div className="space-y-4">
          {weeklyProgress.map((week, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-16 text-sm font-medium text-gray-700">
                {week.week}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-6">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-6 rounded-full transition-all flex items-center justify-end pr-2"
                      style={{ width: `${Math.min(100, (week.avgAccuracy / 100) * 100)}%` }}
                    >
                      {week.sessions > 0 && (
                        <span className="text-xs text-white font-medium">
                          {week.avgAccuracy}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {week.sessions > 0 && (
                  <div className="text-xs text-gray-600">
                    {week.sessions} sessions • {week.totalMinutes} min • {week.streak} day streak
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ResponsiveCard>

      {/* Improvement Recommendations */}
      <ResponsiveCard>
        <ResponsiveText size="lg" weight="semibold" className="mb-4">
          🎯 Improvement Recommendations
        </ResponsiveText>

        <div className="space-y-3">
          {improvementRecommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
              <span className="text-indigo-600 font-bold">{index + 1}.</span>
              <ResponsiveText size="md" className="text-indigo-800">
                {recommendation}
              </ResponsiveText>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <ResponsiveButton
            onClick={onExportData}
            variant="outline"
            size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg' }}
          >
            📊 Export Detailed Report
          </ResponsiveButton>
        </div>
      </ResponsiveCard>
    </div>
  );
}