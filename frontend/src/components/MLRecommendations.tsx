/**
 * Machine Learning Exercise Recommendations System
 * Phase 5: Advanced AI Features and Personalization
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

export interface UserProfileML {
  userId: string;
  voiceType: string;
  experience: string;
  goals: string[];
  strongAreas: string[];
  weakAreas: string[];
  preferences: {
    genres: string[];
    exerciseTypes: string[];
    sessionLength: number;
    preferredDifficulty: number;
  };
  performance: {
    accuracy: number;
    consistency: number;
    improvement: number;
    totalSessions: number;
    streakDays: number;
  };
  patterns: {
    bestTimeOfDay: string;
    optimalSessionLength: number;
    frequency: number; // sessions per week
    preferredWarmupDuration: number;
  };
}

export interface ExerciseML {
  id: string;
  title: string;
  type: 'warmup' | 'technique' | 'repertoire' | 'assessment' | 'fun';
  category: 'breath' | 'pitch' | 'range' | 'rhythm' | 'articulation' | 'expression' | 'health';
  difficulty: number; // 1-10
  duration: number; // in seconds
  voiceTypes: string[]; // suitable voice types
  prerequisites: string[];
  benefits: string[];
  tags: string[];
  description: string;
  instructions: string[];
  targetAreas: string[];
}

export interface MLRecommendation {
  id: string;
  exercise: ExerciseML;
  reason: string;
  score: number; // 0-1
  confidence: number; // 0-1
  priority: 'high' | 'medium' | 'low';
  context: string;
  expectedImprovement: number; // percentage
  estimatedTime: number; // in minutes
  difficulty: 'appropriate' | 'challenge' | 'review';
  adaptation: string[];
}

const exerciseDatabase: ExerciseML[] = [
  // Breath Support Exercises
  {
    id: 'diaphragmatic_breathing',
    title: 'Diaphragmatic Breathing Foundation',
    type: 'warmup',
    category: 'breath',
    difficulty: 2,
    duration: 300,
    voiceTypes: ['soprano', 'alto', 'tenor', 'bass'],
    prerequisites: [],
    benefits: ['Better tone quality', 'Longer phrases', 'Reduced tension'],
    tags: ['breathing', 'foundation', 'warmup', 'all_levels'],
    description: 'Essential breathing technique for all singers',
    instructions: ['Lie on your back with knees bent', 'Place hand on stomach', 'Inhale through nose for 4 counts', 'Exhale slowly for 8 counts'],
    targetAreas: ['breath support', 'tone quality'],
  },
  {
    id: 'straw_breathing',
    title: 'Straw Breathing Technique',
    type: 'technique',
    category: 'breath',
    difficulty: 4,
    duration: 240,
    voiceTypes: ['soprano', 'alto', 'tenor', 'bass'],
    prerequisites: ['diaphragmatic_breathing'],
    benefits: ['Focused airflow', 'Reduced breathiness', 'Better control'],
    tags: ['breathing', 'technique', 'intermediate'],
    description: 'Use a straw to focus and control your airflow',
    instructions: ['Inhale deeply', 'Place straw between lips', 'Exhale slowly through straw', 'Keep jaw relaxed'],
    targetAreas: ['breath control', 'focus'],
  },

  // Pitch Accuracy Exercises
  {
    id: 'siren_exercise',
    title: 'Vocal Siren Warmup',
    type: 'warmup',
    category: 'pitch',
    difficulty: 3,
    duration: 180,
    voiceTypes: ['soprano', 'alto', 'tenor', 'bass'],
    prerequisites: [],
    benefits: ['Smooth pitch transitions', 'Range exploration', 'Vocal flexibility'],
    tags: ['pitch', 'warmup', 'range', 'beginner'],
    description: 'Slide between low and high pitches smoothly',
    instructions: ['Start on low comfortable note', 'Glide up to high note', 'Return to low note', 'Keep airflow consistent'],
    targetAreas: ['pitch accuracy', 'range', 'flexibility'],
  },
  {
    id: 'pitch_interval_training',
    title: 'Perfect Fifth Intervals',
    type: 'technique',
    category: 'pitch',
    difficulty: 6,
    duration: 300,
    voiceTypes: ['soprano', 'alto', 'tenor', 'bass'],
    prerequisites: ['siren_exercise'],
    benefits: ['Pitch accuracy', 'Interval recognition', 'Ear training'],
    tags: ['pitch', 'intervals', 'technique', 'intermediate'],
    description: 'Practice perfect fifths for pitch accuracy',
    instructions: ['Sing Do-Sol-Do', 'Focus on landing precisely', 'Use a tuner', 'Keep both notes steady'],
    targetAreas: ['pitch accuracy', 'interval training'],
  },

  // Range Development
  {
    id: 'lip_trills_beginner',
    title: 'Gentle Lip Trills',
    type: 'technique',
    category: 'range',
    difficulty: 4,
    duration: 180,
    voiceTypes: ['soprano', 'alto', 'tenor', 'bass'],
    prerequisites: ['diaphragmatic_breathing'],
    benefits: ['Vocal flexibility', 'Range extension', 'Coordination'],
    tags: ['range', 'flexibility', 'technique'],
    description: 'Gentle lip trills to build flexibility',
    instructions: ['Use "brrrr" sound', 'Start slowly', 'Keep breath support', 'Avoid jaw tension'],
    targetAreas: ['flexibility', 'coordination', 'range'],
  },
  {
    id: 'vocal_siren_advanced',
    title: 'Extended Range Siren',
    type: 'technique',
    category: 'range',
    difficulty: 7,
    duration: 240,
    voiceTypes: ['soprano', 'alto', 'tenor', 'bass'],
    prerequisites: ['siren_exercise'],
    benefits: ['Extended range', 'Smooth register transitions', 'Range control'],
    tags: ['range', 'advanced', 'register_transitions'],
    description: 'Extended siren covering full vocal range',
    instructions: ['Slide from lowest to highest note', 'Pass through bridges smoothly', 'Use consistent breath support', 'Avoid pushing'],
    targetAreas: ['range', 'register_transitions', 'control'],
  },

  // Articulation
  {
    id: 'diction_exercises',
    title: 'Clear Diction Practice',
    type: 'technique',
    category: 'articulation',
    difficulty: 3,
    duration: 240,
    voiceTypes: ['soprano', 'alto', 'tenor', 'bass'],
    prerequisites: [],
    benefits: ['Clear articulation', 'Consonant clarity', 'Word precision'],
    tags: ['articulation', 'diction', 'technique'],
    description: 'Practice clear articulation with consonants',
    instructions: ['Exaggerate consonants', 'Use "tongue twisters"', 'Start slowly', 'Focus on crisp articulation'],
    targetAreas: ['articulation', 'diction'],
  },

  // Expression
  {
    id: 'dynamic_control',
    title: 'Dynamic Volume Control',
    type: 'technique',
    category: 'expression',
    difficulty: 6,
    duration: 300,
    voiceTypes: ['soprano', 'alto', 'tenor', 'bass'],
    prerequisites: ['diaphragmatic_breathing'],
    benefits: ['Volume control', 'Dynamic expression', 'Breath support'],
    tags: ['expression', 'dynamics', 'technique'],
    description: 'Practice controlled volume changes',
    instructions: ['Start with medium volume', 'Gradually increase to loud', 'Gradually decrease to soft', 'Maintain pitch stability'],
    targetAreas: ['dynamics', 'expression', 'breath_control'],
  },
  {
    id: 'emotional_delivery',
    title: 'Emotional Song Delivery',
    type: 'repertoire',
    category: 'expression',
    difficulty: 8,
    duration: 420,
    voiceTypes: ['soprano', 'alto', 'tenor', 'bass'],
    prerequisites: ['dynamic_control', 'vocal_siren_advanced'],
    benefits: ['Emotional expression', 'Storytelling', 'Performance skills'],
    tags: ['expression', 'repertoire', 'performance'],
    description: 'Practice delivering songs with emotion',
    instructions: ['Choose emotional content', 'Focus on lyrics meaning', 'Use appropriate vocal color', 'Connect with audience'],
    targetAreas: ['expression', 'performance', 'storytelling'],
  },

  // Health
  {
    id: 'vocal_cool_down',
    title: 'Gentle Vocal Cool Down',
    type: 'warmup',
    category: 'health',
    difficulty: 1,
    duration: 240,
    voiceTypes: ['soprano', 'alto', 'tenor', 'bass'],
    prerequisites: [],
    benefits: ['Vocal health', 'Strain prevention', 'Voice recovery'],
    tags: ['health', 'cool_down', 'prevention'],
    description: 'Gentle exercises to cool down your voice',
    instructions: ['Gentle humming', 'Soft lip trills', 'Gentle sighing', 'Relaxation stretches'],
    targetAreas: ['vocal_health', 'prevention'],
  },
  {
    id: 'jaw_relaxation',
    title: 'Jaw and Neck Relaxation',
    type: 'warmup',
    category: 'health',
    difficulty: 1,
    duration: 180,
    voiceTypes: ['soprano', 'alto', 'tenor', 'bass'],
    prerequisites: [],
    benefits: ['Tension release', 'Pain prevention', 'Better tone'],
    tags: ['health', 'relaxation', 'prevention'],
    description: 'Exercises to release jaw and neck tension',
    instructions: ['Gentle jaw massage', 'Neck stretches', 'Yawning exercise', 'Shoulder rolls'],
    targetAreas: ['health', 'tension_release'],
  },
];

interface MLRecommendationsProps {
  onExerciseSelect?: (exercise: ExerciseML) => void;
  onRecommendationAccept?: (recommendation: MLRecommendation) => void;
}

export default function MLRecommendations({ onExerciseSelect, onRecommendationAccept }: MLRecommendationsProps) {
  const { profile } = useUserProfile();
  const { isMobile } = useResponsiveBreakpoints();
  const [recommendations, setRecommendations] = useState<MLRecommendation[]>([]);
  const [userProfileML, setUserProfileML] = useState<UserProfileML | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  // Generate user profile from existing data
  useEffect(() => {
    if (!profile) return;

    const userProfile: UserProfileML = {
      userId: profile.profile?.id || 'user',
      voiceType: profile.profile?.voiceProfile?.voiceType || 'unknown',
      experience: profile.progress?.totalSessions ?
        (profile.progress.totalSessions < 10 ? 'beginner' :
         profile.progress.totalSessions < 50 ? 'intermediate' :
         profile.progress.totalSessions < 100 ? 'advanced' : 'expert') : 'beginner',
      goals: ['Improve pitch accuracy', 'Expand range', 'Better breath control'],
      strongAreas: [],
      weakAreas: [],
      preferences: {
        genres: ['Pop', 'Jazz', 'Musical Theatre'],
        exerciseTypes: ['technique', 'warmup'],
        sessionLength: 30,
        preferredDifficulty: 5,
      },
      performance: {
        accuracy: profile.progress?.averagePitchAccuracy || 75,
        consistency: 80,
        improvement: 15,
        totalSessions: profile.progress?.totalSessions || 0,
        streakDays: profile.progress?.currentStreak || 0,
      },
      patterns: {
        bestTimeOfDay: 'evening',
        optimalSessionLength: 25,
        frequency: 3,
        preferredWarmupDuration: 5,
      },
    };

    setUserProfileML(userProfile);
  }, [profile]);

  // Generate ML recommendations
  useEffect(() => {
    if (!userProfileML) return;

    setLoading(true);

    const generateRecommendations = (): MLRecommendation[] => {
      const recs: MLRecommendation[] = [];

      // Analyze user's weak areas and performance
      const accuracyScore = userProfileML.performance.accuracy;
      const sessionsCount = userProfileML.performance.totalSessions;
      const experienceLevel = userProfileML.experience;

      // Recommend based on accuracy
      if (accuracyScore < 80) {
        const pitchExercises = exerciseDatabase.filter(ex =>
          ex.category === 'pitch' &&
          ex.difficulty <= 4 &&
          (ex.voiceTypes.includes(userProfileML.voiceType) || ex.voiceTypes.includes('unknown'))
        );

        pitchExercises.forEach(exercise => {
          const score = 1 - (accuracyScore / 100);
          recs.push({
            id: `rec_accuracy_${Date.now()}_${Math.random()}`,
            exercise,
            reason: `Your accuracy is ${accuracyScore}%. Focus on pitch accuracy exercises.`,
            score,
            confidence: 0.85,
            priority: 'high',
            context: 'pitch_improvement',
            expectedImprovement: 15,
            estimatedTime: Math.ceil(exercise.duration / 60),
            difficulty: exercise.difficulty <= 3 ? 'appropriate' : 'challenge',
            adaptation: userProfileML.voiceType !== 'unknown' ?
              [`Adapted for ${userProfileML.voiceType} voice type`] : [],
          });
        });
      }

      // Recommend based on experience level
      const appropriateDifficulty = experienceLevel === 'beginner' ? 3 :
                                     experienceLevel === 'intermediate' ? 5 :
                                     experienceLevel === 'advanced' ? 7 : 5;

      const suitableExercises = exerciseDatabase.filter(ex =>
        Math.abs(ex.difficulty - appropriateDifficulty) <= 2 &&
        (ex.voiceTypes.includes(userProfileML.voiceType) || ex.voiceTypes.includes('unknown'))
      );

      suitableExercises.slice(0, 3).forEach(exercise => {
        const score = 1 - (Math.abs(exercise.difficulty - appropriateDifficulty) / 10);
        recs.push({
          id: `rec_level_${Date.now()}_${Math.random()}`,
          exercise,
          reason: `Recommended based on your ${experienceLevel} experience level`,
          score,
          confidence: 0.7,
          priority: 'medium',
          context: 'experience_appropriate',
          expectedImprovement: 10,
          estimatedTime: Math.ceil(exercise.duration / 60),
          difficulty: 'appropriate',
          adaptation: userProfileML.voiceType !== 'unknown' ?
            [`Optimized for ${userProfileML.voiceType} voice`] : [],
        });
      });

      // Recommend variety based on exercise history
      const recentExerciseTypes = userProfileML.preferences.exerciseTypes;
      const differentTypes = exerciseDatabase.filter(ex =>
        !recentExerciseTypes.includes(ex.type) &&
        ex.difficulty <= appropriateDifficulty + 1 &&
        (ex.voiceTypes.includes(userProfileML.voiceType) || ex.voiceTypes.includes('unknown'))
      );

      differentTypes.slice(0, 2).forEach(exercise => {
        const score = 0.6 + Math.random() * 0.2;
        recs.push({
          id: `rec_variety_${Date.now()}_${Math.random()}`,
          exercise,
          reason: `Try different exercise types to avoid plateaus and build well-rounded skills`,
          score,
          confidence: 0.6,
          priority: 'medium',
          context: 'variety_prevention',
          expectedImprovement: 8,
          estimatedTime: Math.ceil(exercise.duration / 60),
          difficulty: exercise.difficulty <= appropriateDifficulty ? 'appropriate' : 'challenge',
          adaptation: userProfileML.voiceType !== 'unknown' ?
            [`New type: ${exercise.type}`] : [],
        });
      });

      // Health recommendations
      if (sessionsCount > 5 && Math.random() > 0.7) {
        const healthExercises = exerciseDatabase.filter(ex => ex.category === 'health');
        healthExercises.forEach(exercise => {
          recs.push({
            id: `rec_health_${Date.now()}_${Math.random()}`,
            exercise,
            reason: 'Include vocal health exercises to prevent fatigue and maintain long-term vocal health',
            score: 0.75,
            confidence: 0.9,
            priority: 'medium',
            context: 'vocal_health',
            expectedImprovement: 0,
            estimatedTime: Math.ceil(exercise.duration / 60),
            difficulty: 'review',
            adaptation: [],
          });
        });
      }

      // Sort and return top recommendations
      return recs
        .sort((a, b) => {
          // Sort by priority first, then by score
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return b.score - a.score;
        })
        .slice(0, 8);
    };

    const timer = setTimeout(() => {
      setRecommendations(generateRecommendations());
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [userProfileML]);

  const handleAcceptRecommendation = (recommendation: MLRecommendation) => {
    onRecommendationAccept?.(recommendation);
    onExerciseSelect?.(recommendation.exercise);

    // Update user profile with feedback
    setRecommendations(prev => prev.filter(r => r.id !== recommendation.id));
  };

  const handleDismissRecommendation = (recommendationId: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== recommendationId));
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return 'bg-green-100 text-green-800';
    if (difficulty <= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 3) return 'Beginner';
    if (difficulty <= 6) return 'Intermediate';
    return 'Advanced';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'breath': return '💨';
      case 'pitch': return '🎯';
      case 'range': return '↕️';
      case 'articulation': return '🗣️';
      case 'expression': return '🎭';
      case 'health': return '🏥';
      default: return '🎵';
    }
  };

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'warmup': return '🔥';
      case 'technique': return '⚙️';
      case 'repertoire': return '🎼';
      case 'assessment': return '📊';
      case 'fun': return '🎲';
      default: return '📝';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <ResponsiveCard className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="text-center space-y-4">
          <div className="text-5xl">🤖</div>
          <ResponsiveText size="2xl" weight="semibold" className="text-blue-900">
            Machine Learning Recommendations
          </ResponsiveText>
          <ResponsiveText size="md" color="text-blue-700">
            Personalized exercise suggestions based on your performance patterns and goals
          </ResponsiveText>

          {userProfileML && (
            <div className="flex justify-center gap-6 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">
                  {userProfileML.performance.accuracy}%
                </div>
                <ResponsiveText size="sm" color="text-blue-700">
                  Accuracy
                </ResponsiveText>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">
                  {userProfileML.performance.totalSessions}
                </div>
                <ResponsiveText size="sm" color="text-blue-700">
                  Sessions
                </ResponsiveText>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900 capitalize">
                  {userProfileML.experience}
                </ResponsiveText>
                <ResponsiveText size="sm" color="text-blue-700">
                  Level
                </ResponsiveText>
              </div>
            </div>
          )}
        </div>
      </ResponsiveCard>

      {/* Filter Controls */}
      <ResponsiveCard>
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {['breath', 'pitch', 'range', 'articulation', 'expression', 'health'].map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getCategoryIcon(category)}
              <span className="capitalize">{category}</span>
            </button>
          ))}
        </div>
      </ResponsiveCard>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🤖</div>
          <ResponsiveText size="lg" weight="medium" className="text-gray-600">
            Analyzing your patterns...
          </ResponsiveText>
          <div className="mt-4">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {!loading && (
        <div className="space-y-4">
          {recommendations.length === 0 ? (
            <ResponsiveCard>
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🎯</div>
                <ResponsiveText size="lg" weight="medium" className="mb-4">
                  No new recommendations
                </ResponsiveText>
                <ResponsiveText size="md" color="text-gray-600">
                  Complete more sessions to get personalized recommendations
                </ResponsiveText>
              </div>
            </ResponsiveCard>
          ) : (
            <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 2 }} gap={6}>
              {recommendations.map((recommendation) => (
                <ResponsiveCard key={recommendation.id} className="hover:shadow-lg transition-all">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getTypeEmoji(recommendation.exercise.type)}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recommendation.exercise.difficulty)}`}>
                          {getDifficultyLabel(recommendation.exercise.difficulty)}
                        </span>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        recommendation.priority === 'high' ? 'bg-red-100 text-red-800' :
                        recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {recommendation.priority}
                      </div>
                    </div>

                    {/* Exercise Info */}
                    <div>
                      <ResponsiveText size="lg" weight="semibold" className="mb-2">
                        {recommendation.exercise.title}
                      </ResponsiveText>
                      <ResponsiveText size="md" color="text-gray-600" className="mb-3">
                        {recommendation.exercise.description}
                      </ResponsiveText>

                      {/* AI Reason */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <ResponsiveText size="sm" weight="medium" className="text-blue-900 mb-1">
                          🤖 AI Insight:
                        </ResponsiveText>
                        <ResponsiveText size="sm" className="text-blue-800">
                          {recommendation.reason}
                        </ResponsiveText>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex items-center gap-1`}>
                          {getCategoryIcon(recommendation.exercise.category)}
                          <span className="capitalize">{recommendation.exercise.category}</span>
                        </span>
                        {recommendation.exercise.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Expected Outcome */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Expected improvement:
                        </span>
                        <span className="font-medium text-green-600">
                          +{recommendation.expectedImprovement}%
                        </span>
                      </div>

                      {/* Adaptation Info */}
                      {recommendation.adaptation.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                          <ResponsiveText size="xs" className="text-green-800">
                            {recommendation.adaptation.join(' • ')}
                          </ResponsiveText>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <ResponsiveButton
                          onClick={() => handleAcceptRecommendation(recommendation)}
                          variant="primary"
                          size={{ mobile: 'md', tablet: 'lg', desktop: 'lg' }}
                          fullWidth
                        >
                          🚀 Start Exercise
                        </ResponsiveButton>
                        <ResponsiveButton
                          onClick={() => handleDismissRecommendation(recommendation.id)}
                          variant="outline"
                          size={{ mobile: 'md', tablet: 'lg', desktop: 'lg' }}
                        >
                          Skip
                        </ResponsiveButton>
                      </div>
                    </div>
                  </ResponsiveCard>
              ))}
            </ResponsiveGrid>
          )}
        </div>
      )}

      {/* Learning Progress */}
      {userProfileML && (
        <ResponsiveCard>
          <ResponsiveText size="lg" weight="semibold" className="mb-4">
            📈 Learning Patterns
          </ResponsiveText>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">
                {userProfileML.patterns.bestTimeOfDay}
              </div>
              <ResponsiveText size="sm" color="text-gray-600">
                Best Practice Time
              </ResponsiveText>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">
                {userProfileML.patterns.optimalSessionLength}min
              </div>
              <ResponsiveText size="sm" color="text-gray-600">
                Optimal Session
              </ResponsiveText>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-900">
                {userProfileML.patterns.frequency}x/week
              </div>
              <ResponsiveText size="sm" color="text-gray-600">
                Practice Frequency
              </ResponsiveText>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg">
              <div className="text-2xl font-bold text-teal-900">
                {userProfileML.patterns.preferredWarmupDuration}min
              </div>
              <ResponsiveText size="sm" color="text-gray-600">
                Warmup Duration
              </ResponsiveText>
            </div>
          </div>
        </ResponsiveCard>
      )}
    </div>
  );
}