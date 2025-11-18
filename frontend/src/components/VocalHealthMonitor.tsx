import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertTriangle, Activity, Droplets, Thermometer, Clock, TrendingUp, Heart, Zap, Shield } from 'lucide-react';

// Interfaces for vocal health monitoring
export interface VocalHealthMetrics {
  id: string;
  timestamp: string;
  // Core health indicators
  vocalFatigue: number; // 0-100, higher is more fatigued
  hydrationScore: number; // 0-100, hydration level
  strainIndex: number; // 0-100, vocal strain level
  recoveryTime: number; // minutes until fully recovered

  // Environmental and behavioral factors
  practiceDuration: number; // minutes practiced today
  speakingTime: number; // estimated speaking minutes
  environmentQuality: number; // 0-100, air quality, humidity

  // Physical indicators
  pitchStability: number; // 0-100, consistency of pitch
  volumeConsistency: number; // 0-100, control over dynamics
  breathSupport: number; // 0-100, breathing efficiency

  // Risk factors
  recentIllness: boolean;
  medications: string[];
  allergens: string[];
  stressLevel: number; // 0-100

  // Recommendations
  recommendations: HealthRecommendation[];
  warnings: HealthWarning[];
}

export interface HealthRecommendation {
  id: string;
  type: 'hydration' | 'rest' | 'technique' | 'environment' | 'exercise';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  actionSteps: string[];
  estimatedTime: string; // time to see improvement
}

export interface HealthWarning {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  category: 'fatigue' | 'strain' | 'dehydration' | 'overuse' | 'technique';
  title: string;
  message: string;
  immediateAction: string;
}

export interface HealthTrend {
  date: string;
  overallScore: number;
  fatigueLevel: number;
  hydrationScore: number;
  strainIndex: number;
  practiceMinutes: number;
}

export interface HealthGoal {
  id: string;
  type: 'daily_hydration' | 'practice_limit' | 'rest_breaks' | 'technique_improvement';
  target: number;
  current: number;
  unit: string;
  achieved: boolean;
}

