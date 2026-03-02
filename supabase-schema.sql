-- ============================================
-- Supabase SQL Schema for כלים שלובים App
-- Run this in Supabase SQL Editor to create all tables
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (linked to Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STUDENTS (profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  full_name TEXT,
  username TEXT,
  profile_image TEXT,
  city TEXT,
  description TEXT,
  additional_images JSONB DEFAULT '[]',
  weekly_video_url TEXT,
  coordinates JSONB,
  contact_info JSONB DEFAULT '{}',
  contribution_details JSONB DEFAULT '{}',
  services JSONB DEFAULT '[]',
  service_areas JSONB DEFAULT '[]',
  category_main TEXT,
  category_sub TEXT,
  is_holiday_highlight BOOLEAN DEFAULT FALSE,
  holiday_type TEXT,
  tags JSONB DEFAULT '[]',
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SERVICES
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  geographic_area TEXT,
  price TEXT,
  images JSONB DEFAULT '[]',
  video_url TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  provider_id TEXT,
  provider_name TEXT,
  provider_image TEXT,
  is_holiday_highlight BOOLEAN DEFAULT FALSE,
  holiday_type TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  type TEXT,
  title TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  related_id TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRIVATE MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS private_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  subject TEXT,
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  related_post_id TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMUNITY POSTS
-- ============================================
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  user_name TEXT,
  content TEXT,
  category TEXT,
  likes JSONB DEFAULT '[]',
  comments JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GRATITUDE POSTS
-- ============================================
CREATE TABLE IF NOT EXISTS gratitude_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  user_name TEXT,
  content TEXT,
  recipient_name TEXT,
  likes JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRAYER REQUESTS
-- ============================================
CREATE TABLE IF NOT EXISTS prayer_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_for_prayer TEXT,
  request_types JSONB DEFAULT '[]',
  valid_for TEXT,
  valid_until DATE,
  context_note TEXT,
  status TEXT DEFAULT 'פעיל',
  requester_id TEXT,
  requester_name TEXT,
  prayers_from JSONB DEFAULT '[]',
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT,
  location TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  max_participants INTEGER,
  registration_required BOOLEAN DEFAULT FALSE,
  cost TEXT DEFAULT 'חינם',
  contact_info TEXT,
  tags JSONB DEFAULT '[]',
  image_url TEXT,
  organizer_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  participants JSONB DEFAULT '[]',
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SPOTLIGHT REQUESTS
-- ============================================
CREATE TABLE IF NOT EXISTS spotlight_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  personal_story TEXT,
  business_description TEXT,
  what_i_offer TEXT,
  tagline TEXT,
  images JSONB DEFAULT '[]',
  video_url TEXT,
  contact_preference TEXT,
  status TEXT DEFAULT 'pending',
  selected_week DATE,
  admin_feedback TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROFILE APPROVALS
-- ============================================
CREATE TABLE IF NOT EXISTS profile_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  student_profile_id TEXT,
  type TEXT,
  proposed_data JSONB,
  current_data JSONB,
  changes_summary TEXT,
  status TEXT DEFAULT 'pending',
  admin_feedback TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RECOMMENDATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id TEXT,
  content TEXT,
  recommender_id TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BUG REPORTS
-- ============================================
CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  title TEXT,
  description TEXT,
  severity TEXT,
  status TEXT DEFAULT 'open',
  likes JSONB DEFAULT '[]',
  admin_response TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CATEGORY REQUESTS
-- ============================================
CREATE TABLE IF NOT EXISTS category_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  suggested_category TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  admin_feedback TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SERVICE CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  main_category TEXT,
  sub_category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HOLIDAY SECTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS holiday_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  description TEXT,
  holiday_type TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- APP STATS
-- ============================================
CREATE TABLE IF NOT EXISTS app_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stat_key TEXT UNIQUE,
  stat_value JSONB,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gratitude_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE spotlight_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_stats ENABLE ROW LEVEL SECURITY;

-- Public read access for most tables (community app)
CREATE POLICY "Public read access" ON users FOR SELECT USING (true);
CREATE POLICY "Public read access" ON students FOR SELECT USING (true);
CREATE POLICY "Public read access" ON services FOR SELECT USING (true);
CREATE POLICY "Public read access" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Public read access" ON gratitude_posts FOR SELECT USING (true);
CREATE POLICY "Public read access" ON prayer_requests FOR SELECT USING (true);
CREATE POLICY "Public read access" ON events FOR SELECT USING (true);
CREATE POLICY "Public read access" ON recommendations FOR SELECT USING (true);
CREATE POLICY "Public read access" ON service_categories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON holiday_sections FOR SELECT USING (true);
CREATE POLICY "Public read access" ON spotlight_requests FOR SELECT USING (true);

-- Authenticated users can insert
CREATE POLICY "Authenticated insert" ON students FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated insert" ON services FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated insert" ON notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated insert" ON private_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated insert" ON community_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated insert" ON gratitude_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated insert" ON prayer_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated insert" ON events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated insert" ON spotlight_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated insert" ON profile_approvals FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated insert" ON recommendations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated insert" ON bug_reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated insert" ON category_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can update/delete their own records
CREATE POLICY "Authenticated update" ON students FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update" ON services FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update" ON community_posts FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update" ON prayer_requests FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update" ON events FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update" ON spotlight_requests FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update" ON bug_reports FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete" ON prayer_requests FOR DELETE USING (auth.uid() IS NOT NULL);

-- Notifications & messages: users can read their own
CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users read own messages" ON private_messages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users read own bug reports" ON bug_reports FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users read own profile approvals" ON profile_approvals FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update notifications" ON notifications FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update messages" ON private_messages FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================
-- STORAGE BUCKET for file uploads
-- ============================================
-- Run in Supabase Dashboard > Storage:
-- Create a bucket called "public-files" with public access enabled

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_services_provider_id ON services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_is_approved ON services(is_approved);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_sender ON private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_recipient ON private_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_status ON prayer_requests(status);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_spotlight_requests_user_id ON spotlight_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_approvals_user_id ON profile_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_service_id ON recommendations(service_id);
