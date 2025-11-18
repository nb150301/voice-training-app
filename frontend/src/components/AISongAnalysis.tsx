/**
 * AI Song Analysis and Difficulty Assessment System
 * Phase 5: Advanced AI Features and Personalization
 */

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ResponsiveCard,
  ResponsiveText,
  ResponsiveButton,
  ResponsiveGrid,
} from './ui/ResponsiveLayout';
import { useResponsiveBreakpoints } from '../../hooks/useResponsiveBreakpoints';
import { useUserProfile } from './UserProfileManager';

export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  year: number;
  key: string;
  timeSignature: string;
  tempo: number;
  duration: number; // in seconds
  lyrics: string;
  vocalRange: {
    min: number;
    max: number;
    voiceType: string;
  };
  difficulty: number; // 1-10
  techniques: string[];
  tags: string[];
}

export interface SongAnalysis {
  songId: string;
  analysisDate: string;
  userVoiceType: string;
  matchPercentage: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  modifications: SongModification[];
  challenges: string[];
  benefits: string[];
  practiceAreas: string[];
  estimatedPracticeTime: number;
  confidence: number; // 0-1
  adaptation: string[];
}

export interface SongModification {
  type: 'key_change' | 'tempo_adjustment' | 'range_adaptation' | 'octave_shift';
  original: any;
  modified: any;
  reason: string;
  impact: 'ease' | 'challenge' | 'minor_change' | 'major_change';
}

export interface PracticePlan {
  id: string;
  songId: string;
  steps: PracticeStep[];
  totalTime: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  focusAreas: string[];
  prerequisites: string[];
}

export interface PracticeStep {
  id: string;
  title: string;
  type: 'preparation' | 'melody_practice' | 'harmony_study' | 'rhythm_work' | 'full_performance' | 'reflection';
  duration: number; // in minutes
  instructions: string[];
  goals: string[];
  techniques: string[];
  tips: string[];
  challenges: string[];
}

// Song database with AI analysis data
const songDatabase: Song[] = [
  {
    id: 'song_1',
    title: 'Perfect',
    artist: 'Ed Sheeran',
    genre: 'Pop',
    year: 2017,
    key: 'G Major',
    timeSignature: '4/4',
    tempo: 63,
    duration: 263,
    lyrics: 'I found a love for me...',
    vocalRange: { min: 220, max: 660, voiceType: 'tenor' },
    difficulty: 6,
    techniques: ['breath_control', 'vocal_placement', 'dynamics'],
    tags: ['pop', 'ballad', 'popular', 'beginner_friendly'],
  },
  {
    id: 'song_2',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    genre: 'Rock',
    year: 1975,
    key: 'Bb Major',
    timeSignature: '4/4',
    tempo: 72,
    duration: 354,
    lyrics: 'Is this the real life?...',
    vocalRange: { min: 220, max: 770, voiceType: 'tenor' },
    difficulty: 10,
    techniques: ['opera', 'wide_range', 'dramatic_expression', 'vocal_agility'],
    tags: ['rock', 'opera', 'challenging', 'advanced'],
  },
  {
    id: 'song_3',
    title: 'Someone Like You',
    artist: 'Adele',
    genre: 'Pop/Soul',
    year: 2011,
    key: 'C Major',
    timeSignature: '4/4',
    tempo: 78,
    duration: 235,
    lyrics: 'I heard that you\'re settled down...',
    vocalRange: { min: 220, max: 660, voiceType: 'alto' },
    difficulty: 4,
    techniques: ['emotional_delivery', 'breath_control', 'dynamics'],
    tags: ['pop', 'soul', 'ballad', 'intermediate'],
  },
  {
    id: 'song_4',
    title: 'Thinking Out Loud',
    artist: 'Ariana Grande',
    genre: 'Pop/R&B',
    year: 2019,
    key: 'F Major',
    timeSignature: '4/4',
    tempo: 108,
    duration: 258,
    lyrics: 'Thinking out loud...',
    vocalRange: { min: 330, max: 880, voiceType: 'soprano' },
    difficulty: 8,
    techniques: ['vocal_agility', 'breath_support', 'belting', 'rhythm'],
    tags: ['pop', 'r&b', 'challenging', 'high_range'],
  },
  {
    id: 'song_5',
    title: 'Feeling Good',
    artist: 'Bill Withers',
    genre: 'Pop/Soul',
    year: 1972,
    key: 'C Major',
    timeSignature: '4/4',
    tempo: 116,
    duration: 213,
    lyrics: 'I just want to feel good...',
    vocalRange: { min: 196, max: 523, voiceType: 'baritone' },
    difficulty: 3,
    techniques: ['groove', 'emotion', 'rhythm', 'phrasing'],
    tags: ['soul', 'funk', 'beginner_friendly', 'classic'],
  },
  {
    id: 'song_6',
    title: 'Shallow',
    title: 'Lady Gaga & Bradley Cooper',
    artist: 'A Star is Born',
    genre: 'Pop',
    year: 2018,
    key: 'G Major',
    timeSignature: '4/4',
    tempo: 96,
    duration: 216,
    lyrics: 'I\'m shallow...',
    vocalRange: { min: 293, max: 659, voiceType: 'alto' },
    difficulty: 5,
    techniques: ['emotional_depth', 'storytelling', 'dynamic_control'],
    tags: ['pop', 'ballad', 'dramatic', 'movie'],
  },
];

