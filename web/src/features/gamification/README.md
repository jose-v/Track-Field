# Gamification System

This directory contains the UI components for the Track & Field app's gamification system.

## Overview

The gamification system introduces a Points & Badges system with social visibility to drive user engagement. It rewards athletes for consistent usage of the app and achievements in their fitness journey.

## Components

The main components of the gamification system are:

- `PointsDisplay` - Shows an athlete's points, current level, and progress to the next level
- `BadgeList` - Displays badges earned by an athlete
- `StreakTracker` - Shows the current streak of consecutive activity days
- `Leaderboard` - Displays top athletes by points

## Implementation Status

Please refer to the implementation checklist in `docs/milestones.html` for current progress and next steps.

## File Structure

```
src/
  ├── config/
  │   ├── badges.ts       # Badge definitions
  │   └── levels.ts       # Level system configuration
  ├── features/
  │   └── gamification/   # UI components
  ├── hooks/
  │   └── gamification.ts # React hooks
  ├── services/
  │   └── gamificationService.ts # Service layer
  └── types/
      └── gamification.ts # TypeScript interfaces
```

## Database Schema

The gamification system uses the following tables:

- `points_ledger` - Records of points awarded to athletes
- `badges` - Catalog of available badges
- `athlete_badges` - Association of badges to athletes
- `athlete_streaks` - Tracking of activity streaks

## Integration Points

The gamification system integrates with the following parts of the application:

- Workout tracking
- Nutrition tracking
- Sleep tracking 