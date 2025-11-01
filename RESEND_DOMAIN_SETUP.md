# Resend Domain Verification Guide

## Current Status

- Email API Key: Configured
- Test Email: Success! (sent to wlk760541031@gmail.com)
- Email ID: `c6f710d5-9ac4-46b8-b279-bf8719f2186c`

## Next Step: Verify Your Domain

To send emails from `info@quadrants.ch` to any user, you need to verify the `quadrants.ch` domain in Resend.

### Step 1: Add Domain to Resend

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click **Add Domain**
3. Enter `quadrants.ch`
4. Click **Add**

### Step 2: Get DNS Records

Resend will provide you with DNS records to add. Example:

\`\`\`
Type: TXT
Host: resend._domainkey.quadrants.ch
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4... (long string)

Type: TXT
Host: quadrants.ch
Value: resend-verification=abc123...

Type: MX
Host: quadrants.ch
Priority: 10
Value: mx.resend.com
\`\`\`

### Step 3: Add DNS Records

Add these records to your DNS provider (where you manage quadrants.ch DNS):

#### If using Cloudflare:
1. Log in to Cloudflare
2. Select `quadrants.ch` domain
3. Go to **DNS** → **Records**
4. Click **Add record**
5. Add each record exactly as provided by Resend
6. Save changes

#### If using other DNS providers:
The process is similar - find your DNS management panel and add the records.

### Step 4: Verify Domain in Resend

1. Wait 5-10 minutes for DNS propagation
2. Go back to [Resend Domains](https://resend.com/domains)
3. Click **Verify** next to `quadrants.ch`
4. If successful, status will change to "Verified"

### Step 5: Update Environment Variable

Once verified, update `.env.local`:

\`\`\`bash
# Change from:
EMAIL_FROM=onboarding@resend.dev

# To:
EMAIL_FROM=info@quadrants.ch
\`\`\`

Restart your server:
\`\`\`bash
npm run dev
\`\`\`

### Step 6: Test with Your Domain

\`\`\`bash
# Create a test script
cat > test-custom-domain.ts << 'EOF'
import * as dotenv from 'dotenv'
import { sendWelcomeEmail } from './lib/email'

dotenv.config({ path: '.env.local' })

sendWelcomeEmail({
  to: 'thomtechnic@gmail.com',  // Now works with any email!
  userName: 'Thomas'
}).then(result => {
  console.log(result.success ? 'Success!' : 'Failed:', result)
})
EOF

# Run test
npx tsx test-custom-domain.ts

# Clean up
rm test-custom-domain.ts
\`\`\`

## Common Issues

### Issue 1: DNS Not Propagating

**Solution**:
- Wait up to 24 hours (usually 5-10 minutes)
- Check DNS propagation: https://dnschecker.org

### Issue 2: MX Record Conflicts

**Problem**: Existing MX records for email hosting

**Solution**:
- Resend MX records are only for sending, not receiving
- You can keep your existing MX records
- Just add Resend's records alongside

### Issue 3: SPF Record Limits

**Problem**: Multiple SPF records not allowed

**Solution**:
- Merge SPF records into one
- Example:
  \`\`\`
  v=spf1 include:_spf.google.com include:spf.resend.com ~all
  \`\`\`

## Email Functionality After Verification

Once verified, your app will:

1. Send welcome emails from `info@quadrants.ch`
2. Work for any recipient email address
3. Have better email deliverability
4. Avoid spam filters
5. Show your brand in recipient's inbox

## Current Temporary Setup

Until domain is verified:

- Sender: `onboarding@resend.dev` (Resend's shared domain)
- Recipient: Can only send to `wlk760541031@gmail.com` (registered email)
- Production: Not ready yet

After verification:

- Sender: `info@quadrants.ch` (your custom domain)
- Recipient: Any email address
- Production: Ready to deploy

## Testing Checklist

After domain verification:

- [ ] Domain shows "Verified" in Resend Dashboard
- [ ] Update `EMAIL_FROM` in `.env.local`
- [ ] Restart dev server
- [ ] Test email to `thomtechnic@gmail.com`
- [ ] Test email to another address
- [ ] Check spam folder (first email might go there)
- [ ] Verify sender shows as `info@quadrants.ch`
- [ ] Complete test payment flow
- [ ] Verify welcome email arrives after payment

## Support

- Resend Docs: https://resend.com/docs/dashboard/domains/introduction
- DNS Checker: https://dnschecker.org
- Test Email: https://www.mail-tester.com

---

**Current Status**: Emails working with test domain
**Next Action**: Verify `quadrants.ch` domain in Resend
**ETA**: 10-15 minutes after adding DNS records