const VocalHealthMonitor: React.FC<{
  userId?: string;
  onHealthAlert?: (alert: HealthWarning) => void;
  onGoalAchieved?: (goal: HealthGoal) => void;
  className?: string;
}> = ({ userId, onHealthAlert, onGoalAchieved, className = '' }) => {
  const [currentMetrics, setCurrentMetrics] = useState<VocalHealthMetrics | null>(null);
  const [healthTrends, setHealthTrends] = useState<HealthTrend[]>([]);
  const [healthGoals, setHealthGoals] = useState<HealthGoal[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'goals' | 'recommendations'>('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');

  // Initialize default health goals
  useEffect(() => {
    const defaultGoals: HealthGoal[] = [
      {
        id: 'daily_hydration',
        type: 'daily_hydration',
        target: 8,
        current: 0,
        unit: 'glasses',
        achieved: false
      },
      {
        id: 'practice_limit',
        type: 'practice_limit',
        target: 60,
        current: 0,
        unit: 'minutes',
        achieved: false
      },
      {
        id: 'rest_breaks',
        type: 'rest_breaks',
        target: 6,
        current: 0,
        unit: 'breaks',
        achieved: false
      }
    ];
    setHealthGoals(defaultGoals);
  }, []);

  // Simulate health data analysis
  const analyzeVocalHealth = useCallback(() => {
    const now = new Date();
    const metrics: VocalHealthMetrics = {
      id: `health_${Date.now()}`,
      timestamp: now.toISOString(),

      // Simulate realistic health metrics
      vocalFatigue: Math.random() * 30 + (isMonitoring ? 20 : 10), // 10-60%
      hydrationScore: Math.random() * 20 + 70, // 70-90%
      strainIndex: Math.random() * 25 + 5, // 5-30%
      recoveryTime: Math.floor(Math.random() * 60 + 30), // 30-90 minutes

      practiceDuration: Math.floor(Math.random() * 90 + 15), // 15-105 minutes
      speakingTime: Math.floor(Math.random() * 180 + 60), // 60-240 minutes
      environmentQuality: Math.random() * 30 + 60, // 60-90%

      pitchStability: Math.random() * 20 + 75, // 75-95%
      volumeConsistency: Math.random() * 25 + 70, // 70-95%
      breathSupport: Math.random() * 30 + 65, // 65-95%

      recentIllness: Math.random() > 0.8,
      medications: [],
      allergens: ['dust', 'pollen'].filter(() => Math.random() > 0.7),
      stressLevel: Math.random() * 40 + 20, // 20-60%

      recommendations: generateRecommendations(),
      warnings: generateWarnings()
    };

    setCurrentMetrics(metrics);
    setLastAnalysis(now);

    // Check for critical alerts
    const criticalWarnings = metrics.warnings.filter(w => w.severity === 'critical');
    criticalWarnings.forEach(warning => onHealthAlert?.(warning));

    return metrics;
  }, [isMonitoring, onHealthAlert]);

  // Generate health recommendations based on current metrics
  const generateRecommendations = (): HealthRecommendation[] => {
    const recommendations: HealthRecommendation[] = [
      {
        id: 'hydration',
        type: 'hydration',
        priority: 'high',
        title: 'Increase Water Intake',
        description: 'Your vocal cords need proper hydration to function optimally',
        actionSteps: [
          'Drink 8 glasses of water throughout the day',
          'Avoid caffeine and alcohol',
          'Use a humidifier in dry environments',
          'Steam inhalation for 10 minutes'
        ],
        estimatedTime: 'Immediate relief, 2-3 days for full benefit'
      },
      {
        id: 'vocal_rest',
        type: 'rest',
        priority: 'medium',
        title: 'Schedule Vocal Breaks',
        description: 'Regular rest periods prevent vocal fatigue and strain',
        actionSteps: [
          'Take 5-minute breaks every 25 minutes of practice',
          'Complete vocal rest for 1-2 hours after intense sessions',
          'Use non-verbal communication when possible',
          'Avoid whispering (it can strain vocal cords more than speaking)'
        ],
        estimatedTime: '30 minutes for initial recovery'
      },
      {
        id: 'technique',
        type: 'technique',
        priority: 'medium',
        title: 'Focus on Breath Support',
        description: 'Proper breathing reduces vocal strain and improves tone',
        actionSteps: [
          'Practice diaphragmatic breathing exercises',
          'Maintain good posture during practice',
          'Warm up gradually before intense singing',
          'Cool down with gentle humming'
        ],
        estimatedTime: '1-2 weeks to see improvement'
      }
    ];

    return recommendations.slice(0, 3 + Math.floor(Math.random() * 2));
  };

  // Generate health warnings based on current metrics
  const generateWarnings = (): HealthWarning[] => {
    const warnings: HealthWarning[] = [];

    // Simulate different warning scenarios
    if (Math.random() > 0.7) {
      warnings.push({
        id: 'fatigue_warning',
        severity: 'warning',
        category: 'fatigue',
        title: 'Vocal Fatigue Detected',
        message: 'Your voice shows signs of fatigue. Consider taking a break.',
        immediateAction: 'Stop practicing and rest your voice for at least 30 minutes'
      });
    }

    if (Math.random() > 0.85) {
      warnings.push({
        id: 'strain_alert',
        severity: 'critical',
        category: 'strain',
        title: 'High Vocal Strain',
        message: 'Dangerous levels of vocal strain detected. Immediate rest required.',
        immediateAction: 'Complete vocal rest for 24 hours. Consult a voice specialist if symptoms persist.'
      });
    }

    if (Math.random() > 0.8) {
      warnings.push({
        id: 'hydration_reminder',
        severity: 'info',
        category: 'dehydration',
        title: 'Low Hydration Level',
        message: 'Your hydration score is below optimal levels.',
        immediateAction: 'Drink a glass of water and consider using a humidifier.'
      });
    }

    return warnings;
  };

  // Calculate overall health score
  const overallHealthScore = useMemo(() => {
    if (!currentMetrics) return 0;

    const weights = {
      fatigue: 0.3,
      hydration: 0.25,
      strain: 0.25,
      technique: 0.2
    };

    const fatigueScore = 100 - currentMetrics.vocalFatigue;
    const techniqueScore = (currentMetrics.pitchStability + currentMetrics.volumeConsistency + currentMetrics.breathSupport) / 3;

    return Math.round(
      fatigueScore * weights.fatigue +
      currentMetrics.hydrationScore * weights.hydration +
      (100 - currentMetrics.strainIndex) * weights.strain +
      techniqueScore * weights.technique
    );
  }, [currentMetrics]);

  // Get health status color and message
  const getHealthStatus = (score: number) => {
    if (score >= 85) return { color: 'text-green-600', bg: 'bg-green-50', message: 'Excellent', icon: '✨' };
    if (score >= 70) return { color: 'text-blue-600', bg: 'bg-blue-50', message: 'Good', icon: '👍' };
    if (score >= 55) return { color: 'text-yellow-600', bg: 'bg-yellow-50', message: 'Fair', icon: '⚠️' };
    if (score >= 40) return { color: 'text-orange-600', bg: 'bg-orange-50', message: 'Caution', icon: '⚡' };
    return { color: 'text-red-600', bg: 'bg-red-50', message: 'At Risk', icon: '🚨' };
  };

  // Start/stop monitoring
  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    if (!isMonitoring) {
      // Start monitoring cycle
      analyzeVocalHealth();
    }
  };

  // Auto-analyze when monitoring
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      analyzeVocalHealth();
    }, 30000); // Analyze every 30 seconds

    return () => clearInterval(interval);
  }, [isMonitoring, analyzeVocalHealth]);

  // Generate mock trend data
  useEffect(() => {
    const generateTrendData = () => {
      const trends: HealthTrend[] = [];
      const now = new Date();

      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        trends.push({
          date: date.toISOString().split('T')[0],
          overallScore: Math.floor(Math.random() * 25 + 70),
          fatigueLevel: Math.floor(Math.random() * 30 + 10),
          hydrationScore: Math.floor(Math.random() * 20 + 70),
          strainIndex: Math.floor(Math.random() * 25 + 5),
          practiceMinutes: Math.floor(Math.random() * 90 + 15)
        });
      }

      setHealthTrends(trends);
    };

    generateTrendData();
  }, []);

  const healthStatus = getHealthStatus(overallHealthScore);

  if (!currentMetrics) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Vocal Health Monitor</h3>
          <p className="text-gray-600 mb-4">Real-time monitoring and protection for your voice</p>
          <button
            onClick={toggleMonitoring}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Health Monitoring
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Heart className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Vocal Health Monitor</h2>
              <p className="text-sm text-gray-600">AI-powered voice protection and wellness</p>
            </div>
          </div>
          <button
            onClick={toggleMonitoring}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              isMonitoring
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            <div className={`h-2 w-2 rounded-full ${isMonitoring ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
            {isMonitoring ? 'Monitoring' : 'Start Monitor'}
          </button>
        </div>

        {/* Health Score Overview */}
        <div className={`${healthStatus.bg} rounded-lg p-4 border border-gray-200`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{healthStatus.icon}</span>
              <div>
                <div className={`text-2xl font-bold ${healthStatus.color}`}>
                  {overallHealthScore}/100
                </div>
                <div className="text-sm text-gray-600">Overall Vocal Health</div>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${healthStatus.color} ${healthStatus.bg}`}>
              {healthStatus.message}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex">
          {(['overview', 'trends', 'goals', 'recommendations'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium border-b-2 capitalize transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'overview' && '📊 '}
              {tab === 'trends' && '📈 '}
              {tab === 'goals' && '🎯 '}
              {tab === 'recommendations' && '💡 '}
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Vocal Fatigue</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{currentMetrics.vocalFatigue.toFixed(0)}%</div>
                <div className="text-xs text-gray-600">Lower is better</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Hydration</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{currentMetrics.hydrationScore.toFixed(0)}%</div>
                <div className="text-xs text-gray-600">Target: 80%+</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-700">Strain Index</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{currentMetrics.strainIndex.toFixed(0)}%</div>
                <div className="text-xs text-gray-600">Keep below 30%</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Recovery Time</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{currentMetrics.recoveryTime}m</div>
                <div className="text-xs text-gray-600">Until fully rested</div>
              </div>
            </div>

            {/* Technique Metrics */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Technique Assessment</h3>
              <div className="space-y-3">
                {[
                  { label: 'Pitch Stability', value: currentMetrics.pitchStability, icon: '🎯' },
                  { label: 'Volume Control', value: currentMetrics.volumeConsistency, icon: '🔊' },
                  { label: 'Breath Support', value: currentMetrics.breathSupport, icon: '💨' }
                ].map((metric) => (
                  <div key={metric.label} className="flex items-center gap-3">
                    <span className="text-xl">{metric.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                        <span className="text-sm text-gray-900">{metric.value.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${metric.value}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Warnings */}
            {currentMetrics.warnings.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Health Alerts</h3>
                <div className="space-y-2">
                  {currentMetrics.warnings.map((warning) => (
                    <div
                      key={warning.id}
                      className={`p-4 rounded-lg border ${
                        warning.severity === 'critical' ? 'bg-red-50 border-red-200' :
                        warning.severity === 'warning' ? 'bg-orange-50 border-orange-200' :
                        'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {warning.severity === 'critical' ? (
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        ) : warning.severity === 'warning' ? (
                          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                        ) : (
                          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{warning.title}</h4>
                          <p className="text-sm text-gray-700 mt-1">{warning.message}</p>
                          <p className="text-sm font-medium text-gray-900 mt-2">
                            Action: {warning.immediateAction}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Health Trends</h3>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">Overall Health Score</h4>
              <div className="space-y-3">
                {healthTrends.slice(-7).map((trend, index) => (
                  <div key={trend.date} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-20">
                      {new Date(trend.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${trend.overallScore}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {trend.overallScore}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📈 Improving</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <div>• Hydration levels up 15% this week</div>
                  <div>• Practice efficiency improving</div>
                  <div>• Better breath support consistency</div>
                </div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">⚠️ Watch</h4>
                <div className="space-y-1 text-sm text-yellow-800">
                  <div>• Fatigue levels slightly elevated</div>
                  <div>• Practice duration increasing</div>
                  <div>• Consider more frequent breaks</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Daily Health Goals</h3>

            <div className="space-y-4">
              {healthGoals.map((goal) => (
                <div key={goal.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {goal.type === 'daily_hydration' && '💧 Daily Hydration'}
                        {goal.type === 'practice_limit' && '🎤 Practice Time Management'}
                        {goal.type === 'rest_breaks' && '⏸️ Rest Breaks'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Target: {goal.target} {goal.unit}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      goal.achieved
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {goal.achieved ? 'Achieved ✓' : `${goal.current}/${goal.target}`}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        goal.achieved ? 'bg-green-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">🏆 Weekly Challenge</h4>
              <p className="text-sm text-blue-800 mb-3">
                Complete all daily health goals for 7 consecutive days
              </p>
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <div
                      key={day}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        day <= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {day <= 3 ? '✓' : day}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-blue-700 ml-2">3/7 days completed</span>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Personalized Recommendations</h3>

            <div className="space-y-4">
              {currentMetrics.recommendations.map((rec) => (
                <div key={rec.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      rec.priority === 'urgent' ? 'bg-red-100' :
                      rec.priority === 'high' ? 'bg-orange-100' :
                      rec.priority === 'medium' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      {rec.type === 'hydration' && <Droplets className="h-4 w-4 text-blue-600" />}
                      {rec.type === 'rest' && <Clock className="h-4 w-4 text-yellow-600" />}
                      {rec.type === 'technique' && <Activity className="h-4 w-4 text-green-600" />}
                      {rec.type === 'environment' && <Shield className="h-4 w-4 text-purple-600" />}
                      {rec.type === 'exercise' && <Zap className="h-4 w-4 text-indigo-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{rec.title}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          rec.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          rec.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{rec.description}</p>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <h5 className="font-medium text-gray-900 mb-2">Action Steps:</h5>
                        <ul className="space-y-1 text-sm text-gray-700">
                          {rec.actionSteps.map((step, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-600 mt-0.5">•</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <span className="text-xs text-gray-600">⏱️ {rec.estimatedTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">🌟 Pro Tip</h4>
              <p className="text-sm text-green-800">
                Consistent implementation of these recommendations can improve your vocal health score by 15-25 points within 2 weeks.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {lastAnalysis && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Last analyzed: {lastAnalysis.toLocaleTimeString()}</span>
            <span>Next analysis in: {isMonitoring ? '30s' : 'Manual'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VocalHealthMonitor;