# Customer Onboarding Platform - Database Setup

## Supabase Database Setup

### 1. Initial Schema Setup

Create a new migration file in `supabase/migrations` with the following content:

```sql
/*
  # Initial Schema Setup

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key)
      - `email` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `customer_data`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, foreign key)
      - `email` (text)
      - `survey_data` (jsonb)
      - `ai_email` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customer_data table
CREATE TABLE IF NOT EXISTS customer_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  survey_data jsonb NOT NULL DEFAULT '{}',
  ai_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can read own customer data"
  ON customer_data
  FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own customer data"
  ON customer_data
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own customer data"
  ON customer_data
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = profile_id);

-- Create function to handle profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2. Add Email Context to Profiles

Create a new migration file in `supabase/migrations` with the following content:

```sql
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
```

## Environment Variables

Create a `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

## Setup Instructions

1. Create a new Supabase project
2. Click the "Connect to Supabase" button in the top right of your project
3. Copy the provided environment variables to your `.env.local` file
4. Apply the migrations to your Supabase project

The schema includes:

- A `profiles` table that automatically creates a profile when a user signs up
  - Includes `email_context` for customizing AI-generated emails
- A `customer_data` table for storing uploaded customer survey data
- Row Level Security (RLS) policies to ensure data privacy
- Automatic user profile creation via database triggers

The schema is designed to:
- Maintain data isolation between users
- Support JSON storage for flexible survey data
- Enable AI-generated email storage with customizable context
- Provide secure access control through RLS policies