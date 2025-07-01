# Workout and Meet Assignment Notifications

This document describes the comprehensive notification system for workout and meet assignments that has been implemented in the Track & Field application.

## Overview

The notification system automatically alerts athletes when:
1. **New workouts are assigned** by their coach
2. **New meet events are assigned** by their coach
3. **Existing workouts are updated** by their coach
4. **Existing meet assignments are modified** by their coach

## Components Added/Modified

### 1. Notification Service (`src/services/notificationService.ts`)
New service that handles creating notifications for workout and meet assignments:
- `createWorkoutAssignmentNotification()` - Single workout assignment
- `createBulkWorkoutAssignmentNotifications()` - Multiple athletes
- `createMeetAssignmentNotification()` - Single meet event assignment
- `createBulkMeetAssignmentNotifications()` - Multiple athletes
- `createWorkoutUpdateNotification()` - Workout changes
- `createMeetUpdateNotification()` - Meet assignment changes

### 2. API Integration (`src/services/api.ts`)
Updated the `athleteWorkouts.assign()` method to automatically create notifications when workouts are assigned to athletes.

### 3. Meet Assignment Integration
Updated multiple components to create notifications when meet events are assigned:
- `src/pages/coach/Meets.tsx` - Bulk assignment drawer
- `src/components/meets/CoachAthleteAssignmentDrawer.tsx` - Individual event assignments
- `src/components/meets/CoachAthleteEventManager.tsx` - Single athlete assignment

### 4. UI Components
Updated notification display components to handle new notification types:
- `src/components/NotificationsModal.tsx` - Bell icon popup
- `src/components/NotificationsTable.tsx` - Full notifications page

### 5. Database Triggers (`create_assignment_notification_triggers.sql`)
Optional database-level triggers that can create notifications automatically:
- Workout assignment trigger
- Meet event assignment trigger  
- Workout update trigger

## Notification Types

### Workout Notifications
- **Type**: `workout_assigned`
- **Title**: "New Workout Assigned"
- **Message**: "[Coach Name] assigned you a new workout: [Workout Name]"
- **Color**: Orange
- **Icon**: Calendar

- **Type**: `workout_updated`
- **Title**: "Workout Updated"
- **Message**: "[Coach Name] updated your workout [Workout Name]: [Change Description]"
- **Color**: Orange
- **Icon**: Calendar

### Meet Notifications
- **Type**: `meet_assigned`
- **Title**: "New Meet Event Assigned"
- **Message**: "[Coach Name] assigned you to compete in [Event Name] at [Meet Name]"
- **Color**: Purple
- **Icon**: Calendar

- **Type**: `meet_updated`
- **Title**: "Meet Assignment Updated"
- **Message**: "[Coach Name] updated your assignment for [Event Name] at [Meet Name]: [Change Description]"
- **Color**: Purple
- **Icon**: Calendar

## Implementation Details

### Client-Side Notifications
The primary implementation uses client-side notification creation when assignments are made through the UI. This approach:
- ✅ Works immediately without database changes
- ✅ Provides detailed error handling
- ✅ Includes proper coach/athlete name resolution
- ✅ Handles bulk assignments efficiently

### Database Triggers (Optional)
The SQL file provides database-level triggers as an additional layer:
- 🔄 Requires running SQL migration
- 🔄 Creates notifications for all assignment methods (including direct database inserts)
- 🔄 May need adjustment for specific database permissions

## Data Flow

### Workout Assignment Flow
1. Coach assigns workout(s) to athlete(s) via UI
2. `api.athleteWorkouts.assign()` creates database records
3. Notification service fetches coach and workout names
4. Bulk notification records are created
5. Athletes see notifications in bell icon and notifications page

### Meet Assignment Flow
1. Coach assigns athlete(s) to meet event(s) via UI
2. Assignment components create `athlete_meet_events` records
3. Notification service fetches coach, event, and meet names
4. Individual or bulk notification records are created
5. Athletes see notifications in their notification center

## Metadata Structure

Notifications include rich metadata for future enhancements:

### Workout Notifications
```json
{
  "workout_id": "uuid",
  "coach_id": "uuid", 
  "sender_id": "uuid",
  "action": "assigned|updated",
  "change_description": "string" // for updates
}
```

### Meet Notifications
```json
{
  "meet_event_id": "uuid",
  "event_name": "string",
  "meet_name": "string", 
  "coach_id": "uuid",
  "sender_id": "uuid",
  "action": "assigned|updated",
  "change_description": "string" // for updates
}
```

## Error Handling

The notification system is designed to be resilient:
- Notification failures do not prevent assignment operations
- Errors are logged but don't interrupt user workflows
- Fallback names are used if coach/workout/meet names can't be fetched
- Bulk operations handle partial failures gracefully

## Future Enhancements

Potential improvements to consider:
1. **Real-time notifications** using Supabase real-time subscriptions
2. **Email notifications** for important assignments
3. **Push notifications** for mobile app
4. **Notification preferences** allowing athletes to customize notification types
5. **Digest notifications** for daily/weekly summaries
6. **Read receipts** showing when athletes viewed assignments

## Testing

To test the notification system:
1. Create a coach account and athlete account
2. Establish coach-athlete relationship
3. As coach, assign workouts to athlete via Workouts page
4. As coach, assign meet events to athlete via Meets page
5. As athlete, check bell icon and notifications page
6. Verify notifications show appropriate details and coach information

## Troubleshooting

Common issues and solutions:
- **No notifications appearing**: Check coach-athlete relationship is approved
- **Missing coach names**: Verify coach profile has first_name/last_name
- **Generic workout names**: Ensure workouts have descriptive names
- **Console errors**: Check browser console for notification service errors 