-- Students roster table (replaces hardcoded studentsData.ts)
CREATE TABLE IF NOT EXISTS students (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  university text DEFAULT '',
  major text DEFAULT '',
  expected_graduation int,
  cohort text DEFAULT '2026-27 College Cohort',
  enrollment_date text DEFAULT '',
  status text DEFAULT 'Active',
  attendance_rate int DEFAULT 0,
  engagement_score int DEFAULT 0,
  sessions_attended int DEFAULT 0,
  total_sessions int DEFAULT 0,
  gpa numeric(3,2),
  picture text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read students" ON students FOR SELECT USING (true);
CREATE POLICY "Staff can manage students" ON students FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (raw_user_meta_data->>'role' = 'staff' OR raw_user_meta_data->>'role' = 'admin')
  )
);

-- Student semester performance (replaces hardcoded semesterData.ts)
CREATE TABLE IF NOT EXISTS student_semester_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  student_name text NOT NULL,
  engagement_score int NOT NULL,
  attendance_rate int NOT NULL,
  participation_points int NOT NULL,
  total_points int NOT NULL,
  semester text NOT NULL,
  previous_semester_score int,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, semester)
);

ALTER TABLE student_semester_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read semester stats" ON student_semester_stats FOR SELECT USING (true);
CREATE POLICY "Staff can manage semester stats" ON student_semester_stats FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (raw_user_meta_data->>'role' = 'staff' OR raw_user_meta_data->>'role' = 'admin')
  )
);

