package models

import "time"

type User struct {
	ID               string    `json:"id"`
	Email            string    `json:"email"`
	PasswordHash     string    `json:"-"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
	StreakCount      int       `json:"streak_count"`
	LastPracticeDate *string   `json:"last_practice_date,omitempty"`
	TotalXP          int       `json:"total_xp"`
	Level            int       `json:"level"`
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}
