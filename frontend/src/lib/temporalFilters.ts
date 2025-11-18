/**
 * Advanced temporal filtering and smoothing algorithms for pitch data
 * Phase 3: Kalman filters, median filters, and adaptive smoothing
 */

export interface FilterConfig {
  // Kalman filter parameters
  processNoise: number;        // Process noise covariance
  measurementNoise: number;    // Measurement noise covariance
  initialError: number;        // Initial error covariance

  // Median filter parameters
  medianWindowSize: number;    // Size of median filter window (odd number)

  // Adaptive smoothing parameters
  adaptiveWindow: number;      // Window for adaptive smoothing
  sensitivityThreshold: number; // Threshold for detecting rapid changes

  // Confidence-based filtering
  confidenceThreshold: number; // Minimum confidence to trust measurement
  confidenceWeighting: boolean; // Apply confidence-based weighting

  // Outlier detection
  outlierThreshold: number;     // Standard deviations for outlier detection
  outlierRejection: boolean;    // Enable outlier rejection
}

export const DEFAULT_FILTER_CONFIG: FilterConfig = {
  processNoise: 0.01,          // Low process noise for smooth transitions
  measurementNoise: 0.1,       // Moderate measurement noise
  initialError: 1.0,           // Initial uncertainty
  medianWindowSize: 5,         // 5-sample median filter
  adaptiveWindow: 3,           // 3-sample adaptive smoothing
  sensitivityThreshold: 0.3,   // Threshold for detecting rapid changes
  confidenceThreshold: 0.4,    // Minimum confidence
  confidenceWeighting: true,   // Enable confidence weighting
  outlierThreshold: 2.5,       // 2.5 standard deviations
  outlierRejection: true,       // Enable outlier detection
};

export interface FilterState {
  value: number;
  confidence: number;
  timestamp: number;
  quality: 'high' | 'medium' | 'low';
}

/**
 * Kalman Filter for pitch smoothing
 * Estimates the true pitch value while accounting for noise and uncertainty
 */
export class KalmanFilter {
  private processNoise: number;
  private measurementNoise: number;
  private errorCovariance: number;
  private estimate: number;
  private isInitialized: boolean = false;

  constructor(config: FilterConfig) {
    this.processNoise = config.processNoise;
    this.measurementNoise = config.measurementNoise;
    this.errorCovariance = config.initialError;
    this.estimate = 0;
  }

  /**
   * Update Kalman filter with new measurement
   */
  public update(measurement: number, confidence: number = 1.0): number {
    // Adjust measurement noise based on confidence
    const adjustedMeasurementNoise = this.measurementNoise / confidence;

    if (!this.isInitialized) {
      this.estimate = measurement;
      this.isInitialized = true;
      return measurement;
    }

    // Prediction step
    const predictedEstimate = this.estimate;
    const predictedErrorCovariance = this.errorCovariance + this.processNoise;

    // Update step
    const kalmanGain = predictedErrorCovariance / (predictedErrorCovariance + adjustedMeasurementNoise);
    this.estimate = predictedEstimate + kalmanGain * (measurement - predictedEstimate);
    this.errorCovariance = (1 - kalmanGain) * predictedErrorCovariance;

    return this.estimate;
  }

  /**
   * Get current estimate
   */
  public getEstimate(): number {
    return this.estimate;
  }

  /**
   * Get current error covariance
   */
  public getErrorCovariance(): number {
    return this.errorCovariance;
  }

  /**
   * Reset filter state
   */
  public reset(): void {
    this.isInitialized = false;
    this.errorCovariance = 1.0;
    this.estimate = 0;
  }
}

/**
 * Median Filter for outlier removal
 * Removes outliers by taking the median of recent values
 */
export class MedianFilter {
  private window: number[] = [];
  private windowSize: number;

  constructor(windowSize: number) {
    this.windowSize = windowSize;
  }

  /**
   * Apply median filter to new value
   */
  public update(value: number): number {
    this.window.push(value);

    if (this.window.length > this.windowSize) {
      this.window.shift();
    }

    return this.calculateMedian();
  }

  /**
   * Calculate median of current window
   */
  private calculateMedian(): number {
    const sorted = [...this.window].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
  }

