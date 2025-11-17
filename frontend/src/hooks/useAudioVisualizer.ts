import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAudioVisualizerReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  analyser: AnalyserNode | null;
  startVisualizing: (stream: MediaStream, externalAnalyser?: AnalyserNode) => void;
  stopVisualizing: () => void;
}

export const useAudioVisualizer = (): UseAudioVisualizerReturn => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const startVisualizing = (stream: MediaStream, externalAnalyser?: AnalyserNode) => {
    console.log('[Visualizer] Starting visualization with stream:', stream);
    console.log('[Visualizer] Stream active:', stream.active);
    console.log('[Visualizer] Audio tracks:', stream.getAudioTracks());
    console.log('[Visualizer] External analyser provided:', !!externalAnalyser);

    let analyserNode: AnalyserNode;

    if (externalAnalyser) {
      // Use external analyser (from AudioProcessor)
      analyserNode = externalAnalyser;
      console.log('[Visualizer] Using external analyser for processed audio');
      audioContextRef.current = externalAnalyser.context as AudioContext;
    } else {
      // Fallback: create our own analyser for raw audio
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 2048;

      console.log('[Visualizer] AudioContext created, state:', ctx.state);
      console.log('[Visualizer] Analyser FFT size:', analyserNode.fftSize);

      // Connect stream to analyser
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyserNode);

      console.log('[Visualizer] MediaStreamSource connected to analyser');
      audioContextRef.current = ctx;
    }

    analyserRef.current = analyserNode;

    // Start visualization
    visualize(analyserNode);
    console.log('[Visualizer] Visualization loop started');
  };

  const visualize = (analyserNode: AnalyserNode) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('[Visualizer] Canvas ref is null');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[Visualizer] Canvas context is null');
      return;
    }

    console.log('[Visualizer] Canvas and context ready:', canvas.width, 'x', canvas.height);

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const frequencyData = new Uint8Array(bufferLength);

    let frameCount = 0;
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      // Get time domain data for waveform
      analyserNode.getByteTimeDomainData(dataArray);
      // Get frequency data for bars
      analyserNode.getByteFrequencyData(frequencyData);

      // Log every 60 frames (about 1 second)
      if (frameCount % 60 === 0) {
        const avgFreq = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length;
        console.log('[Visualizer] Frame:', frameCount, 'Avg frequency:', avgFreq);
      }
      frameCount++;

      // Clear with gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgb(17, 24, 39)');
      gradient.addColorStop(1, 'rgb(30, 41, 59)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw frequency bars
      const barWidth = canvas.width / 64;
      const barGap = 2;
      for (let i = 0; i < 64; i++) {
        const barHeight = (frequencyData[i] / 255) * canvas.height * 0.8;
        const x = i * (barWidth + barGap);
        const y = canvas.height - barHeight;

        // Create gradient for bars
        const barGradient = ctx.createLinearGradient(0, y, 0, canvas.height);
        barGradient.addColorStop(0, 'rgb(139, 92, 246)'); // Purple
        barGradient.addColorStop(0.5, 'rgb(99, 102, 241)'); // Indigo
        barGradient.addColorStop(1, 'rgb(59, 130, 246)'); // Blue

        ctx.fillStyle = barGradient;
        ctx.fillRect(x, y, barWidth - barGap, barHeight);
      }

      // Draw waveform overlay
      ctx.lineWidth = 3;
      const waveGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      waveGradient.addColorStop(0, 'rgba(34, 211, 238, 0.8)'); // Cyan
      waveGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.8)'); // Purple
      waveGradient.addColorStop(1, 'rgba(236, 72, 153, 0.8)'); // Pink
      ctx.strokeStyle = waveGradient;
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
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

      // Draw center line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  };

  const stopVisualizing = useCallback(() => {
    console.log('[Visualizer] Stopping visualization...');

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (audioContextRef.current) {
      console.log('[Visualizer] AudioContext state before close:', audioContextRef.current.state);
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        console.log('[Visualizer] AudioContext closed');
      } else {
        console.log('[Visualizer] AudioContext already closed, skipping');
      }
      audioContextRef.current = null;
    }

    analyserRef.current = null;

    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
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
    startVisualizing,
    stopVisualizing,
  };
};
