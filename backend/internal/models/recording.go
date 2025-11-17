package models

import "time"

type Recording struct {
	ID               string    `json:"id" db:"id"`
	UserID           string    `json:"user_id" db:"user_id"`
	FilePath         string    `json:"file_path" db:"file_path"`
	OriginalFilename string    `json:"original_filename" db:"original_filename"`
	Duration         float64   `json:"duration" db:"duration"`
	FileSize         int64     `json:"file_size" db:"file_size"`
	PitchHz          *float64  `json:"pitch_hz,omitempty" db:"pitch_hz"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" db:"updated_at"`
}
