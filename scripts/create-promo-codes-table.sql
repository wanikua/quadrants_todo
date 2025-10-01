-- Create promo codes table for free subscription access

CREATE TABLE IF NOT EXISTS promo_codes (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL CHECK (plan IN ('pro', 'team')),
    duration_months INTEGER, -- NULL means lifetime
    max_uses INTEGER, -- NULL means unlimited
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by TEXT, -- user_id who created this code (for admin tracking)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create promo code redemptions table to track who used which code
CREATE TABLE IF NOT EXISTS promo_code_redemptions (
    id SERIAL PRIMARY KEY,
    promo_code_id INTEGER REFERENCES promo_codes(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- When this specific redemption expires
    UNIQUE(promo_code_id, user_id) -- User can't redeem same code twice
);

-- Add RLS policies for promo codes
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_redemptions ENABLE ROW LEVEL SECURITY;

-- Anyone can view active promo codes (to validate them)
CREATE POLICY promo_codes_select_active ON promo_codes
    FOR SELECT
    USING (is_active = true);

-- Only specific users can insert/update promo codes (admin functionality)
-- For now, we'll allow insert without auth (you can add admin check later)
CREATE POLICY promo_codes_insert ON promo_codes
    FOR INSERT
    WITH CHECK (true);

-- Users can view their own redemptions
CREATE POLICY redemptions_select_own ON promo_code_redemptions
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id', true)::TEXT);

-- Users can redeem codes
CREATE POLICY redemptions_insert ON promo_code_redemptions
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id', true)::TEXT);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON promo_code_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_promo_code_id ON promo_code_redemptions(promo_code_id);

-- Insert some example promo codes
INSERT INTO promo_codes (code, plan, duration_months, max_uses, is_active) VALUES
    ('WELCOME2024', 'pro', 12, NULL, true), -- Pro plan for 1 year, unlimited uses
    ('TEAM50', 'team', 6, 50, true), -- Team plan for 6 months, 50 uses max
    ('LIFETIME', 'team', NULL, 10, true), -- Lifetime Team plan, 10 uses only
    ('FREEPRO', 'pro', NULL, NULL, true) -- Lifetime Pro, unlimited uses
ON CONFLICT (code) DO NOTHING;

-- Function to validate and redeem promo code
CREATE OR REPLACE FUNCTION redeem_promo_code(
    p_code TEXT,
    p_user_id TEXT
)
RETURNS JSON AS $$
DECLARE
    v_promo_code promo_codes%ROWTYPE;
    v_redemption_exists BOOLEAN;
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_result JSON;
BEGIN
    -- Get promo code details
    SELECT * INTO v_promo_code
    FROM promo_codes
    WHERE code = p_code AND is_active = true;

    -- Check if code exists
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Invalid or inactive promo code');
    END IF;

    -- Check if code has expired
    IF v_promo_code.expires_at IS NOT NULL AND v_promo_code.expires_at < NOW() THEN
        RETURN json_build_object('success', false, 'error', 'Promo code has expired');
    END IF;

    -- Check if max uses reached
    IF v_promo_code.max_uses IS NOT NULL AND v_promo_code.current_uses >= v_promo_code.max_uses THEN
        RETURN json_build_object('success', false, 'error', 'Promo code has reached maximum uses');
    END IF;

    -- Check if user already redeemed this code
    SELECT EXISTS(
        SELECT 1 FROM promo_code_redemptions
        WHERE promo_code_id = v_promo_code.id AND user_id = p_user_id
    ) INTO v_redemption_exists;

    IF v_redemption_exists THEN
        RETURN json_build_object('success', false, 'error', 'You have already redeemed this code');
    END IF;

    -- Calculate expiration date for this redemption
    IF v_promo_code.duration_months IS NOT NULL THEN
        v_expires_at := NOW() + (v_promo_code.duration_months || ' months')::INTERVAL;
    ELSE
        v_expires_at := NULL; -- Lifetime
    END IF;

    -- Create redemption record
    INSERT INTO promo_code_redemptions (promo_code_id, user_id, expires_at)
    VALUES (v_promo_code.id, p_user_id, v_expires_at);

    -- Update promo code usage count
    UPDATE promo_codes
    SET current_uses = current_uses + 1
    WHERE id = v_promo_code.id;

    -- Update user subscription
    UPDATE users
    SET
        subscription_status = v_promo_code.plan,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Return success with details
    RETURN json_build_object(
        'success', true,
        'plan', v_promo_code.plan,
        'expires_at', v_expires_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
