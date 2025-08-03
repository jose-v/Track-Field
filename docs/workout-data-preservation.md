# Workout Data Preservation System

## Overview

The Track & Field application now implements a comprehensive data preservation system that ensures workout data is never permanently lost. Instead of permanently deleting workouts, the system uses a **soft delete + archive** approach.

## How It Works

### 1. Soft Delete (Initial "Delete" Action)
When a user clicks "Delete" on a workout:
- The workout is marked as deleted with `deleted_at` and `deleted_by` timestamps
- The workout remains in the database but is hidden from normal views
- Users can restore the workout from the "Deleted Workouts" section

### 2. Archive (Final "Delete Forever" Action)
When a user clicks "Archive" on a deleted workout:
- All workout data is copied to history tables (`workout_history`, `exercise_results_history`, `athlete_workouts_history`)
- The workout and related data are removed from active tables
- Data is preserved for compliance, analytics, and potential recovery

## Database Schema

### History Tables
- `workout_history` - Stores complete workout data
- `exercise_results_history` - Stores exercise performance data
- `athlete_workouts_history` - Stores assignment data

### Key Features
- **Data Integrity**: All relationships and metadata are preserved
- **Audit Trail**: Tracks who archived the data and when
- **Recovery**: Admin function to restore archived workouts
- **Performance**: Indexed for efficient querying

## User Experience

### For Coaches/Athletes
1. **Delete Workout**: Moves to "Deleted Workouts" section (soft delete)
2. **Restore**: Brings workout back to active state
3. **Archive**: Moves to history tables (removes from view but preserves data)

### For Administrators
- Access to "Archived Workouts" view for data recovery
- Ability to restore archived workouts if needed
- Complete audit trail of all data movements

## Benefits

### Data Protection
- **No Data Loss**: Workout data is never permanently deleted
- **Compliance**: Meets data retention requirements
- **Recovery**: Ability to restore data if needed

### User Experience
- **Familiar Workflow**: Users still see "delete" functionality
- **Clear Messaging**: UI explains that data is preserved
- **Flexible**: Can restore from both deleted and archived states

### Technical Benefits
- **Performance**: Active tables remain clean and fast
- **Storage**: History tables can be optimized/compressed
- **Analytics**: Preserved data available for reporting

## Implementation Details

### API Changes
- `softDelete()` - Marks workout as deleted (existing)
- `archiveWorkout()` - Moves to history tables (new)
- `getArchivedWorkouts()` - Retrieves archived data (new)
- `restoreArchivedWorkout()` - Recovers from archive (new)

### Database Functions
- `restore_archived_workout()` - PostgreSQL function for recovery

### UI Components
- Updated delete confirmation dialogs
- New "Archive" button instead of "Delete Forever"
- Admin interface for archived data management

## Migration

### Required Steps
1. Run `create_workout_history_tables.sql` to create history tables
2. Deploy updated API with archive functionality
3. Update UI components to use new archive flow

### Backward Compatibility
- Existing soft delete functionality remains unchanged
- Users can still restore from deleted state
- Gradual migration to archive system

## Security & Permissions

### Row Level Security (RLS)
- Users can only see their own archived data
- Admin functions require appropriate permissions
- Audit trail tracks all data movements

### Data Access
- **Coaches**: Can archive their own workouts
- **Athletes**: Can archive their own workouts  
- **Admins**: Can view and restore all archived data

## Monitoring & Maintenance

### Recommended Practices
- Regular backup of history tables
- Monitor storage usage of history tables
- Consider data retention policies for very old archives
- Implement cleanup procedures for extremely old data if needed

### Performance Considerations
- History tables are indexed for efficient querying
- Consider partitioning for very large datasets
- Archive old history data to separate storage if needed

## Future Enhancements

### Potential Features
- Automated cleanup of very old archived data
- Enhanced analytics on archived workout patterns
- Bulk restore functionality for administrators
- Data export capabilities for compliance reporting

### Technical Improvements
- Compression for history tables
- Automated archiving of old soft-deleted items
- Enhanced search and filtering of archived data 