  /**
   * Reset filter state
   */
  public reset(): void {
    this.window = [];
  }
}

/**
 * Adaptive Smoothing Filter
 * Adjusts smoothing based on rate of change and confidence
 */
export class AdaptiveSmoothingFilter {
  private history: FilterState[] = [];
  private config: FilterConfig;

  constructor(config: FilterConfig) {
    this.config = config;
  }

  /**
   * Apply adaptive smoothing
   */
  public update(pitch: number, confidence: number, timestamp: number = Date.now()): number {
    const state: FilterState = {
      value: pitch,
      confidence,
      timestamp,
      quality: this.assessQuality(pitch, confidence)
    };

    this.history.push(state);

    // Keep only recent history
    if (this.history.length > this.config.adaptiveWindow) {
      this.history.shift();
    }

    return this.calculateSmoothedValue();
  }

  /**
   * Assess quality of measurement
   */
  private assessQuality(pitch: number, confidence: number): 'high' | 'medium' | 'low' {
    if (confidence > 0.8 && pitch > 0) return 'high';
    if (confidence > 0.5 && pitch > 0) return 'medium';
    return 'low';
  }

  /**
   * Calculate smoothed value using adaptive weighting
   */
  private calculateSmoothedValue(): number {
    if (this.history.length === 0) return 0;
    if (this.history.length === 1) return this.history[0].value;

    const latest = this.history[this.history.length - 1];
    const previous = this.history[this.history.length - 2];

    // Calculate rate of change
    const changeRate = Math.abs(latest.value - previous.value);
    const isRapidChange = changeRate > this.config.sensitivityThreshold * 100;

    let smoothingFactor = 0.2; // Default smoothing

    // Adjust smoothing based on quality
    if (latest.quality === 'high') {
      smoothingFactor = 0.3;
    } else if (latest.quality === 'medium') {
      smoothingFactor = 0.15;
    } else {
      smoothingFactor = 0.05; // Very aggressive smoothing for low quality
    }

    // Adjust for rapid changes
    if (isRapidChange) {
      smoothingFactor = Math.max(smoothingFactor, 0.4);
    }

    // Apply confidence weighting
    const confidenceWeight = this.config.confidenceWeighting ? latest.confidence : 1.0;
    const adjustedSmoothingFactor = smoothingFactor * confidenceWeight;

    // Calculate weighted average
    let weightedSum = 0;
    let totalWeight = 0;

    for (let i = 0; i < this.history.length; i++) {
      const state = this.history[i];
      const weight = Math.pow(0.5, i) * state.confidence;
      weightedSum += state.value * weight;
      totalWeight += weight;
    }

    const weightedAverage = totalWeight > 0 ? weightedSum / totalWeight : latest.value;

    // Blend with latest value using adjusted smoothing factor
    return previous.value * (1 - adjustedSmoothingFactor) + weightedAverage * adjustedSmoothingFactor;
  }

  /**
   * Reset filter state
   */
  public reset(): void {
    this.history = [];
  }
}

/**
 * Outlier Detection and Rejection
 * Identifies and removes statistical outliers from pitch measurements
 */
export class OutlierDetector {
  private recentValues: number[] = [];
  private config: FilterConfig;

  constructor(config: FilterConfig) {
    this.config = config;
  }

  /**
   * Check if value is an outlier
   */
  public isOutlier(value: number): boolean {
    if (!this.config.outlierRejection || this.recentValues.length < 3) {
      return false;
    }

    const mean = this.calculateMean();
    const stdDev = this.calculateStandardDeviation(mean);
    const zScore = Math.abs(value - mean) / stdDev;

    return zScore > this.config.outlierThreshold;
  }

  /**
   * Add value to history
   */
  public addValue(value: number): void {
    this.recentValues.push(value);
    if (this.recentValues.length > 20) {
      this.recentValues.shift();
    }
  }

