-- ============================================
-- RLS Policy Upgrade — Safe to re-run (idempotent)
-- Tightens security so users can only modify their own data
-- ============================================

-- Drop ALL old policies first (both original and upgraded)
DROP POLICY IF EXISTS "Authenticated update" ON students;
DROP POLICY IF EXISTS "Authenticated update" ON services;
DROP POLICY IF EXISTS "Authenticated update" ON community_posts;
DROP POLICY IF EXISTS "Authenticated update" ON prayer_requests;
DROP POLICY IF EXISTS "Authenticated update" ON events;
DROP POLICY IF EXISTS "Authenticated update" ON spotlight_requests;
DROP POLICY IF EXISTS "Authenticated update" ON bug_reports;
DROP POLICY IF EXISTS "Authenticated delete" ON prayer_requests;
DROP POLICY IF EXISTS "Authenticated delete" ON students;
DROP POLICY IF EXISTS "Users update own student profile" ON students;
DROP POLICY IF EXISTS "Users delete own student profile" ON students;
DROP POLICY IF EXISTS "Users update own services" ON services;
DROP POLICY IF EXISTS "Users delete own services" ON services;
DROP POLICY IF EXISTS "Users update own posts" ON community_posts;
DROP POLICY IF EXISTS "Users delete own posts" ON community_posts;
DROP POLICY IF EXISTS "Users update own prayers" ON prayer_requests;
DROP POLICY IF EXISTS "Users delete own prayers" ON prayer_requests;
DROP POLICY IF EXISTS "Users update own events" ON events;
DROP POLICY IF EXISTS "Users update own spotlight" ON spotlight_requests;
DROP POLICY IF EXISTS "Users update own bugs" ON bug_reports;
DROP POLICY IF EXISTS "Admin update approvals" ON profile_approvals;
DROP POLICY IF EXISTS "Public read app stats" ON app_stats;
DROP POLICY IF EXISTS "Admin insert app stats" ON app_stats;
DROP POLICY IF EXISTS "Admin update app stats" ON app_stats;
DROP POLICY IF EXISTS "Users insert own profile" ON users;
DROP POLICY IF EXISTS "Users update own profile" ON users;
DROP POLICY IF EXISTS "Public read files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own files" ON storage.objects;

-- Students: users can only update/delete their own profile
CREATE POLICY "Users update own student profile" ON students
  FOR UPDATE USING (
    user_id = (SELECT id::text FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users delete own student profile" ON students
  FOR DELETE USING (
    user_id = (SELECT id::text FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- Services: only provider or admin can update
CREATE POLICY "Users update own services" ON services
  FOR UPDATE USING (
    provider_id = (SELECT id::text FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users delete own services" ON services
  FOR DELETE USING (
    provider_id = (SELECT id::text FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- Community posts: only author or admin can update/delete
CREATE POLICY "Users update own posts" ON community_posts
  FOR UPDATE USING (
    user_id = (SELECT id::text FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users delete own posts" ON community_posts
  FOR DELETE USING (
    user_id = (SELECT id::text FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- Prayer requests: only requester or admin
CREATE POLICY "Users update own prayers" ON prayer_requests
  FOR UPDATE USING (
    requester_id = (SELECT id::text FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users delete own prayers" ON prayer_requests
  FOR DELETE USING (
    requester_id = (SELECT id::text FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- Events: only organizer or admin
CREATE POLICY "Users update own events" ON events
  FOR UPDATE USING (
    organizer_id = (SELECT id::text FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- Spotlight requests: only requester or admin
CREATE POLICY "Users update own spotlight" ON spotlight_requests
  FOR UPDATE USING (
    user_id = (SELECT id::text FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- Bug reports: only reporter or admin
CREATE POLICY "Users update own bugs" ON bug_reports
  FOR UPDATE USING (
    user_id = (SELECT id::text FROM users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- Profile approvals: only admin can update
CREATE POLICY "Admin update approvals" ON profile_approvals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- App stats: public read, admin write
CREATE POLICY "Public read app stats" ON app_stats FOR SELECT USING (true);
CREATE POLICY "Admin insert app stats" ON app_stats FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin update app stats" ON app_stats FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
);

-- Users table: authenticated users can insert their own profile (for ensureUserProfile)
CREATE POLICY "Users insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users table: users can update their own profile
CREATE POLICY "Users update own profile" ON users
  FOR UPDATE USING (
    auth_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- STORAGE POLICIES for public-files bucket
-- ============================================
-- Anyone can view files (public bucket)
CREATE POLICY "Public read files" ON storage.objects
  FOR SELECT USING (bucket_id = 'public-files');

-- Authenticated users can upload files
CREATE POLICY "Authenticated upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'public-files' AND auth.uid() IS NOT NULL
  );

-- Users can update their own uploaded files
CREATE POLICY "Users update own files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'public-files' AND auth.uid() = owner
  );

-- Users can delete their own uploaded files
CREATE POLICY "Users delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'public-files' AND auth.uid() = owner
  );
