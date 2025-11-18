/**
 * Achievements and Gamification System
 * UI/UX Phase 3: Advanced Features
 */

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ResponsiveCard,
  ResponsiveText,
  ResponsiveButton,
  ResponsiveGrid,
} from './ui/ResponsiveLayout';
import { useResponsiveBreakpoints } from '../../hooks/useResponsiveBreakpoints';
import { useUserProfile } from './UserProfileManager';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'milestone' | 'skill' | 'consistency' | 'exploration';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: {
    type: 'streak' | 'sessions' | 'accuracy' | 'exercises' | 'time';
    target: number;
    condition?: string;
  };
  points: number;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

export interface UserLevel {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
  icon: string;
  rewards: string[];
}

const defaultAchievements: Achievement[] = [
  // Milestone Achievements
  {
    id: 'first_note',
    title: 'First Note',
    description: 'Complete your first recording session',
    icon: '🎵',
    category: 'milestone',
    rarity: 'common',
    requirements: { type: 'sessions', target: 1 },
    points: 10,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Maintain a 7-day practice streak',
    icon: '🔥',
    category: 'consistency',
    rarity: 'rare',
    requirements: { type: 'streak', target: 7 },
    points: 50,
    progress: 0,
    maxProgress: 7,
  },
  {
    id: 'month_master',
    title: 'Month Master',
    description: 'Maintain a 30-day practice streak',
    icon: '⭐',
    category: 'consistency',
    rarity: 'epic',
    requirements: { type: 'streak', target: 30 },
    points: 200,
    progress: 0,
    maxProgress: 30,
  },
  {
    id: 'century_club',
    title: 'Century Club',
    description: 'Complete 100 practice sessions',
    icon: '💯',
    category: 'milestone',
    rarity: 'legendary',
    requirements: { type: 'sessions', target: 100 },
    points: 500,
    progress: 0,
    maxProgress: 100,
  },

  // Skill Achievements
  {
    id: 'pitch_perfect',
    title: 'Pitch Perfect',
    description: 'Achieve 95% accuracy in a single session',
    icon: '🎯',
    category: 'skill',
    rarity: 'rare',
    requirements: { type: 'accuracy', target: 95 },
    points: 75,
    progress: 0,
    maxProgress: 95,
  },
  {
    id: 'steady_hand',
    title: 'Steady Hand',
    description: 'Hold a note steady for 30 seconds',
    icon: '⏱️',
    category: 'skill',
    rarity: 'common',
    requirements: { type: 'time', target: 30 },
    points: 25,
    progress: 0,
    maxProgress: 30,
  },
  {
    id: 'exercise_explorer',
    title: 'Exercise Explorer',
    description: 'Complete all beginner exercises',
    icon: '🗺️',
    category: 'exploration',
    rarity: 'common',
    requirements: { type: 'exercises', target: 3, condition: 'beginner' },
    points: 40,
    progress: 0,
    maxProgress: 3,
  },
  {
    id: 'intermediate_innovator',
    title: 'Intermediate Innovator',
    description: 'Complete all intermediate exercises',
    icon: '🚀',
    category: 'skill',
    rarity: 'rare',
    requirements: { type: 'exercises', target: 3, condition: 'intermediate' },
    points: 100,
    progress: 0,
    maxProgress: 3,
  },
  {
    id: 'advanced_artist',
    title: 'Advanced Artist',
    description: 'Complete all advanced exercises',
    icon: '🎨',
    category: 'skill',
    rarity: 'epic',
    requirements: { type: 'exercises', target: 3, condition: 'advanced' },
    points: 150,
    progress: 0,
    maxProgress: 3,
  },

  // Consistency Achievements
  {
    id: 'daily_devotee',
    title: 'Daily Devotee',
    description: 'Practice for 7 consecutive days',
    icon: '📅',
    category: 'consistency',
    rarity: 'common',
    requirements: { type: 'streak', target: 7 },
    points: 35,
    progress: 0,
    maxProgress: 7,
  },
  {
    id: 'time_traveler',
    title: 'Time Traveler',
    description: 'Practice for a total of 10 hours',
    icon: '⏰',
    category: 'consistency',
    rarity: 'rare',
    requirements: { type: 'time', target: 36000 }, // 10 hours in seconds
    points: 80,
    progress: 0,
    maxProgress: 36000,
  },
  {
    id: 'marathon_singer',
    title: 'Marathon Singer',
    description: 'Practice for a total of 50 hours',
    icon: '🏃‍♀️',
    category: 'consistency',
    rarity: 'legendary',
    requirements: { type: 'time', target: 180000 }, // 50 hours in seconds
    points: 300,
    progress: 0,
    maxProgress: 180000,
  },

  // Exploration Achievements
  {
    id: 'voice_discoverer',
    title: 'Voice Discoverer',
    description: 'Complete voice type detection',
    icon: '🔍',
    category: 'exploration',
    rarity: 'common',
    requirements: { type: 'exercises', target: 1, condition: 'voice_detection' },
    points: 15,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'settings_sage',
    title: 'Settings Sage',
    description: 'Customize all audio settings',
    icon: '⚙️',
    category: 'exploration',
    rarity: 'common',
    requirements: { type: 'exercises', target: 1, condition: 'settings_customized' },
    points: 20,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'statistician',
    title: 'Statistician',
    description: 'View your statistics 50 times',
    icon: '📊',
    category: 'exploration',
    rarity: 'rare',
    requirements: { type: 'sessions', target: 50, condition: 'statistics_viewed' },
    points: 60,
    progress: 0,
    maxProgress: 50,
  },
];

