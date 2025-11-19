#!/bin/bash

# Swim Academy Pro - Docker Deployment Script
# This script helps you deploy the application with Docker on Linux/Mac

set -e

echo ""
echo "========================================"
echo "  Swim Academy Pro - Deployment Helper"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR] Docker is not installed!${NC}"
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

echo -e "${GREEN}[OK] Docker is installed${NC}"

# Check if Docker daemon is running
if ! docker ps &> /dev/null; then
    echo -e "${RED}[ERROR] Docker daemon is not running!${NC}"
    echo "Please start Docker and try again."
    exit 1
fi

echo -e "${GREEN}[OK] Docker daemon is running${NC}"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo -e "${GREEN}[OK] .env file created - please edit with your configuration${NC}"
    echo ""
fi

echo "Choose deployment option:"
echo ""
echo "1) Start Production (docker-compose up -d)"
echo "2) Start Development (docker-compose -f docker-compose.dev.yml up -d)"
echo "3) View Logs (docker-compose logs -f)"
echo "4) Stop Services (docker-compose down)"
echo "5) Stop and Remove Data (docker-compose down -v)"
echo "6) View Status (docker-compose ps)"
echo "7) Build New Image (docker-compose build)"
echo ""

read -p "Enter your choice (1-7): " choice

case $choice in
    1)
        echo ""
        echo "Starting production services..."
        docker-compose up -d
        echo ""
        echo -e "${GREEN}[OK] Services started!${NC}"
        echo "Web App: http://localhost:5000"
        echo "API: http://localhost:5000/api"
        echo "Health: http://localhost:5000/health"
        echo ""
        sleep 3
        docker-compose ps
        ;;
    2)
        echo ""
        echo "Starting development services..."
        docker-compose -f docker-compose.dev.yml up -d
        echo ""
        echo -e "${GREEN}[OK] Development services started!${NC}"
        echo "Backend (Dev): http://localhost:5000"
        echo "Frontend: http://localhost:5173"
        echo ""
        sleep 3
        docker-compose -f docker-compose.dev.yml ps
        ;;
    3)
        echo ""
        echo "Showing logs (Ctrl+C to stop)..."
        docker-compose logs -f
        ;;
    4)
        echo ""
        echo "Stopping services..."
        docker-compose down
        echo -e "${GREEN}[OK] Services stopped!${NC}"
        ;;
    5)
        echo ""
        echo "Stopping services and removing data..."
        docker-compose down -v
        echo -e "${GREEN}[OK] Services stopped and data removed!${NC}"
        ;;
    6)
        echo ""
        docker-compose ps
        ;;
    7)
        echo ""
        echo "Building Docker image..."
        docker-compose build
        echo -e "${GREEN}[OK] Build completed!${NC}"
        ;;
    *)
        echo -e "${RED}Invalid choice!${NC}"
        exit 1
        ;;
esac

echo ""
