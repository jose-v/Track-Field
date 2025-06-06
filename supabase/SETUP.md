# Supabase Setup Guide for Email Functionality

## Prerequisites

1. **Supabase CLI**: Install the Supabase CLI
   ```bash
   npm install -g supabase
   ```

2. **Supabase Account**: Make sure you have a Supabase project set up

## Step 1: Initialize Supabase (if not already done)

If you haven't initialized Supabase in your project:

```bash
supabase init
```

## Step 2: Deploy the Email Function

Deploy the send-email function to your Supabase project:

```bash
supabase functions deploy send-email
```

## Step 3: Set Environment Variables

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard
2. Navigate to **Settings** → **Edge Functions**
3. Add the following environment variables:

   - **RESEND_API_KEY**: Your Resend API key (get from https://resend.com)
   - Alternative email service keys if you prefer a different provider

### Option B: Using CLI

```bash
supabase secrets set RESEND_API_KEY=your_resend_api_key_here
```

## Step 4: Email Service Setup

### Using Resend (Recommended)

1. Sign up at https://resend.com
2. Get your API key from the dashboard
3. Verify your domain (for production) or use the development domain
4. Update the "from" address in `supabase/functions/send-email/index.ts`:
   ```typescript
   from: 'Track & Field <noreply@yourdomain.com>'
   ```

### Alternative Email Services

You can also use:
- **SendGrid**: Replace the Resend code with SendGrid API calls
- **Mailgun**: Replace with Mailgun API calls
- **Amazon SES**: Replace with AWS SES API calls

## Step 5: Test the Function

Test the function locally:

```bash
supabase functions serve send-email
```

Then test with curl:

```bash
curl -X POST 'http://localhost:54321/functions/v1/send-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<p>This is a test email</p>",
    "text": "This is a test email"
  }'
```

## Step 6: Update Frontend Configuration

Make sure your frontend has the correct Supabase URL and anon key in your `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development vs Production

### Development Mode
- The function currently logs emails to console and returns mock responses
- Frontend falls back to system email client if function fails
- No actual emails are sent unless you configure an email service

### Production Mode
1. Uncomment the email service code in `send-email/index.ts`
2. Configure your chosen email service API key
3. Update the "from" email address to your verified domain
4. Deploy the updated function

## Troubleshooting

### Function Not Found Error
```bash
# Redeploy the function
supabase functions deploy send-email
```

### CORS Errors
- Make sure the CORS headers are properly configured in the function
- Check that your frontend URL is allowed in Supabase settings

### Email Service Errors
- Verify your API key is correct
- Check that your domain is verified (for production)
- Review the function logs in Supabase dashboard

### Rate Limiting
- Most email services have rate limits
- Implement exponential backoff for retries
- Consider queuing emails for high-volume usage

## Security Considerations

1. **Environment Variables**: Never commit API keys to your repository
2. **RLS Policies**: Consider implementing Row Level Security if storing email logs
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Validation**: Always validate email addresses and content
5. **Spam Prevention**: Consider implementing CAPTCHA for public forms

## Email Service Comparison

| Service | Free Tier | Pricing | Features |
|---------|-----------|---------|----------|
| Resend | 100 emails/day | $20/month for 50k emails | Developer-friendly, good deliverability |
| SendGrid | 100 emails/day | $19.95/month for 50k emails | Enterprise features, analytics |
| Mailgun | 100 emails/day | $35/month for 50k emails | Advanced validation, webhooks |
| Amazon SES | 200 emails/day (if in EC2) | $0.10 per 1k emails | Cost-effective, integrates with AWS |

## Next Steps

1. Choose and configure your email service
2. Test thoroughly in development
3. Set up proper monitoring and logging
4. Consider implementing email templates
5. Add email analytics if needed 