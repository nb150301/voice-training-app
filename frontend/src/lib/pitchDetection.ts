/**
 * Enhanced pitch detection algorithms for improved accuracy and stability
 * Phase 2: YIN algorithm implementation with confidence scoring and temporal filtering
 */

export interface PitchDetectionResult {
  pitch: number;
  confidence: number;
  clarity: number;
  algorithm: 'yin' | 'autocorr' | 'hybrid';
}

export interface PitchDetectionConfig {
  sampleRate: number;
  bufferSize: number;
  yinThreshold: number;           // YIN algorithm threshold (0.1-0.9)
  minPitch: number;               // Minimum pitch to detect (Hz)
  maxPitch: number;               // Maximum pitch to detect (Hz)
  confidenceThreshold: number;    // Minimum confidence to accept pitch
  temporalSmoothing: boolean;     // Enable temporal filtering
  voiceOptimization: boolean;     // Voice-specific optimizations
}

export const DEFAULT_PITCH_DETECTION_CONFIG: PitchDetectionConfig = {
  sampleRate: 44100,
  bufferSize: 2048,
  yinThreshold: 0.1,             // Lower threshold for better sensitivity
  minPitch: 60,                   // Extended lower range for deeper voices
  maxPitch: 500,                  // Extended upper range for higher voices
  confidenceThreshold: 0.3,       // Minimum confidence to accept
  temporalSmoothing: true,
  voiceOptimization: true,
};

/**
 * YIN Pitch Detection Algorithm
 * More accurate than basic autocorrelation for voice signals
 *
 * Based on "YIN, a fundamental frequency estimator for speech and music"
 * by de Cheveigné and Kawahara (2002)
 */
export class YinPitchDetector {
  private config: PitchDetectionConfig;
  private previousPitches: number[] = [];
  private readonly maxHistorySize = 5;

  constructor(config: Partial<PitchDetectionConfig> = {}) {
    this.config = { ...DEFAULT_PITCH_DETECTION_CONFIG, ...config };
  }

  /**
   * Main YIN algorithm implementation
   */
  public detectPitch(audioBuffer: Float32Array): PitchDetectionResult {
    const bufferSize = audioBuffer.length;
    const halfBufferSize = Math.floor(bufferSize / 2);

    // Step 1: Apply preprocessing for voice optimization
    let processedBuffer = this.preprocessAudio(audioBuffer);

    // Step 2: Calculate difference function (Step 1 of YIN)
    const differenceFunction = this.calculateDifferenceFunction(processedBuffer);

    // Step 3: Calculate cumulative mean normalized difference (CMND) (Step 2 of YIN)
    const cmnd = this.calculateCMND(differenceFunction);

    // Step 4: Find absolute minimum (Step 3 of YIN)
    const tau = this.findAbsoluteMinimum(cmnd);

    // Step 5: Parabolic interpolation for sub-sample accuracy (Optional refinement)
    const refinedTau = this.parabolicInterpolation(cmnd, tau);

    // Step 6: Convert to pitch and calculate confidence
    let pitch = 0;
    let confidence = 0;

    if (refinedTau > 0) {
      pitch = this.config.sampleRate / refinedTau;

      // Validate pitch range
      if (pitch >= this.config.minPitch && pitch <= this.config.maxPitch) {
        confidence = this.calculateConfidence(cmnd, refinedTau);
      } else {
        pitch = 0;
      }
    }

    // Step 7: Apply temporal filtering if enabled
    if (this.config.temporalSmoothing && pitch > 0) {
      pitch = this.applyTemporalFiltering(pitch, confidence);
    }

    // Step 8: Calculate pitch clarity
    const clarity = this.calculatePitchClarity(processedBuffer, pitch);

    // Update history
    this.updateHistory(pitch);

    return {
      pitch,
      confidence,
      clarity,
      algorithm: 'yin'
    };
  }

