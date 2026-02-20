/**
 * Audio Settings - stub implementation
 * TODO: implement full settings persistence
 */

export interface AudioSettings {
  showPerformanceMetrics: boolean;
  fftSize: number;
  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;
}

export interface VisualizationConfig {
  enablePerformanceMetrics: boolean;
  performanceMonitoringInterval: number;
  targetFPS: number;
  fftSize: number;
}

const defaultSettings: AudioSettings = {
  showPerformanceMetrics: false,
  fftSize: 2048,
  smoothingTimeConstant: 0.8,
  minDecibels: -90,
  maxDecibels: -10,
};

export const useAudioSettings = () => {
  const settings = defaultSettings;

  const getVisualizationConfig = (): VisualizationConfig => ({
    enablePerformanceMetrics: settings.showPerformanceMetrics,
    performanceMonitoringInterval: 1000,
    targetFPS: 60,
    fftSize: settings.fftSize,
  });

  const updateSettings = (_partial: Partial<AudioSettings>) => {
    // TODO: persist settings
  };

  return { settings, getVisualizationConfig, updateSettings };
};
