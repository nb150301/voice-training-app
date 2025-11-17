package api

import (
	"context"
	"net/http"
	"voice-training-app/internal/auth"
	"voice-training-app/internal/database"
	"voice-training-app/internal/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid request: " + err.Error(),
		})
		return
	}

	// Check if user exists
	var exists bool
	err := database.DB.QueryRow(context.Background(),
		"SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", req.Email).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Database error",
		})
		return
	}

	if exists {
		c.JSON(http.StatusConflict, models.APIResponse{
			Success: false,
			Error:   "Email already registered",
		})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to process password",
		})
		return
	}

	// Create user
	var user models.User
	err = database.DB.QueryRow(context.Background(),
		`INSERT INTO users (email, password_hash)
		 VALUES ($1, $2)
		 RETURNING id, email, created_at, updated_at, streak_count, total_xp, level`,
		req.Email, string(hashedPassword)).Scan(
		&user.ID, &user.Email, &user.CreatedAt, &user.UpdatedAt,
		&user.StreakCount, &user.TotalXP, &user.Level)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to create user",
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Data: gin.H{
			"user": user,
		},
	})
}

func Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid request: " + err.Error(),
		})
		return
	}

	// Get user by email
	var user models.User
	err := database.DB.QueryRow(context.Background(),
		`SELECT id, email, password_hash, created_at, updated_at, streak_count, total_xp, level
		 FROM users WHERE email = $1`, req.Email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt,
		&user.StreakCount, &user.TotalXP, &user.Level)

	if err != nil {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "Invalid email or password",
		})
		return
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "Invalid email or password",
		})
		return
	}

	// Generate JWT token
	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to generate token",
		})
		return
	}

	// Set httpOnly cookie
	c.SetCookie("token", token, 86400, "/", "", false, true)

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: gin.H{
			"token": token,
		},
	})
}

func Me(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "User not authenticated",
		})
		return
	}

	var user models.User
	err := database.DB.QueryRow(context.Background(),
		`SELECT id, email, created_at, updated_at, streak_count, total_xp, level
		 FROM users WHERE id = $1`, userID).Scan(
		&user.ID, &user.Email, &user.CreatedAt, &user.UpdatedAt,
		&user.StreakCount, &user.TotalXP, &user.Level)

	if err != nil {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Error:   "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: gin.H{
			"user": user,
		},
	})
}

func Logout(c *gin.Context) {
	c.SetCookie("token", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    nil,
	})
}