  /**
   * Preprocess audio for voice optimization
   */
  private preprocessAudio(audioBuffer: Float32Array): Float32Array {
    if (!this.config.voiceOptimization) {
      return audioBuffer;
    }

    const processed = new Float32Array(audioBuffer.length);
    const windowSize = Math.min(256, audioBuffer.length);
    const halfWindow = Math.floor(windowSize / 2);

    // Apply voice-optimized preprocessing
    for (let i = 0; i < audioBuffer.length; i++) {
      processed[i] = audioBuffer[i];

      // Apply gentle high-pass to remove rumble (built into preprocessing)
      if (i > halfWindow && i < audioBuffer.length - halfWindow) {
        let sum = 0;
        for (let j = -halfWindow; j <= halfWindow; j++) {
          sum += audioBuffer[i + j];
        }
        const localMean = sum / windowSize;
        processed[i] = audioBuffer[i] - localMean * 0.3; // DC offset removal
      }
    }

    // Apply voice band emphasis (emphasize 80-2000Hz range)
    // Simple approximation using time-domain differentiation
    for (let i = 1; i < processed.length; i++) {
      const diff = processed[i] - processed[i - 1];
      processed[i] = processed[i] * 0.7 + diff * 0.3;
    }

    return processed;
  }

  /**
   * Calculate difference function for YIN algorithm
   */
  private calculateDifferenceFunction(audioBuffer: Float32Array): Float32Array {
    const bufferSize = audioBuffer.length;
    const halfBufferSize = Math.floor(bufferSize / 2);
    const differenceFunction = new Float32Array(halfBufferSize);

    // Calculate W(t) and energy
    let energy = 0;
    for (let i = 0; i < bufferSize; i++) {
      energy += audioBuffer[i] * audioBuffer[i];
    }

    // Calculate difference function for each lag
    for (let tau = 0; tau < halfBufferSize; tau++) {
      let difference = 0;

      for (let j = 0; j < bufferSize - tau; j++) {
        const diff = audioBuffer[j] - audioBuffer[j + tau];
        difference += diff * diff;
      }

      differenceFunction[tau] = difference;
    }

    return differenceFunction;
  }

  /**
   * Calculate Cumulative Mean Normalized Difference (CMND)
   */
  private calculateCMND(differenceFunction: Float32Array): Float32Array {
    const cmnd = new Float32Array(differenceFunction.length);

    // First value is always 0 (can't divide by 0)
    cmnd[0] = 1;

    let runningSum = 0;
    for (let tau = 1; tau < differenceFunction.length; tau++) {
      runningSum += differenceFunction[tau];
      const normalizedValue = differenceFunction[tau] / (runningSum / tau);
      cmnd[tau] = normalizedValue;
    }

    return cmnd;
  }

  /**
   * Find the absolute minimum in CMND below threshold
   */
  private findAbsoluteMinimum(cmnd: Float32Array): number {
    const minLag = Math.floor(this.config.sampleRate / this.config.maxPitch);
    const maxLag = Math.floor(this.config.sampleRate / this.config.minPitch);

    let tau = minLag;

    // Search for first minimum below threshold
    for (let i = minLag; i < maxLag && i < cmnd.length - 1; i++) {
      // Check if this is a local minimum and below threshold
      if (cmnd[i] < this.config.yinThreshold &&
          cmnd[i] < cmnd[i - 1] &&
          cmnd[i] < cmnd[i + 1]) {
        tau = i;
        break;
      }
    }

    // If no minimum found below threshold, find the global minimum in search range
    if (tau === minLag) {
      let minValue = cmnd[minLag];
      for (let i = minLag; i < maxLag && i < cmnd.length; i++) {
        if (cmnd[i] < minValue) {
          minValue = cmnd[i];
          tau = i;
        }
      }
    }

    return tau;
  }

  /**
   * Parabolic interpolation for sub-sample accuracy
   */
  private parabolicInterpolation(cmnd: Float32Array, tau: number): number {
    if (tau === 0 || tau >= cmnd.length - 1) {
      return tau;
    }

    const s0 = cmnd[tau - 1];
    const s1 = cmnd[tau];
    const s2 = cmnd[tau + 1];

    // Parabolic interpolation formula
    const a = (s0 - 2 * s1 + s2) / 2;
    const b = (s2 - s0) / 2;

    if (a !== 0) {
      const delta = -b / (2 * a);
      return tau + delta;
    }

    return tau;
  }

