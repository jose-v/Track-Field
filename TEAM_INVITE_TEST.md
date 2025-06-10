# Team Invitation Feature Testing Guide

## What We've Implemented

### 1. Join Team Functionality
- **Page**: `/join-team` - A dedicated page for users to join teams using invite codes
- **Modal**: `JoinTeamModal` - Modal component for entering invite codes
- **Service**: Enhanced `teamService.ts` with `joinTeamByInviteCode()` function

### 2. Send Invitation Functionality  
- **Modal**: `SendTeamInviteModal` - Modal for team managers to send email invitations
- **Service**: `sendTeamInvitation()` function in `teamService.ts`
- **Integration**: Added to team manager's Teams page

### 3. Navigation Integration
- Added "Join Team" to athlete and coach navigation menus
- Added "Send Invitation" button to each team card in team manager dashboard

## Testing Steps

### Test 1: Create a Team (Team Manager)
1. Login as a team manager
2. Go to `/team-manager/teams`
3. Click "Create Team" 
4. Fill in team details and create
5. Note the 8-character invite code displayed on the team card

### Test 2: Join Team via Code (Athlete/Coach)
1. Login as an athlete or coach
2. Navigate to `/join-team` OR click "Join Team" in the sidebar
3. Click "Join Team with Code" 
4. Enter the invite code from Test 1
5. Verify success message and team membership

### Test 3: Send Email Invitation (Team Manager)
1. On the Teams page, click "Send Invitation" on a team card
2. Enter an email address
3. Select role (athlete/coach)
4. Optionally add a personal message
5. Click "Send Invitation"
6. Verify success message

### Test 4: Navigation Flow
1. Verify "Join Team" appears in athlete sidebar navigation
2. Verify "Join Team" appears in coach sidebar navigation  
3. Verify team managers do NOT see join team (since they create teams)
4. Test the warning message for team managers on the join team page

## Database Integration

### Teams Table
- Uses existing `invite_code` column
- Integrates with existing team creation flow

### Team Membership
- **Athletes**: Updates `athletes.team_id` field
- **Coaches**: Creates entry in `team_coaches` table with role 'assistant_coach'

### Team Invitations Table
- Creates record in `team_invitations` for tracking email invites
- Status tracking (pending, accepted, declined, expired)

## Features Included

### Security & Validation
- Role-based restrictions (team managers can't join teams)
- Email validation for invitations
- Duplicate membership checking
- Unique invite code validation

### User Experience
- Role-specific messaging and benefits
- Dark mode support
- Loading states and error handling
- Success confirmations
- Copy invite code functionality

### Integration Points
- Supabase database integration
- Row Level Security (RLS) compliance
- Real-time updates
- Navigation integration across all role dashboards

## Next Steps (Future Enhancements)

1. **Email Service**: Integrate actual email sending (currently creates database records)
2. **Team Management**: Full team member management interface
3. **Notifications**: In-app notifications for invitations
4. **Team Discovery**: Browse public teams feature
5. **Bulk Invitations**: Send multiple invitations at once

## Files Modified/Created

### New Files
- `src/pages/JoinTeam.tsx` - Main join team page
- `src/components/JoinTeamModal.tsx` - Join team modal
- `src/components/SendTeamInviteModal.tsx` - Send invitation modal  
- `src/hooks/useUserRole.ts` - Hook for getting user role

### Modified Files
- `src/services/teamService.ts` - Added invitation functions
- `src/routes/AppRoutes.tsx` - Added join team route
- `src/pages/team-manager/Teams.tsx` - Added send invitation functionality
- `src/components/layout/AthleteNavigation.tsx` - Added join team nav
- `src/components/layout/CoachNavigation.tsx` - Added join team nav

The team invitation system is now fully functional and integrated across the application! 