  /**
   * Calculate mean of recent values
   */
  private calculateMean(): number {
    if (this.recentValues.length === 0) return 0;
    const sum = this.recentValues.reduce((a, b) => a + b, 0);
    return sum / this.recentValues.length;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(mean: number): number {
    if (this.recentValues.length === 0) return 1;

    const squaredDiffs = this.recentValues.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / this.recentValues.length;

    return Math.sqrt(variance) || 1; // Prevent division by zero
  }

  /**
   * Reset detector state
   */
  public reset(): void {
    this.recentValues = [];
  }
}

/**
 * Comprehensive Temporal Filter
 * Combines all temporal filtering techniques for optimal pitch smoothing
 */
export class TemporalFilter {
  private kalmanFilter: KalmanFilter;
  private medianFilter: MedianFilter;
  private adaptiveFilter: AdaptiveSmoothingFilter;
  private outlierDetector: OutlierDetector;
  private config: FilterConfig;

  constructor(config: Partial<FilterConfig> = {}) {
    this.config = { ...DEFAULT_FILTER_CONFIG, ...config };
    this.kalmanFilter = new KalmanFilter(this.config);
    this.medianFilter = new MedianFilter(this.config.medianWindowSize);
    this.adaptiveFilter = new AdaptiveSmoothingFilter(this.config);
    this.outlierDetector = new OutlierDetector(this.config);
  }

  /**
   * Apply comprehensive temporal filtering
   */
  public process(pitch: number, confidence: number, timestamp: number = Date.now()): number {
    if (pitch <= 0) {
      // Reset filters on invalid pitch
      this.reset();
      return 0;
    }

    // Outlier detection
    if (this.outlierDetector.isOutlier(pitch)) {
      // Skip outlier, but still add to detector history
      this.outlierDetector.addValue(pitch);
      return this.kalmanFilter.getEstimate(); // Return last good estimate
    }

    this.outlierDetector.addValue(pitch);

    // Confidence-based filtering
    if (confidence < this.config.confidenceThreshold) {
      // Low confidence - apply aggressive smoothing
      return this.kalmanFilter.getEstimate();
    }

    // Apply median filter for outlier removal
    const medianFiltered = this.medianFilter.update(pitch);

    // Apply adaptive smoothing
    const adaptivelySmoothed = this.adaptiveFilter.update(medianFiltered, confidence, timestamp);

    // Apply Kalman filter for final smoothing
    const kalmanFiltered = this.kalmanFilter.update(adaptivelySmoothed, confidence);

    return kalmanFiltered;
  }

  /**
   * Get filter quality metrics
   */
  public getQualityMetrics(): {
    errorCovariance: number;
    recentStability: number;
    confidence: number;
  } {
    return {
      errorCovariance: this.kalmanFilter.getErrorCovariance(),
      recentStability: this.calculateStability(),
      confidence: 1.0 - Math.min(this.kalmanFilter.getErrorCovariance(), 1.0)
    };
  }

  /**
   * Calculate recent stability metric
   */
  private calculateStability(): number {
    const estimate = this.kalmanFilter.getEstimate();
    if (estimate <= 0) return 0;

    const errorCovariance = this.kalmanFilter.getErrorCovariance();
    const normalizedError = errorCovariance / estimate;

    return Math.max(0, 1 - normalizedError);
  }

  /**
   * Reset all filters
   */
  public reset(): void {
    this.kalmanFilter.reset();
    this.medianFilter.reset();
    this.adaptiveFilter.reset();
    this.outlierDetector.reset();
  }

  /**
   * Update filter configuration
   */
  public updateConfig(newConfig: Partial<FilterConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Recreate filters with new config
    this.kalmanFilter = new KalmanFilter(this.config);
    this.medianFilter = new MedianFilter(this.config.medianWindowSize);
    this.adaptiveFilter = new AdaptiveSmoothingFilter(this.config);
    this.outlierDetector = new OutlierDetector(this.config);
  }

  /**
   * Get current configuration
   */
  public getConfig(): FilterConfig {
    return { ...this.config };
  }
}

/**
 * Factory function for creating temporal filters
 */
export function createTemporalFilter(config?: Partial<FilterConfig>): TemporalFilter {
  return new TemporalFilter(config);
}

/**
 * Convenience function for simple temporal filtering
 */
export function smoothPitch(
  pitch: number,
  confidence: number,
  config?: Partial<FilterConfig>
): number {
  const filter = createTemporalFilter(config);
  return filter.process(pitch, confidence);
}