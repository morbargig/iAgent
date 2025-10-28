#!/bin/bash
# Start frontend with production API URL
export VITE_BASE_API_URL=https://iagent-1-jzyj.onrender.com
export VITE_API_URL=https://iagent-1-jzyj.onrender.com/api
npx nx serve frontend

