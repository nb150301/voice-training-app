/**
 * Pitch utility functions
 */

// Note names for 12-tone equal temperament
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// A4 = 440 Hz reference
const A4_FREQUENCY = 440;
const A4_MIDI_NUMBER = 69;

/**
 * Convert frequency in Hz to MIDI note number
 */
export function frequencyToMidi(frequency: number): number {
  return 12 * Math.log2(frequency / A4_FREQUENCY) + A4_MIDI_NUMBER;
}

/**
 * Convert frequency to note name with octave (e.g., "C4", "A#3")
 */
export function frequencyToNote(frequency: number): string {
  if (!frequency || frequency <= 0) return 'N/A';

  const midiNumber = frequencyToMidi(frequency);
  const noteNumber = Math.round(midiNumber);
  const octave = Math.floor(noteNumber / 12) - 1;
  const noteIndex = noteNumber % 12;

  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

/**
 * Get pitch category for male voices
 */
export function getPitchCategory(frequency: number): string {
  if (!frequency || frequency <= 0) return 'Unknown';

  // Male voice fundamental frequency ranges (approximate)
  // Bass: 82-165 Hz (E2-E3)
  // Baritone: 98-196 Hz (G2-G3)
  // Tenor: 130-261 Hz (C3-C4)

  if (frequency < 98) return 'Bass';
  if (frequency < 130) return 'Low Baritone';
  if (frequency < 165) return 'Baritone';
  if (frequency < 196) return 'High Baritone';
  if (frequency < 261) return 'Tenor';
  return 'High Voice';
}

/**
 * Format pitch for display with Hz and note
 */
export function formatPitch(frequency: number | null | undefined): string {
  if (!frequency || frequency <= 0) return 'Processing...';

  const note = frequencyToNote(frequency);
  const hz = frequency.toFixed(1);

  return `${hz} Hz (${note})`;
}

/**
 * Get color for pitch visualization
 */
export function getPitchColor(frequency: number): string {
  if (!frequency || frequency <= 0) return 'text-gray-400';

  // Color coding for male voices
  if (frequency < 98) return 'text-blue-600'; // Bass - blue
  if (frequency < 165) return 'text-indigo-600'; // Baritone - indigo
  if (frequency < 261) return 'text-purple-600'; // Tenor - purple
  return 'text-pink-600'; // Higher - pink
}

/**
 * Get background color for pitch badge
 */
export function getPitchBgColor(frequency: number): string {
  if (!frequency || frequency <= 0) return 'bg-gray-100';

  if (frequency < 98) return 'bg-blue-100'; // Bass
  if (frequency < 165) return 'bg-indigo-100'; // Baritone
  if (frequency < 261) return 'bg-purple-100'; // Tenor
  return 'bg-pink-100'; // Higher
}
