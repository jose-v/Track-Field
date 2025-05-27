# Track & Field Assistant - Project Context

## Project Overview
- Main project directory: `/Volumes/MASTERIII/Track & Field/`
- Primary working directory: `web/`
- Frontend: React + Vite + TypeScript
- Database: Supabase (PostgreSQL)
- Supabase URL: `https://vdfqhhfirorqdjldmyzc.supabase.co`
- Project uses Chakra UI for components

## Database Schema

### Core Tables
- `profiles`: Core user data (id, email, name, role, etc.)
- `athletes`: Athlete-specific data (linked to profiles)
- `coaches`: Coach-specific data (linked to profiles)
- `teams`: Team information
- `coach_athletes`: Relationship between coaches and athletes

### Tracking Tables
- `athlete_sleep`: Sleep tracking data
- `athlete_performances`: Performance metrics and records
- `athlete_meets`: Meet participation and scheduling

## Current Architecture
- Authentication via Supabase Auth
- Data access through individual service files
- Chatbot integration with NLP for intent recognition
- Row-Level Security (RLS) used for data access control

## File Structure
- `web/src/components/`: UI components
- `web/src/services/`: Service layer with API calls
- `web/src/db/`: Database migrations and SQL files
- `web/src/lib/`: Utilities including Supabase client
- `web/src/contexts/`: React contexts for state management
- `web/src/hooks/`: Custom React hooks

## Supabase Integration
- Client initialized in `web/src/lib/supabase.ts`
- Auth flows in `web/src/services/authService.ts`
- Data queries in individual service files 

## Chatbot Implementation
- Main component: `web/src/components/ChatBot/TrackChatBot.tsx`
- Service logic: `web/src/services/chatbot.service.ts`
- Response utilities: `web/src/services/chatResponseUtils.ts`

## Data Access Project
- Creating unified data access layer for chatbot
- Goal: Access all athlete data including future schema additions
- Pattern: Adapter pattern with dynamic schema discovery
- Timeline: 14 days across 6 phases (see bot-milestones.html) 