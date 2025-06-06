// @deno-types="https://deno.land/x/types/node/index.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface EmailRequest {
  to: string
  subject: string
  html: string
  text: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text }: EmailRequest = await req.json()

    // Validate email inputs
    if (!to || !subject || (!html && !text)) {
      throw new Error('Missing required email fields')
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      throw new Error('Invalid email address')
    }

    // For now, we'll use a simple email service or log for development
    // In production, you would integrate with services like:
    // - Resend (https://resend.com)
    // - SendGrid
    // - Mailgun
    // - Amazon SES
    
    console.log('📧 Email Request:', {
      to,
      subject,
      textPreview: text.substring(0, 100) + '...',
      timestamp: new Date().toISOString()
    })

    // Simulate email sending for development
    // Replace this with actual email service integration
    const mockEmailId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // In a real implementation, you would:
    // 1. Get API credentials from environment variables
    // 2. Call the email service API
    // 3. Handle rate limiting and retries
    // 4. Store email logs in database if needed

    /*
    Example with Resend:
    
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('Email service not configured')
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Track & Field <noreply@yourdomain.com>',
        to: [to],
        subject: subject,
        html: html,
        text: text,
      }),
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      throw new Error(`Email service error: ${emailResponse.status}`)
    }

    const result = await emailResponse.json()
    */

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: mockEmailId,
        message: 'Email sent successfully',
        // For development, include details
        dev: {
          to,
          subject,
          note: 'This is a mock email in development. Configure email service for production.'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Email function error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send email',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
}) 