/**
 * Learning Path Component
 * Progressive learning system with skill levels and structured exercises
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ResponsiveCard,
  ResponsiveText,
  ResponsiveButton,
  ResponsiveGrid,
} from './ui/ResponsiveLayout';
import { useResponsiveBreakpoints } from '../../hooks/useResponsiveBreakpoints';
import { useUserProfile } from './UserProfileManager';
import { InfoIcon, HelpIcon } from './ui/Tooltip';

export interface Exercise {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in seconds
  targetPitch?: number;
  targetRange?: { min: number; max: number };
  instructions: string[];
  tips: string[];
  completedAt?: string;
  bestScore?: number;
}

export interface SkillLevel {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  exercises: Exercise[];
  isUnlocked: boolean;
  completionPercentage: number;
}

interface LearningPathProps {
  onExerciseSelect: (exercise: Exercise) => void;
}

const defaultExercises: Exercise[] = [
  // Beginner Exercises
  {
    id: 'sustained-note-c',
    title: 'Sustained C Note',
    description: 'Practice holding a steady C note (261 Hz)',
    difficulty: 'beginner',
    duration: 10,
    targetPitch: 261,
    instructions: [
      'Take a deep breath from your diaphragm',
      'Sing "ah" at middle C (261 Hz)',
      'Hold the note steadily for 10 seconds',
      'Focus on keeping the pitch stable',
    ],
    tips: [
      'Use a piano or tuner for reference',
      'Keep your shoulders relaxed',
      'Support with steady breath flow',
    ],
  },
  {
    id: 'five-note-scale',
    title: 'Five Note Scale',
    description: 'Sing a simple C-D-E-F-G scale',
    difficulty: 'beginner',
    duration: 15,
    targetRange: { min: 261, max: 392 },
    instructions: [
      'Start on middle C (261 Hz)',
      'Sing up: C-D-E-F-G',
      'Then back down: G-F-E-D-C',
      'Move smoothly between notes',
    ],
    tips: [
      'Keep each note clear and steady',
      'Don\'t rush between notes',
      'Breathe deeply before starting',
    ],
  },
  {
    id: 'pitch-matching',
    title: 'Pitch Matching',
    description: 'Match random pitches played for you',
    difficulty: 'beginner',
    duration: 20,
    instructions: [
      'Listen to the played pitch',
      'Sing it back accurately',
      'Check your accuracy with feedback',
      'Try different pitches',
    ],
    tips: [
      'Take a moment to listen carefully',
      'Hum the pitch first before singing',
      'Use visual feedback to adjust',
    ],
  },

  // Intermediate Exercises
  {
    id: 'major-arpeggios',
    title: 'Major Arpeggios',
    description: 'Practice major chord arpeggios in different keys',
    difficulty: 'intermediate',
    duration: 20,
    instructions: [
      'Sing root-third-fifth-root pattern',
      'Practice in C major: C-E-G-C',
      'Try F major and G major',
      'Keep intervals accurate',
    ],
    tips: [
      'Think of "Twinkle Twinkle Little Star"',
      'Record yourself to check accuracy',
      'Practice slowly at first',
    ],
  },
  {
    id: 'interval-jumps',
    title: 'Interval Jumps',
    description: 'Practice jumping between specific intervals',
    difficulty: 'intermediate',
    duration: 25,
    instructions: [
      'Practice 3rds: Do-Re-Do, Re-Mi-Re',
      'Practice 5ths: Do-Sol-Do',
      'Practice octaves: Do-high Do-Do',
      'Keep landings accurate',
    ],
    tips: [
      'Visualize the target note before singing',
      'Support larger jumps with more breath',
      'Start with smaller intervals',
    ],
  },
  {
    id: 'vibrato-control',
    title: 'Vibrato Control',
    description: 'Develop controlled vibrato technique',
    difficulty: 'intermediate',
    duration: 30,
    instructions: [
      'Start with a straight tone (no vibrato)',
      'Add gentle pulsation gradually',
      'Control speed and width',
      'Return to straight tone',
    ],
    tips: [
      'Vibrato comes from relaxed support',
      'Don\'t force throat tension',
      'Practice with different tempos',
    ],
  },

  // Advanced Exercises
  {
    id: 'coloratura-runs',
    title: 'Coloratura Runs',
    description: 'Practice fast melismatic runs',
    difficulty: 'advanced',
    duration: 30,
    instructions: [
      'Start with simple 3-note runs',
      'Practice different rhythmic patterns',
      'Keep each note distinct',
      'Gradually increase speed',
    ],
    tips: [
      'Use consistent breath support',
      'Keep tongue and jaw relaxed',
      'Practice with syllables like "la" or "ta"',
    ],
  },
  {
    id: 'wide-leaps',
    title: 'Wide Interval Leaps',
    description: 'Master large intervals across your range',
    difficulty: 'advanced',
    duration: 35,
    instructions: [
      'Practice leaps of 6ths, 7ths, octaves',
      'Keep both starting and ending pitches accurate',
      'Minimize sliding between notes',
      'Try different vowel sounds',
    ],
    tips: [
      'Prepare breath before large leaps',
      'Think the target note clearly',
      'Keep face muscles relaxed',
    ],
  },
  {
    id: 'dynamic-control',
    title: 'Dynamic Control',
    description: 'Control volume while maintaining pitch',
    difficulty: 'advanced',
    duration: 40,
    instructions: [
      'Sing a sustained note from loud to soft',
      'Then soft to loud',
      'Keep pitch steady throughout',
      'Practice crescendo and decrescendo',
    ],
    tips: [
      'Dynamic control comes from breath support',
      'Don\'t tense up when singing softly',
      'Keep consistent resonance',
    ],
  },
];

const getSkillLevels = (voiceType: string): SkillLevel[] => [
  {
    id: 'foundations',
    title: 'Vocal Foundations',
    description: 'Build essential pitch control and breathing techniques',
    icon: '🎯',
    difficulty: 'beginner',
    prerequisites: [],
    exercises: defaultExercises.filter(e => e.difficulty === 'beginner'),
    isUnlocked: true,
    completionPercentage: 0,
  },
  {
    id: 'intermediate',
    title: 'Pitch Precision',
    description: 'Develop accuracy and control with more complex patterns',
    icon: '🎵',
    difficulty: 'intermediate',
    prerequisites: ['foundations'],
    exercises: defaultExercises.filter(e => e.difficulty === 'intermediate'),
    isUnlocked: false,
    completionPercentage: 0,
  },
  {
    id: 'advanced',
    title: 'Artistic Mastery',
    description: 'Master advanced techniques and musical expression',
    icon: '🎼',
    difficulty: 'advanced',
    prerequisites: ['foundations', 'intermediate'],
    exercises: defaultExercises.filter(e => e.difficulty === 'advanced'),
    isUnlocked: false,
    completionPercentage: 0,
  },
];

export default function LearningPath({ onExerciseSelect }: LearningPathProps) {
  const { profile, updateProgress } = useUserProfile();
  const { isMobile } = useResponsiveBreakpoints();
  const [selectedLevel, setSelectedLevel] = useState<string>('foundations');

  const voiceType = profile?.voiceProfile?.voiceType || 'unknown';
  const skillLevels = getSkillLevels(voiceType);

  // Update completion percentages based on user progress
  skillLevels.forEach((level, index) => {
    if (index === 0) {
      level.isUnlocked = true;
    } else {
      const prerequisiteLevels = skillLevels.filter(l => level.prerequisites.includes(l.id));
      level.isUnlocked = prerequisiteLevels.every(l => l.completionPercentage >= 80);
    }

    // Calculate completion percentage based on completed exercises
    const completedExercises = level.exercises.filter(exercise =>
      profile?.progress?.completedExercises?.includes(exercise.id)
    );
    level.completionPercentage = Math.round((completedExercises.length / level.exercises.length) * 100);
  });

  const selectedLevelData = skillLevels.find(l => l.id === selectedLevel) || skillLevels[0];

  const getDifficultyColor = (difficulty: Exercise['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-50';
      case 'intermediate': return 'text-yellow-600 bg-yellow-50';
      case 'advanced': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getDifficultyEmoji = (difficulty: Exercise['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return '🟢';
      case 'intermediate': return '🟡';
      case 'advanced': return '🔴';
      default: return '⚪';
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  const handleExerciseComplete = (exerciseId: string, score: number) => {
    const completedExercises = [...(profile?.progress?.completedExercises || [])];
    if (!completedExercises.includes(exerciseId)) {
      completedExercises.push(exerciseId);
      updateProgress({ completedExercises });
    }
  };

  const getPersonalizedDifficulty = (exercise: Exercise) => {
    if (!profile?.voiceProfile || profile.voiceProfile.voiceType === 'unknown') {
      return exercise.difficulty;
    }

    // Adjust difficulty based on voice type and target pitch
    if (exercise.targetPitch) {
      const voiceRange = profile.voiceProfile.comfortableRange;
      if (exercise.targetPitch < voiceRange.min || exercise.targetPitch > voiceRange.max) {
        return exercise.difficulty === 'beginner' ? 'intermediate' : 'advanced';
      }
    }

    return exercise.difficulty;
  };

  return (
    <div className="space-y-6">
      {/* Skill Levels Overview */}
      <ResponsiveCard>
        <div className="text-center space-y-4">
          <ResponsiveText size="2xl" weight="semibold">
            Your Learning Journey
          </ResponsiveText>
          <ResponsiveText size="md" color="text-gray-600">
            Progress through skill levels to master voice control
          </ResponsiveText>
        </div>

        <ResponsiveGrid cols={{ mobile: 1, tablet: 3, desktop: 3 }} gap={4} className="mt-6">
          {skillLevels.map((level) => (
            <button
              key={level.id}
              onClick={() => level.isUnlocked && setSelectedLevel(level.id)}
              disabled={!level.isUnlocked}
              className={`
                relative p-6 rounded-lg border-2 transition-all
                ${selectedLevel === level.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : level.isUnlocked
                  ? 'border-gray-200 hover:border-indigo-300 bg-white'
                  : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                }
              `}
            >
              <div className="text-center space-y-3">
                <div className="text-4xl">{level.icon}</div>
                <div>
                  <ResponsiveText size="lg" weight="semibold">
                    {level.title}
                  </ResponsiveText>
                  <ResponsiveText size="sm" color="text-gray-600" className="mt-1">
                    {level.description}
                  </ResponsiveText>
                </div>

                {!level.isUnlocked && (
                  <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                    🔒 Complete previous levels
                  </div>
                )}

                {level.isUnlocked && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Progress</span>
                      <span>{level.completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${level.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-center items-center gap-1">
                  <span className="text-2xl">{getDifficultyEmoji(level.difficulty)}</span>
                  <ResponsiveText size="xs" color="text-gray-500" className="capitalize">
                    {level.difficulty}
                  </ResponsiveText>
                </div>
              </div>
            </button>
          ))}
        </ResponsiveGrid>
      </ResponsiveCard>

      {/* Selected Level Details */}
      <ResponsiveCard>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedLevelData.icon}</span>
              <div>
                <ResponsiveText size="xl" weight="semibold">
                  {selectedLevelData.title}
                </ResponsiveText>
                <ResponsiveText size="md" color="text-gray-600">
                  {selectedLevelData.description}
                </ResponsiveText>
              </div>
            </div>
            <HelpIcon
              content={`Complete ${Math.ceil(selectedLevelData.exercises.length * 0.8)} exercises to unlock the next level`}
              size="md"
            />
          </div>

          {/* Voice Type Specific Tips */}
          {voiceType !== 'unknown' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <InfoIcon
                  content={`These exercises are tailored for ${voiceType} voice types`}
                  size="sm"
                />
                <ResponsiveText size="md" weight="medium" color="text-blue-900">
                  Personalized for {voiceType} voice
                </ResponsiveText>
              </div>
              <ResponsiveText size="sm" color="text-blue-700">
                {voiceType === 'soprano' && 'Focus on breath support for higher exercises and gentle approach to lower notes.'}
                {voiceType === 'alto' && 'These exercises work perfectly with your rich middle range.'}
                {voiceType === 'tenor' && 'Build strong breath support for the advanced upper register exercises.'}
                {voiceType === 'bass' && 'These exercises will help develop resonance in your natural range.'}
              </ResponsiveText>
            </div>
          )}

          {/* Exercise List */}
          <div className="space-y-4">
            <ResponsiveText size="lg" weight="semibold">
              Exercises ({selectedLevelData.exercises.length})
            </ResponsiveText>

            {selectedLevelData.exercises.map((exercise) => {
              const isCompleted = profile?.progress?.completedExercises?.includes(exercise.id);
              const personalizedDifficulty = getPersonalizedDifficulty(exercise);

              return (
                <div
                  key={exercise.id}
                  className={`
                    border rounded-lg p-4 transition-all
                    ${isCompleted
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:border-indigo-300'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {isCompleted && <span className="text-green-600 text-xl">✅</span>}
                        <ResponsiveText size="md" weight="semibold">
                          {exercise.title}
                        </ResponsiveText>
                        <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(personalizedDifficulty)}`}>
                          {getDifficultyEmoji(personalizedDifficulty)} {personalizedDifficulty}
                        </span>
                      </div>

                      <ResponsiveText size="sm" color="text-gray-600" className="mb-3">
                        {exercise.description}
                      </ResponsiveText>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <ResponsiveText size="sm" weight="medium" className="mb-1">
                            Instructions:
                          </ResponsiveText>
                          <ul className="space-y-1">
                            {exercise.instructions.map((instruction, index) => (
                              <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                                <span>{index + 1}.</span>
                                <span>{instruction}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <ResponsiveText size="sm" weight="medium" className="mb-1">
                            Tips:
                          </ResponsiveText>
                          <ul className="space-y-1">
                            {exercise.tips.map((tip, index) => (
                              <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                                <span>💡</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>⏱️ {formatDuration(exercise.duration)}</span>
                          {exercise.targetPitch && (
                            <span>🎯 {exercise.targetPitch} Hz</span>
                          )}
                          {exercise.targetRange && (
                            <span>🎼 {exercise.targetRange.min}-{exercise.targetRange.max} Hz</span>
                          )}
                        </div>

                        <ResponsiveButton
                          onClick={() => onExerciseSelect(exercise)}
                          variant={isCompleted ? "outline" : "primary"}
                          size={{ mobile: 'sm', tablet: 'md', desktop: 'md' }}
                        >
                          {isCompleted ? '🔄 Practice Again' : '▶️ Start Exercise'}
                        </ResponsiveButton>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ResponsiveCard>
    </div>
  );
}