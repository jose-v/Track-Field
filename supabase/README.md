# Supabase Functions

This directory contains Supabase Edge Functions for the Track & Field application.

## Email Function (`send-email`)

The `send-email` function handles sending emails via the Supabase infrastructure.

### Setup

1. **Deploy the function to Supabase:**
   ```bash
   npx supabase functions deploy send-email
   ```

2. **Configure environment variables:**
   In your Supabase dashboard, add the following environment variables for production email sending:
   
   - `RESEND_API_KEY` - API key from Resend.com (recommended)
   - Or configure with your preferred email service (SendGrid, Mailgun, etc.)

### Development

For development, the function will log email attempts to the console and return mock success responses. The frontend automatically falls back to opening the system email client if the Supabase function is not available.

### Production Email Services

To enable actual email sending in production, you can integrate with:

1. **Resend** (recommended) - Uncomment the Resend code in `send-email/index.ts`
2. **SendGrid** - Replace with SendGrid API
3. **Mailgun** - Replace with Mailgun API
4. **Amazon SES** - Replace with AWS SES API

### API Usage

The function expects a POST request with:
```json
{
  "to": "recipient@example.com",
  "subject": "Email subject",
  "html": "<p>HTML content</p>",
  "text": "Plain text content"
}
```

### Error Handling

The function includes proper error handling and CORS support. If the function fails, the frontend will gracefully fall back to opening the system email client with pre-filled content. 