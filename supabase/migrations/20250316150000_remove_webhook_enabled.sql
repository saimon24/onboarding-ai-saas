/*
  # Remove Webhook Enabled Field

  This migration removes the webhook_enabled field from the profiles table as it's no longer needed.
  Webhooks will be considered enabled as long as they are configured.
*/

-- Remove webhook_enabled column from profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS webhook_enabled; 