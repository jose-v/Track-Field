# Email Verification Setup Guide

## Supabase Configuration Required

To enable email verification for your Track & Field application, you need to configure the following settings in your Supabase dashboard:

### 1. Enable Email Confirmation

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Settings**
3. In the **User Management** section, ensure **"Require email confirmation"** is enabled
4. This setting ensures that users must verify their email before they can access protected routes

### 2. Configure Email Templates (Optional)

1. In the **Authentication** > **Settings** page
2. Scroll down to **Email Templates**
3. Customize the **"Confirm signup"** email template if desired
4. The default template will work, but you can brand it with your application's styling

### 3. Set Redirect URLs

1. In **Authentication** > **Settings**
2. Add your redirect URLs to the **Site URL** and **Redirect URLs** section:
   - Site URL: `http://localhost:5173` (for development)
   - Redirect URLs: 
     - `http://localhost:5173/email-verified`
     - `https://yourdomain.com/email-verified` (for production)

### 4. SMTP Configuration (Production)

For production, you should configure your own SMTP settings:

1. Go to **Authentication** > **Settings**
2. Scroll to **SMTP Settings**
3. Configure your email provider (e.g., SendGrid, Mailgun, etc.)
4. This ensures better deliverability and branding for verification emails

## Magic Link Security

The application now includes **enhanced magic link security** to prevent abuse:

### 🔒 Email Validation for Magic Links

- **Email Existence Check**: Before sending a magic link, the system verifies that the email exists in the database
- **Security Benefits**: 
  - Prevents magic links from being sent to non-existent accounts
  - Reduces email spam and potential abuse
  - Protects against email enumeration attacks
- **User Experience**: Users receive a generic message that doesn't reveal whether an email exists or not
- **Implementation**: The `signInWithMagicLink()` function in `authService.ts` validates emails using `checkEmailExists()`

### Error Handling

When a magic link is requested for a non-existent email:
- **Message**: "If an account with this email exists, you will receive a magic link shortly."
- **User Guidance**: The UI suggests signing up if they don't have an account
- **Logging**: Server-side logging tracks magic link requests for security monitoring

## Application Features Implemented

The application now includes:

✅ **Enhanced Signup Flow:**
- Shows specific toast message with user's email address
- Redirects to login page after successful signup

✅ **Email Verification Enforcement:**
- `PrivateRoute` component checks `user.email_confirmed_at`
- Unverified users are redirected to `/verify-email` page

✅ **Magic Link Validation:**
- Validates email exists before sending magic link
- Prevents abuse and protects user privacy
- Provides appropriate error handling and user guidance

✅ **Dedicated Verification Page (`/verify-email`):**
- Clear instructions for users
- Ability to resend verification emails
- Option to sign out and use different email
- Responsive design with proper footer spacing

✅ **Success Page (`/email-verified`):**
- Confirmation page after successful verification
- Direct link to dashboard
- Professional success messaging

✅ **Improved Toast Messages:**
- Includes user's email address in signup success message
- Longer display duration (10 seconds)
- Clear call-to-action

## Security Best Practices

1. **Email Enumeration Protection**: Error messages don't reveal whether an email exists
2. **Rate Limiting**: Consider implementing rate limiting for magic link requests (Supabase handles basic rate limiting)
3. **Monitoring**: Log magic link requests for security analysis
4. **User Education**: Provide clear guidance on when to use magic links vs. password authentication

## Testing

To test email verification:

1. **Sign up with a new email/password**
   - Verify the toast shows: "Sign-up successful! Please check your email (user@example.com) to verify your account before logging in."

2. **Check email verification flow**
   - Try to access protected routes before verification
   - Should be redirected to `/verify-email` page

3. **Test verification email**
   - Check your email for verification link
   - Click the link to verify
   - Should redirect to `/email-verified` success page

4. **Test resend functionality**
   - From `/verify-email` page, test the "Resend Verification Email" button
   - Should receive new verification email

5. **Test post-verification access**
   - After verification, should be able to access protected routes
   - Try signing in again - should work normally

## Development vs Production

**Development:**
- Uses Supabase's built-in SMTP (limited emails per hour)
- Redirect URL: `http://localhost:5173/email-verified`

**Production:**
- Should use custom SMTP configuration
- Redirect URL: `https://yourdomain.com/email-verified`
- Ensure all URLs are added to Supabase redirect settings 