# Coach-Athlete Invitation System

## Overview

The Track & Field application has a **secure, email-only** coach-athlete invitation system that operates through notifications and Supabase invitations. This system ensures privacy and security by requiring coaches to know an athlete's email address to invite them, and requiring explicit athlete approval before any coaching relationship is established.

## ✅ **Security Features** 

### **Email-Only Invitations**
- **No browsing athletes**: Coaches cannot browse or search through all athletes in the database
- **Email requirement**: Coaches must know the athlete's email address to send an invitation  
- **Privacy protection**: Athletes remain private until they choose to accept a coach's invitation

### **Approval-Based Relationships**
- **Pending by default**: All coach-athlete relationships start with `pending` status
- **Explicit approval required**: Athletes must explicitly approve or decline each invitation
- **Only approved athletes visible**: Coaches can only see athletes who have approved their requests
- **Notification system**: Athletes receive in-app notifications about coach requests

### **Supabase Integration**
- **Email invitations for new users**: Athletes not in the database receive Supabase invitation emails
- **Secure signup flow**: New users complete account creation through email verification
- **Metadata tracking**: Invitation context preserved through the signup process

## 📧 **Invitation Flow**

### **For Existing Athletes**
1. Coach enters athlete's email in the invitation modal
2. System checks if athlete exists in database
3. If exists: Creates pending coach_athletes relationship
4. Athlete receives in-app notification
5. Athlete can approve/decline in their notifications
6. Status updates to 'approved' or 'declined'
7. Coach can only see approved athletes

### **For New Athletes (Not in Database)**
1. Coach enters athlete's email in the invitation modal  
2. System detects athlete doesn't exist
3. **Supabase invitation email sent** with signup link
4. Email contains coach information in metadata
5. Athlete clicks email link → redirected to `/coach-invitation` page
6. Athlete creates account through standard signup flow
7. After signup: Automatically redirected to invitation acceptance page
8. Athlete can then approve/decline the coaching request
9. Coach-athlete relationship created with appropriate status

## 🎨 **UI/UX Features**

### **Email-Only Modal Design**
- **Dark theme**: Modal uses dark gray background with white text
- **Secure messaging**: Clear explanation of the invitation process
- **Email validation**: Real-time validation with error messaging
- **Process explanation**: Step-by-step breakdown of what happens next
- **Differentiated messaging**: Different success messages for existing vs new users

### **Invitation Landing Page (`/coach-invitation`)**
- **Responsive design**: Works on desktop and mobile
- **Clear branding**: Track & Field themed with appropriate icons
- **Multiple states**: Handles not logged in, pending invitations, and no invitations
- **Action buttons**: Accept/Decline with clear visual hierarchy

## 🔧 **Technical Implementation**

### **Database Schema**
```sql
-- Coach-athlete relationships with approval status
coach_athletes:
  - coach_id (UUID, FK to profiles)
  - athlete_id (UUID, FK to profiles)  
  - approval_status (ENUM: 'pending', 'approved', 'declined')
  - created_at (timestamp)
  - requested_at (timestamp)

-- In-app notifications
notifications:
  - user_id (UUID, FK to profiles)
  - title (text)
  - message (text)
  - type (text: 'coach_request', 'athlete_approval')
  - metadata (jsonb: {coach_id, athlete_id})
  - is_read (boolean)
  - created_at (timestamp)
```

### **Security Filters Applied**
- **useCoachAthletes hook**: Only returns `approval_status = 'approved'`
- **api.ts athletes.getByCoach()**: Filtered to approved relationships only
- **Meets functionality**: Only approved athletes can be assigned to meets
- **Chatbot service**: Only approved relationships for data queries
- **All coach-athlete queries**: Consistently filtered by approval_status

### **Supabase Auth Integration**
- **signUp() with metadata**: Coach information stored in user_metadata
- **Email templates**: Custom coach invitation email with branded content
- **Redirect handling**: `/coach-invitation` route processes signup confirmations
- **Token verification**: Secure handling of email confirmation tokens

## 📱 **User Experience Flow**

### **Coach Workflow**
1. Navigate to "Manage Athletes" page
2. Click "Invite Athlete" button
3. Enter athlete's email address
4. See clear explanation of invitation process
5. Click "Send Invitation"
6. Receive confirmation message (different for existing vs new users)
7. Wait for athlete approval
8. Approved athletes appear in athlete roster
9. Can then assign workouts and manage training

### **Existing Athlete Workflow**
1. Receive in-app notification
2. View notification details with coach information
3. Accept or decline invitation
4. If accepted: Coach gains access to manage training
5. If declined: Relationship marked as declined

### **New Athlete Workflow**
1. Receive invitation email from Supabase
2. Click email link to `/coach-invitation` page
3. See coach invitation details
4. Choose to "Create Account" or "Sign In"
5. Complete account creation process
6. Automatically return to invitation page
7. Accept or decline coaching invitation
8. Begin using the platform with coach relationship

## 🔒 **Privacy & Security Benefits**

### **Data Protection**
- Athletes cannot be discovered without email knowledge
- No public athlete directory or search functionality  
- Explicit consent required for all coach-athlete relationships
- Athletes control their visibility to coaches

### **Spam Prevention**
- Email validation prevents invalid addresses
- Duplicate invitation detection
- Rate limiting through UI feedback
- Clear status tracking prevents re-invitations

### **Audit Trail**
- All invitations timestamped (`requested_at`, `created_at`)
- Status changes tracked (`approval_status`)
- Notifications preserve interaction history
- Coach identity preserved in metadata

## 🛠 **Component Architecture**

### **AddAthleteModal.tsx**
- **Email-only input**: Single field for athlete email
- **Dark theme styling**: White text on dark background
- **Validation logic**: Email format and duplicate checking
- **Supabase integration**: Handles both existing and new user flows
- **Error handling**: Comprehensive error states and messaging

### **CoachInvitation.tsx**
- **Token processing**: Handles Supabase signup confirmation tokens
- **Multi-state UI**: Not logged in, pending invitation, no invitations
- **Responsive design**: Mobile-friendly layout
- **Clear actions**: Accept/Decline with visual feedback

### **Enhanced Security Hooks**
- **useCoachAthletes**: Approval-filtered athlete lists
- **useMyMeets/useCoachMeets**: Approval-filtered for meet functionality
- **All relationship queries**: Consistently apply `approval_status = 'approved'`

This system provides enterprise-grade security while maintaining an excellent user experience for both coaches and athletes. 