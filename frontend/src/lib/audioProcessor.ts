/**
 * Audio Processing Library for Voice Training App
 * Provides audio preprocessing functions to improve pitch detection accuracy
 * by reducing noise and normalizing audio levels before analysis.
 */

export interface AudioProcessorOptions {
  // Noise gate settings
  noiseGateThreshold: number; // dB, below this audio is muted
  noiseGateRatio: number; // Ratio for noise gate compression
  noiseGateAttack: number; // ms
  noiseGateRelease: number; // ms

  // High-pass filter settings
  highPassFrequency: number; // Hz, removes rumble below this frequency

  // Low-pass filter settings
  lowPassFrequency: number; // Hz, removes hiss above this frequency

  // Gain control settings
  targetLevel: number; // Target RMS level (0-1)
  maxGain: number; // Maximum gain multiplier to prevent excessive amplification
  gainSmoothing: number; // Smoothing factor for gain adjustments (0-1)
}

export const DEFAULT_AUDIO_PROCESSOR_OPTIONS: AudioProcessorOptions = {
  noiseGateThreshold: -40, // -40 dB threshold
  noiseGateRatio: 4, // 4:1 ratio
  noiseGateAttack: 5, // 5ms attack
  noiseGateRelease: 50, // 50ms release
  highPassFrequency: 60, // Remove rumble below 60Hz
  lowPassFrequency: 2000, // Remove hiss above 2kHz
  targetLevel: 0.3, // Target RMS level of 0.3
  maxGain: 5.0, // Maximum 5x gain to prevent feedback
  gainSmoothing: 0.1, // Smooth gain adjustments
};

/**
 * AudioProcessor class that manages all audio preprocessing
 */
export class AudioProcessor {
  private audioContext: AudioContext;
  private options: AudioProcessorOptions;

  // Audio nodes
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private highPassFilter: BiquadFilterNode | null = null;
  private lowPassFilter: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // Noise gate state
  private noiseGateEnvelope: number = 0;
  private lastGainValue: number = 1.0;

  // Processing buffer
  private readonly bufferSize = 4096;

  constructor(audioContext: AudioContext, options: Partial<AudioProcessorOptions> = {}) {
    this.audioContext = audioContext;
    this.options = { ...DEFAULT_AUDIO_PROCESSOR_OPTIONS, ...options };

    // Create the audio processing chain
    this.createAudioChain();
  }

  /**
   * Create the audio processing chain: Source -> High Pass -> Low Pass -> Gain -> Analyser
   */
  private createAudioChain(): void {
    // Create high-pass filter to eliminate rumble
    this.highPassFilter = this.audioContext.createBiquadFilter();
    this.highPassFilter.type = 'highpass';
    this.highPassFilter.frequency.value = this.options.highPassFrequency;
    this.highPassFilter.Q.value = 0.7; // Gentle slope

    // Create low-pass filter to eliminate high-frequency noise
    this.lowPassFilter = this.audioContext.createBiquadFilter();
    this.lowPassFilter.type = 'lowpass';
    this.lowPassFilter.frequency.value = this.options.lowPassFrequency;
    this.lowPassFilter.Q.value = 0.7; // Gentle slope

    // Create gain node for automatic gain control
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1.0;

    // Create analyser node for pitch detection
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 2048; // Good balance for pitch detection
    this.analyserNode.smoothingTimeConstant = 0.8; // Smooth visualization
  }

  /**
   * Connect a media stream to the audio processing chain
   */
  public connectStream(stream: MediaStream): AnalyserNode {
    if (!this.analyserNode) {
      throw new Error('Audio processing chain not initialized');
    }

    // Create source from media stream
    this.sourceNode = this.audioContext.createMediaStreamSource(stream);

    // Connect the processing chain
    this.sourceNode
      .connect(this.highPassFilter!)
      .connect(this.lowPassFilter!)
      .connect(this.gainNode!)
      .connect(this.analyserNode!);

    return this.analyserNode;
  }

  /**
   * Disconnect the current stream
   */
  public disconnect(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.noiseGateEnvelope = 0;
    this.lastGainValue = 1.0;
  }

  /**
   * Apply noise gate to audio buffer
   */
  private applyNoiseGate(audioBuffer: Float32Array): Float32Array {
    const processedBuffer = new Float32Array(audioBuffer.length);
    const threshold = Math.pow(10, this.options.noiseGateThreshold / 20);
    const attackTime = this.options.noiseGateAttack / 1000;
    const releaseTime = this.options.noiseGateRelease / 1000;
    const sampleRate = this.audioContext.sampleRate;
    const attackCoeff = Math.exp(-1 / (attackTime * sampleRate));
    const releaseCoeff = Math.exp(-1 / (releaseTime * sampleRate));

    for (let i = 0; i < audioBuffer.length; i++) {
      const sample = audioBuffer[i];
      const envelope = Math.abs(sample);

      // Update noise gate envelope
      if (envelope > this.noiseGateEnvelope) {
        this.noiseGateEnvelope = envelope + (this.noiseGateEnvelope - envelope) * attackCoeff;
      } else {
        this.noiseGateEnvelope = envelope + (this.noiseGateEnvelope - envelope) * releaseCoeff;
      }

      // Apply gate
      if (this.noiseGateEnvelope < threshold) {
        // Below threshold - apply ratio
        const gain = Math.pow(this.noiseGateEnvelope / threshold, 1 - 1 / this.options.noiseGateRatio);
        processedBuffer[i] = sample * gain;
      } else {
        // Above threshold - pass through
        processedBuffer[i] = sample;
      }
    }

    return processedBuffer;
  }

