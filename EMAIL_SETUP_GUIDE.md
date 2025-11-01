# Email Setup Guide - Welcome Emails for Pro Users

This guide explains how to configure automatic welcome emails when users upgrade to Pro.

## Overview

When a user completes payment and upgrades to Pro, the system automatically:
1. Activates their Pro subscription
2. Sends a welcome email with Pro features info
3. Logs the email delivery status

## Setup Instructions

### 1. Create Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get API Key

1. In Resend Dashboard, go to **API Keys**
2. Click **Create API Key**
3. Name it (e.g., "Quadrant Task Manager Production")
4. Copy the API key (starts with `re_`)

### 3. Add Domain (Optional but Recommended)

For production use, add your custom domain:

1. Go to **Domains** in Resend Dashboard
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records to your domain provider
5. Wait for verification (usually a few minutes)

**Note**: Without a custom domain, emails will be sent from `onboarding@resend.dev` (works for testing)

### 4. Configure Environment Variables

Add these variables to your `.env.local` file:

\`\`\`bash
# Resend API Key (required)
RESEND_API_KEY=re_your_api_key_here

# Email sender (optional, defaults to onboarding@resend.dev)
EMAIL_FROM=noreply@yourdomain.com

# App URL for email links (optional, defaults to current origin)
NEXT_PUBLIC_APP_URL=https://your-app-url.com
\`\`\`

**Example**:
\`\`\`bash
RESEND_API_KEY=re_AbCdEf123456_xyz789
EMAIL_FROM=hello@quadranttasks.com
NEXT_PUBLIC_APP_URL=https://quadranttasks.com
\`\`\`

### 5. Restart Your Development Server

\`\`\`bash
npm run dev
\`\`\`

## Testing Email Delivery

### Method 1: Use Test API

Send a test email to verify setup:

\`\`\`bash
curl "http://localhost:3000/api/test-email?to=your-email@example.com"
\`\`\`

Or visit in browser:
\`\`\`
http://localhost:3000/api/test-email?to=your-email@example.com
\`\`\`

**Expected Response**:
\`\`\`json
{
  "success": true,
  "message": "Test email sent successfully to your-email@example.com",
  "emailId": "abc123..."
}
\`\`\`

### Method 2: Complete a Test Payment

1. Go to your pricing page
2. Use Stripe test card: `4242 4242 4242 4242`
3. Complete the payment
4. Check your email inbox
5. Verify the welcome email arrived

### Method 3: Check Resend Dashboard

1. Go to Resend Dashboard → **Emails**
2. You should see the sent emails
3. Click on any email to see:
   - Delivery status
   - Email content
   - Recipient info
   - Logs

## Email Template Customization

The email template is located in `/lib/email.ts`. You can customize:

### Email Subject
\`\`\`typescript
subject: 'Your Custom Subject Here',
\`\`\`

### Email Content
Edit the `getWelcomeEmailHTML()` function to change:
- Header text
- Body content
- CTA button
- Feature list
- Footer text

### Example Customization
\`\`\`typescript
function getWelcomeEmailHTML(userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <!-- Your custom HTML here -->
    </html>
  `
}
\`\`\`

## Troubleshooting

### Email Not Sending

**Problem**: No email received after payment

**Solutions**:
1. Check environment variables are set correctly
2. Verify `RESEND_API_KEY` is valid
3. Check Resend Dashboard for error logs
4. Look at server logs for error messages

\`\`\`bash
# Check if env var is loaded
echo $RESEND_API_KEY

# Test API directly
curl "http://localhost:3000/api/test-email?to=your-email@example.com"
\`\`\`

### "From" Email Rejected

**Problem**: Emails fail with "unauthorized sender"

**Solutions**:
1. Use default `onboarding@resend.dev` for testing
2. For production, add and verify your domain in Resend
3. Make sure `EMAIL_FROM` matches your verified domain

### Email Goes to Spam

**Problem**: Emails end up in spam folder

**Solutions**:
1. Add your domain to Resend (not using shared domain)
2. Set up SPF, DKIM, and DMARC records
3. Avoid spam trigger words in content
4. Include unsubscribe link (already in template)

### Webhook Not Triggering Email

**Problem**: Payment succeeds but no email sent

**Check**:
1. Webhook logs in Stripe Dashboard
2. Server logs for error messages
3. User has email in database:
   \`\`\`sql
   SELECT email, name FROM users WHERE id = 'user_id';
   \`\`\`

## Email Flow Diagram

\`\`\`
User Completes Payment
         |
         v
Stripe Webhook Triggered
         |
         v
Database Updated (subscription_status = 'active')
         |
         v
User Email Retrieved from DB
         |
         v
sendWelcomeEmail() Called
         |
         v
Resend API Sends Email
         |
         v
Email Delivered to User's Inbox
\`\`\`

## Production Checklist

Before going to production:

- [ ] Add and verify custom domain in Resend
- [ ] Update `EMAIL_FROM` to use custom domain
- [ ] Set `NEXT_PUBLIC_APP_URL` to production URL
- [ ] Test email delivery with real payment
- [ ] Check email rendering on multiple clients
  - Gmail
  - Outlook
  - Apple Mail
  - Mobile devices
- [ ] Monitor Resend Dashboard for delivery rates
- [ ] Set up webhook retry logic (already included)

## API Reference

### sendWelcomeEmail()

Send welcome email to new Pro user.

\`\`\`typescript
import { sendWelcomeEmail } from '@/lib/email'

const result = await sendWelcomeEmail({
  to: 'user@example.com',
  userName: 'John Doe'
})

if (result.success) {
  console.log('Email sent:', result.data?.id)
} else {
  console.error('Email failed:', result.error)
}
\`\`\`

### sendTestEmail()

Send test email (uses default template).

\`\`\`typescript
import { sendTestEmail } from '@/lib/email'

const result = await sendTestEmail('test@example.com')
\`\`\`

## Cost and Limits

### Resend Free Tier
- 3,000 emails/month
- 100 emails/day
- All features included
- No credit card required

### Resend Paid Plans
- Pay-as-you-go: $0.001 per email
- No monthly fees
- Higher limits
- See [pricing](https://resend.com/pricing) for details

## Support

- Resend Docs: [https://resend.com/docs](https://resend.com/docs)
- Resend Support: support@resend.com
- Email template testing: [https://www.mailslurp.com](https://www.mailslurp.com)

## Files Created

- `/lib/email.ts` - Email sending utilities
- `/app/api/stripe/webhook/route.ts` - Updated with email integration
- `/app/api/test-email/route.ts` - Test email endpoint
- `/EMAIL_SETUP_GUIDE.md` - This guide

---

**Setup Complete**: Users will now receive welcome emails when they upgrade to Pro!
