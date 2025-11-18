/**
 * Community Feed and Social Sharing System
 * Phase 4: Social Features and Community
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
import { SocialProfile, CommunityPost } from './SocialProfile';

export interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  type: 'weekly' | 'monthly' | 'special';
  category: 'accuracy' | 'endurance' | 'creativity' | 'community';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in days
  requirements: {
    sessions: number;
    accuracy?: number;
    streak?: number;
    participation?: number;
  };
  rewards: {
    xp: number;
    badge: string;
    prize?: string;
  };
  participants: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  host: SocialProfile;
}

export interface LeaderboardEntry {
  rank: number;
  user: SocialProfile;
  score: number;
  category: string;
  change: 'up' | 'down' | 'same' | 'new';
  previousRank?: number;
}

const mockCommunityChallenges: CommunityChallenge[] = [
  {
    id: 'weekly_accuracy_champion',
    title: 'Weekly Accuracy Champion',
    description: 'Achieve the highest average accuracy across all your practice sessions this week!',
    type: 'weekly',
    category: 'accuracy',
    difficulty: 'intermediate',
    duration: 7,
    requirements: {
      sessions: 5,
      accuracy: 85,
    },
    rewards: {
      xp: 100,
      badge: 'Accuracy Master',
      prize: 'Featured on community page',
    },
    participants: 342,
    startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    host: {
      id: 'host1',
      userId: 'host1',
      username: 'voicemaster',
      displayName: 'Voice Master',
      bio: 'Professional vocal coach with 15+ years experience',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=voicemaster',
      banner: '',
      location: 'Nashville, TN',
      voiceType: 'tenor',
      experience: 'professional',
      favoriteGenres: ['Classical', 'Jazz', 'Musical Theatre'],
      goals: [],
      instruments: ['Piano'],
      isPublic: true,
      joinDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date().toISOString(),
      stats: { followers: 1200, following: 150, sharedExercises: 45, completedChallenges: 23, totalSessions: 500, streakDays: 180 },
      achievements: { recentAchievements: [], totalAchievements: 89, favoriteAchievement: 'pitch_perfect' },
      badges: ['Elite Coach', 'Community Leader', '1000 Followers'],
    },
  },
  {
    id: 'monthly_marathon',
    title: '30-Day Practice Marathon',
    description: 'Practice every day for 30 consecutive days and build unbreakable consistency!',
    type: 'monthly',
    category: 'endurance',
    difficulty: 'advanced',
    duration: 30,
    requirements: {
      sessions: 30,
      streak: 30,
    },
    rewards: {
      xp: 300,
      badge: 'Marathon Runner',
      prize: 'Exclusive workshop invitation',
    },
    participants: 567,
    startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    host: {
      id: 'host2',
      userId: 'host2',
      username: 'soprano_star',
      displayName: 'Soprano Star',
      bio: 'Helping singers find their voice and confidence',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=soprano_star',
      banner: '',
      location: 'New York, NY',
      voiceType: 'soprano',
      experience: 'professional',
      favoriteGenres: ['Opera', 'Classical'],
      goals: [],
      instruments: [],
      isPublic: true,
      joinDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date().toISOString(),
      stats: { followers: 890, following: 120, sharedExercises: 32, completedChallenges: 18, totalSessions: 420, streakDays: 120 },
      achievements: { recentAchievements: [], totalAchievements: 76, favoriteAchievement: 'century_club' },
      badges: ['Vocal Virtuoso', 'Inspiration Award'],
    },
  },
];

const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    user: {
      id: 'user1',
      userId: 'user1',
      username: 'pitchperfect',
      displayName: 'Perfect Pitch Pete',
      bio: 'Obsessed with vocal accuracy and helping others improve',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pitchperfect',
      banner: '',
      location: 'Los Angeles, CA',
      voiceType: 'tenor',
      experience: 'advanced',
      favoriteGenres: ['Pop', 'Rock'],
      goals: [],
      instruments: ['Guitar'],
      isPublic: true,
      joinDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date().toISOString(),
      stats: { followers: 2340, following: 89, sharedExercises: 67, completedChallenges: 45, totalSessions: 890, streakDays: 210 },
      achievements: { recentAchievements: [], totalAchievements: 120, favoriteAchievement: 'pitch_perfect' },
      badges: ['Pitch Legend', 'Community Champion', '2000 Followers'],
    },
    score: 9850,
    category: 'accuracy',
    change: 'up',
    previousRank: 2,
  },
  {
    rank: 2,
    user: {
      id: 'user2',
      userId: 'user2',
      username: 'harmonyhero',
      displayName: 'Harmony Hero',
      bio: 'Making the world a more musical place, one note at a time',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=harmonyhero',
      banner: '',
      location: 'Chicago, IL',
      voiceType: 'alto',
      experience: 'advanced',
      favoriteGenres: ['Jazz', 'R&B', 'Gospel'],
      goals: [],
      instruments: ['Piano', 'Keyboards'],
      isPublic: true,
      joinDate: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date().toISOString(),
      stats: { followers: 1876, following: 67, sharedExercises: 54, completedChallenges: 38, totalSessions: 765, streakDays: 95 },
      achievements: { recentAchievements: [], totalAchievements: 98, favoriteAchievement: 'harmony_builder' },
      badges: ['Harmony Master', 'Community Helper'],
    },
    score: 9720,
    category: 'creativity',
    change: 'down',
    previousRank: 1,
  },
  {
    rank: 3,
    user: {
      id: 'user3',
      userId: 'user3',
      username: 'bassboss',
      displayName: 'Bass Boss',
      bio: 'Deep tones, big dreams. Let\'s make some noise!',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bassboss',
      banner: '',
      location: 'Austin, TX',
      voiceType: 'bass',
      experience: 'intermediate',
      favoriteGenres: ['Blues', 'Rock', 'Country'],
      goals: [],
      instruments: ['Bass Guitar'],
      isPublic: true,
      joinDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date().toISOString(),
      stats: { followers: 1234, following: 45, sharedExercises: 28, completedChallenges: 22, totalSessions: 320, streakDays: 45 },
      achievements: { recentAchievements: [], totalAchievements: 45, favoriteAchievement: 'week_warrior' },
      badges: ['Rising Star', 'Consistency King'],
    },
    score: 8900,
    category: 'endurance',
    change: 'new',
  },
];

interface CommunityFeedProps {
  onPostInteract?: (postId: string, action: 'like' | 'comment' | 'share') => void;
  onChallengeJoin?: (challengeId: string) => void;
}

export default function CommunityFeed({ onPostInteract, onChallengeJoin }: CommunityFeedProps) {
  const { profile } = useUserProfile();
  const { isMobile } = useResponsiveBreakpoints();
  const [activeSection, setActiveSection] = useState<'feed' | 'challenges' | 'leaderboard'>('feed');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [filter, setFilter] = useState<'all' | 'achievements' | 'exercises' | 'progress'>('all');

  // Generate mock community posts
  const generateMockPosts = (): CommunityPost[] => {
    const mockUsers: SocialProfile[] = mockLeaderboard.map(entry => entry.user);

    return [
      {
        id: 'community1',
        authorId: mockUsers[0].id,
        author: mockUsers[0],
        type: 'achievement',
        content: 'Just hit 95% accuracy on the Chromatic Challenge! 🎹 Been practicing this for weeks and it finally clicked. The key was slowing down and focusing on each transition. Who else is working on advanced exercises?',
        achievement: {
          id: 'chromatic_master',
          title: 'Chromatic Master',
          icon: '🎹',
          points: 75,
        },
        tags: ['achievement', 'advanced', 'chromatic'],
        likes: 127,
        comments: 23,
        shares: 8,
        isLiked: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: 'community2',
        authorId: mockUsers[1].id,
        author: mockUsers[1],
        type: 'exercise_share',
        content: 'Created a new warmup exercise for bass voices! It focuses on building confidence in the lower register while maintaining tone quality. Perfect for those struggling with chest voice. Try it out and let me know what you think! 🎤',
        exercise: {
          id: 'bass_warmup_confidence',
          title: 'Bass Confidence Builder',
          difficulty: 'beginner',
          duration: 300,
        },
        tags: ['exercise', 'bass', 'warmup', 'chest voice'],
        likes: 89,
        comments: 15,
        shares: 12,
        isLiked: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'community3',
        authorId: mockUsers[2].id,
        author: mockUsers[2],
        content: 'Day 15 of the 30-Day Marathon! 🔥 Halfway there! This challenge has really pushed me to be more consistent. My range has improved and I\'m much more confident with sustained notes. Who else is doing the marathon? Let\'s keep each other motivated!',
        tags: ['progress', 'marathon', 'motivation', 'consistency'],
        likes: 156,
        comments: 34,
        shares: 18,
        isLiked: true,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'community4',
        authorId: mockUsers[0].id,
        author: mockUsers[0],
        type: 'tip',
        content: 'Quick tip for improving pitch accuracy: Record yourself singing a simple scale, then listen back with headphones. You\'ll notice pitch variations you might not hear while singing. This simple technique helped me improve from 75% to 95% accuracy! 🎯',
        tags: ['tip', 'accuracy', 'recording', 'technique'],
        likes: 203,
        comments: 42,
        shares: 25,
        isLiked: false,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'community5',
        authorId: mockUsers[1].id,
        author: mockUsers[1],
        type: 'question',
        content: 'Fellow singers: How do you deal with performance anxiety? I\'ve been practicing for months and my technique is solid, but I get so nervous when recording or performing. Any advice from the community would be greatly appreciated! 🙏',
        tags: ['question', 'anxiety', 'performance', 'advice'],
        likes: 78,
        comments: 56,
        shares: 5,
        isLiked: true,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      },
    ];
  };

  useEffect(() => {
    setPosts(generateMockPosts());
  }, []);

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true;
    if (filter === 'achievements') return post.type === 'achievement';
    if (filter === 'exercises') return post.type === 'exercise_share';
    if (filter === 'progress') return post.type === 'progress_update';
    return true;
  });

  const handlePostInteraction = (postId: string, action: 'like' | 'comment' | 'share') => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        if (action === 'like') {
          return {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          };
        } else if (action === 'share') {
          return { ...post, shares: post.shares + 1 };
        }
      }
      return post;
    }));
    onPostInteract?.(postId, action);
  };

  const getRankChange = (change: LeaderboardEntry['change']) => {
    switch (change) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'new': return '🆕';
      default: return '➡️';
    }
  };

  const getRankChangeColor = (change: LeaderboardEntry['change']) => {
    switch (change) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'new': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  const renderFeed = () => (
    <div className="space-y-6">
      {/* Post Creation */}
      <ResponsiveCard className="bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex gap-3">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.profile?.email || 'current'}`}
            alt="Your avatar"
            className="w-10 h-10 rounded-full"
          />
          <button className="flex-1 text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300">
            <span className="text-gray-500">Share your progress, tips, or achievements...</span>
          </button>
          <ResponsiveButton variant="primary" size={{ mobile: 'md', tablet: 'lg', desktop: 'lg' }}>
            Post
          </ResponsiveButton>
        </div>
      </ResponsiveCard>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'All Posts', icon: '🌍' },
          { id: 'achievements', label: 'Achievements', icon: '🏆' },
          { id: 'exercises', label: 'Exercises', icon: '🎵' },
          { id: 'progress', label: 'Progress', icon: '📈' },
        ].map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setFilter(id as any)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              filter === id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {filteredPosts.map(post => (
          <ResponsiveCard key={post.id} className="hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              {/* Post Header */}
              <div className="flex items-start gap-3">
                <img
                  src={post.author.avatar}
                  alt={post.author.displayName}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{post.author.displayName}</span>
                    <span className="text-gray-500">@{post.author.username}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-500">{formatTimeAgo(post.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      post.type === 'achievement' ? 'bg-yellow-100 text-yellow-800' :
                      post.type === 'exercise_share' ? 'bg-blue-100 text-blue-800' :
                      post.type === 'progress_update' ? 'bg-green-100 text-green-800' :
                      post.type === 'tip' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {post.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="text-gray-800">{post.content}</div>

              {/* Exercise/Achievement Details */}
              {post.exercise && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🎵</div>
                    <div>
                      <div className="font-medium text-blue-900">{post.exercise.title}</div>
                      <div className="text-sm text-blue-700">
                        {post.exercise.difficulty} • {Math.floor(post.exercise.duration / 60)} minutes
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {post.achievement && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{post.achievement.icon}</div>
                    <div>
                      <div className="font-medium text-yellow-900">{post.achievement.title}</div>
                      <div className="text-sm text-yellow-700">+{post.achievement.points} XP</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map(tag => (
                    <span key={tag} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Engagement */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex gap-4">
                  <button
                    onClick={() => handlePostInteraction(post.id, 'like')}
                    className={`flex items-center gap-1 text-sm ${
                      post.isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                    }`}
                  >
                    {post.isLiked ? '❤️' : '🤍'} {post.likes}
                  </button>
                  <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600">
                    💬 {post.comments}
                  </button>
                  <button
                    onClick={() => handlePostInteraction(post.id, 'share')}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-green-600"
                  >
                    📤 {post.shares}
                  </button>
                </div>
                <button className="text-sm text-gray-600 hover:text-indigo-600">
                  🔗 Copy Link
                </button>
              </div>
            </div>
          </ResponsiveCard>
        ))}
      </div>
    </div>
  );

  const renderChallenges = () => (
    <div className="space-y-6">
      <ResponsiveText size="lg" weight="semibold">
        🏆 Active Challenges
      </ResponsiveText>

      <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 2 }} gap={6}>
        {mockCommunityChallenges.map(challenge => (
          <ResponsiveCard key={challenge.id} className="hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              {/* Challenge Header */}
              <div className="flex items-start justify-between">
                <div>
                  <ResponsiveText size="lg" weight="semibold">
                    {challenge.title}
                  </ResponsiveText>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      challenge.type === 'weekly' ? 'bg-blue-100 text-blue-800' :
                      challenge.type === 'monthly' ? 'bg-purple-100 text-purple-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {challenge.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      challenge.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                      challenge.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {challenge.difficulty}
                    </span>
                  </div>
                </div>
                {challenge.isActive && (
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    🔴 Active
                  </div>
                )}
              </div>

              {/* Challenge Description */}
              <ResponsiveText size="md" color="text-gray-600">
                {challenge.description}
              </ResponsiveText>

              {/* Requirements */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <ResponsiveText size="sm" weight="medium" className="mb-2">
                  Requirements:
                </ResponsiveText>
                <div className="space-y-1 text-sm">
                  {challenge.requirements.sessions && (
                    <div>• {challenge.requirements.sessions} practice sessions</div>
                  )}
                  {challenge.requirements.accuracy && (
                    <div>• {challenge.requirements.accuracy}% average accuracy</div>
                  )}
                  {challenge.requirements.streak && (
                    <div>• {challenge.requirements.streak} day streak</div>
                  )}
                </div>
              </div>

              {/* Rewards */}
              <div className="bg-yellow-50 p-3 rounded-lg">
                <ResponsiveText size="sm" weight="medium" className="mb-2">
                  🏅 Rewards:
                </ResponsiveText>
                <div className="text-sm">
                  <div>• +{challenge.rewards.xp} XP</div>
                  <div>• "{challenge.rewards.badge}" badge</div>
                  {challenge.rewards.prize && (
                    <div>• {challenge.rewards.prize}</div>
                  )}
                </div>
              </div>

              {/* Host Info */}
              <div className="flex items-center gap-3">
                <img
                  src={challenge.host.avatar}
                  alt={challenge.host.displayName}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="text-sm font-medium">Hosted by {challenge.host.displayName}</div>
                  <div className="text-xs text-gray-600">
                    {challenge.participants.toLocaleString()} participants
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Challenge Progress</span>
                  <span>4 days left</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                    style={{ width: '43%' }}
                  />
                </div>
              </div>

              {/* Join Button */}
              <ResponsiveButton
                onClick={() => onChallengeJoin?.(challenge.id)}
                variant="primary"
                size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg' }}
                fullWidth
              >
                🚀 Join Challenge
              </ResponsiveButton>
            </div>
          </ResponsiveCard>
        ))}
      </ResponsiveGrid>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="space-y-6">
      <ResponsiveText size="lg" weight="semibold">
        🏆 Global Leaderboard
      </ResponsiveText>

      {/* Leaderboard Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'accuracy', label: 'Accuracy', icon: '🎯' },
          { id: 'endurance', label: 'Endurance', icon: '💪' },
          { id: 'creativity', label: 'Creativity', icon: '🎨' },
          { id: 'community', label: 'Community', icon: '🤝' },
        ].map(({ id, label, icon }) => (
          <button
            key={id}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              true // Currently selected category
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <ResponsiveCard>
        <div className="space-y-4">
          {mockLeaderboard.map((entry, index) => (
            <div
              key={entry.user.id}
              className={`
                flex items-center gap-4 p-4 rounded-lg transition-colors
                ${entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'hover:bg-gray-50'}
              `}
            >
              {/* Rank */}
              <div className={`text-2xl font-bold w-12 text-center ${
                entry.rank === 1 ? 'text-yellow-600' :
                entry.rank === 2 ? 'text-gray-500' :
                entry.rank === 3 ? 'text-orange-600' : 'text-gray-400'
              }`}>
                #{entry.rank}
              </div>

              {/* Avatar */}
              <img
                src={entry.user.avatar}
                alt={entry.user.displayName}
                className="w-12 h-12 rounded-full"
              />

              {/* User Info */}
              <div className="flex-1">
                <div className="font-medium">{entry.user.displayName}</div>
                <div className="text-sm text-gray-600">@{entry.user.username}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full capitalize">
                    {entry.user.voiceType}
                  </span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full capitalize">
                    {entry.user.experience}
                  </span>
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <div className="text-xl font-bold text-indigo-600">
                  {entry.score.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 capitalize">
                  {entry.category}
                </div>
                <div className={`flex items-center gap-1 text-xs ${getRankChangeColor(entry.change)}`}>
                  <span>{getRankChange(entry.change)}</span>
                  {entry.change === 'up' && entry.previousRank && (
                    <span>#{entry.previousRank}</span>
                  )}
                </div>
              </div>

              {/* Action */}
              <ResponsiveButton
                variant="outline"
                size={{ mobile: 'sm', tablet: 'sm', desktop: 'sm' }}
              >
                View Profile
              </ResponsiveButton>
            </div>
          ))}
        </div>
      </ResponsiveCard>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <ResponsiveCard>
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setActiveSection('feed')}
            className={`
              px-6 py-3 rounded-lg font-medium transition-all
              ${activeSection === 'feed'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            🌍 Community Feed
          </button>
          <button
            onClick={() => setActiveSection('challenges')}
            className={`
              px-6 py-3 rounded-lg font-medium transition-all
              {activeSection === 'challenges'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            🏆 Challenges
          </button>
          <button
            onClick={() => setActiveSection('leaderboard')}
            className={`
              px-6 py-3 rounded-lg font-medium transition-all
              {activeSection === 'leaderboard'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            📊 Leaderboard
          </button>
        </div>
      </ResponsiveCard>

      {/* Section Content */}
      {activeSection === 'feed' && renderFeed()}
      {activeSection === 'challenges' && renderChallenges()}
      {activeSection === 'leaderboard' && renderLeaderboard()}
    </div>
  );
}