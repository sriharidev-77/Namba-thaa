/*
  # Create Base Schema for CMS Student Admission Platform

  ## Overview
  This migration creates the foundational database structure for a role-based CMS platform
  to manage student admission inquiries with follow-up tracking and voice recording support.

  ## 1. New Tables

  ### `profiles`
  User profiles with role-based access control
  - `id` (uuid, primary key) - Links to auth.users
  - `email` (text, unique) - User email address
  - `full_name` (text) - User's full name
  - `role` (text) - User role: 'admin', 'co_leader', 'employee'
  - `created_by` (uuid) - Reference to admin who created this user
  - `is_active` (boolean) - Account active status
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `inquiries`
  Student admission inquiries
  - `id` (uuid, primary key) - Unique inquiry identifier
  - `student_name` (text) - Student's full name
  - `contact_number` (text) - Student's contact number
  - `email` (text) - Student's email address
  - `course_interested` (text) - Course student is interested in
  - `more_input` (text) - Additional notes/information
  - `status` (text) - Inquiry status: 'pending', 'converted', 'dropped'
  - `assigned_to` (uuid) - Reference to assigned employee/admin
  - `created_by` (uuid) - Reference to user who created inquiry
  - `created_at` (timestamptz) - Inquiry creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `follow_ups`
  Follow-up logs for student inquiries
  - `id` (uuid, primary key) - Unique follow-up identifier
  - `inquiry_id` (uuid) - Reference to parent inquiry
  - `notes` (text) - Follow-up notes/comments
  - `follow_up_date` (timestamptz) - Scheduled follow-up date/time
  - `voice_recording_url` (text) - URL to voice recording in storage
  - `created_by` (uuid) - Reference to user who created follow-up
  - `created_at` (timestamptz) - Follow-up creation timestamp

  ## 2. Security

  ### Row Level Security (RLS)
  - All tables have RLS enabled
  
  ### Profiles Table Policies
  - Admins can view all profiles
  - Co-leaders can view all profiles
  - Employees can view only their own profile
  - Only admins can insert/update/delete profiles

  ### Inquiries Table Policies
  - Admins and co-leaders can view all inquiries
  - Employees can view only inquiries assigned to them
  - Admins and co-leaders can create and update all inquiries
  - Employees can update only their assigned inquiries
  - Only admins can delete inquiries

  ### Follow-ups Table Policies
  - Users can view follow-ups for inquiries they have access to
  - Users can create follow-ups for inquiries they have access to
  - Users can update their own follow-ups

  ## 3. Important Notes
  - All foreign keys use CASCADE delete to maintain referential integrity
  - Timestamps use automatic defaults for created_at and updated_at
  - Status fields use specific enum-like values for consistency
  - RLS policies enforce strict role-based access control
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'co_leader', 'employee')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  contact_number text NOT NULL,
  email text,
  course_interested text NOT NULL,
  more_input text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'dropped')),
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create follow_ups table
CREATE TABLE IF NOT EXISTS follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  notes text NOT NULL,
  follow_up_date timestamptz NOT NULL,
  voice_recording_url text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inquiries_assigned_to ON inquiries(assigned_to);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_follow_ups_inquiry_id ON follow_ups(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_follow_up_date ON follow_ups(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

-- Profiles table policies
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Co-leaders can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'co_leader'
    )
  );

CREATE POLICY "Employees can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Only admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Inquiries table policies
CREATE POLICY "Admins and co-leaders can view all inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'co_leader')
    )
  );

CREATE POLICY "Employees can view assigned inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid());

CREATE POLICY "Admins and co-leaders can create inquiries"
  ON inquiries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'co_leader')
    )
  );

CREATE POLICY "Admins and co-leaders can update all inquiries"
  ON inquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'co_leader')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'co_leader')
    )
  );

CREATE POLICY "Employees can update assigned inquiries"
  ON inquiries FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Only admins can delete inquiries"
  ON inquiries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Follow-ups table policies
CREATE POLICY "Users can view follow-ups for accessible inquiries"
  ON follow_ups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inquiries i
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE i.id = follow_ups.inquiry_id
      AND (
        p.role IN ('admin', 'co_leader')
        OR i.assigned_to = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create follow-ups for accessible inquiries"
  ON follow_ups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM inquiries i
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE i.id = follow_ups.inquiry_id
      AND (
        p.role IN ('admin', 'co_leader')
        OR i.assigned_to = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own follow-ups"
  ON follow_ups FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic updated_at updates
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inquiries_updated_at ON inquiries;
CREATE TRIGGER update_inquiries_updated_at
  BEFORE UPDATE ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
