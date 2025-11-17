import { useState, useEffect } from 'react';

interface TargetSettings {
  minPitch: number;
  maxPitch: number;
  voiceGoal: 'bass' | 'baritone' | 'tenor' | 'custom';
  notifications: boolean;
}

const VOICE_PRESETS = {
  bass: { min: 82, max: 165, label: 'Bass (E2-E3)', color: 'bg-blue-500' },
  baritone: { min: 98, max: 196, label: 'Baritone (G2-G3)', color: 'bg-indigo-500' },
  tenor: { min: 130, max: 261, label: 'Tenor (C3-C4)', color: 'bg-purple-500' }
};

const DEFAULT_SETTINGS: TargetSettings = {
  minPitch: 98,
  maxPitch: 165,
  voiceGoal: 'baritone',
  notifications: true
};

export default function TargetPitchSettings() {
  const [settings, setSettings] = useState<TargetSettings>(DEFAULT_SETTINGS);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('targetPitchSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        setIsCustomMode(parsed.voiceGoal === 'custom');
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    }
  }, []);

  // Save to localStorage when settings change
  useEffect(() => {
    localStorage.setItem('targetPitchSettings', JSON.stringify(settings));
  }, [settings]);

  const handlePresetSelect = (goal: keyof typeof VOICE_PRESETS) => {
    const preset = VOICE_PRESETS[goal];
    setSettings({
      ...settings,
      voiceGoal: goal,
      minPitch: preset.min,
      maxPitch: preset.max
    });
    setIsCustomMode(false);
  };

  const handleCustomMode = () => {
    setSettings({
      ...settings,
      voiceGoal: 'custom'
    });
    setIsCustomMode(true);
  };

  const updateMinPitch = (value: number) => {
    setSettings({
      ...settings,
      minPitch: Math.min(value, settings.maxPitch - 10)
    });
  };

  const updateMaxPitch = (value: number) => {
    setSettings({
      ...settings,
      maxPitch: Math.max(value, settings.minPitch + 10)
    });
  };

  const currentPreset = Object.entries(VOICE_PRESETS).find(
    ([key, preset]) =>
      settings.voiceGoal === key ||
      (!isCustomMode &&
       Math.abs(settings.minPitch - preset.min) <= 5 &&
       Math.abs(settings.maxPitch - preset.max) <= 5)
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Target Pitch Settings</h2>
          <p className="text-gray-600">Set your voice training goals and target range</p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <svg
            className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Current Target Summary */}
      <div className={`rounded-lg p-4 mb-4 border-2 ${
        isCustomMode ? 'bg-orange-50 border-orange-200' :
        currentPreset ? `${VOICE_PRESETS[currentPreset[0] as keyof typeof VOICE_PRESETS].color.replace('bg-', 'bg-opacity-20 bg-')} border-opacity-30` : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-600">Current Target:</span>
            <p className="text-lg font-semibold text-gray-800">
              {settings.minPitch}-{settings.maxPitch} Hz
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${
            isCustomMode ? 'bg-orange-500' :
            currentPreset ? VOICE_PRESETS[currentPreset[0] as keyof typeof VOICE_PRESETS].color : 'bg-gray-500'
          }`}>
            {isCustomMode ? 'Custom' : (currentPreset ? currentPreset[1].label : 'Custom')}
          </div>
        </div>
      </div>

      {/* Expanded Settings */}
      {isExpanded && (
        <div className="space-y-6">
          {/* Voice Goal Presets */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Voice Goal</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(VOICE_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handlePresetSelect(key as keyof typeof VOICE_PRESETS)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.voiceGoal === key && !isCustomMode
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full mb-2 ${preset.color}`}></div>
                  <div className="font-medium text-gray-800">{preset.label}</div>
                  <div className="text-sm text-gray-600">{preset.min}-{preset.max} Hz</div>
                </button>
              ))}
              <button
                onClick={handleCustomMode}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isCustomMode
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-4 h-4 rounded-full mb-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                <div className="font-medium text-gray-800">Custom Range</div>
                <div className="text-sm text-gray-600">Set your own</div>
              </button>
            </div>
          </div>

          {/* Custom Range Sliders */}
          {isCustomMode && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Custom Pitch Range</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">Minimum Pitch</label>
                    <span className="text-sm font-mono text-indigo-600">{settings.minPitch} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="300"
                    value={settings.minPitch}
                    onChange={(e) => updateMinPitch(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>50 Hz</span>
                    <span>300 Hz</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">Maximum Pitch</label>
                    <span className="text-sm font-mono text-indigo-600">{settings.maxPitch} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    value={settings.maxPitch}
                    onChange={(e) => updateMaxPitch(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>50 Hz</span>
                    <span>500 Hz</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-800">Target Notifications</h4>
              <p className="text-sm text-gray-600">Get alerts when recording in target range</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Reset Button */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                setSettings(DEFAULT_SETTINGS);
                setIsCustomMode(false);
                localStorage.removeItem('targetPitchSettings');
              }}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Export settings for use in other components
export type { TargetSettings };
export { VOICE_PRESETS, DEFAULT_SETTINGS };