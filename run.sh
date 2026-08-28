#!/bin/bash
# FinPilot Replit Start Script
# This script starts both the backend and frontend servers

set -e

echo "=== FinPilot Production Start ==="

# Set environment variables from Replit's defaults
export PORT=${PORT:-8000}
export NEXT_PUBLIC_API_URL="http://localhost:8000"

# Start backend server
echo "Starting backend server..."
cd backend
uvicorn app.main:app --host 0.0.0.0 --port $PORT &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Start frontend server
echo "Starting frontend server..."
cd frontend
next start --host 0.0.0.0 --port 3000 &
FRONTEND_PID=$!
cd ..

echo "=== FinPilot Running ==="
echo "Backend:  http://localhost:$PORT"
echo "Frontend: http://localhost:3000"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
