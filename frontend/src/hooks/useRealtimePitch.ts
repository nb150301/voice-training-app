import { useRef, useState, useCallback, useEffect } from 'react';

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

  const stopPitchDetection = useCallback(() => {
    setIsDetecting(false);
    setCurrentPitch(null);

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    analyserRef.current = null;
    audioContextRef.current = null;
  }, []);

  const startPitchDetection = useCallback((analyser: AnalyserNode) => {
    analyserRef.current = analyser;
    setIsDetecting(true);

    // Get audio context from analyser
    audioContextRef.current = (analyser.context as AudioContext);

    let lastUpdateTime = 0;

    const detect = () => {
      if (!analyserRef.current || !audioContextRef.current) {
        stopPitchDetection();
        return;
      }

      const now = Date.now();

      // Update pitch at interval, not every frame
      if (now - lastUpdateTime >= PITCH_UPDATE_INTERVAL) {
        const fftSize = analyserRef.current.fftSize;
        const bufferLength = fftSize;
        const timeData = new Float32Array(bufferLength);

        // Get time domain data
        const waveformData = new Uint8Array(bufferLength);
        analyserRef.current.getByteTimeDomainData(waveformData);

        // Convert to Float32Array (-1 to 1)
        for (let i = 0; i < bufferLength; i++) {
          timeData[i] = (waveformData[i] - 128) / 128;
        }

        // Detect pitch
        const pitch = detectPitch(timeData, audioContextRef.current.sampleRate);

        // Apply smoothing (exponential moving average)
        if (pitch > 0) {
          setCurrentPitch((prevPitch) => {
            if (prevPitch === null) return pitch;
            // Smooth with 0.3 factor to reduce jitter
            return prevPitch * 0.7 + pitch * 0.3;
          });
        } else {
          // Only clear pitch if no pitch detected for 3 consecutive updates
          setCurrentPitch((prevPitch) => {
            // Gradually decay to 0 to prevent flickering
            return prevPitch !== null && prevPitch > 0 ? prevPitch * 0.9 : null;
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