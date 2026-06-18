-- HighView Student Engagement Platform — Supabase Schema

-- STUDENT PROFILES (replaces localStorage)
CREATE TABLE IF NOT EXISTS student_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  bio text DEFAULT '',
  school text DEFAULT '',
  major text DEFAULT '',
  class_year text DEFAULT '',
  gpa text DEFAULT '',
  location text DEFAULT '',
  phone text DEFAULT '',
  linkedin text DEFAULT '',
  github text DEFAULT '',
  skills text DEFAULT '',
  job_title text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON student_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all profiles" ON student_profiles FOR SELECT USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_user_meta_data->>'role' = 'staff' OR raw_user_meta_data->>'role' = 'admin')));
CREATE POLICY "Users can insert own profile" ON student_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON student_profiles FOR UPDATE USING (auth.uid() = user_id);

-- MILESTONES
CREATE TABLE IF NOT EXISTS milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'engagement',
  type text NOT NULL DEFAULT 'required',
  due_date date,
  points int DEFAULT 10,
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read milestones" ON milestones FOR SELECT USING (true);
CREATE POLICY "Staff can manage milestones" ON milestones FOR ALL USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_user_meta_data->>'role' = 'staff' OR raw_user_meta_data->>'role' = 'admin')));

-- STUDENT MILESTONE PROGRESS
CREATE TABLE IF NOT EXISTS student_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  milestone_id uuid REFERENCES milestones(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'not_started',
  completed_at timestamptz,
  notes text DEFAULT '',
  UNIQUE(user_id, milestone_id)
);
ALTER TABLE student_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own milestones" ON student_milestones FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all milestone progress" ON student_milestones FOR SELECT USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_user_meta_data->>'role' = 'staff' OR raw_user_meta_data->>'role' = 'admin')));

-- DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size int DEFAULT 0,
  uploaded_at timestamptz DEFAULT now()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own documents" ON documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all documents" ON documents FOR SELECT USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_user_meta_data->>'role' = 'staff' OR raw_user_meta_data->>'role' = 'admin')));

-- CONNECTIONS (social capital)
CREATE TABLE IF NOT EXISTS connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  company text DEFAULT '',
  role text DEFAULT '',
  met_at text DEFAULT '',
  met_date date,
  last_contact date,
  linkedin_url text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own connections" ON connections FOR ALL USING (auth.uid() = user_id);

-- ADVISING NOTES
CREATE TABLE IF NOT EXISTS advising_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  staff_user_id uuid REFERENCES auth.users(id),
  staff_name text NOT NULL DEFAULT '',
  note text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE advising_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage advising notes" ON advising_notes FOR ALL USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_user_meta_data->>'role' = 'staff' OR raw_user_meta_data->>'role' = 'admin')));
CREATE POLICY "Students can read own notes" ON advising_notes FOR SELECT USING (auth.uid() = student_user_id);

-- RESOURCES
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'professional',
  url text DEFAULT '',
  organization text DEFAULT '',
  is_featured bool DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read resources" ON resources FOR SELECT USING (true);
CREATE POLICY "Staff can manage resources" ON resources FOR ALL USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_user_meta_data->>'role' = 'staff' OR raw_user_meta_data->>'role' = 'admin')));

-- PROGRESS OVERRIDES
CREATE TABLE IF NOT EXISTS progress_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  staff_user_id uuid REFERENCES auth.users(id),
  ai_score int,
  experiential_score int,
  session_attendance int,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_user_id)
);
ALTER TABLE progress_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage progress overrides" ON progress_overrides FOR ALL USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_user_meta_data->>'role' = 'staff' OR raw_user_meta_data->>'role' = 'admin')));
CREATE POLICY "Students can read own overrides" ON progress_overrides FOR SELECT USING (auth.uid() = student_user_id);

-- SEED MILESTONES
INSERT INTO milestones (title, description, category, type, points, order_index) VALUES
  ('Complete Student Profile', 'Fill out your full profile including bio, skills, and contact information', 'career', 'required', 10, 1),
  ('Upload Resume', 'Upload your most recent resume to your profile', 'career', 'required', 15, 2),
  ('Upload College Transcript', 'Upload your official college transcript', 'academic', 'required', 10, 3),
  ('Attend First Session', 'Attend your first cohort session', 'engagement', 'required', 10, 4),
  ('Complete LinkedIn Profile', 'Set up or update your LinkedIn profile with current education and skills', 'networking', 'required', 15, 5),
  ('Log First Connection', 'Log a professional connection you have made', 'networking', 'required', 10, 6),
  ('Complete AI Workplace Scenario', 'Complete the workplace conflict simulation in AI Coach', 'career', 'required', 20, 7),
  ('Complete AI Interview Scenario', 'Complete the job interview simulation in AI Coach', 'career', 'required', 20, 8),
  ('Apply to an Opportunity', 'Apply to at least one experiential learning opportunity', 'career', 'required', 15, 9),
  ('Attend 3 Consecutive Sessions', 'Attend 3 cohort sessions in a row without missing any', 'engagement', 'optional', 25, 10),
  ('Complete Zero Inbox Sprint', 'Complete the email management simulation in AI Coach', 'career', 'optional', 15, 11),
  ('Connect with a Mentor', 'Log a connection with a mentor or professional in your field', 'networking', 'optional', 20, 12)
ON CONFLICT DO NOTHING;

-- SEED RESOURCES
INSERT INTO resources (title, description, category, url, organization, is_featured) VALUES
  ('HighView Student Handbook', 'Complete guide to the HighView program, requirements, and resources', 'library', '', 'HighView', true),
  ('Resume Writing Guide', 'Step-by-step guide to writing a strong college resume', 'professional', 'https://www.indeed.com/career-advice/resumes-cover-letters/college-resume', 'Indeed', true),
  ('LinkedIn for Students', 'How to build a strong LinkedIn profile as a college student', 'professional', 'https://university.linkedin.com/linkedin-for-students', 'LinkedIn', true),
  ('Handshake — Job & Internship Platform', 'Find internships, jobs, and career events at your school', 'campus', 'https://joinhandshake.com', 'Handshake', true),
  ('Federal Work-Study Program', 'Find work-study opportunities at your institution', 'campus', 'https://studentaid.gov/understand-aid/types/work-study', 'Federal Student Aid', false),
  ('Idealist — Nonprofit Opportunities', 'Find internships and jobs in the nonprofit sector', 'national', 'https://www.idealist.org', 'Idealist', false),
  ('Internships.com', 'Search thousands of paid internships nationwide', 'national', 'https://www.internships.com', 'Internships.com', false),
  ('Toastmasters International', 'Build public speaking and leadership skills', 'local', 'https://www.toastmasters.org', 'Toastmasters', false),
  ('Coursera — Free Courses', 'Take free online courses from top universities', 'library', 'https://www.coursera.org', 'Coursera', false),
  ('Khan Academy', 'Free educational resources for math, science, and more', 'library', 'https://www.khanacademy.org', 'Khan Academy', false)
ON CONFLICT DO NOTHING;
