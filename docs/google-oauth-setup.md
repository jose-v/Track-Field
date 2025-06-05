# Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication for the Track & Field application using Supabase.

## Prerequisites

1. A Supabase project
2. A Google Cloud Console project
3. Admin access to both platforms

## Step 1: Google Cloud Console Setup

### 1.1 Create OAuth 2.0 Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client IDs**
5. Select **Web application** as the application type
6. Configure the following:
   - **Name**: Track & Field App
   - **Authorized JavaScript origins**: 
     - `http://localhost:5173` (for development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**:
     - `https://your-supabase-project.supabase.co/auth/v1/callback`
     - Replace `your-supabase-project` with your actual Supabase project reference

### 1.2 Note Your Credentials

After creating the OAuth client, note down:
- **Client ID** (starts with something like `123456789-abc...googleusercontent.com`)
- **Client Secret**

## Step 2: Supabase Configuration

### 2.1 Enable Google Provider

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list and click to configure
5. Enable the Google provider
6. Enter your Google OAuth credentials:
   - **Client ID**: From Step 1.2
   - **Client Secret**: From Step 1.2
7. Click **Save**

### 2.2 Configure Redirect URLs

In the Supabase Auth settings:
1. Go to **Authentication** > **URL Configuration**
2. Add your site URLs:
   - **Site URL**: `http://localhost:5173` (development) or `https://yourdomain.com` (production)
   - **Redirect URLs**: Add both development and production URLs

## Step 3: Application Configuration

The application is already configured to handle Google OAuth. The key components are:

### 3.1 AuthContext (`src/contexts/AuthContext.tsx`)
- Contains `signInWithGoogle()` function
- Handles OAuth profile creation for new users
- Manages session state

### 3.2 Login Page (`src/pages/Login.tsx`)
- Includes "Sign in with Google" button
- Handles OAuth errors and loading states

### 3.3 Signup Page (`src/components/signup/RoleSelection.tsx`)
- Includes "Sign up with Google" button
- Creates athlete profiles by default for OAuth users

## Step 4: Testing

### 4.1 Development Testing

1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:5173/login`
3. Click "Sign in with Google"
4. Complete the Google OAuth flow
5. Verify you're redirected to the dashboard

### 4.2 Production Testing

1. Deploy your application
2. Update Google Cloud Console with production URLs
3. Update Supabase with production URLs
4. Test the complete flow

## Step 5: User Profile Handling

The application automatically handles OAuth users:

1. **New Users**: Creates a profile with role "athlete" by default
2. **Existing Users**: Uses existing profile data
3. **Name Extraction**: Pulls name from Google profile data
4. **Email Verification**: Google users are automatically verified

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Ensure all URLs in Google Cloud Console match exactly
   - Check for trailing slashes and protocol (http vs https)

2. **"OAuth client not found"**
   - Verify Client ID and Secret in Supabase
   - Ensure Google OAuth client is enabled

3. **"Access blocked"**
   - Check Google Cloud Console project status
   - Verify OAuth consent screen is configured

4. **Users not redirected after OAuth**
   - Check Supabase redirect URL configuration
   - Verify site URL is set correctly

### Debug Steps

1. Check browser console for errors
2. Verify Supabase logs in the dashboard
3. Test with different browsers/incognito mode
4. Ensure all URLs use HTTPS in production

## Security Considerations

1. **Client Secret**: Keep your Google Client Secret secure
2. **Redirect URLs**: Only add trusted domains
3. **Scopes**: The app only requests basic profile information
4. **Session Management**: Supabase handles secure session management

## Additional Features

### Role Selection for OAuth Users

OAuth users default to "athlete" role but can change it later:
1. Navigate to profile settings
2. Update role as needed
3. System will create appropriate role-specific data

### Profile Completion

OAuth users may need to complete their profiles:
1. Phone number
2. Additional role-specific information
3. Preferences and settings

## Support

For issues with this setup:
1. Check Supabase documentation
2. Review Google OAuth documentation
3. Check application logs and console errors 