const userLevels: UserLevel[] = [
  { level: 1, title: 'Novice Singer', minXP: 0, maxXP: 100, icon: '🎤', rewards: ['Voice Discovery'] },
  { level: 2, title: 'Beginning Vocalist', minXP: 100, maxXP: 250, icon: '🎵', rewards: ['Basic Exercises'] },
  { level: 3, title: 'Developing Artist', minXP: 250, maxXP: 500, icon: '🎶', rewards: ['Intermediate Exercises'] },
  { level: 4, title: 'Skilled Performer', minXP: 500, maxXP: 1000, icon: '🎤', rewards: ['Advanced Exercises'] },
  { level: 5, title: 'Expert Singer', minXP: 1000, maxXP: 2000, icon: '🎭', rewards: ['Custom Exercises'] },
  { level: 6, title: 'Master Vocalist', minXP: 2000, maxXP: 3500, icon: '🎼', rewards: ['Performance Analysis'] },
  { level: 7, title: 'Virtuoso', minXP: 3500, maxXP: 5000, icon: '🌟', rewards: ['Voice Mastery'] },
  { level: 8, title: 'Legend', minXP: 5000, maxXP: 10000, icon: '👑', rewards: ['Immortal Status'] },
];

interface AchievementsProps {
  onAchievementUnlocked?: (achievement: Achievement) => void;
}

