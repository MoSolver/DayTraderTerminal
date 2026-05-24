#!/bin/bash
# QUANT TERMINAL - Quick Start Script

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║         QUANT TERMINAL v1.0           ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Check Python
if ! command -v python3 &>/dev/null; then
  echo "ERROR: Python 3 not found. Install Python 3.9+"
  exit 1
fi

# Check Node
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js not found. Install Node 16+"
  exit 1
fi

echo "[1/4] Installing Python dependencies..."
pip install aiohttp yfinance beautifulsoup4 pandas numpy requests lxml -q

echo "[2/4] Installing Node dependencies..."
cd frontend && npm install --silent

echo "[3/4] Starting backend server on port 8080..."
cd ../backend && python3 server.py &
BACKEND_PID=$!
echo "      Backend PID: $BACKEND_PID"

sleep 2

echo "[4/4] Starting React frontend on port 3000..."
cd ../frontend && npm start &
FRONTEND_PID=$!

echo ""
echo "✓ Backend:  http://localhost:8080"
echo "✓ Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" INT
wait
