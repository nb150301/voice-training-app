/**
 * AI Voice Coach System
 * Phase 5: Advanced AI Features and Personalization
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

export interface VoiceAnalysis {
  id: string;
  timestamp: string;
  pitchAccuracy: number;
  pitchStability: number;
  breathSupport: number;
  toneQuality: number;
  articulation: number;
  rhythm: number;
  overallScore: number;
  issues: string[];
  strengths: string[];
  recommendations: string[];
  audioData?: {
    duration: number;
    averagePitch: number;
    pitchRange: { min: number; max: number };
    confidence: number;
  };
}

export interface AILessonPlan {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  objectives: string[];
  exercises: AIExercise[];
  targetAreas: string[];
  prerequisites: string[];
  adaptations: {
    voiceType: string;
    modifications: string[];
  }[];
  successMetrics: {
    accuracy: number;
    consistency: number;
    improvement: number;
  };
}

export interface AIExercise {
  id: string;
  title: string;
  type: 'warmup' | 'technique' | 'repertoire' | 'assessment';
  instructions: string[];
  targetPitch?: number;
  targetRange?: { min: number; max: number };
  duration: number;
  difficulty: number; // 1-10
  aiTips: string[];
  commonMistakes: string[];
  successCriteria: string[];
}

export interface AIRecommendation {
  type: 'exercise' | 'rest' | 'technique' | 'repertoire' | 'health';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reason: string;
  actionItems: string[];
  estimatedTime: number;
  confidence: number; // 0-1
}

interface AIVoiceCoachProps {
  onSessionComplete?: (analysis: VoiceAnalysis) => void;
  onExerciseComplete?: (exerciseId: string, performance: any) => void;
}

export default function AIVoiceCoach({ onSessionComplete, onExerciseComplete }: AIVoiceCoachProps) {
  const { profile } = useUserProfile();
  const { isMobile } = useResponsiveBreakpoints();
  const [isRecording, setIsRecording] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<VoiceAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [currentLesson, setCurrentLesson] = useState<AILessonPlan | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<VoiceAnalysis[]>([]);
  const [realTimeFeedback, setRealTimeFeedback] = useState<string[]>([]);
  const [sessionProgress, setSessionProgress] = useState(0);

  const voiceType = profile?.voiceProfile?.voiceType || 'unknown';

  // Generate AI lesson plans based on user profile
  const generateAILessonPlan = (): AILessonPlan => {
    const userLevel = profile?.progress?.totalSessions ? Math.min(8, Math.floor(profile.progress.totalSessions / 10) + 1) : 1;

    const lessonPlans: AILessonPlan[] = [
      {
        id: 'lesson_beginner_1',
        title: 'Foundational Pitch Control',
        description: 'Build essential pitch accuracy and stability through targeted exercises',
        difficulty: 'beginner',
        duration: 20,
        objectives: ['Improve pitch accuracy to 80%', 'Develop breath support', 'Master basic note sustain'],
        exercises: [
          {
            id: 'ai_ex1',
            title: 'Breathing Foundation',
            type: 'warmup',
            instructions: ['Deep diaphragmatic breathing', '4-count inhale, 8-count exhale', 'Feel expansion in lower back'],
            duration: 180,
            difficulty: 3,
            aiTips: ['Keep shoulders relaxed', 'Practice in front of mirror', 'Place hand on stomach to feel movement'],
            commonMistakes: ['Shoulder tension', 'Shallow breathing', 'Holding breath too long'],
            successCriteria: ['Consistent 8-second exhale', 'No shoulder movement', 'Relaxed jaw'],
          },
          {
            id: 'ai_ex2',
            title: 'Pitch Matching Exercise',
            type: 'technique',
            instructions: ['Listen to reference pitch', 'Hum before singing', 'Match pitch accurately'],
            targetPitch: voiceType === 'bass' ? 130 : voiceType === 'tenor' ? 261 : voiceType === 'alto' ? 329 : 440,
            duration: 240,
            difficulty: 5,
            aiTips: ['Start with humming', 'Use a tuner for reference', 'Record yourself to check'],
            commonMistakes: ['Singing too loudly', 'Not listening to reference', 'Tension in throat'],
            successCriteria: ['Within 10 cents of target', 'Stable tone quality', 'No tension'],
          },
        ],
        targetAreas: ['pitch accuracy', 'breath support'],
        prerequisites: [],
        adaptations: [
          {
            voiceType: 'soprano',
            modifications: ['Start with middle C (261 Hz)', 'Focus on head voice resonance'],
          },
          {
            voiceType: 'bass',
            modifications: ['Start with C3 (130 Hz)', 'Emphasize chest voice'],
          },
        ],
        successMetrics: {
          accuracy: 80,
          consistency: 75,
          improvement: 15,
        },
      },
      {
        id: 'lesson_intermediate_1',
        title: 'Advanced Pitch Precision',
        description: 'Develop advanced pitch control and musical expression techniques',
        difficulty: 'intermediate',
        duration: 30,
        objectives: ['Achieve 90% pitch accuracy', 'Master vibrato control', 'Develop dynamic range'],
        exercises: [
          {
            id: 'ai_ex3',
            title: 'Vibrato Development',
            type: 'technique',
            instructions: ['Start with straight tone', 'Gentle pulsation', 'Control speed and width'],
            targetPitch: voiceType === 'bass' ? 150 : voiceType === 'tenor' ? 293 : voiceType === 'alto' ? 392 : 523,
            duration: 300,
            difficulty: 7,
            aiTips: ['Start with slow vibrato', 'Support from diaphragm', 'Keep throat relaxed'],
            commonMistakes: ['Forced vibrato', 'Throat tension', 'Inconsistent speed'],
            successCriteria: ['Controlled vibrato at 4-6 Hz', 'Even amplitude', 'Relaxed production'],
          },
        ],
        targetAreas: ['pitch precision', 'expression', 'technique'],
        prerequisites: ['Foundational pitch control'],
        adaptations: [
          {
            voiceType: 'alto',
            modifications: ['Focus on mixed voice area', 'Practice smooth register transitions'],
          },
        ],
        successMetrics: {
          accuracy: 90,
          consistency: 85,
          improvement: 20,
        },
      },
    ];

    return lessonPlans[Math.min(userLevel - 1, lessonPlans.length - 1)];
  };

  // Generate AI recommendations based on current performance
  const generateAIRecommendations = (analysis: VoiceAnalysis): AIRecommendation[] => {
    const recommendations: AIRecommendation[] = [];

    if (analysis.pitchAccuracy < 75) {
      recommendations.push({
        type: 'exercise',
        priority: 'high',
        title: 'Focus on Pitch Accuracy',
        description: 'Your pitch accuracy is below optimal level. Dedicated pitch exercises will help.',
        reason: 'Current accuracy: ' + analysis.pitchAccuracy + '%',
        actionItems: ['Practice pitch matching exercises', 'Use tuner for reference', 'Record and review performances'],
        estimatedTime: 15,
        confidence: 0.9,
      });
    }

    if (analysis.breathSupport < 70) {
      recommendations.push({
        type: 'technique',
        priority: 'high',
        title: 'Improve Breath Support',
        description: 'Better breath support will improve tone quality and sustain.',
        reason: 'Breath support score: ' + analysis.breathSupport + '%',
        actionItems: ['Practice diaphragmatic breathing', 'Focus on longer exhales', 'Practice breath control exercises'],
        estimatedTime: 10,
        confidence: 0.85,
      });
    }

    if (analysis.toneQuality < 80) {
      recommendations.push({
        type: 'exercise',
        priority: 'medium',
        title: 'Enhance Tone Quality',
        description: 'Work on resonance and vocal placement for richer tone.',
        reason: 'Tone quality needs improvement',
        actionItems: ['Practice resonance exercises', 'Work on vocal placement', 'Explore different vowel shapes'],
        estimatedTime: 20,
        confidence: 0.8,
      });
    }

    if (analysis.issues.includes('vocal fatigue')) {
      recommendations.push({
        type: 'rest',
        priority: 'high',
        title: 'Vocal Rest Required',
        description: 'Signs of vocal fatigue detected. Rest your voice to prevent injury.',
        reason: 'Vocal fatigue detected in analysis',
        actionItems: ['Take 24-48 hours of vocal rest', 'Stay hydrated', 'Avoid whispering and clearing throat'],
        estimatedTime: 1440, // 24 hours in minutes
        confidence: 0.95,
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  // Simulate real-time AI voice analysis
  const startAnalysis = () => {
    setIsRecording(true);
    setIsAnalyzing(true);
    setSessionProgress(0);

    // Simulate real-time feedback during recording
    const feedbackInterval = setInterval(() => {
      const feedback = [
        'Good breath support - keep it steady!',
        'Watch your jaw tension - try to relax',
        'Excellent pitch control on that note!',
        'Focus on consistent tone quality',
        'Great rhythm and timing',
        'Remember to support from your diaphragm',
      ];

      setRealTimeFeedback(prev => [
        ...prev.slice(-2),
        feedback[Math.floor(Math.random() * feedback.length)]
      ]);
    }, 3000);

    // Simulate analysis completion
    setTimeout(() => {
      clearInterval(feedbackInterval);

      const newAnalysis: VoiceAnalysis = {
        id: `analysis_${Date.now()}`,
        timestamp: new Date().toISOString(),
        pitchAccuracy: Math.min(100, 75 + Math.random() * 20),
        pitchStability: Math.min(100, 70 + Math.random() * 25),
        breathSupport: Math.min(100, 65 + Math.random() * 30),
        toneQuality: Math.min(100, 70 + Math.random() * 25),
        articulation: Math.min(100, 75 + Math.random() * 20),
        rhythm: Math.min(100, 80 + Math.random() * 15),
        overallScore: 0,
        issues: [],
        strengths: [],
        recommendations: [],
        audioData: {
          duration: 120,
          averagePitch: voiceType === 'bass' ? 150 : voiceType === 'tenor' ? 261 : voiceType === 'alto' ? 329 : 440,
          pitchRange: { min: 100, max: 800 },
          confidence: 0.85,
        },
      };

      // Calculate overall score
      newAnalysis.overallScore = Math.round(
        (newAnalysis.pitchAccuracy * 0.3 +
        newAnalysis.pitchStability * 0.2 +
        newAnalysis.breathSupport * 0.2 +
        newAnalysis.toneQuality * 0.15 +
        newAnalysis.articulation * 0.1 +
        newAnalysis.rhythm * 0.05)
      );

      // Generate strengths and issues
      newAnalysis.strengths = [
        'Good pitch control',
        'Consistent breath support',
        'Clear articulation',
      ].slice(0, Math.floor(Math.random() * 3) + 1);

      if (newAnalysis.pitchAccuracy < 80) {
        newAnalysis.issues.push('pitch accuracy needs improvement');
      }
      if (newAnalysis.breathSupport < 75) {
        newAnalysis.issues.push('breath support could be stronger');
      }
      if (Math.random() > 0.7) {
        newAnalysis.issues.push('minor tension in jaw');
      }

      setCurrentAnalysis(newAnalysis);
      setAnalysisHistory(prev => [...prev, newAnalysis]);
      setRecommendations(generateAIRecommendations(newAnalysis));
      setIsRecording(false);
      setIsAnalyzing(false);
      setSessionProgress(100);
      onSessionComplete?.(newAnalysis);
    }, 12000);
  };

  // Initialize AI lesson
  useEffect(() => {
    const lesson = generateAILessonPlan();
    setCurrentLesson(lesson);
  }, [profile]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🌟';
    if (score >= 80) return '✨';
    if (score >= 70) return '👍';
    return '📈';
  };

  const getRecommendationIcon = (type: AIRecommendation['type']) => {
    switch (type) {
      case 'exercise': return '🎵';
      case 'technique': return '🎯';
      case 'rest': return '🛏️';
      case 'repertoire': return '🎼';
      case 'health': return '🏥';
      default: return '💡';
    }
  };

  const getPriorityColor = (priority: AIRecommendation['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-50 border-red-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'low': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* AI Coach Header */}
      <ResponsiveCard className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <div className="text-center space-y-4">
          <div className="text-5xl">🤖</div>
          <ResponsiveText size="2xl" weight="semibold" className="text-purple-900">
            AI Voice Coach
          </ResponsiveText>
          <ResponsiveText size="md" color="text-purple-700">
            Personalized vocal training with intelligent feedback and adaptive learning
          </ResponsiveText>

          {currentLesson && (
            <div className="bg-white bg-opacity-60 rounded-lg p-4 max-w-md mx-auto">
              <ResponsiveText size="lg" weight="medium" className="text-purple-900">
                Current Lesson: {currentLesson.title}
              </ResponsiveText>
              <ResponsiveText size="sm" color="text-purple-700" className="mt-1">
                {currentLesson.description}
              </ResponsiveText>
            </div>
          )}
        </div>
      </ResponsiveCard>

      {/* Session Analysis */}
      <ResponsiveCard>
        <div className="space-y-6">
          <div className="text-center">
            <ResponsiveText size="lg" weight="semibold">
              Voice Analysis Session
            </ResponsiveText>
            <ResponsiveText size="md" color="text-gray-600" className="mt-1">
              Get real-time AI feedback on your vocal performance
            </ResponsiveText>
          </div>

          {/* Recording Controls */}
          <div className="flex justify-center gap-4">
            <ResponsiveButton
              onClick={startAnalysis}
              variant={isRecording ? "secondary" : "primary"}
              size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg' }}
              disabled={isAnalyzing}
              className="min-w-[160px]"
            >
              {isAnalyzing ? '🔄 Analyzing...' : isRecording ? '⏹️ Stop Analysis' : '🎤 Start AI Analysis'}
            </ResponsiveButton>
          </div>

          {/* Progress */}
          {isRecording && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Analysis Progress</span>
                <span>{sessionProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${sessionProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Real-time Feedback */}
          {realTimeFeedback.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <ResponsiveText size="md" weight="medium" className="text-blue-900 mb-3">
                💬 Real-time AI Feedback:
              </ResponsiveText>
              <div className="space-y-2">
                {realTimeFeedback.map((feedback, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">▸</span>
                    <ResponsiveText size="sm" className="text-blue-800">
                      {feedback}
                    </ResponsiveText>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ResponsiveCard>

      {/* Analysis Results */}
      {currentAnalysis && (
        <ResponsiveCard>
          <ResponsiveText size="lg" weight="semibold" className="mb-4">
            📊 Analysis Results
          </ResponsiveText>

          {/* Overall Score */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3">
              <span className="text-6xl">{getScoreEmoji(currentAnalysis.overallScore)}</span>
              <div>
                <div className={`text-4xl font-bold ${getScoreColor(currentAnalysis.overallScore)}`}>
                  {currentAnalysis.overallScore}%
                </div>
                <ResponsiveText size="md" color="text-gray-600">
                  Overall Score
                </ResponsiveText>
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <ResponsiveGrid cols={{ mobile: 2, tablet: 3, desktop: 3 }} gap={4} className="mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <ResponsiveText size="3xl" weight="bold" className={getScoreColor(currentAnalysis.pitchAccuracy)}>
                {currentAnalysis.pitchAccuracy}%
              </ResponsiveText>
              <ResponsiveText size="sm" color="text-gray-600">Pitch Accuracy</ResponsiveText>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <ResponsiveText size="3xl" weight="bold" className={getScoreColor(currentAnalysis.breathSupport)}>
                {currentAnalysis.breathSupport}%
              </ResponsiveText>
              <ResponsiveText size="sm" color="text-gray-600">Breath Support</ResponsiveText>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <ResponsiveText size="3xl" weight="bold" className={getScoreColor(currentAnalysis.toneQuality)}>
                {currentAnalysis.toneQuality}%
              </ResponsiveText>
              <ResponsiveText size="sm" color="text-gray-600">Tone Quality</ResponsiveText>
            </div>
          </ResponsiveGrid>

          {/* Strengths and Issues */}
          <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 2 }} gap={4}>
            <div>
              <ResponsiveText size="md" weight="medium" className="mb-3 text-green-700">
                💪 Strengths
              </ResponsiveText>
              <div className="space-y-2">
                {currentAnalysis.strengths.map((strength, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <ResponsiveText size="sm">{strength}</ResponsiveText>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <ResponsiveText size="md" weight="medium" className="mb-3 text-orange-700">
                🎯 Areas for Improvement
              </ResponsiveText>
              <div className="space-y-2">
                {currentAnalysis.issues.map((issue, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-orange-500">⚠</span>
                    <ResponsiveText size="sm">{issue}</ResponsiveText>
                  </div>
                ))}
              </div>
            </div>
          </ResponsiveGrid>
        </ResponsiveCard>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <ResponsiveCard>
          <ResponsiveText size="lg" weight="semibold" className="mb-4">
            🤖 AI Recommendations
          </ResponsiveText>

          <div className="space-y-4">
            {recommendations.slice(0, 3).map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${getPriorityColor(rec.priority)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getRecommendationIcon(rec.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <ResponsiveText size="md" weight="semibold">
                        {rec.title}
                      </ResponsiveText>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {rec.priority} priority
                      </span>
                    </div>

                    <ResponsiveText size="sm" color="text-gray-700" className="mb-3">
                      {rec.description}
                    </ResponsiveText>

                    <ResponsiveText size="sm" weight="medium" className="mb-2 text-gray-800">
                      Why: {rec.reason}
                    </ResponsiveText>

                    <div className="space-y-1 mb-3">
                      <ResponsiveText size="sm" weight="medium" className="text-gray-800">
                        Action Items:
                      </ResponsiveText>
                      {rec.actionItems.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-indigo-500">•</span>
                          <ResponsiveText size="sm">{item}</ResponsiveText>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        ⏱️ {formatTime(rec.estimatedTime)}
                      </span>
                      <span className="text-sm text-gray-600">
                        Confidence: {Math.round(rec.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ResponsiveCard>
      )}

      {/* Current Lesson */}
      {currentLesson && (
        <ResponsiveCard>
          <ResponsiveText size="lg" weight="semibold" className="mb-4">
            📚 Current AI Lesson Plan
          </ResponsiveText>

          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <ResponsiveText size="md" weight="medium" className="mb-2">
                Objectives
              </ResponsiveText>
              <div className="space-y-1">
                {currentLesson.objectives.map((objective, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-purple-500">•</span>
                    <ResponsiveText size="sm">{objective}</ResponsiveText>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <ResponsiveText size="md" weight="medium" className="mb-2">
                  🎯 Target Areas
                </ResponsiveText>
                <div className="flex flex-wrap gap-2">
                  {currentLesson.targetAreas.map((area, index) => (
                    <span key={index} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <ResponsiveText size="md" weight="medium" className="mb-2">
                  📊 Success Metrics
                </ResponsiveText>
                <div className="space-y-1 text-sm">
                  <div>Accuracy: {currentLesson.successMetrics.accuracy}%</div>
                  <div>Consistency: {currentLesson.successMetrics.consistency}%</div>
                  <div>Improvement: {currentLesson.successMetrics.improvement}%</div>
                </div>
              </div>
            </div>

            {/* Exercises */}
            <div>
              <ResponsiveText size="md" weight="medium" className="mb-3">
                🎵 Exercises in this Lesson
              </ResponsiveText>
              <div className="space-y-3">
                {currentLesson.exercises.map((exercise, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <ResponsiveText size="md" weight="medium">
                        {exercise.title}
                      </ResponsiveText>
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs">
                        {exercise.type}
                      </span>
                    </div>
                    <ResponsiveText size="sm" color="text-gray-600" className="mb-2">
                      Duration: {Math.floor(exercise.duration / 60)}min • Difficulty: {exercise.difficulty}/10
                    </ResponsiveText>
                    {exercise.targetPitch && (
                      <ResponsiveText size="sm" color="text-gray-600">
                        Target: {exercise.targetPitch} Hz
                      </ResponsiveText>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ResponsiveCard>
      )}
    </div>
  );
}