-- Seed 27 students
INSERT INTO students (id, name, email, phone, university, major, expected_graduation, cohort, enrollment_date, status, attendance_rate, engagement_score, sessions_attended, total_sessions, gpa, picture) VALUES
  ('STU001','Alex Rivera','alex.rivera@highview.org','(720) 555-0101','University of Colorado Denver','Computer Science',2026,'2026-27 College Cohort','2024-09-01','Active',92,88,23,25,3.7,'https://ui-avatars.com/api/?name=Alex+Rivera&background=4f46e5&color=fff'),
  ('STU002','Priya Sharma','priya.sharma@highview.org','(303) 555-0102','Colorado State University','Business Analytics',2026,'2026-27 College Cohort','2024-09-01','Active',96,94,24,25,3.9,'https://ui-avatars.com/api/?name=Priya+Sharma&background=7c3aed&color=fff'),
  ('STU003','Jordan Williams','jordan.williams@highview.org','(720) 555-0103','University of Denver','Social Work',2027,'2026-27 College Cohort','2024-09-01','Active',84,76,21,25,3.4,'https://ui-avatars.com/api/?name=Jordan+Williams&background=059669&color=fff'),
  ('STU004','Marcus Thompson','marcus.thompson@highview.org','(303) 555-0104','University of Colorado Boulder','Engineering',2026,'2026-27 College Cohort','2024-09-01','Active',88,82,22,25,3.6,'https://ui-avatars.com/api/?name=Marcus+Thompson&background=dc2626&color=fff'),
  ('STU005','Sarah Mitchell','sarah.mitchell@highview.org','(720) 555-0105','Regis University','Psychology',2027,'2026-27 College Cohort','2024-09-01','Active',100,96,25,25,4.0,'https://ui-avatars.com/api/?name=Sarah+Mitchell&background=d97706&color=fff'),
  ('STU006','David Chen','david.chen@highview.org','(303) 555-0106','University of Colorado Denver','Data Science',2026,'2026-27 College Cohort','2024-09-01','Active',76,68,19,25,3.2,'https://ui-avatars.com/api/?name=David+Chen&background=2563eb&color=fff'),
  ('STU007','Ethan Brooks','ethan.brooks@highview.org','(720) 555-0107','Metropolitan State University','Music Technology',2027,'2026-27 College Cohort','2024-09-01','Active',92,85,23,25,3.5,'https://ui-avatars.com/api/?name=Ethan+Brooks&background=0891b2&color=fff'),
  ('STU008','Maya Patel','maya.patel@highview.org','(303) 555-0108','Colorado State University','Marketing',2026,'2026-27 College Cohort','2024-09-01','Active',80,74,20,25,3.3,'https://ui-avatars.com/api/?name=Maya+Patel&background=9333ea&color=fff'),
  ('STU009','Tyler Johnson','tyler.johnson@highview.org','(720) 555-0109','University of Denver','Finance',2027,'2026-27 College Cohort','2024-09-01','Active',68,62,17,25,2.9,'https://ui-avatars.com/api/?name=Tyler+Johnson&background=ea580c&color=fff'),
  ('STU010','Isabella Garcia','isabella.garcia@highview.org','(303) 555-0110','University of Colorado Boulder','Environmental Science',2026,'2026-27 College Cohort','2024-09-01','Active',94,90,24,25,3.8,'https://ui-avatars.com/api/?name=Isabella+Garcia&background=16a34a&color=fff'),
  ('STU011','Kevin Nguyen','kevin.nguyen@highview.org','(720) 555-0111','Regis University','Nursing',2027,'2026-27 College Cohort','2024-09-01','Active',88,84,22,25,3.6,'https://ui-avatars.com/api/?name=Kevin+Nguyen&background=0284c7&color=fff'),
  ('STU012','Olivia Martinez','olivia.martinez@highview.org','(303) 555-0112','Metropolitan State University','Graphic Design',2026,'2026-27 College Cohort','2024-09-01','Active',72,70,18,25,3.1,'https://ui-avatars.com/api/?name=Olivia+Martinez&background=db2777&color=fff'),
  ('STU013','Ryan O''Connor','ryan.oconnor@highview.org','(720) 555-0113','University of Colorado Denver','Criminal Justice',2027,'2026-27 College Cohort','2024-09-01','At Risk',56,48,14,25,2.5,'https://ui-avatars.com/api/?name=Ryan+OConnor&background=dc2626&color=fff'),
  ('STU014','Sophia Lee','sophia.lee@highview.org','(303) 555-0114','Colorado State University','Biology',2026,'2026-27 College Cohort','2024-09-01','Active',90,86,23,25,3.7,'https://ui-avatars.com/api/?name=Sophia+Lee&background=7c3aed&color=fff'),
  ('STU015','Brandon Smith','brandon.smith@highview.org','(720) 555-0115','University of Denver','Communications',2027,'2026-27 College Cohort','2024-09-01','Active',78,72,20,25,3.2,'https://ui-avatars.com/api/?name=Brandon+Smith&background=059669&color=fff'),
  ('STU016','Emma Davis','emma.davis@highview.org','(303) 555-0116','University of Colorado Boulder','Mathematics',2026,'2026-27 College Cohort','2024-09-01','Active',96,92,24,25,3.9,'https://ui-avatars.com/api/?name=Emma+Davis&background=4f46e5&color=fff'),
  ('STU017','Carlos Rodriguez','carlos.rodriguez@highview.org','(720) 555-0117','Regis University','Business Administration',2027,'2026-27 College Cohort','2024-09-01','Active',84,78,21,25,3.4,'https://ui-avatars.com/api/?name=Carlos+Rodriguez&background=d97706&color=fff'),
  ('STU018','Ava Wilson','ava.wilson@highview.org','(303) 555-0118','Metropolitan State University','Education',2026,'2026-27 College Cohort','2024-09-01','Active',92,88,23,25,3.6,'https://ui-avatars.com/api/?name=Ava+Wilson&background=0891b2&color=fff'),
  ('STU019','Nathan Brown','nathan.brown@highview.org','(720) 555-0119','University of Colorado Denver','Political Science',2027,'2026-27 College Cohort','2024-09-01','At Risk',64,58,16,25,2.7,'https://ui-avatars.com/api/?name=Nathan+Brown&background=dc2626&color=fff'),
  ('STU020','Mia Anderson','mia.anderson@highview.org','(303) 555-0120','Colorado State University','Chemistry',2026,'2026-27 College Cohort','2024-09-01','Active',88,82,22,25,3.5,'https://ui-avatars.com/api/?name=Mia+Anderson&background=2563eb&color=fff'),
  ('STU021','Lucas Taylor','lucas.taylor@highview.org','(720) 555-0121','University of Denver','Economics',2027,'2026-27 College Cohort','2024-09-01','Active',76,70,19,25,3.1,'https://ui-avatars.com/api/?name=Lucas+Taylor&background=9333ea&color=fff'),
  ('STU022','Chloe Thomas','chloe.thomas@highview.org','(303) 555-0122','University of Colorado Boulder','Architecture',2026,'2026-27 College Cohort','2024-09-01','Active',94,90,24,25,3.8,'https://ui-avatars.com/api/?name=Chloe+Thomas&background=ea580c&color=fff'),
  ('STU023','Daniel Kim','daniel.kim@highview.org','(720) 555-0123','Regis University','Accounting',2027,'2026-27 College Cohort','2024-09-01','Active',80,76,20,25,3.3,'https://ui-avatars.com/api/?name=Daniel+Kim&background=16a34a&color=fff'),
  ('STU024','Grace White','grace.white@highview.org','(303) 555-0124','Metropolitan State University','Theater Arts',2026,'2026-27 College Cohort','2024-09-01','Active',86,80,22,25,3.4,'https://ui-avatars.com/api/?name=Grace+White&background=db2777&color=fff'),
  ('STU025','Elijah Harris','elijah.harris@highview.org','(720) 555-0125','University of Colorado Denver','Information Systems',2027,'2026-27 College Cohort','2024-09-01','Active',90,84,23,25,3.6,'https://ui-avatars.com/api/?name=Elijah+Harris&background=0284c7&color=fff'),
  ('STU026','Zoe Martin','zoe.martin@highview.org','(303) 555-0126','Colorado State University','Veterinary Science',2026,'2026-27 College Cohort','2024-09-01','Active',98,95,25,25,3.9,'https://ui-avatars.com/api/?name=Zoe+Martin&background=7c3aed&color=fff'),
  ('STU027','Jackson Lee','jackson.lee@highview.org','(720) 555-0127','University of Denver','Sports Management',2027,'2026-27 College Cohort','2024-09-01','Active',74,68,19,25,3.0,'https://ui-avatars.com/api/?name=Jackson+Lee&background=4f46e5&color=fff')
