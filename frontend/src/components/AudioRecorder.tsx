import { useEffect, useState } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useAudioVisualizer } from '../hooks/useAudioVisualizer';
import { recordingsApi, type UploadProgress, type Recording } from '../lib/api';
import { formatPitch, getPitchCategory, getPitchColor, getPitchBgColor } from '../lib/pitch';

interface AudioRecorderProps {
  onRecordingComplete?: (blob: Blob) => void;
}

export default function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    error,
    stream,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  } = useAudioRecorder();

  const { canvasRef, startVisualizing, stopVisualizing } = useAudioVisualizer();

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedRecording, setUploadedRecording] = useState<Recording | null>(null);
  const [isPitchLoading, setIsPitchLoading] = useState(false);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle recording start
  const handleStart = async () => {
    console.log('[AudioRecorder] Starting recording...');
    const stream = await startRecording();
    console.log('[AudioRecorder] Recording started, stream:', stream);
    if (stream) {
      console.log('[AudioRecorder] Calling startVisualizing with stream');
      startVisualizing(stream);
    } else {
      console.error('[AudioRecorder] No stream returned from startRecording');
    }
  };

  // Handle recording stop
  const handleStop = () => {
    stopRecording();
    stopVisualizing();
  };

  // Handle upload
  const handleUpload = async () => {
    if (!audioBlob) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(null);
    setUploadSuccess(false);
    setUploadedRecording(null);

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `recording-${timestamp}.webm`;

      const response = await recordingsApi.upload(audioBlob, filename, (progress) => {
        setUploadProgress(progress);
      });

      if (response.data?.recording) {
        setUploadedRecording(response.data.recording);
        setUploadSuccess(true);
        setUploadProgress(null);

        // Poll for pitch data (backend processes asynchronously)
        pollForPitch(response.data.recording.id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(errorMessage);
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Poll for pitch data after upload
  const pollForPitch = async (recordingId: string) => {
    setIsPitchLoading(true);
    let attempts = 0;
    const maxAttempts = 10; // Poll for up to 10 seconds
    const pollInterval = 1000; // Poll every 1 second

    const poll = async () => {
      try {
        const response = await recordingsApi.getById(recordingId);
        if (response.data?.recording) {
          const recording = response.data.recording;

          if (recording.pitch_hz && recording.pitch_hz > 0) {
            // Pitch detected!
            setUploadedRecording(recording);
            setIsPitchLoading(false);
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval);
        } else {
          // Give up after max attempts
          setIsPitchLoading(false);
        }
      } catch (err) {
        console.error('Error polling for pitch:', err);
        setIsPitchLoading(false);
      }
    };

    poll();
  };

  // Notify parent when recording is complete
  useEffect(() => {
    if (audioBlob && onRecordingComplete) {
      onRecordingComplete(audioBlob);
    }
  }, [audioBlob, onRecordingComplete]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Voice Recording</h2>
        <p className="text-gray-600">
          Record your voice for up to 5 minutes. We'll analyze your pitch and provide feedback.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Waveform Visualization */}
      <div className="mb-6">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={1200}
            height={300}
            className="w-full border-2 border-indigo-200 rounded-lg bg-gray-900 shadow-lg"
          />
          {isRecording && !isPaused && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/90 text-white px-3 py-1.5 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              RECORDING
            </div>
          )}
          {isPaused && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-yellow-500/90 text-white px-3 py-1.5 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-white rounded-full" />
              PAUSED
            </div>
          )}
        </div>
      </div>

      {/* Recording Timer */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-3 bg-gray-50 rounded-lg px-6 py-3">
          {isRecording && !isPaused && (
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
          {isPaused && (
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
          )}
          <span className="text-3xl font-mono font-bold text-gray-800">
            {formatTime(recordingTime)}
          </span>
          <span className="text-sm text-gray-500">/ 05:00</span>
        </div>
        {isRecording && !isPaused && (
          <p className="text-sm text-gray-600 mt-2">Recording in progress...</p>
        )}
        {isPaused && (
          <p className="text-sm text-yellow-600 mt-2">Recording paused</p>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3 justify-center">
        {!isRecording && !audioBlob && (
          <button
            onClick={handleStart}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            Start Recording
          </button>
        )}

        {isRecording && !isPaused && (
          <>
            <button
              onClick={pauseRecording}
              className="bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Pause
            </button>
            <button
              onClick={handleStop}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              Stop Recording
            </button>
          </>
        )}

        {isRecording && isPaused && (
          <>
            <button
              onClick={resumeRecording}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Resume
            </button>
            <button
              onClick={handleStop}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              Stop Recording
            </button>
          </>
        )}
      </div>

      {/* Recording Complete */}
      {audioBlob && !uploadSuccess && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="font-medium text-green-800">Recording Complete!</p>
              <p className="text-sm text-green-700 mt-1">
                Duration: {formatTime(recordingTime)} • Size: {(audioBlob.size / 1024).toFixed(2)} KB
              </p>
              <audio
                controls
                src={URL.createObjectURL(audioBlob)}
                className="mt-3 w-full"
              />

              {/* Upload Button */}
              {!isUploading && (
                <button
                  onClick={handleUpload}
                  className="mt-4 w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  Upload Recording
                </button>
              )}

              {/* Upload Progress */}
              {isUploading && uploadProgress && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-green-700 mb-2">
                    <span>Uploading...</span>
                    <span>{uploadProgress.percentage}%</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2.5">
                    <div
                      className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    {(uploadProgress.loaded / 1024).toFixed(2)} KB / {(uploadProgress.total / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}

              {/* Upload Error */}
              {uploadError && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <p className="font-medium">Upload Failed</p>
                  <p>{uploadError}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Success */}
      {uploadSuccess && uploadedRecording && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="font-medium text-blue-800">Upload Successful!</p>
              <p className="text-sm text-blue-700 mt-1">
                Your recording has been uploaded and analyzed.
              </p>

              {/* Pitch Analysis Results */}
              <div className="mt-4 bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-800 mb-3">Voice Analysis</h4>

                {isPitchLoading ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm">Analyzing pitch...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Detected Pitch:</span>
                      <span className={`font-mono font-bold text-lg ${getPitchColor(uploadedRecording.pitch_hz || 0)}`}>
                        {formatPitch(uploadedRecording.pitch_hz)}
                      </span>
                    </div>

                    {uploadedRecording.pitch_hz && uploadedRecording.pitch_hz > 0 && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Voice Type:</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPitchBgColor(uploadedRecording.pitch_hz)} ${getPitchColor(uploadedRecording.pitch_hz)}`}>
                            {getPitchCategory(uploadedRecording.pitch_hz)}
                          </span>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            Recording duration: {formatTime(recordingTime)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!isRecording && !audioBlob && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Recording Tips:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Find a quiet environment to minimize background noise</li>
            <li>Speak naturally and clearly into your microphone</li>
            <li>Maximum recording duration is 5 minutes</li>
            <li>You can pause and resume recording as needed</li>
          </ul>
        </div>
      )}
    </div>
  );
}
