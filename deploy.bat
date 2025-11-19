@echo off
REM Swim Academy Pro - Docker Deployment Script for Windows
REM This script helps you deploy the application with Docker

echo.
echo ========================================
echo  Swim Academy Pro - Deployment Helper
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed!
    echo Please download and install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [OK] Docker is installed
echo.

REM Check if Docker daemon is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker daemon is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [OK] Docker daemon is running
echo.

REM Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo [OK] .env file created - please edit with your configuration
    echo.
)

echo.
echo Choose deployment option:
echo.
echo 1) Start Production (docker-compose up -d)
echo 2) Start Development (docker-compose -f docker-compose.dev.yml up -d)
echo 3) View Logs (docker-compose logs -f)
echo 4) Stop Services (docker-compose down)
echo 5) Stop and Remove Data (docker-compose down -v)
echo 6) View Status (docker-compose ps)
echo 7) Build New Image (docker-compose build)
echo.

set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" (
    echo.
    echo Starting production services...
    docker-compose up -d
    echo.
    echo [OK] Services started!
    echo Web App: http://localhost:5000
    echo API: http://localhost:5000/api
    echo Health: http://localhost:5000/health
    echo.
    timeout /t 3
    docker-compose ps
) else if "%choice%"=="2" (
    echo.
    echo Starting development services...
    docker-compose -f docker-compose.dev.yml up -d
    echo.
    echo [OK] Development services started!
    echo Backend (Dev): http://localhost:5000
    echo Frontend: http://localhost:5173
    echo.
    timeout /t 3
    docker-compose -f docker-compose.dev.yml ps
) else if "%choice%"=="3" (
    echo.
    echo Showing logs (Ctrl+C to stop)...
    docker-compose logs -f
) else if "%choice%"=="4" (
    echo.
    echo Stopping services...
    docker-compose down
    echo [OK] Services stopped!
) else if "%choice%"=="5" (
    echo.
    echo Stopping services and removing data...
    docker-compose down -v
    echo [OK] Services stopped and data removed!
) else if "%choice%"=="6" (
    echo.
    docker-compose ps
) else if "%choice%"=="7" (
    echo.
    echo Building Docker image...
    docker-compose build
    echo [OK] Build completed!
) else (
    echo Invalid choice!
)

echo.
pause
