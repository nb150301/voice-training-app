/**
 * Onboarding Flow component
 * UI/UX Phase 2: User Journey Enhancement
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
import { InfoIcon, HelpIcon } from './ui/Tooltip';

interface OnboardingFlowProps {
  onComplete: () => void;
  user: any;
}

type OnboardingStep = 'welcome' | 'microphone' | 'voice-discovery' | 'first-recording' | 'understanding-results' | 'complete';

interface VoiceProfile {
  voiceType: 'soprano' | 'alto' | 'tenor' | 'bass' | 'unknown';
  comfortableRange: {
    min: number;
    max: number;
  };
  confidence: number;
}

export default function OnboardingFlow({ onComplete, user }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile>({
    voiceType: 'unknown',
    comfortableRange: { min: 0, max: 0 },
    confidence: 0,
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [pitchData, setPitchData] = useState<number[]>([]);
  const { isMobile } = useResponsiveBreakpoints();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const steps: OnboardingStep[] = [
    'welcome',
    'microphone',
    'voice-discovery',
    'first-recording',
    'understanding-results',
    'complete'
  ];

  const currentStepIndex = steps.indexOf(currentStep);

  const nextStep = () => {
    const nextIndex = Math.min(currentStepIndex + 1, steps.length - 1);
    setCurrentStep(steps[nextIndex]);
  };

  const prevStep = () => {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setCurrentStep(steps[prevIndex]);
  };

  const analyzeVoiceType = (pitches: number[]): VoiceProfile => {
    if (pitches.length === 0) {
      return {
        voiceType: 'unknown',
        comfortableRange: { min: 0, max: 0 },
        confidence: 0,
      };
    }

    const validPitches = pitches.filter(p => p > 50 && p < 1000);
    if (validPitches.length === 0) {
      return {
        voiceType: 'unknown',
        comfortableRange: { min: 0, max: 0 },
        confidence: 0,
      };
    }

    const minPitch = Math.min(...validPitches);
    const maxPitch = Math.max(...validPitches);
    const avgPitch = validPitches.reduce((a, b) => a + b, 0) / validPitches.length;

    let voiceType: VoiceProfile['voiceType'];
    if (avgPitch > 500) voiceType = 'soprano';
    else if (avgPitch > 400) voiceType = 'alto';
    else if (avgPitch > 250) voiceType = 'tenor';
    else voiceType = 'bass';

    return {
      voiceType,
      comfortableRange: { min: Math.round(minPitch), max: Math.round(maxPitch) },
      confidence: Math.min(100, Math.round((validPitches.length / pitches.length) * 100)),
    };
  };

  const startVoiceDiscovery = async () => {
    setIsRecording(true);
    setRecordingTime(0);
    setPitchData([]);

    // Simulate pitch detection for demo
    const demoPitches = Array.from({ length: 20 }, (_, i) => {
      // Generate realistic pitch data based on different voice types
      const basePitch = 150 + Math.random() * 300;
      return basePitch + Math.sin(i * 0.5) * 20;
    });

    setTimeout(() => {
      setPitchData(demoPitches);
      const profile = analyzeVoiceType(demoPitches);
      setVoiceProfile(profile);
      setIsRecording(false);
    }, 5000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVoiceTypeDescription = (type: VoiceProfile['voiceType']) => {
    switch (type) {
      case 'soprano':
        return 'High singing voice, typically the highest voice type';
      case 'alto':
        return 'Mid-range singing voice, harmonizing beautifully';
      case 'tenor':
        return 'Higher male voice, clear and bright tone';
      case 'bass':
        return 'Lowest voice type, rich and deep tones';
      default:
        return 'Voice type not detected, try again for better results';
    }
  };

  const getVoiceEmoji = (type: VoiceProfile['voiceType']) => {
    switch (type) {
      case 'soprano': return '🎵';
      case 'alto': return '🎤';
      case 'tenor': return '🎙️';
      case 'bass': return '🔊';
      default: return '❓';
    }
  };

  const renderWelcomeStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="text-6xl">🎤</div>
        <ResponsiveText size="2xl" weight="semibold">
          Welcome to Your Voice Training Journey!
        </ResponsiveText>
        <ResponsiveText size="md" color="text-gray-600">
          Let's set up your personalized voice training experience in just a few steps
        </ResponsiveText>
      </div>

      <ResponsiveCard className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <ResponsiveText size="lg" weight="semibold" className="mb-4">
          What you'll achieve:
        </ResponsiveText>
        <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }} gap={4}>
          <div className="text-center space-y-2">
            <div className="text-3xl">🎯</div>
            <ResponsiveText size="md" weight="medium">
              Find Your Voice Type
            </ResponsiveText>
            <ResponsiveText size="sm" color="text-gray-600">
              Discover your natural vocal range
            </ResponsiveText>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl">📊</div>
            <ResponsiveText size="md" weight="medium">
              Track Progress
            </ResponsiveText>
            <ResponsiveText size="sm" color="text-gray-600">
              Monitor your improvement over time
            </ResponsiveText>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl">🏆</div>
            <ResponsiveText size="md" weight="medium">
              Build Confidence
            </ResponsiveText>
            <ResponsiveText size="sm" color="text-gray-600">
              Develop consistent, accurate pitch
            </ResponsiveText>
          </div>
        </ResponsiveGrid>
      </ResponsiveCard>

      <ResponsiveButton
        onClick={nextStep}
        variant="primary"
        size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg' }}
        fullWidth
      >
        Let's Get Started →
      </ResponsiveButton>
    </div>
  );

  const renderMicrophoneStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <ResponsiveText size="2xl" weight="semibold">
          Microphone Setup
        </ResponsiveText>
        <ResponsiveText size="md" color="text-gray-600">
          Let's make sure your microphone is working properly
        </ResponsiveText>
      </div>

      <ResponsiveCard>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🎤</div>
            <div>
              <ResponsiveText size="lg" weight="semibold">
                Check Your Microphone
              </ResponsiveText>
              <ResponsiveText size="md" color="text-gray-600">
                Position yourself 6-12 inches from your microphone
              </ResponsiveText>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <InfoIcon
                content="Find a quiet environment with minimal background noise for best results"
                size="md"
                className="mt-1"
              />
              <div>
                <ResponsiveText size="md" weight="medium" color="text-blue-900">
                  Quick Tips:
                </ResponsiveText>
                <ul className="mt-2 space-y-1 text-sm text-blue-800">
                  <li>• Use a quiet room with minimal echo</li>
                  <li>• Position microphone at mouth level</li>
                  <li>• Avoid background noise (fans, TV, etc.)</li>
                  <li>• Speak clearly and naturally</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">✅</div>
              <ResponsiveText size="md" weight="medium">
                Quiet Space
              </ResponsiveText>
              <ResponsiveText size="sm" color="text-gray-600">
                Minimize background noise
              </ResponsiveText>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl mb-2">📏</div>
              <ResponsiveText size="md" weight="medium">
                6-12 Inches
              </ResponsiveText>
              <ResponsiveText size="sm" color="text-gray-600">
                Distance from microphone
              </ResponsiveText>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-2">🎯</div>
              <ResponsiveText size="md" weight="medium">
                Clear Voice
              </ResponsiveText>
              <ResponsiveText size="sm" color="text-gray-600">
                Speak at normal volume
              </ResponsiveText>
            </div>
          </div>
        </div>
      </ResponsiveCard>

      <div className="flex gap-4">
        <ResponsiveButton
          onClick={prevStep}
          variant="outline"
          size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg' }}
        >
          ← Back
        </ResponsiveButton>
        <ResponsiveButton
          onClick={nextStep}
          variant="primary"
          size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg' }}
          fullWidth
        >
          Sounds Good →
        </ResponsiveButton>
      </div>
    </div>
  );

  const renderVoiceDiscoveryStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <ResponsiveText size="2xl" weight="semibold">
          Discover Your Voice Type
        </ResponsiveText>
        <ResponsiveText size="md" color="text-gray-600">
          Let's find your natural vocal range through a simple exercise
        </ResponsiveText>
      </div>

      <ResponsiveCard>
        <div className="space-y-6">
          <div className="text-center">
            <ResponsiveText size="lg" weight="semibold" className="mb-4">
              Voice Discovery Exercise
            </ResponsiveText>
            <ResponsiveText size="md" color="text-gray-600" className="mb-6">
              We'll help you find your comfortable vocal range
            </ResponsiveText>

            {!isRecording && !voiceProfile.confidence && (
              <div className="space-y-4">
                <div className="text-6xl">🎵</div>
                <ResponsiveButton
                  onClick={startVoiceDiscovery}
                  variant="primary"
                  size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg' }}
                  className="min-h-16"
                >
                  🎤 Start Voice Discovery
                </ResponsiveButton>
                <ResponsiveText size="sm" color="text-gray-500">
                  This will take about 5 seconds
                </ResponsiveText>
              </div>
            )}

            {isRecording && (
              <div className="space-y-4">
                <div className="text-6xl animate-pulse">🎤</div>
                <div className="text-center space-y-2">
                  <ResponsiveText size="xl" weight="semibold" color="text-indigo-600">
                    Recording...
                  </ResponsiveText>
                  <ResponsiveText size="lg" className="font-mono">
                    {formatTime(recordingTime)}
                  </ResponsiveText>
                  <ResponsiveText size="md" color="text-gray-600">
                    Sing or speak comfortably from low to high notes
                  </ResponsiveText>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, (recordingTime / 5) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {voiceProfile.confidence > 0 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">{getVoiceEmoji(voiceProfile.voiceType)}</div>
                  <ResponsiveText size="2xl" weight="semibold" className="capitalize">
                    {voiceProfile.voiceType === 'unknown' ? 'Voice Analysis Complete' : voiceProfile.voiceType}
                  </ResponsiveText>
                  <ResponsiveText size="md" color="text-gray-600" className="mt-2">
                    {getVoiceTypeDescription(voiceProfile.voiceType)}
                  </ResponsiveText>
                </div>

                {voiceProfile.voiceType !== 'unknown' && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
                    <ResponsiveText size="lg" weight="semibold" className="mb-4 text-center">
                      Your Vocal Range
                    </ResponsiveText>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <ResponsiveText size="md" color="text-gray-600">Lowest Note:</ResponsiveText>
                        <ResponsiveText size="md" weight="semibold">{voiceProfile.comfortableRange.min} Hz</ResponsiveText>
                      </div>
                      <div className="flex justify-between items-center">
                        <ResponsiveText size="md" color="text-gray-600">Highest Note:</ResponsiveText>
                        <ResponsiveText size="md" weight="semibold">{voiceProfile.comfortableRange.max} Hz</ResponsiveText>
                      </div>
                      <div className="flex justify-between items-center">
                        <ResponsiveText size="md" color="text-gray-600">Confidence:</ResponsiveText>
                        <ResponsiveText size="md" weight="semibold">{voiceProfile.confidence}%</ResponsiveText>
                      </div>
                    </div>
                  </div>
                )}

                {voiceProfile.confidence < 70 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <ResponsiveText size="md" color="text-yellow-800" className="text-center">
                      💡 Tip: Try again in a quieter environment for better accuracy
                    </ResponsiveText>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </ResponsiveCard>

      <div className="flex gap-4">
        <ResponsiveButton
          onClick={prevStep}
          variant="outline"
          size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg' }}
        >
          ← Back
        </ResponsiveButton>
        {voiceProfile.confidence > 0 && (
          <ResponsiveButton
            onClick={nextStep}
            variant="primary"
            size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg' }}
            fullWidth
          >
            Continue →
          </ResponsiveButton>
        )}
      </div>
    </div>
  );

  const renderFirstRecordingStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <ResponsiveText size="2xl" weight="semibold">
          Your First Recording
        </ResponsiveText>
        <ResponsiveText size="md" color="text-gray-600">
          Let's practice with a simple sustained note exercise
        </ResponsiveText>
      </div>

      <ResponsiveCard>
        <div className="space-y-6">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <ResponsiveText size="lg" weight="semibold" className="mb-4 text-center">
              Exercise: Sustained Note
            </ResponsiveText>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">1️⃣</span>
                <ResponsiveText size="md">
                  Take a deep breath and prepare to sing
                </ResponsiveText>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">2️⃣</span>
                <ResponsiveText size="md">
                  Choose a comfortable note in your middle range
                </ResponsiveText>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">3️⃣</span>
                <ResponsiveText size="md">
                  Sing "ah" or "oh" and hold the note for 5 seconds
                </ResponsiveText>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">4️⃣</span>
                <ResponsiveText size="md">
                  Try to keep the pitch steady throughout
                </ResponsiveText>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="text-4xl">🎯</div>
            <ResponsiveButton
              onClick={() => {
                // Simulate recording completion
                setTimeout(() => nextStep(), 3000);
              }}
              variant="primary"
              size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg' }}
            >
              🎤 Start Practice Recording
            </ResponsiveButton>
            <ResponsiveText size="sm" color="text-gray-500">
              Focus on keeping your pitch steady
            </ResponsiveText>
          </div>
        </div>
      </ResponsiveCard>

      <div className="flex gap-4">
        <ResponsiveButton
          onClick={prevStep}
          variant="outline"
          size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg' }}
        >
          ← Back
        </ResponsiveButton>
      </div>
    </div>
  );

  const renderUnderstandingResultsStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <ResponsiveText size="2xl" weight="semibold">
          Understanding Your Results
        </ResponsiveText>
        <ResponsiveText size="md" color="text-gray-600">
          Learn how to interpret the visual feedback
        </ResponsiveText>
      </div>

      <ResponsiveCard>
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <ResponsiveText size="lg" weight="semibold" className="mb-2">
              Visual Pitch Display
            </ResponsiveText>
            <ResponsiveText size="md" color="text-gray-600">
              The line shows your pitch in real-time
            </ResponsiveText>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <ResponsiveText size="md" weight="semibold" color="text-green-900">
                  Steady Pitch
                </ResponsiveText>
              </div>
              <ResponsiveText size="sm" color="text-green-700">
                The line stays relatively flat and stable - great pitch control!
              </ResponsiveText>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <ResponsiveText size="md" weight="semibold" color="text-blue-900">
                Target Zone
                </ResponsiveText>
              </div>
              <ResponsiveText size="sm" color="text-blue-700">
                Try to keep your pitch within the highlighted target area
              </ResponsiveText>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <ResponsiveText size="md" weight="semibold" color="text-yellow-900">
                  Slight Variation
                </ResponsiveText>
              </div>
              <ResponsiveText size="sm" color="text-yellow-700">
                Small wavering is normal - breathing causes natural variation
              </ResponsiveText>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <HelpIcon content="Your voice type affects your comfortable range - what's easy for a bass might be challenging for a soprano" size="md" />
                <ResponsiveText size="md" weight="semibold" color="text-purple-900">
                  Personal Range
                </ResponsiveText>
              </div>
              <ResponsiveText size="sm" color="text-purple-700">
                Everyone has different natural ranges - work with yours!
              </ResponsiveText>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <ResponsiveText size="md" weight="semibold" className="mb-3">
              Pro Tips for Success:
            </ResponsiveText>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <ResponsiveText size="sm">
                  <strong>Posture:</strong> Stand tall with relaxed shoulders
                </ResponsiveText>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <ResponsiveText size="sm">
                  <strong>Breathing:</strong> Use deep diaphragmatic breaths
                </ResponsiveText>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <ResponsiveText size="sm">
                  <strong>Practice:</strong> Regular short sessions are better than long occasional ones
                </ResponsiveText>
              </li>
            </ul>
          </div>
        </div>
      </ResponsiveCard>

      <div className="flex gap-4">
        <ResponsiveButton
          onClick={prevStep}
          variant="outline"
          size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg' }}
        >
          ← Back
        </ResponsiveButton>
        <ResponsiveButton
          onClick={nextStep}
          variant="primary"
          size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg' }}
          fullWidth
        >
          Got it! →
        </ResponsiveButton>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="text-6xl">🎉</div>
        <ResponsiveText size="2xl" weight="semibold">
          Congratulations!
        </ResponsiveText>
        <ResponsiveText size="md" color="text-gray-600">
          You're all set up and ready to start your voice training journey
        </ResponsiveText>
      </div>

      <ResponsiveCard className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <div className="space-y-6">
          <div className="text-center">
            <ResponsiveText size="lg" weight="semibold" className="mb-4">
              Your Voice Profile
            </ResponsiveText>
            {voiceProfile.voiceType !== 'unknown' && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl">{getVoiceEmoji(voiceProfile.voiceType)}</span>
                  <ResponsiveText size="xl" weight="semibold" className="capitalize">
                    {voiceProfile.voiceType}
                  </ResponsiveText>
                </div>
                <ResponsiveText size="md" color="text-gray-600">
                  Range: {voiceProfile.comfortableRange.min} - {voiceProfile.comfortableRange.max} Hz
                </ResponsiveText>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-2xl mb-2">🎯</div>
              <ResponsiveText size="md" weight="medium">
                Daily Practice
              </ResponsiveText>
              <ResponsiveText size="sm" color="text-gray-600">
                5-10 minutes daily
              </ResponsiveText>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-2xl mb-2">📈</div>
              <ResponsiveText size="md" weight="medium">
                Track Progress
              </ResponsiveText>
              <ResponsiveText size="sm" color="text-gray-600">
                Monitor improvement
              </ResponsiveText>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-2xl mb-2">🏆</div>
              <ResponsiveText size="md" weight="medium">
                Build Skills
              </ResponsiveText>
              <ResponsiveText size="sm" color="text-gray-600">
                Step by step
              </ResponsiveText>
            </div>
          </div>

          <div className="text-center">
            <ResponsiveText size="md" color="text-gray-600" className="mb-4">
              Ready to start improving your voice?
            </ResponsiveText>
            <ResponsiveButton
              onClick={onComplete}
              variant="primary"
              size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg' }}
            >
              🚀 Go to Dashboard
            </ResponsiveButton>
          </div>
        </div>
      </ResponsiveCard>

      <div className="text-center">
        <ResponsiveText size="sm" color="text-gray-500">
          You can always revisit this setup process in Settings
        </ResponsiveText>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'microphone':
        return renderMicrophoneStep();
      case 'voice-discovery':
        return renderVoiceDiscoveryStep();
      case 'first-recording':
        return renderFirstRecordingStep();
      case 'understanding-results':
        return renderUnderstandingResultsStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <ResponsiveContainer>
        <div className="max-w-4xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <ResponsiveText size="sm" color="text-gray-600">
                Step {currentStepIndex + 1} of {steps.length}
              </ResponsiveText>
              <ResponsiveText size="sm" color="text-gray-600">
                {Math.round(((currentStepIndex + 1) / steps.length) * 100)}% Complete
              </ResponsiveText>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                    index <= currentStepIndex ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step Content */}
          <ResponsiveCard className="mb-6">
            {renderStep()}
          </ResponsiveCard>

          {/* Quick Help */}
          <div className="text-center">
            <ResponsiveText size="sm" color="text-gray-500">
              Need help? Check the tooltips scattered throughout each step
            </ResponsiveText>
          </div>
        </div>
      </ResponsiveContainer>
    </div>
  );
}