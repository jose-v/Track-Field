# Meet File Upload and Modification Notification System

This document describes the comprehensive notification system that automatically alerts athletes when their coaches add files to meets or modify meet details they're assigned to.

## Overview

The notification system automatically alerts athletes when:
1. **New files are added** to meets they're assigned to
2. **Meet details are modified** for meets they're assigned to

## System Architecture

### Database Structure
Athletes are connected to meets through a three-table relationship:
- `track_meets` (the actual meets)
- `meet_events` (specific events within meets like "100m dash")
- `athlete_meet_events` (assignments linking athletes to specific events)

### Notification Flow
1. **Trigger Detection**: Database triggers detect file uploads or meet modifications
2. **Athlete Identification**: System finds all athletes assigned to any event within the affected meet
3. **Notification Creation**: Individual notifications are created for each assigned athlete
4. **Real-time Display**: Athletes see notifications in their notification bell and notifications page

## Components Added/Modified

### 1. Database Triggers (`create_meet_notification_triggers.sql`)

#### Functions Created:
- `get_meet_assigned_athletes(meet_id)` - Returns all athletes assigned to any event within a meet
- `get_meet_name(meet_id)` - Gets the meet name for notifications
- `notify_meet_file_upload()` - Trigger function for file uploads
- `notify_meet_modification()` - Trigger function for meet modifications

#### Triggers Created:
- `trigger_meet_file_upload_notification` - Fires on `INSERT` to `meet_files` table
- `trigger_meet_modification_notification` - Fires on `UPDATE` to `track_meets` table

### 2. Notification Service Updates (`src/services/notificationService.ts`)

#### New Functions:
- `createMeetFileAddedNotification()` - Single athlete file notification
- `createBulkMeetFileAddedNotifications()` - Multiple athletes file notification
- `createMeetModificationNotification()` - Single athlete meet update notification
- `createBulkMeetModificationNotifications()` - Multiple athletes meet update notification

### 3. UI Component Updates

#### NotificationsModal (`src/components/NotificationsModal.tsx`)
- Added `meet_file_added` to icon mapping (calendar icon)
- Added `meet_file_added` to color mapping (purple theme)

#### NotificationsTable (`src/components/NotificationsTable.tsx`)
- Added `meet_file_added` to badge color scheme
- Added "Meet File Added" display label

## Notification Types

### File Upload Notifications
- **Type**: `meet_file_added`
- **Title**: "New File Added to Meet"
- **Message**: "[Coach Name] added a new file '[File Name]' to [Meet Name]"
- **Color**: Purple
- **Icon**: Calendar

**Metadata Structure:**
```json
{
  "meet_id": "uuid",
  "meet_name": "string",
  "file_name": "string",
  "file_type": "string",
  "coach_id": "uuid",
  "sender_id": "uuid",
  "action": "file_added"
}
```

### Meet Modification Notifications
- **Type**: `meet_updated`
- **Title**: "Meet Information Updated"
- **Message**: "[Coach Name] updated details for [Meet Name]: [Change Description]"
- **Color**: Purple
- **Icon**: Calendar

**Metadata Structure:**
```json
{
  "meet_id": "uuid",
  "meet_name": "string",
  "coach_id": "uuid",
  "sender_id": "uuid",
  "action": "meet_updated",
  "change_description": "string"
}
```

## Triggering Conditions

### File Upload Triggers
Notifications are created when:
- A coach uploads any file (PDF, image, document, etc.) to a meet
- The file upload is successful in the `meet_files` table
- Athletes are assigned to any event within that meet

### Meet Modification Triggers
Notifications are created when any of these meet fields are modified:
- **Basic Info**: `name`, `meet_date`, `end_date`
- **Venue**: `venue_name`, `address`, `city`, `state`
- **Contact**: `contact_name`, `contact_email`, `contact_phone`
- **Registration**: `registration_deadline`, `entry_fee`
- **Logistics**: `transportation_info`, `lodging_details`, `lodging_email`, `lodging_phone`
- **Status**: `status` changes (Planned, Completed, Cancelled)

The system builds intelligent change descriptions:
- "Meet name updated" 
- "Meet date changed"
- "Venue/location updated"
- "Contact information updated"
- "Transportation details updated"
- "Lodging information updated"
- "Registration deadline changed"
- "Entry fee updated"
- "Meet status changed to [New Status]"

## Installation and Setup

### 1. Run Database Migration
```sql
-- Execute the SQL file to create triggers and functions
\i create_meet_notification_triggers.sql
```

### 2. Verify Installation
The SQL script will output success messages:
```
NOTICE: Meet notification triggers created successfully
NOTICE: - Trigger: notify athletes when files are added to meets
NOTICE: - Trigger: notify athletes when meet details are updated  
NOTICE: - Athletes are identified through athlete_meet_events assignments
```

### 3. Test Functionality
1. Create a meet with assigned athletes
2. Upload a file to the meet
3. Modify meet details
4. Verify athletes receive notifications

