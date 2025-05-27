#!/bin/bash
# Setup script for gamification test environment

# Export Supabase environment variables
export VITE_SUPABASE_URL="your_supabase_url"
export VITE_SUPABASE_ANON_KEY="your_supabase_anon_key"

# Run the development server
echo "Starting development server with gamification test environment..."
npm run dev 