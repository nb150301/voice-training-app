import { useMemo } from 'react';
import { useRealtimePitch } from '../hooks/useRealtimePitch';
import { formatPitch, getPitchCategory, getPitchColor } from '../lib/pitch';

interface RealtimePitchMeterProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
}

interface MeterZone {
  min: number;
  max: number;
  color: string;
  bgColor: string;
  label: string;
}

// Voice type ranges for male voices
const METER_ZONES: MeterZone[] = [
  { min: 0, max: 82, color: 'text-gray-400', bgColor: 'bg-gray-200', label: 'Too Low' },
  { min: 82, max: 98, color: 'text-blue-600', bgColor: 'bg-blue-200', label: 'Bass' },
  { min: 98, max: 130, color: 'text-indigo-600', bgColor: 'bg-indigo-200', label: 'Baritone' },
  { min: 130, max: 165, color: 'text-purple-600', bgColor: 'bg-purple-200', label: 'Low Tenor' },
  { min: 165, max: 261, color: 'text-pink-600', bgColor: 'bg-pink-200', label: 'Tenor' },
  { min: 261, max: 500, color: 'text-orange-600', bgColor: 'bg-orange-200', label: 'Too High' },
];

export default function RealtimePitchMeter({ analyser, isActive }: RealtimePitchMeterProps) {
  const { currentPitch, currentConfidence, currentClarity, currentAlgorithm, filterQuality, isDetecting, startPitchDetection, stopPitchDetection } = useRealtimePitch();

  // Start/stop detection based on analyser availability
  if (isActive && analyser && !isDetecting) {
    startPitchDetection(analyser);
  } else if ((!isActive || !analyser) && isDetecting) {
    stopPitchDetection();
  }

  // Calculate needle rotation (0-180 degrees)
  const needleRotation = useMemo(() => {
    if (currentPitch === null || currentPitch === 0) return 0;

    // Map pitch to rotation (0-180 degrees)
    const minRotation = 0;
    const maxRotation = 180;
    const pitchRange = 400; // 50-450 Hz range

    const normalizedPitch = (currentPitch - 50) / pitchRange;
    const clampedPitch = Math.max(0, Math.min(1, normalizedPitch));

    return minRotation + (maxRotation * clampedPitch);
  }, [currentPitch]);

  // Get current zone
  const currentZone = useMemo(() => {
    if (!currentPitch) return null;
    return METER_ZONES.find(zone => currentPitch >= zone.min && currentPitch < zone.max);
  }, [currentPitch]);

  if (!isActive || !analyser) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Live Pitch Meter</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Start recording to see pitch meter</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Live Pitch Meter</h3>

      {/* Circular Gauge */}
      <div className="relative flex flex-col items-center mb-4">
        <div className="relative w-64 h-64">
          {/* Gauge Background */}
          <svg viewBox="0 0 200 120" className="absolute inset-0 w-full h-full">
            {/* Meter zones */}
            {METER_ZONES.map((zone, index) => {
              const startAngle = (index * 30) - 90; // Start from left
              const endAngle = startAngle + 30;

              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;

              const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

              const x1 = 100 + 90 * Math.cos(startRad);
              const y1 = 100 + 90 * Math.sin(startRad);
              const x2 = 100 + 90 * Math.cos(endRad);
              const y2 = 100 + 90 * Math.sin(endRad);

              return (
                <path
                  key={index}
                  d={`M ${x1} ${y1} A 90 90 0 ${largeArcFlag} 1 ${x2} ${y2} L 100 100 Z`}
                  fill={zone.bgColor}
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}

            {/* Zone labels */}
            {METER_ZONES.map((zone, index) => {
              const angle = (index * 30) - 75; // Center of zone
              const rad = (angle * Math.PI) / 180;
              const x = 100 + 70 * Math.cos(rad);
              const y = 100 + 70 * Math.sin(rad);

              return (
                <text
                  key={`label-${index}`}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`text-xs font-medium fill-current ${zone.color}`}
                >
                  {zone.label}
                </text>
              );
            })}

            {/* Needle */}
            <g transform={`rotate(${needleRotation - 90}, 100, 100)`}>
              <line
                x1="100"
                y1="100"
                x2="185"
                y2="100"
                stroke="#ef4444"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="100" cy="100" r="8" fill="#ef4444" />
            </g>

            {/* Center decorative circle */}
            <circle cx="100" cy="100" r="95" fill="none" stroke="#e5e7eb" strokeWidth="2" />
          </svg>
        </div>

        {/* Digital Display */}
        <div className="text-center mt-4">
          <div className={`text-3xl font-bold font-mono ${currentPitch ? getPitchColor(currentPitch) : 'text-gray-400'}`}>
            {formatPitch(currentPitch)}
          </div>

          {currentZone && currentPitch && (
            <div className={`mt-2 px-3 py-1 rounded-full text-sm font-medium ${currentZone.bgColor} ${currentZone.color}`}>
              {currentZone.label}
            </div>
          )}

          {currentPitch && (
            <div className="mt-1 text-sm text-gray-600">
              Voice: {getPitchCategory(currentPitch)}
            </div>
          )}
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center justify-center gap-2 text-sm mb-3">
        {isDetecting ? (
          <>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-700">
              Detecting pitch with {currentAlgorithm.toUpperCase()} algorithm
            </span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-gray-400 rounded-full" />
            <span className="text-gray-500">Ready</span>
          </>
        )}
      </div>

      {/* Quality Indicators */}
      {isDetecting && currentPitch && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Confidence Indicator */}
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-1">Confidence</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentConfidence > 0.8 ? 'bg-green-500' :
                    currentConfidence > 0.6 ? 'bg-yellow-500' :
                    currentConfidence > 0.4 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, currentConfidence * 100)}%` }}
                />
              </div>
              <span className={`text-xs font-mono ${
                currentConfidence > 0.8 ? 'text-green-700' :
                currentConfidence > 0.6 ? 'text-yellow-700' :
                currentConfidence > 0.4 ? 'text-orange-700' : 'text-red-700'
              }`}>
                {Math.round(currentConfidence * 100)}%
              </span>
            </div>
          </div>

          {/* Clarity Indicator */}
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-1">Signal Clarity</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentClarity > 0.8 ? 'bg-blue-500' :
                    currentClarity > 0.6 ? 'bg-indigo-500' :
                    currentClarity > 0.4 ? 'bg-purple-500' : 'bg-gray-500'
                  }`}
                  style={{ width: `${Math.min(100, currentClarity * 100)}%` }}
                />
              </div>
              <span className={`text-xs font-mono ${
                currentClarity > 0.8 ? 'text-blue-700' :
                currentClarity > 0.6 ? 'text-indigo-700' :
                currentClarity > 0.4 ? 'text-purple-700' : 'text-gray-700'
              }`}>
                {Math.round(currentClarity * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Quality Metrics */}
      {isDetecting && filterQuality && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs font-medium text-gray-700 mb-2">Temporal Filter Performance</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-gray-600">Stability</div>
              <div className={`text-sm font-mono ${
                filterQuality.stability > 0.8 ? 'text-green-700' :
                filterQuality.stability > 0.6 ? 'text-yellow-700' :
                'text-orange-700'
              }`}>
                {Math.round(filterQuality.stability * 100)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600">Precision</div>
              <div className={`text-sm font-mono ${
                filterQuality.confidence > 0.8 ? 'text-blue-700' :
                filterQuality.confidence > 0.6 ? 'text-indigo-700' :
                'text-purple-700'
              }`}>
                {Math.round(filterQuality.confidence * 100)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600">Error</div>
              <div className={`text-sm font-mono ${
                filterQuality.errorCovariance < 0.1 ? 'text-green-700' :
                filterQuality.errorCovariance < 0.3 ? 'text-yellow-700' :
                'text-red-700'
              }`}>
                {(filterQuality.errorCovariance).toFixed(3)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quality Status Messages */}
      {isDetecting && currentPitch && (
        <div className="text-center">
          {filterQuality && filterQuality.stability > 0.85 && currentConfidence > 0.7 && (
            <div className="text-sm text-green-700 font-medium">
              ✓ Excellent stability and voice detection
            </div>
          )}
          {filterQuality && filterQuality.stability > 0.7 && currentConfidence > 0.5 && (
            <div className="text-sm text-green-600 font-medium">
              ✓ Good filter stability
            </div>
          )}
          {filterQuality && filterQuality.stability < 0.5 && (
            <div className="text-sm text-orange-700 font-medium">
              ⚠️ Filter stabilizing... Keep voice steady
            </div>
          )}
          {!filterQuality && currentConfidence <= 0.4 && (
            <div className="text-sm text-orange-700 font-medium">
              ⚠️ Move closer to microphone or reduce background noise
            </div>
          )}
        </div>
      )}

      {/* Voice Range Reference */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600 text-center">
          Typical male voice ranges:
          <br />
          Bass: 82-165 Hz | Baritone: 98-196 Hz | Tenor: 130-261 Hz
        </p>
      </div>
    </div>
  );
}