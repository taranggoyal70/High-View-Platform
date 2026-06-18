-- Opportunities table (replaces localStorage + hardcoded mockOpportunities)

CREATE TABLE IF NOT EXISTS opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'Job shadows',
  tags text[] DEFAULT '{}',
  location text DEFAULT '',
  pay text DEFAULT '',
  duration text DEFAULT '',
  spots int,
  deadline text DEFAULT '',
  status text DEFAULT '',
  is_paid bool DEFAULT false,
  application_link text DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read opportunities" ON opportunities FOR SELECT USING (true);
CREATE POLICY "Staff can manage opportunities" ON opportunities FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (raw_user_meta_data->>'role' = 'staff' OR raw_user_meta_data->>'role' = 'admin')
  )
);

-- STUDENT OPPORTUNITY TRACKING
CREATE TABLE IF NOT EXISTS opportunity_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  opportunity_id uuid REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'applied',
  applied_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(user_id, opportunity_id)
);

ALTER TABLE opportunity_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own applications" ON opportunity_applications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all applications" ON opportunity_applications FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (raw_user_meta_data->>'role' = 'staff' OR raw_user_meta_data->>'role' = 'admin')
  )
);

-- SEED real opportunities
INSERT INTO opportunities (title, company, type, tags, location, pay, deadline, status, is_paid, application_link) VALUES
  ('Brand Strategy Micro-Internship', 'Crocs Inc.', 'Micro-internships', ARRAY['Marketing', '6 weeks'], 'Remote', '$18/hr', 'Apr 15', 'Closes Soon', true, ''),
  ('Curated Connections — Spring', 'HighView × 8 Partners', 'Networking', ARRAY['Apr 4'], 'Virtual', 'Free', '', 'New', false, ''),
  ('HR Job Shadow', 'Pinnacol Assurance', 'Job shadows', ARRAY['HR / People Ops', 'Half day'], 'Denver, CO', '', '', '', false, ''),
  ('Embedded Project Team — AI Strategy', 'ChatWalrus', 'Micro-internships', ARRAY['Tech / AI', '10 weeks'], 'Hybrid', '$20/hr', 'May 1', 'Closes Soon', true, '')
ON CONFLICT DO NOTHING;
