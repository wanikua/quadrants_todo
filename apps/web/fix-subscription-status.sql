-- Fix subscription_status to be 'active' instead of 'pro'
UPDATE users
SET subscription_status = 'active'
WHERE subscription_plan = 'pro'
AND subscription_status = 'pro';

-- Verify the fix
SELECT id, email, name, subscription_plan, subscription_status, stripe_customer_id
FROM users
WHERE subscription_plan = 'pro';
