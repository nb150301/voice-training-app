package api

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"
	"voice-training-app/internal/audio"
	"voice-training-app/internal/database"
	"voice-training-app/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	MaxUploadSize    = 50 * 1024 * 1024 // 50MB
	UploadDir        = "uploads/recordings"
	ProcessedDir     = "uploads/processed"
	AllowedMimeTypes = "audio/webm,audio/mp4,audio/wav,audio/mpeg"
)

// UploadRecording handles audio file uploads
func UploadRecording(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	// Parse multipart form
	if err := c.Request.ParseMultipartForm(MaxUploadSize); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "File too large or invalid form data",
		})
		return
	}

	// Get the file
	file, header, err := c.Request.FormFile("audio")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "No audio file provided",
		})
		return
	}
	defer file.Close()

	// Validate file size
	if header.Size > MaxUploadSize {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   fmt.Sprintf("File size exceeds maximum allowed size of %dMB", MaxUploadSize/(1024*1024)),
		})
		return
	}

	// Generate unique filename
	ext := filepath.Ext(header.Filename)
	if ext == "" {
		ext = ".webm" // Default extension
	}
	newFilename := fmt.Sprintf("%s-%d%s", uuid.New().String(), time.Now().Unix(), ext)
	filePath := filepath.Join(UploadDir, newFilename)

	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(UploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to create upload directory",
		})
		return
	}

	// Save file to disk
	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to save file",
		})
		return
	}
	defer dst.Close()

	written, err := io.Copy(dst, file)
	if err != nil {
		os.Remove(filePath) // Clean up on error
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to write file",
		})
		return
	}

	// Save recording metadata to database
	var recording models.Recording
	err = database.DB.QueryRow(context.Background(),
		`INSERT INTO recordings (user_id, file_path, original_filename, duration, file_size)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, user_id, file_path, original_filename, duration, file_size, pitch_hz, created_at, updated_at`,
		userID, filePath, header.Filename, 0.0, written).Scan(
		&recording.ID, &recording.UserID, &recording.FilePath, &recording.OriginalFilename,
		&recording.Duration, &recording.FileSize, &recording.PitchHz,
		&recording.CreatedAt, &recording.UpdatedAt)

	if err != nil {
		os.Remove(filePath) // Clean up on error
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to save recording metadata",
		})
		return
	}

	// Process audio asynchronously (transcode + pitch detection)
	go func() {
		wavPath, pitchHz, err := audio.ProcessAudioFile(filePath)
		if err != nil {
			log.Printf("Audio processing failed for recording %s: %v", recording.ID, err)
			return
		}

		// Update recording with pitch data
		_, err = database.DB.Exec(context.Background(),
			`UPDATE recordings SET pitch_hz = $1 WHERE id = $2`,
			pitchHz, recording.ID)

		if err != nil {
			log.Printf("Failed to update pitch for recording %s: %v", recording.ID, err)
		} else {
			log.Printf("Processed recording %s: WAV=%s, Pitch=%.2f Hz", recording.ID, wavPath, pitchHz)
		}
	}()

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Data: gin.H{
			"recording": recording,
		},
	})
}

// ListRecordings returns all recordings for the authenticated user
func ListRecordings(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	rows, err := database.DB.Query(context.Background(),
		`SELECT id, user_id, file_path, original_filename, duration, file_size, pitch_hz, created_at, updated_at
		 FROM recordings
		 WHERE user_id = $1
		 ORDER BY created_at DESC`,
		userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to fetch recordings",
		})
		return
	}
	defer rows.Close()

	recordings := []models.Recording{}
	for rows.Next() {
		var r models.Recording
		err := rows.Scan(&r.ID, &r.UserID, &r.FilePath, &r.OriginalFilename,
			&r.Duration, &r.FileSize, &r.PitchHz, &r.CreatedAt, &r.UpdatedAt)
		if err != nil {
			continue
		}
		recordings = append(recordings, r)
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: gin.H{
			"recordings": recordings,
		},
	})
}

// GetRecording returns a single recording by ID
func GetRecording(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	recordingID := c.Param("id")

	var recording models.Recording
	err := database.DB.QueryRow(context.Background(),
		`SELECT id, user_id, file_path, original_filename, duration, file_size, pitch_hz, created_at, updated_at
		 FROM recordings
		 WHERE id = $1 AND user_id = $2`,
		recordingID, userID).Scan(
		&recording.ID, &recording.UserID, &recording.FilePath, &recording.OriginalFilename,
		&recording.Duration, &recording.FileSize, &recording.PitchHz,
		&recording.CreatedAt, &recording.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Error:   "Recording not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: gin.H{
			"recording": recording,
		},
	})
}

// DeleteRecording deletes a recording
func DeleteRecording(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	recordingID := c.Param("id")

	// Get recording to delete file
	var filePath string
	err := database.DB.QueryRow(context.Background(),
		`SELECT file_path FROM recordings WHERE id = $1 AND user_id = $2`,
		recordingID, userID).Scan(&filePath)

	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Error:   "Recording not found",
		})
		return
	}

	// Delete from database
	_, err = database.DB.Exec(context.Background(),
		`DELETE FROM recordings WHERE id = $1 AND user_id = $2`,
		recordingID, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to delete recording",
		})
		return
	}

	// Delete file from disk
	os.Remove(filePath)

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    nil,
	})
}
