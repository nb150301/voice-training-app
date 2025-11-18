import { useRef, useState, useCallback, useEffect } from 'react';
import { createAudioProcessor, type AudioProcessor } from '../lib/audioProcessor';
import { createPitchDetector, type PitchDetectionResult, type PitchDetectionConfig } from '../lib/pitchDetection';
import { createTemporalFilter, type FilterConfig, type TemporalFilter } from '../lib/temporalFilters';
import { useAudioSettings } from '../lib/audioSettings';

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

  // Get user audio settings
  const { settings, getAudioProcessorConfig, getPitchDetectorConfig, getTemporalFilterConfig } = useAudioSettings();

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

    // Initialize audio processor with user-configured settings
    const processorConfig = getAudioProcessorConfig();
    audioProcessorRef.current = createAudioProcessor(audioContextRef.current, processorConfig);

    // Initialize pitch detector with user-configured settings
    const pitchConfig = getPitchDetectorConfig();
    pitchConfig.sampleRate = audioContextRef.current.sampleRate;
    pitchConfig.bufferSize = 2048;
    pitchConfig.temporalSmoothing = true;
    pitchConfig.voiceOptimization = true;

    const algorithm = settings.algorithmMode === 'auto' ? 'yin' : settings.algorithmMode;
    pitchDetectorRef.current = createPitchDetector(algorithm, pitchConfig);

    // Initialize temporal filter with user-configured settings
    const filterConfig = getTemporalFilterConfig();
    temporalFilterRef.current = createTemporalFilter(filterConfig);

    let lastUpdateTime = 0;

    const detect = () => {
      if (!analyserRef.current || !audioContextRef.current || !audioProcessorRef.current ||
          !pitchDetectorRef.current || !temporalFilterRef.current) {
        stopPitchDetection();
        return;
      }

      const now = Date.now();

      // Update pitch at interval (respect user's response time setting)
      const updateInterval = Math.max(50, settings.responseTime); // Minimum 50ms
      if (now - lastUpdateTime >= updateInterval) {
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