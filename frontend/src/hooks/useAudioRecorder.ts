import { useState, useRef, useCallback } from 'react';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  audioBlob: Blob | null;
  error: string | null;
  stream: MediaStream | null;
  startRecording: () => Promise<MediaStream | null>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
}

const MAX_RECORDING_TIME = 300; // 5 minutes in seconds

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopRecordingRef = useRef<(() => void) | null>(null);

  const startRecording = useCallback(async (): Promise<MediaStream | null> => {
    try {
      setError(null);
      setAudioBlob(null);
      chunksRef.current = [];
      setRecordingTime(0);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      // Collect audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setIsRecording(false);
        setIsPaused(false);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);

      // Clear any existing timer before starting new one
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;

          // Auto-stop at max time
          if (newTime >= MAX_RECORDING_TIME && stopRecordingRef.current) {
            stopRecordingRef.current();
          }

          return newTime;
        });
      }, 1000);

      return stream;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(errorMessage);
      console.error('Recording error:', err);
      return null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  // Keep stopRecording ref updated
  stopRecordingRef.current = stopRecording;

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      // Clear any existing timer before starting new one
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Restart timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= MAX_RECORDING_TIME && stopRecordingRef.current) {
            stopRecordingRef.current();
          }
          return newTime;
        });
      }, 1000);
    }
  }, [isRecording, isPaused]);

  return {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    error,
    stream: streamRef.current,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  };
};
