# Production Setup for quadrants.ch

## 1. Clerk Production Configuration

### Get Production Keys from Clerk Dashboard
1. Go to https://dashboard.clerk.com
2. Select your application
3. Switch to **Production** environment (top-right toggle)
4. Go to **API Keys** section
5. Copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_live_`)
   - `CLERK_SECRET_KEY` (starts with `sk_live_`)

### Configure Production Domain in Clerk
1. In Clerk Dashboard (Production mode)
2. Go to **Domains** section
3. Add your production domain: `quadrants.ch`
4. Configure URLs:
   - Sign-in URL: `https://quadrants.ch/sign-in`
   - Sign-up URL: `https://quadrants.ch/sign-up`
   - After sign-in URL: `https://quadrants.ch/`
   - After sign-up URL: `https://quadrants.ch/`

## 2. Vercel Deployment

### Add Environment Variables in Vercel
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables for **Production** environment:

\`\`\`
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_[your-key]
CLERK_SECRET_KEY=sk_live_[your-key]
DATABASE_URL=[your-neon-database-url]
\`\`\`

### Deploy Commands
\`\`\`bash
# If using Vercel CLI
vercel --prod

# Or push to main branch if connected to GitHub
git push origin main
\`\`\`

## 3. Update .env.production File

Replace the placeholder values in `.env.production`:

\`\`\`env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_[paste-your-actual-key]
CLERK_SECRET_KEY=sk_live_[paste-your-actual-key]
\`\`\`

## 4. Test Production Locally

To test with production keys locally:

\`\`\`bash
# Build with production environment
npm run build

# Start production server locally
npm run start
\`\`\`

## 5. Verify Production Setup

After deployment, verify:
1. Visit https://quadrants.ch
2. Check that Clerk authentication loads without errors
3. Test sign-in/sign-up flow
4. Verify database connection works

## Troubleshooting

If you see "Production Keys are only allowed for domain quadrants.ch":
- Make sure you're accessing via `https://quadrants.ch` not `http://` or `www.`
- Verify the domain is correctly configured in Clerk Dashboard
- Check that environment variables are properly set in Vercel

If authentication fails:
- Verify production keys are correct (not development keys)
- Check Vercel environment variables are set for Production
- Ensure Clerk domain configuration matches exactly
