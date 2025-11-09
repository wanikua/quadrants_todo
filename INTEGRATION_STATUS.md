# Integration Status & Setup Guide

## 🎯 Overview

This document provides a comprehensive overview of all integrations in the 1Bit Authentication project, including setup instructions, status checks, and troubleshooting guides.

## 📊 Current Integration Status

### ✅ Neon Database (PostgreSQL)
**Status**: Fully Integrated
**Required**: Yes

#### Configuration
- Environment variable: `DATABASE_URL`
- Connection: Serverless PostgreSQL via `@neondatabase/serverless`
- Connection pooling: Enabled

#### Database Schema
Tables:
- `users` - User accounts with JWT authentication
- `projects` - User projects
- `project_members` - Project membership
- `tasks` - Project tasks
- `players` - Task assignments
- `promo_codes` - Promotional codes for premium features

#### Setup Steps
1. Create a Neon account at https://neon.tech
2. Create a new project
3. Copy the connection string
4. Add to `.env.local`:
   \`\`\`
   DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb
   \`\`\`
5. Run database setup: Visit `/api/setup-db`
6. Verify: Visit `/diagnostics`

#### Migrations
The app includes automatic migrations for:
- Adding `password_hash` column to users
- Adding `name` column to users
- Creating promo codes table

Run migrations via:
- `/api/db/migrate-password` - Migrates password column
- `/api/db/add-columns` - Adds missing columns
- `/api/setup-db` - Complete database initialization

### ✅ Custom JWT Authentication
**Status**: Fully Implemented
**Required**: Yes

#### Features
- Custom JWT-based authentication (no third-party service)
- Password hashing with bcryptjs (10 rounds)
- HTTP-only cookies for session management
- 7-day token expiration
- Automatic token refresh

#### Configuration
- Environment variable: `JWT_SECRET`
- Minimum length: 32 characters
- Example: `JWT_SECRET=change-this-to-a-secure-secret-key-at-least-32-characters-long`

#### API Endpoints
- `POST /api/auth/signout` - Sign out user
- Server Actions:
  - `signUp(email, password, name)` - Create account
  - `signIn(email, password)` - Authenticate user

#### Security Features
- Password hashing (bcrypt with salt rounds)
- HTTP-only cookies (prevent XSS)
- Secure cookies in production
- SameSite: Lax (CSRF protection)
- Token verification on each request

#### Middleware Protection
Protected routes:
- `/projects/*` - All project pages
- `/pricing` - Pricing page
- `/promo` - Promo code page

Public routes:
- `/` - Landing page
- `/auth/signin` - Sign in page
- `/auth/signup` - Sign up page
- `/api/*` - API routes (handled separately)

### 🟡 Stripe Integration (Optional)
**Status**: Configured, Optional
**Required**: No (only for paid features)

#### Features
- Subscription management
- Multiple pricing tiers (Free, Pro, Team)
- Stripe Checkout integration
- Customer Portal for subscription management
- Webhook handling for payment events

#### Configuration
Required for payments:
\`\`\`env
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
\`\`\`

Optional (product-specific):
\`\`\`env
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
STRIPE_PRICE_ID_PRO_YEARLY=price_...
STRIPE_PRICE_ID_TEAM_MONTHLY=price_...
STRIPE_PRICE_ID_TEAM_YEARLY=price_...
\`\`\`

#### Setup Steps
1. Create Stripe account at https://stripe.com
2. Get API keys from Dashboard
3. Create products and prices
4. Configure webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
5. Add webhook secret to environment variables
6. Test with Stripe test mode

#### Subscription Plans
**Free**:
- 1 project
- Unlimited tasks
- 1 team member

**Pro** ($9.99/month):
- 10 projects
- Unlimited tasks
- Up to 5 team members
- Priority support

**Team** ($29.99/month):
- Unlimited projects
- Unlimited tasks
- Unlimited team members
- 24/7 support
- Advanced analytics

#### API Endpoints
- `POST /api/stripe/create-checkout-session` - Start checkout
- `POST /api/stripe/create-portal-session` - Access customer portal
- `POST /api/stripe/webhook` - Handle Stripe events

## 🔧 Environment Variables Reference

### Required
\`\`\`env
# Neon Database Connection
DATABASE_URL=postgresql://user:password@host.neon.tech/database

# JWT Secret for Authentication (32+ characters)
JWT_SECRET=your-very-long-and-secure-secret-key-here
\`\`\`

### Optional
\`\`\`env
# Stripe (only if you want payment features)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
STRIPE_PRICE_ID_TEAM_MONTHLY=price_...

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
\`\`\`

## 🧪 Testing & Diagnostics

### Diagnostics Dashboard
Visit `/diagnostics` to check:
- ✅ Environment variables
- ✅ Database connection
- ✅ Database schema
- ✅ Authentication system
- ✅ Stripe integration

### Manual Testing

#### 1. Database Connection
\`\`\`bash
curl http://localhost:3000/api/diagnostics/database
\`\`\`

#### 2. Authentication
1. Visit `/auth/signup`
2. Create account
3. Verify redirect to `/projects`
4. Sign out
5. Visit `/auth/signin`
6. Sign in with created account

#### 3. Database Schema
\`\`\`bash
curl http://localhost:3000/api/diagnostics/schema
\`\`\`

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Set strong `JWT_SECRET` (32+ characters)
- [ ] Configure `DATABASE_URL` with production database
- [ ] If using Stripe, set production API keys
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Run database migrations
- [ ] Test authentication flow
- [ ] Verify all environment variables

### Vercel Deployment
1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy
5. Run database setup: `https://yourdomain.com/api/setup-db`
6. Verify: `https://yourdomain.com/diagnostics`

### Post-Deployment
- [ ] Test signup/signin flow
- [ ] Create test project
- [ ] Add test tasks
- [ ] If using Stripe, test checkout flow
- [ ] Verify webhook endpoint (Stripe)
- [ ] Monitor error logs

## 🐛 Troubleshooting

### Authentication Issues

**Problem**: "Invalid credentials" error
- Check if user exists in database
- Verify password was hashed correctly
- Check JWT_SECRET is set
- Clear browser cookies

**Problem**: Redirected to signin on protected routes
- Check middleware.ts is working
- Verify auth token cookie is being set
- Check token expiration
- Verify JWT_SECRET matches

**Problem**: User not found after signup
- Check database connection
- Verify users table exists
- Check for SQL errors in logs
- Run database migrations

### Database Issues

**Problem**: "Connection failed"
- Verify DATABASE_URL is correct
- Check Neon project is active
- Verify network connectivity
- Check for IP restrictions

**Problem**: "Table does not exist"
- Run `/api/setup-db` to create tables
- Check schema with `/api/diagnostics/schema`
- Manually run SQL from `/scripts/init-database.sql`

**Problem**: "Column does not exist"
- Run migrations: `/api/db/migrate-password`
- Add columns: `/api/db/add-columns`
- Check schema matches code

### Stripe Issues

**Problem**: "Stripe not configured"
- Add STRIPE_SECRET_KEY to environment
- Verify API key is valid
- Check key mode (test vs live)

**Problem**: Webhook not receiving events
- Verify webhook endpoint URL
- Check STRIPE_WEBHOOK_SECRET
- Test webhook in Stripe dashboard
- Check webhook signature verification

## 📚 Additional Resources

### Documentation
- [Neon Documentation](https://neon.tech/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [JWT Documentation](https://jwt.io)

### Support
- GitHub Issues: Report bugs and feature requests
- Email: support@yourdomain.com

### Migration Guides
- From Stack Auth: See CLAUDE.md
- From Clerk: Authentication is now custom JWT-based

## 🔐 Security Best Practices

1. **JWT Secret**:
   - Use strong, random secret (32+ characters)
   - Never commit to version control
   - Rotate periodically in production

2. **Database**:
   - Use connection pooling
   - Enable SSL in production
   - Regular backups
   - Monitor query performance

3. **Stripe**:
   - Use webhook secrets
   - Verify webhook signatures
   - Test with test keys first
   - Monitor for suspicious activity

4. **Passwords**:
   - Enforced hashing (bcrypt)
   - Salted (10 rounds)
   - Never logged or exposed

## 📊 Performance Monitoring

### Key Metrics to Track
- Authentication success rate
- Database query response time
- API endpoint latency
- Error rates by type
- Active user sessions

### Recommended Tools
- Vercel Analytics
- Sentry for error tracking
- Neon metrics dashboard
- Stripe dashboard analytics

---

Last Updated: January 2025
Version: 1.0.0
\`\`\`

Now let me fix the middleware to ensure authentication is working correctly:
