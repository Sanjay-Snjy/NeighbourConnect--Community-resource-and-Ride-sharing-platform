#!/usr/bin/env bash
# Build script for Vercel (or any frontend host).
# This is a simple Vite build script for the React frontend.

set -o errexit

# Install dependencies (uncomment if needed)
# npm ci

# Build the React application for production
npm run build

# Optional: run linting
# npm run lint

# Optional: run tests
# npm run test

echo "Frontend build completed successfully"
echo "Output directory: dist/"