  /**
   * Calculate confidence score for detected pitch
   */
  private calculateConfidence(cmnd: Float32Array, tau: number): number {
    if (tau <= 0 || tau >= cmnd.length) {
      return 0;
    }

    const value = cmnd[tau];

    // Higher confidence for lower CMND values
    let confidence = Math.max(0, 1 - value);

    // Boost confidence for clear periodic signals
    if (value < this.config.yinThreshold * 0.5) {
      confidence = Math.min(1, confidence * 1.2);
    }

    return confidence;
  }

  /**
   * Calculate pitch clarity based on signal periodicity
   */
  private calculatePitchClarity(audioBuffer: Float32Array, pitch: number): number {
    if (pitch <= 0) {
      return 0;
    }

    const sampleRate = this.config.sampleRate;
    const period = Math.round(sampleRate / pitch);

    if (period >= audioBuffer.length / 2) {
      return 0.5; // Low clarity for very low frequencies
    }

    // Calculate periodicity by comparing consecutive periods
    let clarity = 0;
    const numPeriods = Math.floor(audioBuffer.length / period);

    if (numPeriods < 3) {
      return 0.3; // Not enough periods for analysis
    }

    for (let i = 1; i < numPeriods - 1; i++) {
      const start1 = i * period;
      const start2 = (i + 1) * period;

      if (start2 + period < audioBuffer.length) {
        let correlation = 0;
        for (let j = 0; j < period; j++) {
          correlation += audioBuffer[start1 + j] * audioBuffer[start2 + j];
        }
        clarity += Math.abs(correlation) / period;
      }
    }

    clarity = clarity / (numPeriods - 2);
    return Math.min(1, clarity * 10); // Normalize to 0-1 range
  }

