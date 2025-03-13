/*
  # Add Email Context to Profiles

  This migration adds an email_context column to the profiles table.
  This column will store user-defined context for AI-generated emails,
  such as tone, brand information, and other customizations.
*/

-- Add email_context column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_context jsonb NOT NULL DEFAULT '{"tone": "professional and friendly", "brand_info": "", "additional_instructions": ""}';

-- Update existing profiles to have the default email_context
UPDATE profiles SET email_context = '{"tone": "professional and friendly", "brand_info": "", "additional_instructions": ""}' WHERE email_context IS NULL; 