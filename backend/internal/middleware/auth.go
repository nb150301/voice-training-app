package middleware

import (
	"net/http"
	"strings"
	"voice-training-app/internal/auth"
	"voice-training-app/internal/models"

	"github.com/gin-gonic/gin"
)

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			// Try to get token from cookie
			token, err := c.Cookie("token")
			if err != nil || token == "" {
				c.JSON(http.StatusUnauthorized, models.APIResponse{
					Success: false,
					Error:   "Authorization required",
				})
				c.Abort()
				return
			}
			authHeader = "Bearer " + token
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Success: false,
				Error:   "Invalid authorization format",
			})
			c.Abort()
			return
		}

		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Success: false,
				Error:   "Invalid or expired token",
			})
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Next()
	}
}