  /**
   * Apply temporal filtering to smooth pitch detection
   */
  private applyTemporalFiltering(currentPitch: number, confidence: number): number {
    if (this.previousPitches.length === 0) {
      return currentPitch;
    }

    // Weighted average based on confidence and temporal proximity
    let weightedSum = currentPitch * confidence;
    let totalWeight = confidence;

    // Consider recent history with decreasing weights
    for (let i = 0; i < this.previousPitches.length; i++) {
      const historicalPitch = this.previousPitches[i];
      const weight = (1 - i / this.previousPitches.length) * 0.3;

      // Only consider if within reasonable pitch range
      if (Math.abs(historicalPitch - currentPitch) < currentPitch * 0.2) {
        weightedSum += historicalPitch * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? weightedSum / totalWeight : currentPitch;
  }

  /**
   * Update pitch history for temporal filtering
   */
  private updateHistory(pitch: number): void {
    if (pitch > 0) {
      this.previousPitches.push(pitch);

      // Keep only recent history
      if (this.previousPitches.length > this.maxHistorySize) {
        this.previousPitches.shift();
      }
    }
  }

  /**
   * Reset detector state
   */
  public reset(): void {
    this.previousPitches = [];
  }
}

/**
 * Hybrid pitch detector combining YIN and autocorrelation
 * Uses the best algorithm based on signal characteristics
 */
export class HybridPitchDetector {
  private yinDetector: YinPitchDetector;
  private config: PitchDetectionConfig;

  constructor(config: Partial<PitchDetectionConfig> = {}) {
    this.config = { ...DEFAULT_PITCH_DETECTION_CONFIG, ...config };
    this.yinDetector = new YinPitchDetector(this.config);
  }

  public detectPitch(audioBuffer: Float32Array): PitchDetectionResult {
    // Detect pitch using YIN
    const yinResult = this.yinDetector.detectPitch(audioBuffer);

    // Calculate signal characteristics
    const signalEnergy = this.calculateSignalEnergy(audioBuffer);
    const spectralCentroid = this.calculateSpectralCentroid(audioBuffer);

    // Choose algorithm based on signal characteristics
    let finalResult = yinResult;
    let algorithm: 'yin' | 'autocorr' | 'hybrid' = 'yin';

    // For very high energy signals, autocorrelation might be more stable
    if (signalEnergy > 0.1 && spectralCentroid > 1000) {
      // Fallback to autocorrelation for high-energy, high-frequency content
      const autocorrResult = this.detectPitchAutocorr(audioBuffer);

      // Blend results based on confidence
      if (autocorrResult.confidence > yinResult.confidence * 1.2) {
        finalResult = {
          pitch: autocorrResult.pitch,
          confidence: Math.max(yinResult.confidence, autocorrResult.confidence),
          clarity: (yinResult.clarity + autocorrResult.clarity) / 2,
          algorithm: 'hybrid'
        };
        algorithm = 'hybrid';
      }
    }

    // Final validation
    if (finalResult.confidence < this.config.confidenceThreshold) {
      finalResult.pitch = 0;
    }

    finalResult.algorithm = algorithm;
    return finalResult;
  }

  private calculateSignalEnergy(audioBuffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
      sum += audioBuffer[i] * audioBuffer[i];
    }
    return Math.sqrt(sum / audioBuffer.length);
  }

  private calculateSpectralCentroid(audioBuffer: Float32Array): number {
    // Simplified spectral centroid calculation
    let weightedSum = 0;
    let magnitudeSum = 0;

    for (let i = 1; i < audioBuffer.length; i++) {
      const magnitude = Math.abs(audioBuffer[i] - audioBuffer[i - 1]);
      weightedSum += i * magnitude;
      magnitudeSum += magnitude;
    }

    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  private detectPitchAutocorr(audioBuffer: Float32Array): PitchDetectionResult {
    // Basic autocorrelation as fallback
    const bufferSize = audioBuffer.length;
    const halfBufferSize = Math.floor(bufferSize / 2);

    // Calculate autocorrelation
    const autocorr = new Float32Array(halfBufferSize);
    for (let lag = 0; lag < halfBufferSize; lag++) {
      let correlation = 0;
      for (let i = 0; i < bufferSize - lag; i++) {
        correlation += audioBuffer[i] * audioBuffer[i + lag];
      }
      autocorr[lag] = correlation;
    }

    // Find peak
    const minLag = Math.floor(this.config.sampleRate / this.config.maxPitch);
    const maxLag = Math.floor(this.config.sampleRate / this.config.minPitch);

    let bestLag = minLag;
    let maxCorrelation = autocorr[minLag];

    for (let lag = minLag; lag < maxLag; lag++) {
      if (autocorr[lag] > maxCorrelation) {
        maxCorrelation = autocorr[lag];
        bestLag = lag;
      }
    }

    const pitch = bestLag > 0 ? this.config.sampleRate / bestLag : 0;
    const confidence = maxCorrelation / autocorr[0];
    const clarity = confidence > 0.5 ? 0.7 : 0.4;

    return {
      pitch: (pitch >= this.config.minPitch && pitch <= this.config.maxPitch) ? pitch : 0,
      confidence,
      clarity,
      algorithm: 'autocorr'
    };
  }
}

/**
 * Factory function to create pitch detector with optimal algorithm
 */
export function createPitchDetector(
  algorithm: 'yin' | 'hybrid' = 'yin',
  config?: Partial<PitchDetectionConfig>
): YinPitchDetector | HybridPitchDetector {
  if (algorithm === 'hybrid') {
    return new HybridPitchDetector(config);
  }
  return new YinPitchDetector(config);
}

/**
 * Convenience function for pitch detection
 */
export function detectPitch(
  audioBuffer: Float32Array,
  algorithm: 'yin' | 'hybrid' = 'yin',
  config?: Partial<PitchDetectionConfig>
): PitchDetectionResult {
  const detector = createPitchDetector(algorithm, config);
  return detector.detectPitch(audioBuffer);
}