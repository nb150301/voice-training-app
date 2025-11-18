/**
 * Social Profile System
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

export interface SocialProfile {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  avatar: string;
  banner: string;
  location: string;
  website?: string;
  socialLinks: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    soundcloud?: string;
  };
  voiceType: string;
  experience: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  favoriteGenres: string[];
  goals: string[];
  instruments: string[];
  isPublic: boolean;
  joinDate: string;
  lastActive: string;
  stats: {
    followers: number;
    following: number;
    sharedExercises: number;
    completedChallenges: number;
    totalSessions: number;
    streakDays: number;
  };
  achievements: {
    recentAchievements: string[];
    totalAchievements: number;
    favoriteAchievement?: string;
  };
  badges: string[];
}

export interface CommunityPost {
  id: string;
  authorId: string;
  author: SocialProfile;
  type: 'achievement' | 'exercise_share' | 'progress_update' | 'tip' | 'question';
  content: string;
  media?: {
    type: 'audio' | 'image' | 'video';
    url: string;
    thumbnail?: string;
  };
  exercise?: {
    id: string;
    title: string;
    difficulty: string;
    duration: number;
  };
  achievement?: {
    id: string;
    title: string;
    icon: string;
    points: number;
  };
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt?: string;
}

const voiceGenres = [
  'Classical', 'Pop', 'Rock', 'Jazz', 'R&B', 'Country', 'Folk',
  'Musical Theatre', 'Opera', 'Blues', 'Gospel', 'Electronic', 'Hip Hop'
];

const experienceLevels = [
  { id: 'beginner', name: 'Beginner', description: 'Just starting my voice journey' },
  { id: 'intermediate', name: 'Intermediate', description: 'Comfortable with basic techniques' },
  { id: 'advanced', name: 'Advanced', description: 'Proficient in multiple styles' },
  { id: 'professional', name: 'Professional', description: 'Working in the music industry' }
];

interface SocialProfileProps {
  profile?: SocialProfile;
  isOwnProfile?: boolean;
  onFollow?: (userId: string) => void;
  onShare?: (type: string, content: any) => void;
}

export default function SocialProfile({ profile, isOwnProfile = false, onFollow, onShare }: SocialProfileProps) {
  const { userProfile } = useUserProfile();
  const { isMobile } = useResponsiveBreakpoints();
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'shared' | 'activity'>('overview');
  const [isFollowing, setIsFollowing] = useState(false);
  const [userPosts, setUserPosts] = useState<CommunityPost[]>([]);

  // Generate demo social profile data
  const generateDemoProfile = (): SocialProfile => {
    return {
      id: `social_${Date.now()}`,
      userId: userProfile?.profile?.id || '',
      username: userProfile?.profile?.email?.split('@')[0] || 'user123',
      displayName: userProfile?.profile?.name || 'Voice Trainer',
      bio: 'Passionate about improving my voice and helping others do the same!',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile?.profile?.email || 'default'}`,
      banner: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&h=300&fit=crop',
      location: 'Los Angeles, CA',
      website: 'https://myportfolio.com',
      socialLinks: {
        instagram: '@myvoicejourney',
        youtube: 'My Voice Journey',
        soundcloud: 'voice-training-mixes',
      },
      voiceType: userProfile?.profile?.voiceProfile?.voiceType || 'unknown',
      experience: userProfile?.profile?.progress?.totalSessions ?
        (userProfile.profile.progress.totalSessions < 10 ? 'beginner' :
         userProfile.profile.progress.totalSessions < 50 ? 'intermediate' :
         userProfile.profile.progress.totalSessions < 100 ? 'advanced' : 'professional') : 'beginner',
      favoriteGenres: ['Pop', 'Jazz', 'Musical Theatre'],
      goals: ['Improve pitch accuracy', 'Expand vocal range', 'Master breath control'],
      instruments: ['Piano', 'Guitar'],
      isPublic: true,
      joinDate: userProfile?.profile?.createdAt || new Date().toISOString(),
      lastActive: new Date().toISOString(),
      stats: {
        followers: Math.floor(Math.random() * 1000) + 50,
        following: Math.floor(Math.random() * 200) + 20,
        sharedExercises: userProfile?.profile?.progress?.completedExercises?.length || 0,
        completedChallenges: Math.floor(Math.random() * 50) + 10,
        totalSessions: userProfile?.profile?.progress?.totalSessions || 0,
        streakDays: userProfile?.profile?.progress?.currentStreak || 0,
      },
      achievements: {
        recentAchievements: ['week_warrior', 'pitch_perfect'],
        totalAchievements: Math.floor(Math.random() * 15) + 5,
        favoriteAchievement: 'pitch_perfect',
      },
      badges: ['Early Adopter', 'Consistent Practitioner', 'Community Helper'],
    };
  };

  const [socialProfileData, setSocialProfileData] = useState<SocialProfile>(profile || generateDemoProfile());
  const [isEditing, setIsEditing] = useState(false);

  // Generate demo posts
  const generateDemoPosts = (): CommunityPost[] => {
    return [
      {
        id: 'post1',
        authorId: socialProfileData.id,
        author: socialProfileData,
        type: 'achievement',
        content: 'Just unlocked the Pitch Perfect achievement! 🎯 Achieved 95% accuracy in my practice session today. Hard work is paying off!',
        achievement: {
          id: 'pitch_perfect',
          title: 'Pitch Perfect',
          icon: '🎯',
          points: 75,
        },
        tags: ['achievement', 'milestone', 'practice'],
        likes: 42,
        comments: 8,
        shares: 3,
        isLiked: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'post2',
        authorId: socialProfileData.id,
        author: socialProfileData,
        type: 'exercise_share',
        content: 'Created a new warmup exercise that really helped with my breath support! It\'s a 3-minute breathing exercise followed by sustained notes. Perfect for beginners! 🎵',
        exercise: {
          id: 'custom_breath_support',
          title: 'Breath Support Builder',
          difficulty: 'beginner',
          duration: 180,
        },
        tags: ['exercise', 'warmup', 'breathing', 'beginner'],
        likes: 28,
        comments: 12,
        shares: 5,
        isLiked: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'post3',
        authorId: socialProfileData.id,
        author: socialProfileData,
        type: 'progress_update',
        content: '30-day streak achieved! 🔥 Never thought I\'d make it this far. My range has expanded by almost a full octave and my confidence is soaring. Remember, consistency is key!',
        tags: ['progress', 'milestone', 'streak', 'motivation'],
        likes: 67,
        comments: 15,
        shares: 8,
        isLiked: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  };

  useEffect(() => {
    setUserPosts(generateDemoPosts());
  }, [socialProfileData]);

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    onFollow?.(socialProfileData.userId);

    // Update follower count
    setSocialProfileData(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        followers: isFollowing ? prev.stats.followers - 1 : prev.stats.followers + 1,
      },
    }));
  };

  const handleShare = (type: string) => {
    onShare?.(type, socialProfileData);
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Active now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getExperienceColor = (experience: string) => {
    switch (experience) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      case 'professional': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVoiceTypeEmoji = (voiceType: string) => {
    switch (voiceType) {
      case 'soprano': return '🎵';
      case 'alto': return '🎤';
      case 'tenor': return '🎙️';
      case 'bass': return '🔊';
      default: return '🎤';
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <ResponsiveCard className="overflow-hidden">
        {/* Banner */}
        <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
          <img
            src={socialProfileData.banner}
            alt="Profile banner"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6 -mt-12">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
            {/* Avatar */}
            <div className="relative">
              <img
                src={socialProfileData.avatar}
                alt="Profile avatar"
                className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg object-cover"
              />
              <div className="absolute -bottom-2 -right-2 text-2xl">
                {getVoiceTypeEmoji(socialProfileData.voiceType)}
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                <ResponsiveText size="2xl" weight="bold">
                  {socialProfileData.displayName}
                </ResponsiveText>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getExperienceColor(socialProfileData.experience)}`}>
                  {socialProfileData.experience}
                </span>
              </div>
              <div className="flex items-center gap-4 text-gray-600 mb-3">
                <span className="flex items-center gap-1">
                  @ {socialProfileData.username}
                </span>
                <span className="flex items-center gap-1">
                  📍 {socialProfileData.location}
                </span>
                <span className="flex items-center gap-1">
                  📅 Joined {formatJoinDate(socialProfileData.joinDate)}
                </span>
                <span className="flex items-center gap-1">
                  ⚡ {formatLastActive(socialProfileData.lastActive)}
                </span>
              </div>

              <ResponsiveText size="md" className="text-gray-700 mb-4 max-w-2xl">
                {socialProfileData.bio}
              </ResponsiveText>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 justify-center md:justify-start mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{socialProfileData.stats.followers}</div>
                  <div className="text-sm text-gray-600">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{socialProfileData.stats.following}</div>
                  <div className="text-sm text-gray-600">Following</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{socialProfileData.stats.sharedExercises}</div>
                  <div className="text-sm text-gray-600">Shared</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{socialProfileData.stats.totalSessions}</div>
                  <div className="text-sm text-gray-600">Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{socialProfileData.stats.streakDays}</div>
                  <div className="text-sm text-gray-600">Streak</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center md:justify-start">
                {!isOwnProfile && (
                  <>
                    <ResponsiveButton
                      onClick={handleFollow}
                      variant={isFollowing ? "outline" : "primary"}
                      size={{ mobile: 'md', tablet: 'lg', desktop: 'lg' }}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </ResponsiveButton>
                    <ResponsiveButton
                      variant="outline"
                      size={{ mobile: 'md', tablet: 'lg', desktop: 'lg' }}
                    >
                      💬 Message
                    </ResponsiveButton>
                  </>
                )}
                {isOwnProfile && (
                  <ResponsiveButton
                    onClick={() => setIsEditing(!isEditing)}
                    variant="outline"
                    size={{ mobile: 'md', tablet: 'lg', desktop: 'lg' }}
                  >
                    ✏️ Edit Profile
                  </ResponsiveButton>
                )}
                <ResponsiveButton
                  onClick={() => handleShare('profile')}
                  variant="outline"
                  size={{ mobile: 'md', tablet: 'lg', desktop: 'lg' }}
                >
                  📤 Share
                </ResponsiveButton>
              </div>
            </div>
          </div>
        </div>
      </ResponsiveCard>

      {/* Content Tabs */}
      <ResponsiveCard>
        <div className="flex flex-wrap gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            📋 Overview
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`pb-3 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'achievements'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            🏆 Achievements
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`pb-3 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'shared'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            📤 Shared Content
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-3 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'activity'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
            >
            📈 Activity
          </button>
        </div>
      </ResponsiveCard>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 2 }} gap={6}>
          {/* Voice Details */}
          <ResponsiveCard>
            <ResponsiveText size="lg" weight="semibold" className="mb-4">
              🎵 Voice Profile
            </ResponsiveText>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Voice Type</span>
                <span className="font-medium capitalize">{socialProfileData.voiceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Experience Level</span>
                <span className="font-medium capitalize">{socialProfileData.experience}</span>
              </div>
              <div>
                <span className="text-gray-600">Favorite Genres</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {socialProfileData.favoriteGenres.map(genre => (
                    <span key={genre} className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-sm">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Goals</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {socialProfileData.goals.map(goal => (
                    <span key={goal} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                      {goal}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Instruments</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {socialProfileData.instruments.map(instrument => (
                    <span key={instrument} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                      {instrument}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </ResponsiveCard>

          {/* Badges */}
          <ResponsiveCard>
            <ResponsiveText size="lg" weight="semibold" className="mb-4">
              🏅 Badges & Recognition
            </ResponsiveText>
            <div className="space-y-4">
              <div>
                <ResponsiveText size="md" weight="medium" className="mb-2">
                  Community Badges
                </ResponsiveText>
                <div className="grid grid-cols-2 gap-2">
                  {socialProfileData.badges.map(badge => (
                    <div key={badge} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                      <div className="text-2xl mb-1">🏅</div>
                      <div className="text-sm font-medium text-yellow-800">{badge}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <ResponsiveText size="md" weight="medium" className="mb-2">
                  Achievement Stats
                </ResponsiveText>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Achievements</span>
                    <span className="font-medium">{socialProfileData.achievements.totalAchievements}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed Challenges</span>
                    <span className="font-medium">{socialProfileData.stats.completedChallenges}</span>
                  </div>
                </div>
              </div>
            </div>
          </ResponsiveCard>
        </ResponsiveGrid>
      )}

      {activeTab === 'shared' && (
        <div className="space-y-6">
          <ResponsiveText size="lg" weight="semibold">
            📤 Shared Content ({userPosts.length})
          </ResponsiveText>
          <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 2 }} gap={4}>
            {userPosts.map(post => (
              <ResponsiveCard key={post.id} className="hover:shadow-lg transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      post.type === 'achievement' ? 'bg-yellow-100 text-yellow-800' :
                      post.type === 'exercise_share' ? 'bg-blue-100 text-blue-800' :
                      post.type === 'progress_update' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {post.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <ResponsiveText size="md" className="line-clamp-3">
                    {post.content}
                  </ResponsiveText>

                  {post.exercise && (
                    <div className="bg-indigo-50 p-3 rounded-lg">
                      <div className="font-medium text-indigo-900">{post.exercise.title}</div>
                      <div className="text-sm text-indigo-700">
                        {post.exercise.difficulty} • {Math.floor(post.exercise.duration / 60)}min
                      </div>
                    </div>
                  )}

                  {post.achievement && (
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{post.achievement.icon}</span>
                        <div>
                          <div className="font-medium text-yellow-900">{post.achievement.title}</div>
                          <div className="text-sm text-yellow-700">+{post.achievement.points} XP</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1">
                        {post.isLiked ? '❤️' : '🤍'} {post.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        💬 {post.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        📤 {post.shares}
                      </span>
                    </div>
                    <ResponsiveButton
                      variant="outline"
                      size={{ mobile: 'sm', tablet: 'sm', desktop: 'sm' }}
                      onClick={() => handleShare('post')}
                    >
                      Share
                    </ResponsiveButton>
                  </div>
                </div>
              </ResponsiveCard>
            ))}
          </ResponsiveGrid>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <ResponsiveText size="lg" weight="semibold">
            🏆 Recent Achievements
          </ResponsiveText>
          <ResponsiveGrid cols={{ mobile: 2, tablet: 3, desktop: 4 }} gap={4}>
            {socialProfileData.achievements.recentAchievements.map(achievement => (
              <div key={achievement} className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
                <div className="text-4xl mb-2">🏆</div>
                <div className="font-medium text-gray-800 capitalize">
                  {achievement.replace('_', ' ')}
                </div>
              </div>
            ))}
          </ResponsiveGrid>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-6">
          <ResponsiveText size="lg" weight="semibold">
            📈 Recent Activity
          </ResponsiveText>
          <ResponsiveCard>
            <div className="space-y-4">
              {userPosts.slice(0, 5).map(post => (
                <div key={post.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-b-0">
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${
                      post.type === 'achievement' ? 'bg-yellow-400' :
                      post.type === 'exercise_share' ? 'bg-blue-400' :
                      post.type === 'progress_update' ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium capitalize">{post.type.replace('_', ' ')}</span>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.content}</p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ResponsiveCard>
        </div>
      )}
    </div>
  );
}