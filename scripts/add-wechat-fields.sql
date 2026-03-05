-- Add WeChat OAuth fields to users table
-- Run this migration before enabling WeChat login

ALTER TABLE users ADD COLUMN IF NOT EXISTS wechat_openid VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wechat_unionid VARCHAR(255) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_wechat_openid ON users(wechat_openid) WHERE wechat_openid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_wechat_unionid ON users(wechat_unionid) WHERE wechat_unionid IS NOT NULL;
