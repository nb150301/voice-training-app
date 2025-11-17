.PHONY: help dev migrate test clean docker-up docker-down backend frontend

help:
	@echo "Available commands:"
	@echo "  make dev         - Start all services (Docker + Backend + Frontend)"
	@echo "  make docker-up   - Start Docker services (PostgreSQL + Redis)"
	@echo "  make docker-down - Stop Docker services"
	@echo "  make migrate     - Run database migrations"
	@echo "  make backend     - Start Go backend server"
	@echo "  make frontend    - Start React frontend dev server"
	@echo "  make test        - Run all tests"
	@echo "  make clean       - Clean build artifacts"

docker-up:
	@echo "Starting Docker services..."
	docker-compose up -d
	@echo "Waiting for PostgreSQL to be ready..."
	@sleep 5

docker-down:
	@echo "Stopping Docker services..."
	docker-compose down

migrate: docker-up
	@echo "Running database migrations..."
	@PGPASSWORD=dev_password psql -h localhost -U dev -d voice_training -f backend/migrations/001_initial_schema.sql
	@echo "Migrations completed!"

backend:
	@echo "Starting Go backend server..."
	cd backend && go run cmd/server/main.go

frontend:
	@echo "Starting React frontend dev server..."
	cd frontend && npm run dev

test:
	@echo "Running backend tests..."
	cd backend && go test ./...
	@echo "Running frontend tests..."
	cd frontend && npm test

clean:
	@echo "Cleaning build artifacts..."
	rm -rf backend/tmp
	rm -rf frontend/dist
	rm -rf frontend/node_modules/.vite

dev:
	@echo "Starting development environment..."
	@echo "1. Starting Docker services..."
	@make docker-up
	@echo "2. Running migrations..."
	@make migrate
	@echo ""
	@echo "Development environment ready!"
	@echo ""
	@echo "To start the servers:"
	@echo "  Terminal 1: make backend"
	@echo "  Terminal 2: make frontend"