ON CONFLICT DO NOTHING;

-- Seed semester stats (from semesterData.ts)
INSERT INTO student_semester_stats (student_id, student_name, engagement_score, attendance_rate, participation_points, total_points, semester, previous_semester_score) VALUES
  -- Fall 2024
  ('STU001','Alex Rivera',85,88,340,1313,'fall-2024',NULL),
  ('STU002','Priya Sharma',82,85,320,1287,'fall-2024',NULL),
  ('STU003','Jordan Williams',88,90,350,1428,'fall-2024',NULL),
  ('STU004','Marcus Thompson',78,82,300,1260,'fall-2024',NULL),
  ('STU005','Sarah Mitchell',90,92,360,1442,'fall-2024',NULL),
  ('STU006','David Chen',75,78,280,1233,'fall-2024',NULL),
  ('STU007','Ethan Brooks',92,95,380,1467,'fall-2024',NULL),
  ('STU008','Maya Patel',80,83,310,1273,'fall-2024',NULL),
  ('STU009','Tyler Johnson',86,89,345,1420,'fall-2024',NULL),
  ('STU010','Isabella Garcia',84,87,335,1406,'fall-2024',NULL),
  -- Spring 2025
  ('STU001','Alex Rivera',92,94,390,1476,'spring-2025',85),
  ('STU002','Priya Sharma',88,90,360,1438,'spring-2025',82),
  ('STU003','Jordan Williams',90,92,370,1452,'spring-2025',88),
  ('STU004','Marcus Thompson',76,80,290,1246,'spring-2025',78),
  ('STU005','Sarah Mitchell',91,93,365,1449,'spring-2025',90),
  ('STU006','David Chen',80,84,310,1374,'spring-2025',75),
  ('STU007','Ethan Brooks',94,97,400,1491,'spring-2025',92),
  ('STU008','Maya Patel',82,85,320,1387,'spring-2025',80),
  ('STU009','Tyler Johnson',87,90,350,1427,'spring-2025',86),
  ('STU010','Isabella Garcia',85,88,340,1413,'spring-2025',84),
  ('STU011','Kevin Nguyen',79,82,305,1366,'spring-2025',NULL),
  -- Summer 2025
  ('STU001','Alex Rivera',95,97,410,1502,'summer-2025',92),
  ('STU003','Jordan Williams',91,93,375,1459,'summer-2025',90),
  ('STU005','Sarah Mitchell',92,94,370,1456,'summer-2025',91),
  ('STU006','David Chen',83,87,325,1395,'summer-2025',80),
  ('STU007','Ethan Brooks',96,98,420,1514,'summer-2025',94),
  ('STU009','Tyler Johnson',88,91,355,1434,'summer-2025',87),
  ('STU011','Kevin Nguyen',82,85,315,1382,'summer-2025',79),
  -- Fall 2025
  ('STU001','Alex Rivera',97,99,430,1526,'fall-2025',95),
  ('STU002','Priya Sharma',90,93,375,1458,'fall-2025',88),
  ('STU003','Jordan Williams',92,94,380,1466,'fall-2025',91),
  ('STU004','Marcus Thompson',78,82,295,1255,'fall-2025',76),
  ('STU005','Sarah Mitchell',93,95,375,1463,'fall-2025',92),
  ('STU006','David Chen',85,89,335,1409,'fall-2025',83),
  ('STU007','Ethan Brooks',98,100,440,1538,'fall-2025',96),
  ('STU008','Maya Patel',84,87,330,1401,'fall-2025',82),
  ('STU009','Tyler Johnson',89,92,360,1441,'fall-2025',88),
  ('STU010','Isabella Garcia',86,89,345,1420,'fall-2025',85),
  ('STU011','Kevin Nguyen',84,87,325,1396,'fall-2025',82),
  ('STU012','Olivia Martinez',81,84,310,1375,'fall-2025',NULL),
  -- Spring 2026
  ('STU001','Alex Rivera',98,100,450,1548,'spring-2026',97),
  ('STU002','Priya Sharma',92,95,390,1477,'spring-2026',90),
  ('STU003','Jordan Williams',93,95,385,1473,'spring-2026',92),
  ('STU004','Marcus Thompson',80,84,305,1269,'spring-2026',78),
  ('STU005','Sarah Mitchell',94,96,380,1470,'spring-2026',93),
  ('STU006','David Chen',87,90,345,1422,'spring-2026',85),
  ('STU007','Ethan Brooks',99,100,460,1559,'spring-2026',98),
  ('STU008','Maya Patel',86,89,340,1415,'spring-2026',84),
  ('STU009','Tyler Johnson',90,93,365,1448,'spring-2026',89),
  ('STU010','Isabella Garcia',87,90,350,1427,'spring-2026',86),
  ('STU011','Kevin Nguyen',85,88,330,1403,'spring-2026',84),
  ('STU012','Olivia Martinez',83,86,320,1389,'spring-2026',81),
  -- Summer 2026
  ('STU001','Alex Rivera',99,100,470,1569,'summer-2026',98),
  ('STU002','Priya Sharma',93,96,395,1484,'summer-2026',92),
  ('STU005','Sarah Mitchell',95,97,385,1477,'summer-2026',94),
  ('STU007','Ethan Brooks',99,100,465,1564,'summer-2026',99),
  ('STU009','Tyler Johnson',91,94,370,1455,'summer-2026',90),
  ('STU012','Olivia Martinez',84,87,325,1396,'summer-2026',83)
ON CONFLICT DO NOTHING;
