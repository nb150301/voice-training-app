import { useEffect, useRef, useState, useCallback } from 'react';
import { createVisualizationOptimizer, type VisualizationOptimizer, type VisualizationConfig } from '../lib/visualizationOptimizer';

interface UseAudioVisualizerReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  analyser: AnalyserNode | null;
  performanceMetrics: any;
  startVisualizing: (stream: MediaStream, externalAnalyser?: AnalyserNode) => void;
  stopVisualizing: () => void;
}

export const useAudioVisualizer = (): UseAudioVisualizerReturn => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const optimizerRef = useRef<VisualizationOptimizer | null>(null);
  const stopAnimationRef = useRef<(() => void) | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  const startVisualizing = (stream: MediaStream, externalAnalyser?: AnalyserNode) => {
    console.log('[Visualizer] Starting optimized visualization with stream:', stream);

    // Initialize visualization optimizer with voice-optimized settings
    const vizConfig: Partial<VisualizationConfig> = {
      targetFPS: 30,                           // Reduced from 60 for better performance
      enableFrameSkipping: true,
      adaptiveFrameRate: true,
      enableHardwareAcceleration: true,
      enableBatchRendering: true,
      reduceComplexity: true,
      enablePerformanceMetrics: true,
      performanceMonitoringInterval: 1000,
    };

    optimizerRef.current = createVisualizationOptimizer(vizConfig);

    // Start performance monitoring
    const performanceInterval = setInterval(() => {
      if (optimizerRef.current) {
        setPerformanceMetrics(optimizerRef.current.getMetrics());
      }
    }, 1000);

    let analyserNode: AnalyserNode;

    if (externalAnalyser) {
      // Use external analyser (from AudioProcessor)
      analyserNode = externalAnalyser;
      audioContextRef.current = externalAnalyser.context as AudioContext;
    } else {
      // Fallback: create our own analyser for raw audio
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 2048;

      // Connect stream to analyser
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyserNode);
      audioContextRef.current = ctx;
    }

    analyserRef.current = analyserNode;

    // Start optimized visualization loop
    stopAnimationRef.current = optimizerRef.current.createAnimationLoop((deltaTime: number) => {
      visualize(analyserNode, deltaTime);
    });

    // Store cleanup function
    stopAnimationRef.current = () => {
      clearInterval(performanceInterval);
      if (optimizerRef.current) {
        optimizerRef.current.dispose();
        optimizerRef.current = null;
      }
    };

    console.log('[Visualizer] Optimized visualization loop started');
  };

  const visualize = (analyserNode: AnalyserNode, deltaTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !optimizerRef.current) {
      return;
    }

    // Check if we should render this frame
    if (!optimizerRef.current.shouldRender()) {
      return;
    }

    // Start performance measurement
    const endMeasurement = optimizerRef.current.startFrameMeasurement();

    try {
      // Get optimized canvas context
      const ctx = optimizerRef.current.getOptimizedContext(canvas);

      // Optimize canvas if not already optimized
      if (!canvas.dataset.optimized) {
        optimizerRef.current.optimizeCanvas(canvas);
        canvas.dataset.optimized = 'true';
      }

      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const frequencyData = new Uint8Array(bufferLength);

      // Get audio data
      analyserNode.getByteTimeDomainData(dataArray);
      analyserNode.getByteFrequencyData(frequencyData);

      // Get optimization settings based on current performance
      const settings = optimizerRef.current.getOptimizedDrawingSettings();

      // Clear background (simplified when in high performance mode)
      if (settings.simplifiedRendering) {
        // Simple solid color background
        ctx.fillStyle = 'rgb(17, 24, 39)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        // Full gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgb(17, 24, 39)');
        gradient.addColorStop(1, 'rgb(30, 41, 59)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw frequency bars (optimized based on performance)
      const barCount = settings.fewerParticles ? 32 : 64;
      const barWidth = canvas.width / barCount;
      const barGap = settings.reducedDetail ? 1 : 2;

      for (let i = 0; i < barCount; i++) {
        const barHeight = (frequencyData[i] / 255) * canvas.height * 0.8;
        const x = i * (barWidth + barGap);
        const y = canvas.height - barHeight;

        if (settings.simplifiedGradients) {
          // Simple solid color bars
          ctx.fillStyle = `hsl(${240 + (i / barCount) * 60}, 70%, 50%)`;
          ctx.fillRect(x, y, barWidth - barGap, barHeight);
        } else {
          // Full gradient bars
          const barGradient = ctx.createLinearGradient(0, y, 0, canvas.height);
          barGradient.addColorStop(0, 'rgb(139, 92, 246)');
          barGradient.addColorStop(0.5, 'rgb(99, 102, 241)');
          barGradient.addColorStop(1, 'rgb(59, 130, 246)');
          ctx.fillStyle = barGradient;
          ctx.fillRect(x, y, barWidth - barGap, barHeight);
        }
      }

      // Draw waveform overlay (skip animations if requested)
      if (!settings.skipAnimations) {
        ctx.lineWidth = settings.reducedDetail ? 2 : 3;

        if (settings.simplifiedGradients) {
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.6)';
        } else {
          const waveGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
          waveGradient.addColorStop(0, 'rgba(34, 211, 238, 0.8)');
          waveGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.8)');
          waveGradient.addColorStop(1, 'rgba(236, 72, 153, 0.8)');
          ctx.strokeStyle = waveGradient;
        }

        ctx.beginPath();

        const sampleRate = settings.reducedDetail ? 4 : 2; // Reduce waveform detail
        const sliceWidth = canvas.width / (bufferLength / sampleRate);
        let x = 0;

        for (let i = 0; i < bufferLength; i += sampleRate) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      }

      // Draw center line (simplified)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

    } finally {
      // End performance measurement
      endMeasurement();
    }
  };

  const stopVisualizing = useCallback(() => {
    console.log('[Visualizer] Stopping optimized visualization...');

    // Stop animation loop
    if (stopAnimationRef.current) {
      stopAnimationRef.current();
      stopAnimationRef.current = null;
    }

    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setPerformanceMetrics(null);

    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      delete canvas.dataset.optimized;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      stopVisualizing();
    };
  }, [stopVisualizing]);

  return {
    canvasRef,
    analyser: analyserRef.current,
    performanceMetrics,
    startVisualizing,
    stopVisualizing,
  };
};
