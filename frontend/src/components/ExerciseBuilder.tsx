/**
 * Custom Exercise Builder and Practice Templates
 * UI/UX Phase 3: Advanced Features
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ResponsiveContainer,
  ResponsiveCard,
  ResponsiveText,
  ResponsiveButton,
  ResponsiveGrid,
} from './ui/ResponsiveLayout';
import { useResponsiveBreakpoints } from '../../hooks/useResponsiveBreakpoints';
import { useUserProfile } from './UserProfileManager';

export interface ExerciseTemplate {
  id: string;
  title: string;
  description: string;
  category: 'warmup' | 'technical' | 'musicality' | 'endurance' | 'repertoire';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  exercises: ExerciseStep[];
  createdBy: 'system' | 'user';
  isPublic: boolean;
  tags: string[];
  rating?: number;
  usageCount?: number;
}

export interface ExerciseStep {
  id: string;
  type: 'note' | 'scale' | 'interval' | 'rest' | 'breath' | 'vibrato';
  targetPitch?: number;
  duration: number; // in seconds
  instruction: string;
  tip?: string;
  repeat?: number;
}

export interface CustomExercise {
  id: string;
  title: string;
  description: string;
  steps: ExerciseStep[];
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targetAreas: string[];
  voiceType?: string;
  createdAt: string;
  isFavorite: boolean;
}

const systemTemplates: ExerciseTemplate[] = [
  {
    id: 'vocal_warmup_basic',
    title: 'Basic Vocal Warmup',
    description: 'Essential warmup sequence for daily practice',
    category: 'warmup',
    difficulty: 'beginner',
    duration: 300, // 5 minutes
    createdBy: 'system',
    isPublic: true,
    tags: ['warmup', 'beginner', 'daily'],
    rating: 4.8,
    usageCount: 1234,
    exercises: [
      {
        id: 'step1',
        type: 'breath',
        duration: 30,
        instruction: 'Deep diaphragmatic breathing',
        tip: 'Place hand on stomach to feel expansion',
      },
      {
        id: 'step2',
        type: 'note',
        targetPitch: 261,
        duration: 15,
        instruction: 'Sustained middle C on "ah"',
        tip: 'Keep steady airflow',
      },
      {
        id: 'step3',
        type: 'scale',
        duration: 30,
        instruction: '5-note scale up and down',
        tip: 'Move smoothly between notes',
      },
    ],
  },
  {
    id: 'pitch_foundation',
    title: 'Pitch Foundation Builder',
    description: 'Build solid pitch control and accuracy',
    category: 'technical',
    difficulty: 'intermediate',
    duration: 600,
    createdBy: 'system',
    isPublic: true,
    tags: ['pitch', 'accuracy', 'control'],
    rating: 4.6,
    usageCount: 856,
    exercises: [
      {
        id: 'step1',
        type: 'note',
        targetPitch: 261,
        duration: 20,
        instruction: 'Sustained middle C',
        tip: 'Focus on steady pitch',
      },
      {
        id: 'step2',
        type: 'interval',
        duration: 30,
        instruction: 'Perfect fifths (C-G)',
        tip: 'Land precisely on target note',
      },
      {
        id: 'step3',
        type: 'scale',
        duration: 40,
        instruction: 'Major scale with rhythm',
        tip: 'Keep timing consistent',
      },
    ],
  },
  {
    id: 'endurance_champion',
    title: 'Endurance Champion',
    description: 'Build breath control and sustained singing ability',
    category: 'endurance',
    difficulty: 'advanced',
    duration: 900,
    createdBy: 'system',
    isPublic: true,
    tags: ['endurance', 'breath', 'stamina'],
    rating: 4.7,
    usageCount: 432,
    exercises: [
      {
        id: 'step1',
        type: 'breath',
        duration: 60,
        instruction: 'Extended breathing exercises',
        tip: 'Slow exhale for control',
      },
      {
        id: 'step2',
        type: 'note',
        targetPitch: 293,
        duration: 45,
        instruction: 'Extended sustained D',
        tip: 'Support with core muscles',
      },
      {
        id: 'step3',
        type: 'vibrato',
        duration: 60,
        instruction: 'Controlled vibrato exercise',
        tip: 'Start slow, gradually increase speed',
      },
    ],
  },
];

interface ExerciseBuilderProps {
  onExerciseCreated?: (exercise: CustomExercise) => void;
  onTemplateSelected?: (template: ExerciseTemplate) => void;
}

export default function ExerciseBuilder({ onExerciseCreated, onTemplateSelected }: ExerciseBuilderProps) {
  const { profile } = useUserProfile();
  const { isMobile } = useResponsiveBreakpoints();
  const [activeTab, setActiveTab] = useState<'templates' | 'builder' | 'my-exercises'>('templates');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [buildingExercise, setBuildingExercise] = useState<CustomExercise>({
    id: '',
    title: '',
    description: '',
    steps: [],
    estimatedDuration: 0,
    difficulty: 'beginner',
    targetAreas: [],
    voiceType: profile?.voiceProfile?.voiceType || 'unknown',
    createdAt: new Date().toISOString(),
    isFavorite: false,
  });
  const [isRecording, setIsRecording] = useState(false);
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>([]);

  const voiceType = profile?.voiceProfile?.voiceType || 'unknown';

  const categories = [
    { id: 'all', name: 'All', icon: '🎯' },
    { id: 'warmup', name: 'Warmup', icon: '🔥' },
    { id: 'technical', name: 'Technical', icon: '⚡' },
    { id: 'musicality', name: 'Musicality', icon: '🎵' },
    { id: 'endurance', name: 'Endurance', icon: '💪' },
    { id: 'repertoire', name: 'Repertoire', icon: '🎼' },
  ];

  const exerciseStepTypes = [
    { id: 'note', name: 'Single Note', icon: '🎵', description: 'Sustain a specific pitch' },
    { id: 'scale', name: 'Scale', icon: '🎼', description: 'Sing a scale pattern' },
    { id: 'interval', name: 'Interval', icon: '📏', description: 'Jump between specific intervals' },
    { id: 'breath', name: 'Breathing', icon: '💨', description: 'Breathing exercise' },
    { id: 'rest', name: 'Rest', icon: '⏸️', description: 'Silent rest period' },
    { id: 'vibrato', name: 'Vibrato', icon: '〰️', description: 'Vibrato control exercise' },
  ];

  const targetAreas = [
    'Pitch Accuracy', 'Breath Support', 'Range Expansion', 'Tone Quality',
    'Rhythm', 'Vibrato Control', 'Endurance', 'Diction', 'Dynamics'
  ];

  // Filter templates
  const filteredTemplates = selectedCategory === 'all'
    ? systemTemplates
    : systemTemplates.filter(template => template.category === selectedCategory);

  // Adjust template exercises based on voice type
  const getAdjustedTemplate = (template: ExerciseTemplate): ExerciseTemplate => {
    if (voiceType === 'unknown') return template;

    const voiceRanges = {
      soprano: { min: 500, max: 1200, factor: 1.5 },
      alto: { min: 350, max: 900, factor: 1.2 },
      tenor: { min: 200, max: 600, factor: 0.9 },
      bass: { min: 80, max: 350, factor: 0.7 },
    };

    const range = voiceRanges[voiceType as keyof typeof voiceRanges];

    const adjustedExercises = template.exercises.map(exercise => {
      if (exercise.targetPitch) {
        return {
          ...exercise,
          targetPitch: Math.round(exercise.targetPitch * range.factor),
        };
      }
      return exercise;
    });

    return { ...template, exercises: adjustedExercises };
  };

  const addStep = (type: ExerciseStep['type']) => {
    const newStep: ExerciseStep = {
      id: `step_${Date.now()}`,
      type,
      duration: 15, // Default 15 seconds
      instruction: getDefaultInstruction(type),
    };

    const updatedExercise = {
      ...buildingExercise,
      steps: [...buildingExercise.steps, newStep],
      estimatedDuration: buildingExercise.estimatedDuration + newStep.duration,
    };

    setBuildingExercise(updatedExercise);
  };

  const getDefaultInstruction = (type: ExerciseStep['type']): string => {
    switch (type) {
      case 'note': return 'Sustain target pitch';
      case 'scale': return 'Sing scale pattern';
      case 'interval': return 'Sing interval pattern';
      case 'breath': return 'Breathing exercise';
      case 'rest': return 'Rest and recover';
      case 'vibrato': return 'Vibrato control';
      default: return 'Perform exercise';
    }
  };

  const updateStep = (stepId: string, updates: Partial<ExerciseStep>) => {
    const updatedSteps = buildingExercise.steps.map(step => {
      if (step.id === stepId) {
        const oldDuration = step.duration;
        const newStep = { ...step, ...updates };

        // Update total duration
        setBuildingExercise(prev => ({
          ...prev,
          estimatedDuration: prev.estimatedDuration - oldDuration + newStep.duration,
        }));

        return newStep;
      }
      return step;
    });

    setBuildingExercise(prev => ({ ...prev, steps: updatedSteps }));
  };

  const removeStep = (stepId: string) => {
    const stepToRemove = buildingExercise.steps.find(step => step.id === stepId);
    if (!stepToRemove) return;

    const updatedExercise = {
      ...buildingExercise,
      steps: buildingExercise.steps.filter(step => step.id !== stepId),
      estimatedDuration: buildingExercise.estimatedDuration - stepToRemove.duration,
    };

    setBuildingExercise(updatedExercise);
  };

  const saveExercise = () => {
    if (!buildingExercise.title || buildingExercise.steps.length === 0) {
      alert('Please add a title and at least one exercise step');
      return;
    }

    const exerciseToSave: CustomExercise = {
      ...buildingExercise,
      id: `custom_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updatedExercises = [...customExercises, exerciseToSave];
    setCustomExercises(updatedExercises);
    onExerciseCreated?.(exerciseToSave);

    // Reset builder
    setBuildingExercise({
      id: '',
      title: '',
      description: '',
      steps: [],
      estimatedDuration: 0,
      difficulty: 'beginner',
      targetAreas: [],
      voiceType,
      createdAt: new Date().toISOString(),
      isFavorite: false,
    });

    alert('Exercise saved successfully!');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-50 border-green-300';
      case 'intermediate': return 'bg-yellow-50 border-yellow-300';
      case 'advanced': return 'bg-red-50 border-red-300';
      default: return 'bg-gray-50 border-gray-300';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const renderTemplateTab = () => (
    <div className="space-y-6">
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

      {/* Templates Grid */}
      <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }} gap={4}>
        {filteredTemplates.map(template => {
          const adjustedTemplate = getAdjustedTemplate(template);

          return (
            <ResponsiveCard
              key={template.id}
              className={`hover:shadow-lg transition-all cursor-pointer ${getDifficultyColor(template.difficulty)}`}
              onClick={() => onTemplateSelected?.(adjustedTemplate)}
            >
              <div className="space-y-3">
                <div>
                  <ResponsiveText size="md" weight="semibold">
                    {template.title}
                  </ResponsiveText>
                  <ResponsiveText size="sm" className="mt-1">
                    {template.description}
                  </ResponsiveText>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize font-medium">
                    {template.difficulty}
                  </span>
                  <span className="flex items-center gap-1">
                    ⏱️ {formatDuration(template.duration)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    ⭐ {template.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    👥 {template.usageCount}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="bg-white bg-opacity-60 px-2 py-1 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>

                <ResponsiveButton
                  variant="primary"
                  size={{ mobile: 'sm', tablet: 'sm', desktop: 'sm' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTemplateSelected?.(adjustedTemplate);
                  }}
                >
                  🚀 Start Template
                </ResponsiveButton>
              </div>
            </ResponsiveCard>
          );
        })}
      </ResponsiveGrid>
    </div>
  );

  const renderBuilderTab = () => (
    <div className="space-y-6">
      <ResponsiveCard>
        <ResponsiveText size="lg" weight="semibold" className="mb-4">
          Create Custom Exercise
        </ResponsiveText>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exercise Title
            </label>
            <input
              type="text"
              value={buildingExercise.title}
              onChange={(e) => setBuildingExercise(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="My Custom Exercise"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={buildingExercise.description}
              onChange={(e) => setBuildingExercise(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Describe your exercise..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                value={buildingExercise.difficulty}
                onChange={(e) => setBuildingExercise(prev => ({
                  ...prev,
                  difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced'
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Duration
              </label>
              <div className="text-lg font-medium text-indigo-600">
                {formatDuration(buildingExercise.estimatedDuration)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Areas
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {targetAreas.map(area => (
                <label key={area} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={buildingExercise.targetAreas.includes(area)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBuildingExercise(prev => ({
                          ...prev,
                          targetAreas: [...prev.targetAreas, area]
                        }));
                      } else {
                        setBuildingExercise(prev => ({
                          ...prev,
                          targetAreas: prev.targetAreas.filter(a => a !== area)
                        }));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{area}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </ResponsiveCard>

      {/* Exercise Steps */}
      <ResponsiveCard>
        <div className="flex justify-between items-center mb-4">
          <ResponsiveText size="lg" weight="semibold">
            Exercise Steps ({buildingExercise.steps.length})
          </ResponsiveText>
          <ResponsiveButton
            variant="outline"
            size={{ mobile: 'sm', tablet: 'sm', desktop: 'sm' }}
            onClick={() => saveExercise()}
            disabled={!buildingExercise.title || buildingExercise.steps.length === 0}
          >
            💾 Save Exercise
          </ResponsiveButton>
        </div>

        {/* Add Step Buttons */}
        <div className="mb-6">
          <ResponsiveText size="md" weight="medium" className="mb-3">
            Add Step:
          </ResponsiveText>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {exerciseStepTypes.map(type => (
              <button
                key={type.id}
                onClick={() => addStep(type.id as ExerciseStep['type'])}
                className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                <span className="text-lg">{type.icon}</span>
                <div>
                  <div className="font-medium text-sm">{type.name}</div>
                  <div className="text-xs text-gray-600">{type.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          {buildingExercise.steps.map((step, index) => (
            <div key={step.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium">Step {index + 1}</span>
                  <span className="text-sm text-gray-500 capitalize">{step.type}</span>
                </div>
                <button
                  onClick={() => removeStep(step.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instruction
                  </label>
                  <input
                    type="text"
                    value={step.instruction}
                    onChange={(e) => updateStep(step.id, { instruction: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={step.duration}
                    onChange={(e) => updateStep(step.id, { duration: parseInt(e.target.value) || 15 })}
                    min="5"
                    max="120"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                {step.type === 'note' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Pitch (Hz)
                    </label>
                    <input
                      type="number"
                      value={step.targetPitch || ''}
                      onChange={(e) => updateStep(step.id, { targetPitch: parseInt(e.target.value) || undefined })}
                      min="50"
                      max="2000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tip (Optional)
                  </label>
                  <input
                    type="text"
                    value={step.tip || ''}
                    onChange={(e) => updateStep(step.id, { tip: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="Add a helpful tip..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {buildingExercise.steps.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p>Add steps to build your custom exercise</p>
          </div>
        )}
      </ResponsiveCard>
    </div>
  );

  const renderMyExercisesTab = () => (
    <div className="space-y-6">
      <div className="text-center">
        <ResponsiveText size="lg" weight="semibold">
          My Custom Exercises
        </ResponsiveText>
        <ResponsiveText size="md" color="text-gray-600" className="mt-1">
          Exercises you've created and saved
        </ResponsiveText>
      </div>

      {customExercises.length === 0 ? (
        <ResponsiveCard>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📝</div>
            <ResponsiveText size="md" weight="medium" className="mb-2">
              No custom exercises yet
            </ResponsiveText>
            <ResponsiveText size="sm" color="text-gray-600" className="mb-4">
              Create your first personalized exercise
            </ResponsiveText>
            <ResponsiveButton
              onClick={() => setActiveTab('builder')}
              variant="primary"
            >
              ✨ Create Exercise
            </ResponsiveButton>
          </div>
        </ResponsiveCard>
      ) : (
        <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }} gap={4}>
          {customExercises.map(exercise => (
            <ResponsiveCard
              key={exercise.id}
              className={`hover:shadow-lg transition-all cursor-pointer ${getDifficultyColor(exercise.difficulty)}`}
            >
              <div className="space-y-3">
                <div>
                  <ResponsiveText size="md" weight="semibold">
                    {exercise.title}
                  </ResponsiveText>
                  <ResponsiveText size="sm" className="mt-1">
                    {exercise.description}
                  </ResponsiveText>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize font-medium">
                    {exercise.difficulty}
                  </span>
                  <span className="flex items-center gap-1">
                    ⏱️ {formatDuration(exercise.estimatedDuration)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {exercise.targetAreas.slice(0, 2).map(area => (
                    <span key={area} className="bg-white bg-opacity-60 px-2 py-1 rounded text-xs">
                      {area}
                    </span>
                  ))}
                </div>

                <div className="text-xs text-gray-500">
                  Created {new Date(exercise.createdAt).toLocaleDateString()}
                </div>

                <ResponsiveButton
                  variant="primary"
                  size={{ mobile: 'sm', tablet: 'sm', desktop: 'sm' }}
                >
                  ▶️ Start Exercise
                </ResponsiveButton>
              </div>
            </ResponsiveCard>
          ))}
        </ResponsiveGrid>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <ResponsiveCard>
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setActiveTab('templates')}
            className={`
              px-6 py-3 rounded-lg font-medium transition-all
              ${activeTab === 'templates'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            📚 Exercise Templates
          </button>
          <button
            onClick={() => setActiveTab('builder')}
            className={`
              px-6 py-3 rounded-lg font-medium transition-all
              ${activeTab === 'builder'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            ✨ Exercise Builder
          </button>
          <button
            onClick={() => setActiveTab('my-exercises')}
            className={`
              px-6 py-3 rounded-lg font-medium transition-all
              ${activeTab === 'my-exercises'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            📝 My Exercises ({customExercises.length})
          </button>
        </div>
      </ResponsiveCard>

      {/* Tab Content */}
      {activeTab === 'templates' && renderTemplateTab()}
      {activeTab === 'builder' && renderBuilderTab()}
      {activeTab === 'my-exercises' && renderMyExercisesTab()}
    </div>
  );
}