## Testing Scenarios

### File Upload Notifications
1. **Setup**: Create meet with 2-3 assigned athletes
2. **Action**: Coach uploads a PDF file
3. **Expected**: All assigned athletes get "New File Added to Meet" notification
4. **Verify**: Notification includes correct file name and meet name

### Meet Modification Notifications  
1. **Setup**: Create meet with assigned athletes
2. **Action**: Coach changes meet date
3. **Expected**: All assigned athletes get "Meet Information Updated" notification
4. **Verify**: Message includes "Meet date changed" in description

### Multiple Changes
1. **Setup**: Meet with assigned athletes
2. **Action**: Coach updates venue name, contact email, and lodging details
3. **Expected**: Single notification with combined change description
4. **Verify**: "Venue/location updated. Contact information updated. Lodging information updated."

### No Athletes Scenario
1. **Setup**: Create meet with no athlete assignments
2. **Action**: Upload file or modify meet
3. **Expected**: No notifications created (no assigned athletes)

## Error Handling

### Robust Design
- **Graceful Failures**: Notification failures don't prevent file uploads or meet modifications
- **Fallback Names**: Uses "Your Coach" if coach name can't be retrieved
- **Empty Results**: Handles meets with no assigned athletes gracefully
- **Database Errors**: Logs errors but doesn't interrupt core functionality

### Monitoring
All notification operations are logged for debugging:
```sql
-- Check recent notifications
SELECT * FROM notifications 
WHERE type IN ('meet_file_added', 'meet_updated') 
ORDER BY created_at DESC;

-- Check for failed notifications (manual verification needed)
-- Look for missing notifications when files/meets are modified
```

## Performance Considerations

### Efficient Queries
- **Indexed Lookups**: Uses existing indexes on `meet_events.meet_id` and `athlete_meet_events.meet_event_id`
- **Bulk Operations**: Creates multiple notifications in single database operations
- **Minimal Joins**: Uses efficient queries to find assigned athletes

### Scalability
- **Meeting Size**: System scales well with large meets (100+ athletes)
- **File Volume**: No performance impact from multiple file uploads
- **Modification Frequency**: Optimized for frequent meet updates

## Future Enhancements

### Potential Improvements
1. **Notification Preferences**: Allow athletes to customize notification types
2. **Digest Notifications**: Daily/weekly summaries instead of immediate notifications
3. **Email Integration**: Send email notifications for important updates
4. **Push Notifications**: Mobile app push notifications
5. **File Type Filtering**: Different notifications for different file types
6. **Real-time Updates**: WebSocket integration for instant notifications

### Advanced Features
1. **Notification History**: Track notification delivery and read status
2. **Escalation**: Remind athletes of unread important notifications
3. **Analytics**: Track notification engagement and effectiveness
4. **Batch Operations**: Smart grouping of related notifications

## Troubleshooting

### Common Issues

#### No Notifications Appearing
1. **Check Assignments**: Verify athletes are assigned to meet events
2. **Check Triggers**: Ensure database triggers are installed
3. **Check Permissions**: Verify RLS policies allow notification creation

```sql
-- Debug: Check if athletes are assigned to meet
SELECT 
  ame.athlete_id,
  me.meet_id,
  tm.name as meet_name
FROM athlete_meet_events ame
JOIN meet_events me ON ame.meet_event_id = me.id  
JOIN track_meets tm ON me.meet_id = tm.id
WHERE tm.id = 'your-meet-id';
```

#### Duplicate Notifications
1. **Check Trigger Logic**: Ensure triggers aren't firing multiple times
2. **Check Client Code**: Verify no duplicate service calls

#### Missing Change Descriptions
1. **Check Field Mapping**: Ensure all important fields are monitored
2. **Check Update Logic**: Verify trigger detects field changes properly

### Debug Queries

```sql
-- Check recent meet notifications
SELECT 
  n.*,
  p.first_name || ' ' || p.last_name as athlete_name
FROM notifications n
JOIN profiles p ON n.user_id = p.id
WHERE n.type IN ('meet_file_added', 'meet_updated')
ORDER BY n.created_at DESC
LIMIT 20;

-- Check meet file uploads
SELECT 
  mf.*,
  tm.name as meet_name
FROM meet_files mf
JOIN track_meets tm ON mf.meet_id = tm.id
ORDER BY mf.uploaded_at DESC
LIMIT 10;

-- Check function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('get_meet_assigned_athletes', 'notify_meet_file_upload');
```

## Security Considerations

### Access Control
- **RLS Policies**: Notifications respect Row Level Security
- **Coach Verification**: Only authenticated coaches can trigger notifications
- **Athlete Privacy**: Athletes only see their own notifications

### Data Protection
- **Metadata Security**: Sensitive information is not stored in notification metadata
- **File References**: Only file names (not content) included in notifications
- **Coach Information**: Only coach names (not sensitive data) included

This comprehensive notification system ensures athletes stay informed about important meet updates while maintaining security and performance standards. 