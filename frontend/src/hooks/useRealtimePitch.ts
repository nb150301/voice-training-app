import { useRef, useState, useCallback, useEffect } from 'react';
import { createAudioProcessor, type AudioProcessor } from '../lib/audioProcessor';
import { createPitchDetector, type PitchDetectionResult, type PitchDetectionConfig } from '../lib/pitchDetection';
import { createTemporalFilter, type FilterConfig, type TemporalFilter } from '../lib/temporalFilters';

interface UseRealtimePitchReturn {
  currentPitch: number | null;
  currentConfidence: number;
  currentClarity: number;
  currentAlgorithm: 'yin' | 'autocorr' | 'hybrid';
  filterQuality: {
    stability: number;
    errorCovariance: number;
    confidence: number;
  } | null;
  isDetecting: boolean;
  startPitchDetection: (analyser: AnalyserNode) => void;
  stopPitchDetection: () => void;
}

const PITCH_UPDATE_INTERVAL = 100; // Update every 100ms

/**
 * Hook for real-time pitch detection using Web Audio API
 */
export const useRealtimePitch = (): UseRealtimePitchReturn => {
  const [currentPitch, setCurrentPitch] = useState<number | null>(null);
  const [currentConfidence, setCurrentConfidence] = useState<number>(0);
  const [currentClarity, setCurrentClarity] = useState<number>(0);
  const [currentAlgorithm, setCurrentAlgorithm] = useState<'yin' | 'autocorr' | 'hybrid'>('yin');
  const [filterQuality, setFilterQuality] = useState<{
    stability: number;
    errorCovariance: number;
    confidence: number;
  } | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  const pitchDetectorRef = useRef<any>(null);
  const temporalFilterRef = useRef<TemporalFilter | null>(null);

  const stopPitchDetection = useCallback(() => {
    setIsDetecting(false);
    setCurrentPitch(null);
    setCurrentConfidence(0);
    setCurrentClarity(0);
    setFilterQuality(null);

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Clean up audio processor
    if (audioProcessorRef.current) {
      audioProcessorRef.current.dispose();
      audioProcessorRef.current = null;
    }

    // Clean up pitch detector
    if (pitchDetectorRef.current) {
      pitchDetectorRef.current.reset();
      pitchDetectorRef.current = null;
    }

    // Clean up temporal filter
    if (temporalFilterRef.current) {
      temporalFilterRef.current.reset();
      temporalFilterRef.current = null;
    }

    analyserRef.current = null;
    audioContextRef.current = null;
  }, []);

  const startPitchDetection = useCallback((analyser: AnalyserNode) => {
    analyserRef.current = analyser;
    setIsDetecting(true);

    // Get audio context from analyser
    audioContextRef.current = (analyser.context as AudioContext);

    // Initialize audio processor with enhanced filtering for voice
    audioProcessorRef.current = createAudioProcessor(audioContextRef.current, {
      noiseGateThreshold: -35, // More aggressive noise gate
      highPassFrequency: 80,   // Slightly higher to reduce more rumble
      lowPassFrequency: 1800,  // Slightly lower to reduce more hiss
      targetLevel: 0.25,       // Lower target level for more headroom
      maxGain: 3.0,           // Reduced max gain to prevent feedback
      gainSmoothing: 0.05,    // Slower smoothing for stability
    });

    // Initialize YIN pitch detector with voice-optimized configuration
    const pitchConfig: PitchDetectionConfig = {
      sampleRate: audioContextRef.current.sampleRate,
      bufferSize: 2048,
      yinThreshold: 0.08,        // Very sensitive for voice
      minPitch: 60,              // Extended lower range
      maxPitch: 500,             // Extended upper range
      confidenceThreshold: 0.25, // Lower threshold for more detection
      temporalSmoothing: true,    // Enable temporal filtering
      voiceOptimization: true,   // Voice-specific optimizations
    };

    pitchDetectorRef.current = createPitchDetector('yin', pitchConfig);

    // Initialize temporal filter with voice-optimized configuration
    const filterConfig: Partial<FilterConfig> = {
      processNoise: 0.008,         // Lower noise for smoother output
      measurementNoise: 0.05,      // Reduced measurement noise
      medianWindowSize: 3,         // Smaller window for better responsiveness
      adaptiveWindow: 2,           // Adaptive smoothing
      sensitivityThreshold: 0.25,  // More sensitive to changes
      confidenceThreshold: 0.3,    // Lower threshold for more detection
      confidenceWeighting: true,   // Enable confidence weighting
      outlierThreshold: 2.0,       // Outlier detection
      outlierRejection: true,      // Enable outlier rejection
    };

    temporalFilterRef.current = createTemporalFilter(filterConfig);

    let lastUpdateTime = 0;

    const detect = () => {
      if (!analyserRef.current || !audioContextRef.current || !audioProcessorRef.current ||
          !pitchDetectorRef.current || !temporalFilterRef.current) {
        stopPitchDetection();
        return;
      }

      const now = Date.now();

      // Update pitch at interval, not every frame
      if (now - lastUpdateTime >= PITCH_UPDATE_INTERVAL) {
        const fftSize = analyserRef.current.fftSize;
        const bufferLength = fftSize;

        // Get processed audio data from audio processor
        const processedAudio = audioProcessorRef.current.getProcessedaudioData();

        // Use processed audio if available, otherwise fallback to raw data
        let audioToAnalyze = processedAudio;
        if (audioToAnalyze.length === 0) {
          // Fallback to raw audio if processor not ready
          const waveformData = new Uint8Array(bufferLength);
          analyserRef.current.getByteTimeDomainData(waveformData);

          audioToAnalyze = new Float32Array(bufferLength);
          for (let i = 0; i < bufferLength; i++) {
            audioToAnalyze[i] = (waveformData[i] - 128) / 128;
          }
        }

        // Detect pitch using YIN algorithm
        const result: PitchDetectionResult = pitchDetectorRef.current.detectPitch(audioToAnalyze);

        // Apply comprehensive temporal filtering
        let finalPitch = 0;
        if (result.pitch > 0 && result.confidence >= pitchConfig.confidenceThreshold) {
          // Apply temporal filtering (Kalman + Median + Adaptive + Outlier rejection)
          finalPitch = temporalFilterRef.current.process(result.pitch, result.confidence, now);
        }

        // Update pitch with final filtered result
        if (finalPitch > 0) {
          setCurrentPitch(finalPitch);

          // Update confidence and clarity with smoothing
          setCurrentConfidence((prev) => prev * 0.8 + result.confidence * 0.2);
          setCurrentClarity((prev) => prev * 0.8 + result.clarity * 0.2);
          setCurrentAlgorithm(result.algorithm);

          // Update filter quality metrics
          const qualityMetrics = temporalFilterRef.current.getQualityMetrics();
          setFilterQuality({
            stability: qualityMetrics.recentStability,
            errorCovariance: qualityMetrics.errorCovariance,
            confidence: qualityMetrics.confidence
          });
        } else {
          // Gradual decay with temporal filter state preservation
          setCurrentPitch((prevPitch) => {
            if (prevPitch === null || prevPitch <= 0) return null;

            // Very gentle decay to maintain stability
            const newPitch = prevPitch * 0.98;
            return newPitch > 10 ? newPitch : null;
          });

          // Gentle confidence decay
          setCurrentConfidence((prev) => Math.max(0, prev * 0.95));
          setCurrentClarity((prev) => Math.max(0, prev * 0.95));

          // Clear filter quality when no valid pitch
          setFilterQuality(null);
        }

        lastUpdateTime = now;
      }

      animationRef.current = requestAnimationFrame(detect);
    };

    detect();
  }, [stopPitchDetection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPitchDetection();
    };
  }, [stopPitchDetection]);

  return {
    currentPitch,
    currentConfidence,
    currentClarity,
    currentAlgorithm,
    filterQuality,
    isDetecting,
    startPitchDetection,
    stopPitchDetection,
  };
};