  /**
   * Apply automatic gain control
   */
  private applyGainControl(audioBuffer: Float32Array): void {
    if (!this.gainNode) return;

    // Calculate RMS level
    let sum = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
      sum += audioBuffer[i] * audioBuffer[i];
    }
    const rms = Math.sqrt(sum / audioBuffer.length);

    if (rms > 0) {
      // Calculate required gain
      let targetGain = this.options.targetLevel / rms;

      // Limit maximum gain to prevent feedback
      targetGain = Math.min(targetGain, this.options.maxGain);

      // Smooth gain changes
      this.lastGainValue = this.lastGainValue * (1 - this.options.gainSmoothing) +
                          targetGain * this.options.gainSmoothing;

      // Apply gain
      this.gainNode.gain.value = this.lastGainValue;
    }
  }

  /**
   * Process audio data with all filters and effects
   */
  public processAudio(audioBuffer: Float32Array): Float32Array {
    // Apply noise gate
    let processedBuffer = this.applyNoiseGate(audioBuffer);

    // Apply gain control
    this.applyGainControl(processedBuffer);

    return processedBuffer;
  }

  /**
   * Get processed audio data for pitch detection
   */
  public getProcessedaudioData(): Float32Array {
    if (!this.analyserNode) {
      return new Float32Array(0);
    }

    const bufferLength = this.analyserNode.fftSize;
    const timeData = new Float32Array(bufferLength);

    // Get time domain data from analyser (after processing)
    const waveformData = new Uint8Array(bufferLength);
    this.analyserNode.getByteTimeDomainData(waveformData);

    // Convert to Float32Array (-1 to 1)
    for (let i = 0; i < bufferLength; i++) {
      timeData[i] = (waveformData[i] - 128) / 128;
    }

    return timeData;
  }

  /**
   * Get the analyser node for visualization
   */
  public getAnalyser(): AnalyserNode | null {
    return this.analyserNode;
  }

  /**
   * Update processing options
   */
  public updateOptions(newOptions: Partial<AudioProcessorOptions>): void {
    this.options = { ...this.options, ...newOptions };

    // Update filter parameters if they exist
    if (this.highPassFilter) {
      this.highPassFilter.frequency.value = this.options.highPassFrequency;
    }

    if (this.lowPassFilter) {
      this.lowPassFilter.frequency.value = this.options.lowPassFrequency;
    }
  }

  /**
   * Get current processing options
   */
  public getOptions(): AudioProcessorOptions {
    return { ...this.options };
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.disconnect();

    // Disconnect all nodes
    if (this.highPassFilter) {
      this.highPassFilter.disconnect();
      this.highPassFilter = null;
    }

    if (this.lowPassFilter) {
      this.lowPassFilter.disconnect();
      this.lowPassFilter = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }
  }
}

/**
 * Create an audio processor with default settings
 */
export function createAudioProcessor(audioContext: AudioContext, options?: Partial<AudioProcessorOptions>): AudioProcessor {
  return new AudioProcessor(audioContext, options);
}

/**
 * Utility function to create a noise profile for adaptive filtering
 */
export function analyzeNoiseProfile(audioContext: AudioContext, stream: MediaStream, durationMs: number = 1000): Promise<Float32Array> {
  return new Promise((resolve) => {
    const tempAnalyser = audioContext.createAnalyser();
    const tempSource = audioContext.createMediaStreamSource(stream);

    tempSource.connect(tempAnalyser);

    const samples = Math.floor((audioContext.sampleRate * durationMs) / 1000);
    const noiseProfile = new Float32Array(samples);
    let sampleIndex = 0;

    const collectNoiseSample = () => {
      const bufferLength = tempAnalyser.fftSize;
      const waveformData = new Uint8Array(bufferLength);
      tempAnalyser.getByteTimeDomainData(waveformData);

      // Convert and add to profile
      for (let i = 0; i < bufferLength && sampleIndex < samples; i++) {
        noiseProfile[sampleIndex++] = (waveformData[i] - 128) / 128;
      }

      if (sampleIndex < samples) {
        requestAnimationFrame(collectNoiseSample);
      } else {
        // Clean up
        tempSource.disconnect();
        tempAnalyser.disconnect();
        resolve(noiseProfile);
      }
    };

    collectNoiseSample();
  });
}