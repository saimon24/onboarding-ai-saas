-- Add subscription fields to profiles table
ALTER TABLE profiles
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN subscription_id TEXT,
ADD COLUMN subscription_status TEXT,
ADD COLUMN subscription_price_id TEXT,
ADD COLUMN subscription_plan_name TEXT,
ADD COLUMN subscription_current_period_end TIMESTAMPTZ; 