export default function Achievements({ onAchievementUnlocked }: AchievementsProps) {
  const { profile, updateProgress } = useUserProfile();
  const { isMobile } = useResponsiveBreakpoints();
  const [achievements, setAchievements] = useState<Achievement[]>(defaultAchievements);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showNewAchievement, setShowNewAchievement] = useState<Achievement | null>(null);

  // Calculate user's current level and XP
  const userXP = profile?.progress?.totalSessions ? profile.progress.totalSessions * 10 : 0;
  const currentLevel = userLevels.find(level => userXP >= level.minXP && userXP < level.maxXP) || userLevels[0];
  const nextLevel = userLevels.find(level => level.level === currentLevel.level + 1);
  const progressToNextLevel = nextLevel ? ((userXP - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100 : 100;

  // Update achievements progress based on user profile
  useEffect(() => {
    const updatedAchievements = achievements.map(achievement => {
      let progress = 0;

      switch (achievement.requirements.type) {
        case 'sessions':
          progress = profile?.progress?.totalSessions || 0;
          break;
        case 'streak':
          progress = profile?.progress?.currentStreak || 0;
          break;
        case 'accuracy':
          progress = profile?.progress?.averagePitchAccuracy || 0;
          break;
        case 'time':
          progress = profile?.progress?.totalRecordingTime || 0;
          break;
        case 'exercises':
          if (achievement.requirements.condition === 'beginner') {
            progress = (profile?.progress?.completedExercises?.filter(id =>
              ['sustained-note-c', 'five-note-scale', 'pitch-matching'].includes(id)
            ).length) || 0;
          } else if (achievement.requirements.condition === 'intermediate') {
            progress = (profile?.progress?.completedExercises?.filter(id =>
              ['major-arpeggios', 'interval-jumps', 'vibrato-control'].includes(id)
            ).length) || 0;
          } else if (achievement.requirements.condition === 'advanced') {
            progress = (profile?.progress?.completedExercises?.filter(id =>
              ['coloratura-runs', 'wide-leaps', 'dynamic-control'].includes(id)
            ).length) || 0;
          } else {
            progress = profile?.progress?.completedExercises?.length || 0;
          }
          break;
      }

      const isUnlocked = progress >= achievement.requirements.target;
      const wasUnlocked = achievement.unlockedAt;

      // Check if achievement was just unlocked
      if (isUnlocked && !wasUnlocked) {
        const updatedAchievement = { ...achievement, progress, unlockedAt: new Date().toISOString() };
        setShowNewAchievement(updatedAchievement);
        setTimeout(() => setShowNewAchievement(null), 5000);
        return updatedAchievement;
      }

      return { ...achievement, progress, unlockedAt: wasUnlocked };
    });

    setAchievements(updatedAchievements);
  }, [profile]);

  const categories = [
    { id: 'all', name: 'All', icon: '🎯' },
    { id: 'milestone', name: 'Milestones', icon: '🏆' },
    { id: 'skill', name: 'Skills', icon: '⚡' },
    { id: 'consistency', name: 'Consistency', icon: '🔥' },
    { id: 'exploration', name: 'Exploration', icon: '🗺️' },
  ];

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'from-gray-50 to-gray-100 border-gray-300';
      case 'rare': return 'from-blue-50 to-blue-100 border-blue-300';
      case 'epic': return 'from-purple-50 to-purple-100 border-purple-300';
      case 'legendary': return 'from-yellow-50 to-yellow-100 border-yellow-300';
      default: return 'from-gray-50 to-gray-100 border-gray-300';
    }
  };

  const getRarityTextColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-700';
      case 'rare': return 'text-blue-700';
      case 'epic': return 'text-purple-700';
      case 'legendary': return 'text-yellow-700';
      default: return 'text-gray-700';
    }
  };

  const getRarityIcon = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return '⚪';
      case 'rare': return '🔵';
      case 'epic': return '🟣';
      case 'legendary': return '🟡';
      default: return '⚪';
    }
  };

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedAchievements = achievements.filter(a => a.unlockedAt);
  const totalAchievementPoints = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);

  return (
    <div className="space-y-6">
      {/* New Achievement Popup */}
      {showNewAchievement && (
        <div className="fixed top-4 right-4 z-50 max-w-sm animate-bounce">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎉</span>
              <div>
                <div className="font-bold">Achievement Unlocked!</div>
                <div className="text-sm">{showNewAchievement.title}</div>
                <div className="text-xs opacity-90">+{showNewAchievement.points} XP</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Level and Progress */}
      <ResponsiveCard className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <span className="text-5xl">{currentLevel.icon}</span>
            <div>
              <ResponsiveText size="2xl" weight="semibold" className="text-indigo-900">
                Level {currentLevel.level}: {currentLevel.title}
              </ResponsiveText>
              <ResponsiveText size="md" color="text-indigo-700">
                {userXP} / {nextLevel?.maxXP || currentLevel.maxXP} XP
              </ResponsiveText>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-indigo-700">
              <span>Progress to Level {nextLevel?.level || 'Max'}</span>
              <span>{Math.round(progressToNextLevel)}%</span>
            </div>
            <div className="w-full bg-indigo-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressToNextLevel}%` }}
              />
            </div>
          </div>

          <div className="flex justify-center gap-6 text-sm">
            <div className="text-center">
              <div className="font-bold text-indigo-900">{unlockedAchievements.length}</div>
              <div className="text-indigo-700">Achievements</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-indigo-900">{totalAchievementPoints}</div>
              <div className="text-indigo-700">Total Points</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-indigo-900">{profile?.progress?.currentStreak || 0}</div>
              <div className="text-indigo-700">Day Streak</div>
            </div>
          </div>
        </div>
      </ResponsiveCard>

      {/* Category Filter */}
      <ResponsiveCard>
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all
                ${selectedCategory === category.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </ResponsiveCard>

      {/* Achievements Grid */}
      <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3, large: 4 }} gap={4}>
        {filteredAchievements.map(achievement => (
          <div
            key={achievement.id}
            className={`
              relative border-2 rounded-lg p-4 transition-all
              ${achievement.unlockedAt
                ? `bg-gradient-to-br ${getRarityColor(achievement.rarity)}`
                : 'bg-gray-50 border-gray-200 opacity-75'
              }
              ${achievement.progress > 0 && !achievement.unlockedAt ? 'border-indigo-300' : ''}
            `}
          >
            {/* Rarity Badge */}
            <div className="absolute top-2 right-2">
              <span className="text-sm">{getRarityIcon(achievement.rarity)}</span>
            </div>

            <div className="text-center space-y-3">
              <div className="text-4xl">
                {achievement.unlockedAt ? achievement.icon : '🔒'}
              </div>

              <div>
                <ResponsiveText size="md" weight="semibold" className={getRarityTextColor(achievement.rarity)}>
                  {achievement.unlockedAt ? achievement.title : '???'}
                </ResponsiveText>
                <ResponsiveText size="sm" color="text-gray-600" className="mt-1">
                  {achievement.unlockedAt ? achievement.description : 'Complete requirements to unlock'}
                </ResponsiveText>
              </div>

              {achievement.unlockedAt && (
                <div className="text-xs text-gray-500">
                  🎉 Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                </div>
              )}

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Progress</span>
                  <span>{achievement.progress} / {achievement.requirements.target}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`
                      h-2 rounded-full transition-all duration-300
                      ${achievement.unlockedAt
                        ? 'bg-green-500'
                        : 'bg-indigo-500'
                      }
                    `}
                    style={{ width: `${Math.min(100, (achievement.progress / achievement.requirements.target) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">
                  {achievement.requirements.type === 'sessions' && 'Sessions'}
                  {achievement.requirements.type === 'streak' && 'Days'}
                  {achievement.requirements.type === 'accuracy' && '% Accuracy'}
                  {achievement.requirements.type === 'time' && 'Seconds'}
                  {achievement.requirements.type === 'exercises' && 'Exercises'}
                </span>
                <span className="font-medium text-indigo-600">
                  +{achievement.points} XP
                </span>
              </div>
            </div>
          </div>
        ))}
      </ResponsiveGrid>

      {/* Rewards Preview */}
      <ResponsiveCard>
        <ResponsiveText size="lg" weight="semibold" className="mb-4 text-center">
          🎁 Upcoming Rewards
        </ResponsiveText>
        <div className="space-y-3">
          {userLevels.slice(currentLevel.level, currentLevel.level + 3).map(level => (
            <div key={level.level} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl">{level.icon}</span>
              <div className="flex-1">
                <div className="font-medium">Level {level.level}: {level.title}</div>
                <div className="text-sm text-gray-600">Unlocks: {level.rewards.join(', ')}</div>
              </div>
              <div className="text-sm text-gray-500">
                {level.minXP} XP
              </div>
            </div>
          ))}
        </div>
      </ResponsiveCard>
    </div>
  );
}