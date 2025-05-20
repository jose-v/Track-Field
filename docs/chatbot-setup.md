# Track & Field AI Chatbot Setup Guide

This guide will help you set up the AI chatbot for the Track & Field application. The chatbot uses OpenAI's ChatGPT API through a Supabase Edge Function to provide personalized responses about training, schedules, and performance metrics.

## Prerequisites

- Supabase Project
- OpenAI API Key

## Setup Steps

### 1. Deploy the Edge Function to Supabase

The chatbot uses a Supabase Edge Function to securely communicate with OpenAI's API. To deploy this function:

```bash
# Navigate to your project directory
cd /path/to/track-and-field

# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (replace 'your-project-ref' with your actual project reference)
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy chatgpt --project-ref your-project-ref
```

### 2. Set the OpenAI API Key in Supabase

You need to configure your OpenAI API key as a secret in Supabase:

```bash
# Replace 'your-openai-api-key' with your actual API key
supabase secrets set OPENAI_API_KEY=your-openai-api-key --project-ref your-project-ref
```

### 3. Verify the Setup

To verify that the chatbot is working correctly:

1. Open the Track & Field application
2. Click on the chat icon in the bottom right corner
3. Ask a question like "When is my next meet?"
4. You should receive a response from the AI assistant

## Customization

### Modifying System Prompts

To change how the AI assistant responds, you can modify the system prompt in the Edge Function. Edit the file at `supabase/functions/chatgpt/index.ts`:

```typescript
messages: [
  { role: "system", content: "You are a Track & Field assistant helping athletes." },
  { role: "user", content: prompt }
]
```

### Adjusting Response Parameters

You can adjust the AI response parameters in `src/services/chatbot.service.ts`:

```typescript
const { data, error } = await supabase.functions.invoke('chatgpt', {
  body: {
    prompt,
    model: 'gpt-4',         // Change to 'gpt-3.5-turbo' for lower cost
    max_tokens: 150,        // Increase for longer responses
    temperature: 0.7,       // Lower for more deterministic responses
  },
});
```

## Troubleshooting

### Edge Function Not Working

If the Edge Function isn't working:

1. Check the Supabase dashboard for function logs
2. Verify that the OPENAI_API_KEY is set correctly
3. Ensure your API key has the necessary permissions in OpenAI

### Rate Limiting

If you encounter rate limiting:

1. Consider upgrading your OpenAI plan
2. Implement caching for common queries
3. Adjust the max_tokens to use fewer tokens per request

## Security Considerations

- The Edge Function securely handles the API key without exposing it to clients
- User queries are processed server-side for better security
- CORS is configured to restrict access to authorized domains

For any issues or questions, please contact the development team. 