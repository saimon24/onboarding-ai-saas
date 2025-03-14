/*
  # Add Webhook Fields to Profiles

  This migration adds webhook-related fields to the profiles table:
  - webhook_id: A unique identifier for the user's webhook
  - webhook_enabled: A flag to enable/disable the webhook
  - webhook_config: JSON configuration for the webhook (field mappings, etc.)
  - webhook_last_received: Timestamp of the last received webhook
*/

-- Add webhook fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS webhook_id UUID DEFAULT gen_random_uuid();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS webhook_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS webhook_config JSONB DEFAULT '{"field_mappings": {}}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS webhook_last_received TIMESTAMPTZ;

-- Create a unique index on webhook_id to ensure it's always unique
CREATE UNIQUE INDEX IF NOT EXISTS profiles_webhook_id_idx ON profiles(webhook_id); 