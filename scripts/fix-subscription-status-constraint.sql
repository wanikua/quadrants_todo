-- Fix subscription_status constraint to include free, pro, team values
-- Date: 2025-10-31

-- Drop old constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_status_check;

-- Add new constraint with all valid values
ALTER TABLE users ADD CONSTRAINT users_subscription_status_check
CHECK (subscription_status IN (
  'free',                -- Free tier
  'pro',                 -- Pro tier
  'team',                -- Team tier
  'active',              -- Stripe: subscription is active
  'canceled',            -- Stripe: subscription canceled
  'past_due',            -- Stripe: payment past due
  'trialing',            -- Stripe: in trial period
  'incomplete',          -- Stripe: incomplete payment
  'incomplete_expired',  -- Stripe: incomplete expired
  'unpaid'               -- Stripe: unpaid
));
