import { useRef, useState, useCallback, useEffect } from 'react';
import { createAudioProcessor, type AudioProcessor } from '../lib/audioProcessor';
import { createPitchDetector, type PitchDetectionResult, type PitchDetectionConfig } from '../lib/pitchDetection';

interface UseRealtimePitchReturn {
  currentPitch: number | null;
  isDetecting: boolean;
  startPitchDetection: (analyser: AnalyserNode) => void;
  stopPitchDetection: () => void;
}

const MIN_PITCH = 50;  // Minimum pitch to detect (Hz)
const MAX_PITCH = 500; // Maximum pitch to detect (Hz)
const PITCH_UPDATE_INTERVAL = 100; // Update every 100ms

/**
 * Autocorrelation algorithm for pitch detection
 * More robust than peak detection for voice signals
 */
function detectPitch(audioBuffer: Float32Array, sampleRate: number): number {
  const bufferSize = audioBuffer.length;

  // Apply Hamming window to reduce spectral leakage
  const hammingWindow = new Float32Array(bufferSize);
  for (let i = 0; i < bufferSize; i++) {
    hammingWindow[i] = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (bufferSize - 1));
  }

  const windowedBuffer = new Float32Array(bufferSize);
  for (let i = 0; i < bufferSize; i++) {
    windowedBuffer[i] = audioBuffer[i] * hammingWindow[i];
  }

  // Autocorrelation
  const correlations = new Float32Array(bufferSize);
  for (let lag = 0; lag < bufferSize; lag++) {
    let correlation = 0;
    for (let i = 0; i < bufferSize - lag; i++) {
      correlation += windowedBuffer[i] * windowedBuffer[i + lag];
    }
    correlations[lag] = correlation;
  }

  // Find the best lag (first major peak after lag 0)
  let bestLag = 0;
  let maxCorrelation = 0;

  const minLag = Math.floor(sampleRate / MAX_PITCH);
  const maxLag = Math.floor(sampleRate / MIN_PITCH);

  for (let lag = minLag; lag < maxLag && lag < bufferSize / 2; lag++) {
    if (correlations[lag] > maxCorrelation) {
      maxCorrelation = correlations[lag];
      bestLag = lag;
    }
  }

  // Check if we found a valid pitch
  if (bestLag === 0 || maxCorrelation < 0.3 * correlations[0]) {
    return 0; // No clear pitch detected
  }

  const pitch = sampleRate / bestLag;
  return pitch >= MIN_PITCH && pitch <= MAX_PITCH ? pitch : 0;
}

/**
 * Hook for real-time pitch detection using Web Audio API
 */
export const useRealtimePitch = (): UseRealtimePitchReturn => {
  const [currentPitch, setCurrentPitch] = useState<number | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioProcessorRef = useRef<AudioProcessor | null>(null);

  const stopPitchDetection = useCallback(() => {
    setIsDetecting(false);
    setCurrentPitch(null);

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Clean up audio processor
    if (audioProcessorRef.current) {
      audioProcessorRef.current.dispose();
      audioProcessorRef.current = null;
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

    let lastUpdateTime = 0;

    const detect = () => {
      if (!analyserRef.current || !audioContextRef.current || !audioProcessorRef.current) {
        stopPitchDetection();
        return;
      }

      const now = Date.now();

      // Update pitch at interval, not every frame
      if (now - lastUpdateTime >= PITCH_UPDATE_INTERVAL) {
        const fftSize = analyserRef.current.fftSize;
        const bufferLength = fftSize;
        const timeData = new Float32Array(bufferLength);

        // Get processed audio data from audio processor
        const processedAudio = audioProcessorRef.current.getProcessedaudioData();

        // Use processed audio if available, otherwise fallback to raw data
        let audioToAnalyze = processedAudio;
        if (audioToAnalyze.length === 0) {
          // Fallback to raw audio if processor not ready
          const waveformData = new Uint8Array(bufferLength);
          analyserRef.current.getByteTimeDomainData(waveformData);

          for (let i = 0; i < bufferLength; i++) {
            timeData[i] = (waveformData[i] - 128) / 128;
          }
          audioToAnalyze = timeData;
        }

        // Detect pitch using processed audio
        const pitch = detectPitch(audioToAnalyze, audioContextRef.current.sampleRate);

        // Apply enhanced smoothing with voice-specific parameters
        if (pitch > 0) {
          setCurrentPitch((prevPitch) => {
            if (prevPitch === null) return pitch;

            // Enhanced smoothing that adapts to pitch changes
            const pitchDiff = Math.abs(pitch - prevPitch);
            let smoothingFactor = 0.2; // Default smoothing

            // Less smoothing for large pitch changes (allows quick transitions)
            if (pitchDiff > 50) {
              smoothingFactor = 0.4;
            } else if (pitchDiff > 20) {
              smoothingFactor = 0.3;
            }

            // More smoothing for small changes (reduces jitter)
            else {
              smoothingFactor = 0.15;
            }

            return prevPitch * (1 - smoothingFactor) + pitch * smoothingFactor;
          });
        } else {
          // Gradual decay with persistence to prevent flickering
          setCurrentPitch((prevPitch) => {
            if (prevPitch === null || prevPitch <= 0) return null;

            // Slower decay for voice pitch ranges
            const decayFactor = prevPitch > 150 ? 0.95 : 0.92;
            const newPitch = prevPitch * decayFactor;

            // Only clear when very low
            return newPitch > 10 ? newPitch : null;
          });
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
    isDetecting,
    startPitchDetection,
    stopPitchDetection,
  };
};