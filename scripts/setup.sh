#!/bin/bash

# Track & Field App Setup Script
# This script helps set up the development environment

set -e

echo "🏃‍♂️ Track & Field App Setup"
echo "=========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install web dependencies
echo "📦 Installing web dependencies..."
cd web && npm install && cd ..

# Check if .env files exist
if [ ! -f ".env" ]; then
    echo "⚠️  Root .env file not found. Creating from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "📝 Please edit .env with your actual values"
    else
        echo "❌ .env.example not found. Please create .env manually."
    fi
fi

if [ ! -f "web/.env" ]; then
    echo "⚠️  Web .env file not found. Creating from template..."
    if [ -f "web/.env.example" ]; then
        cp web/.env.example web/.env
        echo "📝 Please edit web/.env with your actual values"
    else
        echo "❌ web/.env.example not found. Please create web/.env manually."
    fi
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. Installing..."
    npm install -g supabase
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env files with your Supabase credentials"
echo "2. Run 'npm run analyze-db' to check database connection"
echo "3. Run 'cd web && npm run dev' to start the development server"
echo ""
echo "For more information, see docs/DEVELOPMENT.md" 