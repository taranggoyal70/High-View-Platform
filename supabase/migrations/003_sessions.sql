-- Sessions (replaces localStorage customSessions)
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date text NOT NULL,
  time text NOT NULL,
  type text DEFAULT 'Virtual',
  instructor text DEFAULT '',
  required_grades text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read sessions" ON sessions FOR SELECT USING (true);
CREATE POLICY "Staff can manage sessions" ON sessions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (raw_user_meta_data->>'role' = 'staff' OR raw_user_meta_data->>'role' = 'admin')
  )
);

-- Session registrations (replaces localStorage sessionRegistrations)
CREATE TABLE IF NOT EXISTS session_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_name text DEFAULT '',
  registered_at timestamptz DEFAULT now(),
  UNIQUE(session_id, user_id)
);

ALTER TABLE session_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own registrations" ON session_registrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Staff view all registrations" ON session_registrations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (raw_user_meta_data->>'role' = 'staff' OR raw_user_meta_data->>'role' = 'admin')
  )
);

-- Session no-shows (replaces localStorage sessionNoShows)
CREATE TABLE IF NOT EXISTS session_no_shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  marked_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, user_id)
);

ALTER TABLE session_no_shows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage no-shows" ON session_no_shows FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (raw_user_meta_data->>'role' = 'staff' OR raw_user_meta_data->>'role' = 'admin')
  )
);
CREATE POLICY "Students view own no-shows" ON session_no_shows FOR SELECT USING (auth.uid() = user_id);

-- Course registrations (replaces localStorage studentCourseRegistrations)
CREATE TABLE IF NOT EXISTS course_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id text NOT NULL,
  registered_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE course_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own course registrations" ON course_registrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Staff view all course registrations" ON course_registrations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (raw_user_meta_data->>'role' = 'staff' OR raw_user_meta_data->>'role' = 'admin')
  )
);
