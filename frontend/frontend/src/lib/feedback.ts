import { PitchStats } from '../components/PitchStatistics';

export interface Feedback {
  assessment: string;
  score: number; // 0-100
  strengths: string[];
  improvements: string[];
  exercises: string[];
  nextGoal: string;
  motivationalMessage: string;
  tips: string[];
}

/**
 * Generate personalized feedback based on pitch statistics
 */
export function generateFeedback(stats: PitchStats): Feedback {
  if (stats.recordingsWithPitch === 0) {
    return {
      assessment: "Get Started!",
      score: 0,
      strengths: ["Ready to begin your voice training journey"],
      improvements: ["Record your first audio sample"],
      exercises: ["Press 'Start Recording' to begin"],
      nextGoal: "Complete your first recording",
      motivationalMessage: "Great things come from small beginnings. Start with just one recording!",
      tips: ["Find a quiet space", "Speak naturally", "Start with simple vowels"]
    };
  }

  // Calculate base score
  let score = 50; // Base score

  // Consistency scoring (40% of total)
  const range = stats.pitchRange || 0;
  if (range < 20) score += 30; // Excellent
  else if (range < 40) score += 20; // Good
  else if (range < 60) score += 10; // Fair

  // Volume of recordings (20% of total)
  if (stats.recordingsWithPitch >= 10) score += 10;
  else if (stats.recordingsWithPitch >= 5) score += 5;

  // Voice type stability (20% of total)
  if (stats.recordingsWithPitch >= 3) {
    // Check if most recordings fall into same voice category
    score += 10;
  }

  // Pitch level appropriateness (20% of total)
  if (stats.avgPitch && stats.avgPitch >= 82 && stats.avgPitch <= 261) {
    score += 10; // Within male voice range
  }

  score = Math.min(100, Math.max(0, score));

  // Generate assessment based on score
  let assessment: string;
  let motivationalMessage: string;

  if (score >= 90) {
    assessment = "Excellent! Professional Voice Quality";
    motivationalMessage = "Outstanding work! Your voice shows remarkable consistency and control. You're developing professional-level vocal skills.";
  } else if (score >= 80) {
    assessment = "Very Good! Strong Foundation";
    motivationalMessage = "Impressive progress! Your voice demonstrates good control and consistency. Keep up the excellent work.";
  } else if (score >= 70) {
    assessment = "Good! Solid Progress";
    motivationalMessage = "Great job! You're building strong vocal foundations. Your dedication is showing real results.";
  } else if (score >= 60) {
    assessment = "Making Progress!";
    motivationalMessage = "You're on the right track! Every recording brings you closer to your goals.";
  } else if (score >= 50) {
    assessment = "Developing Consistency";
    motivationalMessage = "Rome wasn't built in a day! Your voice is finding its natural range and stability.";
  } else {
    assessment = "Building Foundation";
    motivationalMessage = "Every expert was once a beginner! Your journey has just begun.";
  }

  // Generate strengths
  const strengths: string[] = [];

  if (range < 30) {
    strengths.push("Excellent pitch stability");
  }
  if (stats.avgPitch && stats.avgPitch >= 98 && stats.avgPitch <= 196) {
    strengths.push("Strong baritone range");
  }
  if (stats.avgPitch && stats.avgPitch >= 130 && stats.avgPitch <= 261) {
    strengths.push("Clear tenor qualities");
  }
  if (stats.avgPitch && stats.avgPitch >= 82 && stats.avgPitch < 98) {
    strengths.push("Rich bass tones");
  }
  if (stats.recordingsWithPitch >= 5) {
    strengths.push("Consistent practice routine");
  }
  if (stats.recordingsWithPitch >= 10) {
    strengths.push("Dedicated training commitment");
  }

  if (strengths.length === 0) {
    strengths.push("Starting your voice training journey");
  }

  // Generate improvements
  const improvements: string[] = [];

  if (range > 40) {
    improvements.push("Work on pitch consistency");
  }
  if (!stats.avgPitch || stats.avgPitch < 82) {
    improvements.push("Develop lower register strength");
  }
  if (stats.avgPitch && stats.avgPitch > 261) {
    improvements.push("Explore deeper resonance");
  }
  if (stats.recordingsWithPitch < 3) {
    improvements.push("Increase recording frequency");
  }

  if (improvements.length === 0) {
    improvements.push("Continue current practice routine");
  }

  // Generate exercises
  const exercises: string[] = [];

  if (range > 40) {
    exercises.push("Humming exercises for pitch control", "Vowel sustain practice", "Lip trills for stability");
  }
  if (stats.avgPitch && stats.avgPitch < 100) {
    exercises.push("Lower register expansion", "Chest voice development", "Breathing support exercises");
  }
  if (stats.avgPitch && stats.avgPitch > 200) {
    exercises.push("Head voice exploration", "Resonance placement practice");
  }
  if (stats.recordingsWithPitch < 5) {
    exercises.push("Daily 5-minute recording sessions", "Morning warm-up recordings");
  }

  if (exercises.length === 0) {
    exercises.push("Maintain current practice", "Explore different vocal exercises", "Record in different times of day");
  }

  // Generate next goal
  let nextGoal: string;

  if (range > 50) {
    nextGoal = "Reduce pitch range to under 40 Hz";
  } else if (range > 30) {
    nextGoal = "Achieve pitch range under 20 Hz";
  } else if (stats.recordingsWithPitch < 10) {
    nextGoal = "Record 10 sessions to build data";
  } else if (score < 80) {
    nextGoal = "Improve consistency by 10 points";
  } else {
    nextGoal = "Maintain excellent performance";
  }

  // Generate tips
  const tips: string[] = [
    "Record at the same time daily for consistency",
    "Stay hydrated - drink water before recording",
    "Warm up your voice with simple scales",
    "Record in a quiet environment with minimal echo",
    "Stand or sit with good posture",
    "Relax your jaw and shoulders",
    "Use diaphragmatic breathing",
    "Start with your natural speaking voice"
  ];

  return {
    assessment,
    score,
    strengths,
    improvements,
    exercises,
    nextGoal,
    motivationalMessage,
    tips: tips.slice(0, 4) // Return first 4 tips
  };
}

/**
 * Get score color based on score value
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 70) return 'text-indigo-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-orange-600';
}

/**
 * Get score background color
 */
export function getScoreBgColor(score: number): string {
  if (score >= 90) return 'bg-green-100';
  if (score >= 80) return 'bg-blue-100';
  if (score >= 70) return 'bg-indigo-100';
  if (score >= 60) return 'bg-yellow-100';
  return 'bg-orange-100';
}

/**
 * Get score icon
 */
export function getScoreIcon(score: number): string {
  if (score >= 90) return '🏆';
  if (score >= 80) return '⭐';
  if (score >= 70) return '🎯';
  if (score >= 60) return '📈';
  return '🚀';
}