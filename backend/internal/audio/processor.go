package audio

import (
	"fmt"
	"math"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/mjibson/go-dsp/fft"
	"github.com/mjibson/go-dsp/wav"
)

const (
	SampleRate     = 44100 // 44.1 kHz
	MinPitchHz     = 50.0  // Minimum detectable pitch (very low bass)
	MaxPitchHz     = 500.0 // Maximum detectable pitch (high voice)
	FFTSize        = 8192  // FFT window size for pitch detection
	ProcessedDir   = "uploads/processed"
)

// TranscodeToWAV converts audio file to WAV format using ffmpeg
func TranscodeToWAV(inputPath string) (string, error) {
	// Create processed directory if not exists
	if err := os.MkdirAll(ProcessedDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create processed directory: %w", err)
	}

	// Generate output filename
	baseName := filepath.Base(inputPath)
	ext := filepath.Ext(baseName)
	wavName := baseName[:len(baseName)-len(ext)] + ".wav"
	outputPath := filepath.Join(ProcessedDir, wavName)

	// Run ffmpeg to transcode
	// -i input, -ar sample rate, -ac channels (mono), -y overwrite
	cmd := exec.Command("ffmpeg",
		"-i", inputPath,
		"-ar", fmt.Sprintf("%d", SampleRate),
		"-ac", "1", // Mono
		"-y", // Overwrite
		outputPath,
	)

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("ffmpeg transcoding failed: %w", err)
	}

	return outputPath, nil
}

// DetectPitch analyzes WAV file and returns dominant pitch in Hz
func DetectPitch(wavPath string) (float64, error) {
	// Open WAV file
	file, err := os.Open(wavPath)
	if err != nil {
		return 0, fmt.Errorf("failed to open WAV file: %w", err)
	}
	defer file.Close()

	// Read WAV data
	wavData, err := wav.New(file)
	if err != nil {
		return 0, fmt.Errorf("failed to parse WAV file: %w", err)
	}

	// Read all audio samples
	rawSamples, err := wavData.ReadFloats(FFTSize * 2) // Read extra to ensure we have enough
	if err != nil {
		return 0, fmt.Errorf("failed to read WAV samples: %w", err)
	}

	// Convert to float64 samples
	samples := make([]float64, len(rawSamples))
	for i, s := range rawSamples {
		samples[i] = float64(s)
	}

	if len(samples) < FFTSize {
		// Pad with zeros if not enough samples
		for len(samples) < FFTSize {
			samples = append(samples, 0)
		}
	}

	// Apply Hamming window to reduce spectral leakage
	windowed := applyHammingWindow(samples[:FFTSize])

	// Perform FFT
	fftResult := fft.FFTReal(windowed)

	// Find dominant frequency
	maxMagnitude := 0.0
	maxIndex := 0

	// Only check frequencies in voice range
	minBin := int(math.Floor(MinPitchHz * FFTSize / SampleRate))
	maxBin := int(math.Ceil(MaxPitchHz * FFTSize / SampleRate))

	for i := minBin; i < maxBin && i < len(fftResult)/2; i++ {
		magnitude := math.Abs(real(fftResult[i])) + math.Abs(imag(fftResult[i]))
		if magnitude > maxMagnitude {
			maxMagnitude = magnitude
			maxIndex = i
		}
	}

	// Calculate pitch from bin index
	pitch := float64(maxIndex) * SampleRate / FFTSize

	return pitch, nil
}

// applyHammingWindow applies Hamming window function to reduce spectral leakage
func applyHammingWindow(samples []float64) []float64 {
	n := len(samples)
	windowed := make([]float64, n)

	for i := 0; i < n; i++ {
		// Hamming window: 0.54 - 0.46 * cos(2πi/(N-1))
		window := 0.54 - 0.46*math.Cos(2*math.Pi*float64(i)/float64(n-1))
		windowed[i] = samples[i] * window
	}

	return windowed
}

// ProcessAudioFile transcodes audio and detects pitch
func ProcessAudioFile(inputPath string) (wavPath string, pitchHz float64, err error) {
	// Transcode to WAV
	wavPath, err = TranscodeToWAV(inputPath)
	if err != nil {
		return "", 0, fmt.Errorf("transcoding failed: %w", err)
	}

	// Detect pitch
	pitchHz, err = DetectPitch(wavPath)
	if err != nil {
		return wavPath, 0, fmt.Errorf("pitch detection failed: %w", err)
	}

	return wavPath, pitchHz, nil
}
