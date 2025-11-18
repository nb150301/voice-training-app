/**
 * Advanced Practice Modes
 * UI/UX Phase 3: Advanced Features
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  ResponsiveCard,
  ResponsiveText,
  ResponsiveButton,
  ResponsiveGrid,
} from './ui/ResponsiveLayout';
import { useResponsiveBreakpoints } from '../../hooks/useResponsiveBreakpoints';
import { useUserProfile } from './UserProfileManager';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'interval' | 'scale' | 'pitch_match' | 'rhythm' | 'endurance' | 'expression';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  targetPitches?: number[];
  rhythmPattern?: number[];
  scoring: {
    accuracy: number;
    timing: number;
    consistency: number;
    expression: number;
  };
  requirements: {
    minAccuracy: number;
    maxDeviation: number;
    timeWindow: number;
  };
  rewards: {
    xp: number;
    achievement?: string;
    badge?: string;
  };
}

export interface PracticeSession {
  id: string;
  challenge: Challenge;
  startTime: number;
  endTime?: number;
  score: number;
  accuracy: number;
  completed: boolean;
  feedback: string[];
  improvements: string[];
}

const practiceChallenges: Challenge[] = [
  // Interval Challenges
  {
    id: 'perfect_fifths',
    title: 'Perfect Fifths',
    description: 'Sing perfect fifths (Do-Sol) with accuracy',
    type: 'interval',
    difficulty: 'beginner',
    duration: 60,
    targetPitches: [261, 392], // C to G
    scoring: { accuracy: 50, timing: 30, consistency: 20, expression: 0 },
    requirements: { minAccuracy: 85, maxDeviation: 10, timeWindow: 2000 },
    rewards: { xp: 30 },
  },
  {
    id: 'melodic_thirds',
    title: 'Melodic Thirds',
    description: 'Navigate major and minor thirds smoothly',
    type: 'interval',
    difficulty: 'intermediate',
    duration: 90,
    targetPitches: [261, 329, 392, 329, 440, 349], // C-E-G-E-A-F
    scoring: { accuracy: 40, timing: 30, consistency: 30, expression: 0 },
    requirements: { minAccuracy: 80, maxDeviation: 8, timeWindow: 1500 },
    rewards: { xp: 50, achievement: 'interval_master' },
  },

  // Scale Challenges
  {
    id: 'major_scale_speed',
    title: 'Major Scale Speed Run',
    description: 'Complete major scale within time limit',
    type: 'scale',
    difficulty: 'intermediate',
    duration: 30,
    targetPitches: [261, 293, 329, 349, 392, 440, 493, 523, 493, 440, 392, 349, 329, 293, 261],
    scoring: { accuracy: 30, timing: 50, consistency: 20, expression: 0 },
    requirements: { minAccuracy: 75, maxDeviation: 15, timeWindow: 1000 },
    rewards: { xp: 40 },
  },
  {
    id: 'chromatic_challenge',
    title: 'Chromatic Challenge',
    description: 'Navigate chromatic scale with precision',
    type: 'scale',
    difficulty: 'advanced',
    duration: 45,
    targetPitches: [261, 277, 293, 311, 329, 349, 369, 392, 415, 440],
    scoring: { accuracy: 60, timing: 20, consistency: 20, expression: 0 },
    requirements: { minAccuracy: 90, maxDeviation: 5, timeWindow: 800 },
    rewards: { xp: 75, achievement: 'chromatic_master' },
  },

  // Pitch Matching Challenges
  {
    id: 'random_pitch_match',
    title: 'Random Pitch Match',
    description: 'Match randomly generated pitches',
    type: 'pitch_match',
    difficulty: 'beginner',
    duration: 120,
    scoring: { accuracy: 100, timing: 0, consistency: 0, expression: 0 },
    requirements: { minAccuracy: 80, maxDeviation: 20, timeWindow: 3000 },
    rewards: { xp: 25 },
  },
  {
    id: 'harmony_builder',
    title: 'Harmony Builder',
    description: 'Sing harmony lines to played melodies',
    type: 'pitch_match',
    difficulty: 'advanced',
    duration: 180,
    scoring: { accuracy: 50, timing: 20, consistency: 20, expression: 10 },
    requirements: { minAccuracy: 85, maxDeviation: 10, timeWindow: 1500 },
    rewards: { xp: 100, achievement: 'harmony_hero' },
  },

  // Rhythm Challenges
  {
    id: 'rhythm_clinic',
    title: 'Rhythm Clinic',
    description: 'Maintain steady rhythm while changing pitches',
    type: 'rhythm',
    difficulty: 'intermediate',
    duration: 90,
    rhythmPattern: [1, 1, 0.5, 0.5, 1, 2], // Note durations
    scoring: { accuracy: 30, timing: 50, consistency: 20, expression: 0 },
    requirements: { minAccuracy: 80, maxDeviation: 12, timeWindow: 1200 },
    rewards: { xp: 45 },
  },

  // Endurance Challenges
  {
    id: 'long_tone_challenge',
    title: 'Long Tone Challenge',
    description: 'Hold a single note for 30 seconds',
    type: 'endurance',
    difficulty: 'beginner',
    duration: 45,
    scoring: { accuracy: 60, timing: 0, consistency: 40, expression: 0 },
    requirements: { minAccuracy: 85, maxDeviation: 8, timeWindow: 30000 },
    rewards: { xp: 35 },
  },
  {
    id: 'vibrato_control',
    title: 'Vibrato Control',
    description: 'Control vibrato speed and width',
    type: 'expression',
    difficulty: 'advanced',
    duration: 60,
    scoring: { accuracy: 30, timing: 20, consistency: 30, expression: 20 },
    requirements: { minAccuracy: 80, maxDeviation: 10, timeWindow: 2000 },
    rewards: { xp: 60, achievement: 'vibrato_virtuoso' },
  },

  // Expression Challenges
  {
    id: 'dynamic_journey',
    title: 'Dynamic Journey',
    description: 'Move smoothly between loud and soft',
    type: 'expression',
    difficulty: 'intermediate',
    duration: 80,
    scoring: { accuracy: 30, timing: 20, consistency: 20, expression: 30 },
    requirements: { minAccuracy: 75, maxDeviation: 15, timeWindow: 2500 },
    rewards: { xp: 55 },
  },
];

interface PracticeModesProps {
  onSessionComplete: (session: PracticeSession) => void;
}

export default function PracticeModes({ onSessionComplete }: PracticeModesProps) {
  const { profile } = useUserProfile();
  const { isMobile } = useResponsiveBreakpoints();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [feedback, setFeedback] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const voiceType = profile?.voiceProfile?.voiceType || 'unknown';

  // Filter challenges based on user level and voice type
  const userLevel = profile?.progress?.totalSessions ? Math.min(8, Math.floor(profile.progress.totalSessions / 10) + 1) : 1;
  const availableChallenges = practiceChallenges.filter(challenge => {
    // Filter by difficulty based on user level
    const difficultyMap = { beginner: 1, intermediate: 3, advanced: 5 };
    const challengeLevel = difficultyMap[challenge.difficulty];

    return challengeLevel <= userLevel;
  });

  // Adjust challenge target pitches based on voice type
  const getAdjustedChallenge = (challenge: Challenge): Challenge => {
    if (voiceType === 'unknown' || !challenge.targetPitches) return challenge;

    const voiceRanges = {
      soprano: { min: 500, max: 1200, factor: 1.5 },
      alto: { min: 350, max: 900, factor: 1.2 },
      tenor: { min: 200, max: 600, factor: 0.9 },
      bass: { min: 80, max: 350, factor: 0.7 },
    };

    const range = voiceRanges[voiceType as keyof typeof voiceRanges];
    const adjustedPitches = challenge.targetPitches.map(pitch =>
      Math.round(pitch * range.factor)
    );

    return { ...challenge, targetPitches: adjustedPitches };
  };

  const startChallenge = (challenge: Challenge) => {
    const adjustedChallenge = getAdjustedChallenge(challenge);
    setSelectedChallenge(adjustedChallenge);

    const session: PracticeSession = {
      id: `session_${Date.now()}`,
      challenge: adjustedChallenge,
      startTime: Date.now(),
      score: 0,
      accuracy: 0,
      completed: false,
      feedback: [],
      improvements: [],
    };

    setCurrentSession(session);
    setIsPlaying(true);
    setTimeRemaining(challenge.duration);
    setScore(0);
    setFeedback(['Challenge started! Good luck! 🎯']);
  };

  // Simulate real-time scoring during practice
  useEffect(() => {
    if (!isPlaying || !currentSession || timeRemaining <= 0) {
      if (timeRemaining <= 0 && currentSession) {
        completeSession();
      }
      return;
    }

    const timer = setTimeout(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));

      // Simulate score updates (in real implementation, this would be based on actual pitch detection)
      if (Math.random() > 0.3) {
        const scoreGain = Math.floor(Math.random() * 10) + 5;
        setScore(prev => prev + scoreGain);

        setFeedback(prev => [
          ...prev.slice(-2),
          `Great pitch control! +${scoreGain} points`
        ]);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isPlaying, timeRemaining, currentSession]);

  const completeSession = () => {
    if (!currentSession) return;

    const finalScore = Math.min(1000, score);
    const accuracy = Math.min(100, Math.floor((score / 1000) * 100));

    const completedSession: PracticeSession = {
      ...currentSession,
      endTime: Date.now(),
      score: finalScore,
      accuracy,
      completed: true,
      feedback: [...feedback, getPerformanceFeedback(accuracy)],
      improvements: getImprovementSuggestions(accuracy, currentSession.challenge),
    };

    setCurrentSession(completedSession);
    setIsPlaying(false);
    onSessionComplete(completedSession);
  };

  const getPerformanceFeedback = (accuracy: number): string => {
    if (accuracy >= 95) return 'Outstanding! Perfect performance! 🌟';
    if (accuracy >= 85) return 'Excellent work! Very impressive! 🎉';
    if (accuracy >= 75) return 'Great job! Keep up the good work! 👏';
    if (accuracy >= 65) return 'Good effort! Room for improvement! 💪';
    return 'Keep practicing! You\'ll get better! 🎯';
  };

  const getImprovementSuggestions = (accuracy: number, challenge: Challenge): string[] => {
    const suggestions: string[] = [];

    if (accuracy < 80) {
      suggestions.push('Focus on steady breath support');
      suggestions.push('Practice with a tuner for reference');
    }

    if (challenge.scoring.timing > 0) {
      suggestions.push('Work on your timing and rhythm');
    }

    if (challenge.scoring.consistency > 0) {
      suggestions.push('Maintain consistent tone quality');
    }

    if (challenge.scoring.expression > 0) {
      suggestions.push('Add more emotional expression');
    }

    return suggestions;
  };

  const stopChallenge = () => {
    if (currentSession) {
      completeSession();
    }
  };

  const getDifficultyColor = (difficulty: Challenge['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-50 border-green-300 text-green-700';
      case 'intermediate': return 'bg-yellow-50 border-yellow-300 text-yellow-700';
      case 'advanced': return 'bg-red-50 border-red-300 text-red-700';
      default: return 'bg-gray-50 border-gray-300 text-gray-700';
    }
  };

  const getTypeIcon = (type: Challenge['type']) => {
    switch (type) {
      case 'interval': return '🎵';
      case 'scale': return '🎼';
      case 'pitch_match': return '🎯';
      case 'rhythm': return '🥁';
      case 'endurance': return '⏱️';
      case 'expression': return '🎭';
      default: return '🎤';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Active Challenge View */}
      {currentSession && (
        <ResponsiveCard className="border-2 border-indigo-300 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="space-y-6">
            <div className="text-center">
              <ResponsiveText size="2xl" weight="semibold" className="text-indigo-900">
                {currentSession.challenge.title}
              </ResponsiveText>
              <ResponsiveText size="md" color="text-indigo-700" className="mt-1">
                {currentSession.challenge.description}
              </ResponsiveText>
            </div>

            {/* Score and Progress */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <ResponsiveText size="lg" weight="semibold" className="text-indigo-900">
                  {score}
                </ResponsiveText>
                <ResponsiveText size="sm" color="text-indigo-600">
                  Score
                </ResponsiveText>
              </div>
              <div className="text-center">
                <ResponsiveText size="lg" weight="semibold" className="text-indigo-900">
                  {formatTime(timeRemaining)}
                </ResponsiveText>
                <ResponsiveText size="sm" color="text-indigo-600">
                  Time Remaining
                </ResponsiveText>
              </div>
              <div className="text-center">
                <ResponsiveText size="lg" weight="semibold" className="text-indigo-900">
                  {Math.min(100, Math.floor((score / 1000) * 100))}%
                </ResponsiveText>
                <ResponsiveText size="sm" color="text-indigo-600">
                  Accuracy
                </ResponsiveText>
              </div>
            </div>

            {/* Real-time Feedback */}
            <div className="bg-white rounded-lg p-4 max-h-32 overflow-y-auto">
              <ResponsiveText size="sm" weight="semibold" className="text-gray-700 mb-2">
                Live Feedback:
              </ResponsiveText>
              <div className="space-y-1">
                {feedback.map((msg, index) => (
                  <div key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-indigo-500">▸</span>
                    <span>{msg}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex justify-center gap-4">
              <ResponsiveButton
                onClick={stopChallenge}
                variant="outline"
                size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg' }}
              >
                ⏹️ End Challenge
              </ResponsiveButton>
            </div>

            {/* Target Pitches Display */}
            {currentSession.challenge.targetPitches && (
              <div className="text-center">
                <ResponsiveText size="sm" color="text-gray-600" className="mb-2">
                  Target Sequence:
                </ResponsiveText>
                <div className="flex justify-center gap-2 flex-wrap">
                  {currentSession.challenge.targetPitches.map((pitch, index) => (
                    <div key={index} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                      {pitch} Hz
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ResponsiveCard>
      )}

      {/* Challenge Selection */}
      {!isPlaying && (
        <div className="space-y-6">
          <div className="text-center">
            <ResponsiveText size="2xl" weight="semibold">
              Practice Challenges
            </ResponsiveText>
            <ResponsiveText size="md" color="text-gray-600" className="mt-1">
              Test your skills with specialized exercises
            </ResponsiveText>
          </div>

          {/* Stats Overview */}
          <ResponsiveCard className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-900">
                  {availableChallenges.length}
                </div>
                <div className="text-sm text-blue-700">Available</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-900">
                  Level {userLevel}
                </div>
                <div className="text-sm text-green-700">Your Level</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-900">
                  {voiceType !== 'unknown' ? voiceType : '??'}
                </div>
                <div className="text-sm text-purple-700">Voice Type</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-900">
                  {profile?.progress?.totalSessions || 0}
                </div>
                <div className="text-sm text-orange-700">Sessions</div>
              </div>
            </div>
          </ResponsiveCard>

          {/* Challenges Grid */}
          <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3, large: 3 }} gap={4}>
            {availableChallenges.map(challenge => {
              const adjustedChallenge = getAdjustedChallenge(challenge);

              return (
                <ResponsiveCard
                  key={challenge.id}
                  className={`hover:shadow-lg transition-all cursor-pointer ${getDifficultyColor(challenge.difficulty)}`}
                  onClick={() => startChallenge(challenge)}
                >
                  <div className="text-center space-y-3">
                    <div className="text-4xl">
                      {getTypeIcon(challenge.type)}
                    </div>

                    <div>
                      <ResponsiveText size="md" weight="semibold">
                        {adjustedChallenge.title}
                      </ResponsiveText>
                      <ResponsiveText size="sm" className="mt-1">
                        {adjustedChallenge.description}
                      </ResponsiveText>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="capitalize font-medium">
                        {challenge.difficulty}
                      </span>
                      <span className="flex items-center gap-1">
                        ⏱️ {formatTime(challenge.duration)}
                      </span>
                    </div>

                    <div className="text-sm font-medium text-indigo-600">
                      +{challenge.rewards.xp} XP
                    </div>

                    {challenge.rewards.achievement && (
                      <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                        🏆 {challenge.rewards.achievement.replace('_', ' ')}
                      </div>
                    )}

                    <ResponsiveButton
                      variant="primary"
                      size={{ mobile: 'md', tablet: 'md', desktop: 'md' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        startChallenge(challenge);
                      }}
                    >
                      🎯 Start Challenge
                    </ResponsiveButton>
                  </div>
                </ResponsiveCard>
              );
            })}
          </ResponsiveGrid>

          {/* Locked Challenges Preview */}
          {availableChallenges.length < practiceChallenges.length && (
            <ResponsiveCard className="bg-gray-50">
              <ResponsiveText size="lg" weight="semibold" className="mb-4 text-center">
                🔒 More Challenges Available
              </ResponsiveText>
              <ResponsiveText size="md" color="text-gray-600" className="text-center">
                Complete more practice sessions to unlock advanced challenges
              </ResponsiveText>
            </ResponsiveCard>
          )}
        </div>
      )}
    </div>
  );
}