interface AISongAnalysisProps {
  onSongSelect?: (song: Song, analysis: SongAnalysis) => void;
  onPracticePlanGenerated?: (plan: PracticePlan) => void;
}

export default function AISongAnalysis({ onSongSelect, onPracticePlanGenerated }: AISongAnalysisProps) {
  const { profile } = useUserProfile();
  const { isMobile } = useResponsiveBreakpoints();
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<SongAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  [practicePlan, setPracticePlan] = useState<PracticePlan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  const userVoiceType = profile?.profile?.voiceProfile?.voiceType || 'unknown';
  const userExperience = profile?.progress?.totalSessions ?
    (profile.progress.totalSessions < 10 ? 'beginner' :
     profile.progress.totalSessions < 50 ? 'intermediate' :
     profile.progress.totalSessions < 100 ? 'advanced' : 'expert') : 'beginner';

  // Filter songs based on search and filters
  const filteredSongs = songDatabase.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       song.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || song.genre.toLowerCase().includes(selectedGenre.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' ||
      (difficultyFilter === 'beginner' && song.difficulty <= 4) ||
      (difficultyFilter === 'intermediate' && song.difficulty >= 4 && song.difficulty <= 7) ||
      (difficultyFilter === 'advanced' && song.difficulty > 7);

    return matchesSearch && matchesGenre && matchesDifficulty;
  });

  // Analyze song for user
  const analyzeSong = (song: Song) => {
    setIsAnalyzing(true);
    setSelectedSong(song);

    setTimeout(() => {
      const analysis: SongAnalysis = {
        songId: song.id,
        analysisDate: new Date().toISOString(),
        userVoiceType,
        matchPercentage: calculateMatchPercentage(song),
        difficulty: calculateUserDifficulty(song),
        modifications: generateModifications(song),
        challenges: identifyChallenges(song),
        benefits: identifyBenefits(song),
        practiceAreas: identifyPracticeAreas(song),
        estimatedPracticeTime: estimatePracticeTime(song),
        confidence: calculateConfidence(song),
        adaptation: generateAdaptations(song),
      };

      setCurrentAnalysis(analysis);
      setIsAnalyzing(false);
      onSongSelect?.(song, analysis);
    }, 2000);
  };

  // Calculate how well the song matches user's voice type
  const calculateMatchPercentage = (song: Song): number => {
    if (userVoiceType === 'unknown') return 75;

    const voiceRangeOverlap = calculateRangeOverlap(userVoiceType, song.vocalRange);
    const baseMatch = Math.min(100, voiceRangeOverlap * 100);

    // Adjust for user experience
    const experienceModifier = userExperience === 'expert' ? 1.2 :
                            userExperience === 'advanced' ? 1.1 :
                            userExperience === 'intermediate' ? 1.0 : 0.9;

    return Math.min(100, baseMatch * experienceModifier);
  };

  // Calculate range overlap percentage
  const calculateRangeOverlap = (voiceType: string, songRange: { min: number; max: number }): number => {
    const voiceRanges = {
      soprano: { min: 260, max: 1047 },
      alto: { min: 220, max: 880 },
      tenor: { min: 147, max: 659 },
      bass: { min: 98, max: 494 },
    };

    const userRange = voiceRanges[voiceType as keyof typeof voiceRanges];
    if (!userRange) return 0.5;

    const overlapStart = Math.max(userRange.min, songRange.min);
    const overlapEnd = Math.min(userRange.max, songRange.max);

    if (overlapStart >= overlapEnd) return 0;

    const overlapSize = overlapEnd - overlapStart;
    const songRangeSize = songRange.max - songRange.min;
    const userRangeSize = userRange.max - userRange.min;

    return (overlapSize / songRangeSize) * 100;
  };

  // Calculate appropriate difficulty for user
  const calculateUserDifficulty = (song: Song): 'beginner' | 'intermediate' | 'advanced' | 'expert' => {
    const baseDifficulty = song.difficulty;
    const matchPercentage = calculateMatchPercentage(song);

    let userDifficulty = baseDifficulty;

    // Adjust based on match percentage
    if (matchPercentage < 50) {
      userDifficulty += 3; // Song is harder for this user
    } else if (matchPercentage > 80) {
      userDifficulty -= 2; // Song is easier for this user
    }

    // Adjust based on experience
    if (userExperience === 'beginner') {
      userDifficulty += 2;
    } else if (userExperience === 'expert') {
      userDifficulty -= 2;
    }

    return Math.min(10, Math.max(1, userDifficulty));
  };

  // Generate song modifications
  const generateModifications = (song: Song): SongModification[] => {
    const modifications: SongModification[] = [];

    // Key change suggestions
    const userOptimalKeys = {
      soprano: ['D Major', 'E♭ Major', 'F Major'],
      alto: ['G Major', 'C Major', 'A♭ Major'],
      tenor: ['C Major', 'D Major', 'E♭ Major'],
      bass: ['F Major', 'G Major', 'C Major'],
    };

    if (userVoiceType !== 'unknown') {
      const optimalKeys = userOptimalKeys[userVoiceType as keyof typeof userOptimalKeys];
      const targetKey = optimalKeys[Math.floor(Math.random() * optimalKeys.length)];

      modifications.push({
        type: 'key_change',
        original: song.key,
        modified: targetKey,
        reason: `${targetKey} better suits your ${userVoiceType} voice type`,
        impact: 'ease',
      });
    }

    // Tempo suggestions
    if (song.tempo > 110) {
      modifications.push({
        type: 'tempo_adjustment',
        original: song.tempo,
        modified: Math.round(song.tempo * 0.9),
        reason: 'Slower tempo will help with pitch accuracy and learning',
        impact: 'ease',
      });
    }

    // Range adaptation suggestions
    const overlap = calculateRangeOverlap(userVoiceType, song.vocalRange);
    if (overlap < 70) {
      modifications.push({
        type: 'range_adaptation',
        original: song.vocalRange,
        modified: {
          min: song.vocalRange.min * 0.8,
          max: song.vocalRange.max * 0.9,
          voiceType: userVoiceType,
        },
        reason: 'Adapt range to better fit your comfortable singing range',
        impact: 'major_change',
      });
    }

    return modifications;
  };

  // Identify challenges in the song
  const identifyChallenges = (song: Song): string[] => {
    const challenges: string[] = [];

    const difficulty = calculateUserDifficulty(song);
    const matchPercentage = calculateMatchPercentage(song);

    if (matchPercentage < 60) {
      challenges.push(`Range mismatch - song goes ${100 - matchPercentage}% outside your comfortable range`);
    }

    if (difficulty >= 8) {
      challenges.push('Advanced techniques required - includes complex vocal techniques');
    }

    if (song.tempo > 120) {
      challenges.push('Fast tempo - requires excellent breath control and rhythm');
    }

    if (song.duration > 300) {
      challenges.push('Long duration - requires significant stamina');
    }

    const techniques = song.techniques;
    if (techniques.includes('vocal_agility')) {
      challenges.push('Vocal agility - requires fast and accurate pitch changes');
    }
    if (techniques.includes('opera')) {
      challenges.push('Operatic technique - requires classical training');
    }

    return challenges;
  };

  // Identify benefits of learning the song
  const identifyBenefits = (song: Song): string[] => {
    const benefits: string[] = [];

    if (song.techniques.includes('dynamics')) {
      benefits.push('Dynamic expression - practice volume control and expression');
    }

    if (song.techniques.includes('emotional_delivery')) {
      benefits.push('Emotional storytelling - develop performance skills');
    }

    if (song.techniques.includes('breath_control')) {
      benefits.push('Breath support - strengthen foundational technique');
    }

    const difficulty = calculateUserDifficulty(song);
    if (difficulty >= 6) {
      benefits.push('Range expansion - challenge yourself with advanced material');
    }

    if (song.genre === 'classical' || song.genre === 'opera') {
      benefits.push('Classical training - build fundamental skills');
    }

    return benefits;
  };

  // Identify practice areas
  const identifyPracticeAreas = (song: Song): string[] => {
    const areas: string[] = [];

    const techniques = song.techniques;

    if (techniques.includes('pitch_accuracy')) {
      areas.push('Pitch accuracy and intonation');
    }
    if (techniques.includes('rhythm')) {
      areas.push('Rhythm and timing');
    }
    if (techniques.includes('dynamics')) {
      areas.push('Dynamic control and expression');
    }
    if (techniques.includes('breath_control')) {
      areas.push('Breath support and management');
    }

    const overlap = calculateRangeOverlap(userVoiceType, song.vocalRange);
    if (overlap < 80) {
      areas.push('Range development and expansion');
    }

    return areas;
  };

  // Estimate practice time in hours
  const estimatePracticeTime = (song: Song): number => {
    const baseTime = song.duration / 60; // Convert to minutes
    const difficulty = calculateUserDifficulty(song);
    const matchPercentage = calculateMatchPercentage(song);

    let multiplier = 10; // Base multiplier for learning a song

    // Adjust for difficulty
    if (difficulty >= 8) multiplier = 25;
    else if (difficulty >= 5) multiplier = 15;
    else if (difficulty >= 3) multiplier = 8;

    // Adjust for range fit
    if (matchPercentage < 50) multiplier *= 1.5;

    return Math.round(baseTime * multiplier);
  };

  // Calculate confidence in analysis
  const calculateConfidence = (song: Song): number => {
    let confidence = 0.8; // Base confidence

    // Higher confidence for well-known songs
    if (song.year < 2000) confidence += 0.1;

    // Lower confidence for very challenging songs
    if (song.difficulty >= 9) confidence -= 0.2;

    // Higher confidence for good match
    const matchPercentage = calculateMatchPercentage(song);
    if (matchPercentage > 80) confidence += 0.15;
    else if (matchPercentage < 50) confidence -= 0.15;

    return Math.min(1, Math.max(0, confidence));
  };

  // Generate adaptations for the song
  const generateAdaptations = (song: Song): string[] => {
    const adaptations: string[] = [];

    const matchPercentage = calculateMatchPercentage(song);

    if (matchPercentage < 50) {
      adaptations.push('Start with melody-only version to build confidence');
      adaptations.push('Use piano or reference recording for pitch guidance');
    }

    if (song.tempo > 110) {
      adaptations.push('Begin at slower tempo and gradually increase speed');
    }

    if (userExperience === 'beginner') {
      adaptations.push('Focus on learning melody first, add harmonies later');
    }

    return adaptations;
  };

  // Generate practice plan
  const generatePracticePlan = (song: Song, analysis: SongAnalysis): PracticePlan => {
    const baseTime = estimatePracticeTime(song);
    const steps: PracticeStep[] = [
      {
        id: 'step_1',
        title: 'Song Analysis & Listening',
        type: 'preparation',
        duration: 15,
        instructions: [
          'Listen to the original recording multiple times',
          'Identify key melodic phrases',
          'Note tempo changes and dynamics',
          'Mark difficult sections for focused practice'
        ],
        goals: ['Understand song structure', 'Identify personal challenges'],
        techniques: ['active_listening', 'song_structure'],
        tips: ['Follow lyrics to understand emotional content'],
        challenges: ['Overwhelming complexity - break it down'],
      },
      {
        id: 'step_2',
        title: 'Key Signature and Scales',
        type: 'melody_practice',
        duration: 20,
        instructions: [
          `Practice ${song.key} major scale`,
          'Sing the main melody on "la"',
          'Use solfege syllables (do-re-mi-fa-sol)',
          'Focus on accurate pitch for each note'
        ],
        goals: ['Master key signature', 'Improve pitch accuracy'],
        techniques: ['pitch_accuracy', 'solfege', 'scale_practice'],
        tips: ['Play reference pitches if needed'],
        challenges: ['Matching pitches accurately'],
      },
      {
        id: 'step_3',
        title: 'Melody Work',
        type: 'melody_practice',
        duration: 45,
        instructions: [
          'Practice melody in small sections (4-8 measures)',
          'Start with slower tempo if needed',
          'Use breath marks for phrase endings',
          'Record yourself to check accuracy'
        ],
        goals: ['Master main melody', 'Build confidence with song'],
        techniques: ['phrase_shaping', 'breath_support', 'recording'],
        tips: ['Practice short sections repeatedly', 'Rest between attempts'],
        challenges: ['Maintaining consistency throughout'],
      },
    ];

    // Add advanced steps for experienced users
    if (analysis.difficulty !== 'beginner') {
      steps.push(
        {
          id: 'step_4',
          title: 'Harmony and Backup Vocals',
          type: 'harmony_study',
          duration: 30,
          instructions: [
            'Identify chord progressions',
            'Practice harmony parts',
            'Blend with other vocal lines',
            'Balance volume appropriately'
          ],
          goals: ['Add harmony skills', 'Improve listening skills'],
          techniques: ['harmony', 'blend', 'listening'],
          tips: ['Start with simple harmonies'],
          challenges: ['Singing with other voices'],
        },
        {
          id: 'step_5',
          title: 'Full Performance',
          type: 'full_performance',
          duration: 30,
          instructions: [
            'Perform complete song with expression',
            'Connect with lyrical meaning',
            'Apply appropriate dynamics',
            'Practice beginning to end'
          ],
          goals: ['Develop performance skills', 'Connect emotionally with material'],
          techniques: ['performance', 'expression', 'dynamics'],
          tips: ['Record and review performances'],
          challenges: ['Managing performance anxiety'],
        }
      );
    }

    const totalTime = steps.reduce((sum, step) => sum + step.duration, 0);

    return {
      id: `plan_${song.id}_${Date.now()}`,
      songId: song.id,
      steps,
      totalTime,
      difficulty: analysis.difficulty,
      focusAreas: analysis.practiceAreas,
      prerequisites: [],
    };
  };

  const handleAnalyzeSong = (song: Song) => {
    const analysis: SongAnalysis = {
      songId: song.id,
      analysisDate: new Date().toISOString(),
      userVoiceType,
      matchPercentage: calculateMatchPercentage(song),
      difficulty: calculateUserDifficulty(song),
      modifications: generateModifications(song),
      challenges: identifyChallenges(song),
      benefits: identifyBenefits(song),
      practiceAreas: identifyPracticeAreas(song),
      estimatedPracticeTime: estimatePracticeTime(song),
      confidence: calculateConfidence(song),
      adaptation: generateAdaptations(song),
    };

    setCurrentAnalysis(analysis);
    const plan = generatePracticePlan(song, analysis);
    setPracticePlan(plan);
    onSongSelect?.(song, analysis);
    onPracticePlanGenerated?.(plan);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-yellow-100 text-yellow-800';
      case 'expert': return 'red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes > 0 ? `${minutes}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getGenreEmoji = (genre: string) => {
    switch (genre.toLowerCase()) {
      case 'pop': return '🎤';
      case 'rock': return '🎸';
      case 'jazz': return '🎷';
      case 'classical': return '🎼';
      case 'opera': return '🎭';
      case 'soul': return '🎷';
      case 'funk': return '🕺';
      case 'folk': return '🎻';
      case 'country': return '🤠';
      default: return '🎵';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <ResponsiveCard className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
        <div className="text-center space-y-4">
          <div className="text-5xl">🎵</div>
          <ResponsiveText size="2xl" weight="semibold" className="teal-900">
            AI Song Analysis
          </ResponsiveText>
          <ResponsiveText size="md" color="teal-700">
            Get intelligent song analysis, difficulty assessment, and personalized practice plans
          </ResponsiveText>
        </div>
      </ResponsiveCard>

      {/* Search and Filters */}
      <ResponsiveCard>
        <div className="space-y-4">
          <div className="flex flex-col md:flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search songs by title or artist..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Genres</option>
                <option value="pop">Pop</option>
                <option value="rock">Rock</option>
                <option value="jazz">Jazz</option>
                <option value="classical">Classical</option>
                <option value="soul">Soul</option>
              </select>

              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>
      </ResponsiveCard>

      {/* Song Grid */}
      <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }} gap={6}>
        {filteredSongs.map((song) => (
          <ResponsiveCard key={song.id} className="hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              {/* Song Header */}
              <div>
                <ResponsiveText size="lg" weight="semibold" className="line-clamp-2">
                  {song.title}
                </ResponsiveText>
                <ResponsiveText size="md" color="text-gray-600" className="line-clamp-1">
                  by {song.artist}
                </ResponsiveText>
              </div>

              {/* Song Metadata */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex gap-4">
                  <span>{getGenreEmoji(song.genre)} {song.genre}</span>
                  <span>{song.year}</span>
                  <span>{formatDuration(song.duration)}</span>
                  <span>{song.tempo} BPM</span>
                </div>
              </div>

              {/* AI Analysis Button */}
              <ResponsiveButton
                onClick={() => handleAnalyzeSong(song)}
                variant="primary"
                size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg' }}
                disabled={isAnalyzing}
                fullWidth
              >
                {isAnalyzing ? '🔄 Analyzing...' : '🔍 Analyze with AI'}
              </ResponsiveButton>

              {/* Analysis Results */}
              {currentAnalysis && currentAnalysis.songId === song.id && (
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <ResponsiveText size="md" weight="medium">
                      Match for your voice:
                    </ResponsiveText>
                    <span className={`font-bold text-lg ${getMatchColor(currentAnalysis.matchPercentage)}`}>
                      {currentAnalysis.matchPercentage}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <ResponsiveText size="md" weight="medium">
                      Your Difficulty Level:
                    </ResponsiveText>
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getDifficultyColor(currentAnalysis.difficulty)}`}>
                      {currentAnalysis.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <ResponsiveText size="md" weight="medium">
                      Practice Time:
                    </ResponsiveText>
                    <span className="font-bold">
                      {formatTime(currentAnalysis.estimatedPracticeTime)}
                    </span>
                  </div>

                  {/* Modifications */}
                  {currentAnalysis.modifications.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <ResponsiveText size="sm" weight="medium" className="text-blue-900 mb-2">
                        🔧 Suggested Modifications:
                      </ResponsiveText>
                      <div className="space-y-1">
                        {currentAnalysis.modifications.slice(0, 2).map((mod, index) => (
                          <div key={index} className="text-sm text-blue-800">
                            • {mod.reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Challenges */}
                  {currentAnalysis.challenges.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <ResponsiveText size="sm" weight="medium" className="text-yellow-900 mb-2">
                        ⚠️ Challenges:
                      </ResponsiveText>
                      <div className="space-y-1">
                        {currentAnalysis.challenges.slice(0, 2).map((challenge, index) => (
                          <div key={index} className="text-sm text-yellow-800">
                            • {challenge}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Benefits */}
                  {currentAnalysis.benefits.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <ResponsiveText size="sm" weight="medium" className="text-green-900 mb-2">
                        💪 Benefits:
                      </ResponsiveText>
                      <div className="space-y-1">
                        {currentAnalysis.benefits.slice(0, 2).map((benefit, index) => (
                          <div key={index} className="text-sm text-green-800">
                            • {benefit}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Practice Plan */}
                  {practicePlan && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <ResponsiveText size="sm" font-medium className="text-purple-900 mb-2">
                        📋 Practice Plan Generated:
                      </ResponsiveText>
                      <div className="text-sm text-purple-800">
                        {practicePlan.totalTime} minutes • {practicePlan.steps.length} steps
                      </div>
                      <ResponsiveButton
                        onClick={() => onPracticePlanGenerated?.(practicePlan)}
                        variant="outline"
                        size={{ mobile: 'md', tablet: 'md', desktop: 'md' }}
                        className="mt-2"
                      >
                        View Plan
                      </ResponsiveButton>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ResponsiveCard>
        ))}
      </ResponsiveGrid>

      {/* Loading State */}
      {isAnalyzing && (
        <ResponsiveCard>
          <div className="text-center py-12">
            <div className="text-4xl mb-4 animate-pulse">🔍</div>
            <ResponsiveText size="lg" weight="medium" className="text-gray-600">
              AI is analyzing song characteristics and vocal requirements...
            </ResponsiveText>
            <div className="mt-4">
              <div className="w-16 h-16 border-4 border-teal-200 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </ResponsiveCard>
      )}
    </div>
  );
}