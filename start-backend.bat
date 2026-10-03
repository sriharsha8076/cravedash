@echo off
REM ─────────────────────────────────────────────────────────
REM  CraveDash — Start Backend (local profile, no TLS)
REM  Prerequisites: Java 17+, Redis/Valkey on localhost:6379
REM ─────────────────────────────────────────────────────────

echo.
echo  ========================================
echo    CraveDash Backend (Local Profile)
echo  ========================================
echo.

REM Set Maven path
set MVN=%~dp0maven\apache-maven-3.9.6\bin\mvn.cmd

REM Check if Maven exists
if not exist "%MVN%" (
  echo  ERROR: Maven not found at %MVN%
  echo  Please ensure the maven folder is present in d:\AWS\
  pause
  exit /b 1
)

REM Check Java
java -version >nul 2>&1
if errorlevel 1 (
  echo  ERROR: Java not found. Please install JDK 17+.
  pause
  exit /b 1
)

echo  [1/2] Starting Spring Boot backend...
echo        URL: http://localhost:8080
echo        Profile: local (no TLS, plain Redis)
echo.

cd /d "%~dp0backend"

set SPRING_PROFILES_ACTIVE=local
set MEMORYDB_ENDPOINT=localhost
set MEMORYDB_PORT=6379
set MEMORYDB_USERNAME=
set MEMORYDB_PASSWORD=
set ALLOWED_ORIGIN=http://localhost:5173

"%MVN%" spring-boot:run -q

pause
