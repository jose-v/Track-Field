# Track Meets Implementation Guide

This guide provides instructions for implementing the Track Meets functionality for both coach and athlete portals.

## Overview

The Track Meets feature allows:
- Coaches to create, edit, and delete track meets
- Athletes to create, edit, and delete their own track meets
- Coaches to assign events to athletes
- Athletes to select a coach when creating events
- Athletes to select which events to participate in

## Database Setup

1. Run the migration script to create the necessary database tables:

```bash
cd web/src/db
node run-track-meets-migration.js
```

This creates the following tables:
- `track_meets`: Main table for storing track meet information
- `meet_events`: Individual events within a track meet
- `athlete_meet_events`: Assignments of athletes to events

## File Structure

```
web/src/
├── types/
│   └── trackMeets.ts    # Type definitions for Track Meets
├── pages/
│   ├── coach/
│   │   └── Events.tsx   # Coach's Track Meets management page
│   └── athlete/
│       └── Events.tsx   # Athlete's Track Meets page
└── db/
    ├── track_meets_migration.sql    # SQL migration file
    └── run-track-meets-migration.js # Script to run the migration
```

## Routes Configuration

Add the following routes to your application:

```jsx
// For coach portal
<Route path="/coach/events" element={<CoachEvents />} />

// For athlete portal
<Route path="/athlete/events" element={<AthleteEvents />} />
```

## Features

### For Coaches:
- View all track meets they've created
- Create new track meets with detailed information
- Edit existing track meets
- Delete track meets
- Add/edit events within a track meet
- Assign athletes to specific events

### For Athletes:
- View their own created track meets
- View track meets created by their coaches
- Create new track meets (optionally selecting a coach)
- Edit their own track meets
- Delete their own track meets
- Select which events to participate in

## Implementation Details

1. **Track Meets Database Tables:**
   - `track_meets` can be created by either coaches or athletes
   - When an athlete creates a meet, they can optionally assign a coach
   - RLS policies ensure proper access control

2. **Meet Events:**
   - Track meets can have multiple events (e.g., "200m", "400m")
   - Events can have specific days and times
   - Events can be linked to standard event types

3. **Athlete Assignments:**
   - Coaches can assign athletes to events
   - Athletes can select which events to participate in
   - Duplicate assignments are prevented

## Troubleshooting

- If you encounter issues with the database migration, check the Supabase dashboard for errors
- Ensure proper permissions are set in Supabase for the RLS policies
- If the pages aren't loading correctly, check the browser console for errors 