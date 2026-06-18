import { supabase } from '../lib/supabase'

// ── Types ──────────────────────────────────────────────────────────────────

export interface StudentProfileData {
  bio: string
  school: string
  major: string
  class_year: string
  gpa: string
  location: string
  phone: string
  linkedin: string
  github: string
  skills: string
  job_title: string
}

export interface Milestone {
  id: string
  title: string
  description: string
  category: string
  type: string
  due_date: string | null
  points: number
  order_index: number
  created_at: string
}

export interface StudentMilestone {
  id: string
  user_id: string
  milestone_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  completed_at: string | null
  notes: string
}

export interface Document {
  id: string
  user_id: string
  type: string
  file_name: string
  file_path: string
  file_size: number
  uploaded_at: string
}

export interface Connection {
  id: string
  user_id: string
  name: string
  company: string
  role: string
  met_at: string
  met_date: string | null
  last_contact: string | null
  linkedin_url: string
  notes: string
  created_at: string
  updated_at: string
}

export interface AdvisingNote {
  id: string
  student_user_id: string
  staff_user_id: string
  staff_name: string
  note: string
  created_at: string
}

export interface Resource {
  id: string
  title: string
  description: string
  category: string
  url: string
  organization: string
  is_featured: boolean
  created_at: string
}

export interface ProgressOverride {
  ai_score: number | null
  experiential_score: number | null
  session_attendance: number | null
}

// ── Student Profile ────────────────────────────────────────────────────────

export async function getStudentProfile(userId: string): Promise<StudentProfileData | null> {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('bio,school,major,class_year,gpa,location,phone,linkedin,github,skills,job_title')
    .eq('user_id', userId)
    .single()
  if (error || !data) return null
  return data as StudentProfileData
}

export async function saveStudentProfile(userId: string, profile: Partial<StudentProfileData>): Promise<void> {
  const { error } = await supabase
    .from('student_profiles')
    .upsert({ user_id: userId, ...profile, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) throw new Error(error.message)
}

// ── Milestones ─────────────────────────────────────────────────────────────

export async function getMilestones(): Promise<Milestone[]> {
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .order('order_index', { ascending: true })
  if (error || !data) return []
  return data as Milestone[]
}

export async function getStudentMilestoneProgress(userId: string): Promise<StudentMilestone[]> {
  const { data, error } = await supabase
    .from('student_milestones')
    .select('*')
    .eq('user_id', userId)
  if (error || !data) return []
  return data as StudentMilestone[]
}

export async function upsertMilestoneStatus(
  userId: string,
  milestoneId: string,
  status: 'not_started' | 'in_progress' | 'completed'
): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('student_milestones')
    .upsert({
      user_id: userId,
      milestone_id: milestoneId,
      status,
      completed_at: status === 'completed' ? now : null,
    }, { onConflict: 'user_id,milestone_id' })
  if (error) throw new Error(error.message)
}

export async function createMilestone(data: Omit<Milestone, 'id' | 'created_at'>): Promise<void> {
  const { error } = await supabase.from('milestones').insert(data)
  if (error) throw new Error(error.message)
}

export async function deleteMilestone(id: string): Promise<void> {
  const { error } = await supabase.from('milestones').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Documents ──────────────────────────────────────────────────────────────

export async function getDocuments(userId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false })
  if (error || !data) return []
  return data as Document[]
}

export async function uploadDocument(userId: string, file: File, type: string): Promise<Document> {
  const filePath = `${userId}/${type}/${Date.now()}_${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file, { upsert: false })
  if (uploadError) throw new Error(uploadError.message)
  const { data, error } = await supabase
    .from('documents')
    .insert({ user_id: userId, type, file_name: file.name, file_path: filePath, file_size: file.size })
    .select()
    .single()
  if (error || !data) throw new Error('Failed to save document record')
  return data as Document
}

export async function deleteDocument(docId: string, filePath: string): Promise<void> {
  await supabase.storage.from('documents').remove([filePath])
  const { error } = await supabase.from('documents').delete().eq('id', docId)
  if (error) throw new Error(error.message)
}

export async function getDocumentUrl(filePath: string): Promise<string> {
  const { data } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 3600)
  return data?.signedUrl ?? ''
}

// ── Connections ────────────────────────────────────────────────────────────

export async function getConnections(userId: string): Promise<Connection[]> {
  const { data, error } = await supabase
    .from('connections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data as Connection[]
}

export async function addConnection(
  userId: string,
  conn: { name: string; company: string; role: string; met_at: string; met_date: string | null; last_contact: string | null; linkedin_url: string; notes: string }
): Promise<Connection> {
  const { data, error } = await supabase
    .from('connections')
    .insert({ user_id: userId, ...conn })
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to add connection')
  return data as Connection
}

export async function updateConnection(id: string, conn: Partial<Connection>): Promise<void> {
  const { error } = await supabase
    .from('connections')
    .update({ ...conn, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteConnection(id: string): Promise<void> {
  const { error } = await supabase.from('connections').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Advising Notes ─────────────────────────────────────────────────────────

export async function getAdvisingNotes(studentUserId: string): Promise<AdvisingNote[]> {
  const { data, error } = await supabase
    .from('advising_notes')
    .select('*')
    .eq('student_user_id', studentUserId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data as AdvisingNote[]
}

export async function addAdvisingNote(
  studentUserId: string,
  staffUserId: string,
  staffName: string,
  note: string
): Promise<AdvisingNote> {
  const { data, error } = await supabase
    .from('advising_notes')
    .insert({ student_user_id: studentUserId, staff_user_id: staffUserId, staff_name: staffName, note })
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to add note')
  return data as AdvisingNote
}

// ── Resources ──────────────────────────────────────────────────────────────

export async function getResources(category?: string): Promise<Resource[]> {
  let query = supabase
    .from('resources')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
  if (category && category !== 'all') {
    query = query.eq('category', category)
  }
  const { data, error } = await query
  if (error || !data) return []
  return data as Resource[]
}

export async function addResource(resource: {
  title: string; description: string; category: string; url: string; organization: string; is_featured: boolean
}): Promise<Resource> {
  const { data, error } = await supabase
    .from('resources')
    .insert(resource)
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to add resource')
  return data as Resource
}

export async function deleteResource(id: string): Promise<void> {
  const { error } = await supabase.from('resources').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Progress Overrides ─────────────────────────────────────────────────────

export async function getProgressOverrides(studentUserId: string): Promise<ProgressOverride | null> {
  const { data, error } = await supabase
    .from('progress_overrides')
    .select('ai_score, experiential_score, session_attendance')
    .eq('student_user_id', studentUserId)
    .single()
  if (error || !data) return null
  return data as ProgressOverride
}

export async function saveProgressOverrides(
  studentUserId: string,
  staffUserId: string,
  overrides: ProgressOverride
): Promise<void> {
  const { error } = await supabase
    .from('progress_overrides')
    .upsert({
      student_user_id: studentUserId,
      staff_user_id: staffUserId,
      ...overrides,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'student_user_id' })
  if (error) throw new Error(error.message)
}

// ── Opportunities ──────────────────────────────────────────────────────────

export interface OpportunityRecord {
  id: string
  title: string
  company: string
  type: string
  tags: string[]
  location: string
  pay: string
  duration: string
  spots: number | null
  deadline: string
  status: string
  is_paid: boolean
  application_link: string
  created_at: string
}

export async function getOpportunities(): Promise<OpportunityRecord[]> {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data as OpportunityRecord[]
}

export async function addOpportunity(opp: Omit<OpportunityRecord, 'id' | 'created_at'>): Promise<OpportunityRecord> {
  const { data, error } = await supabase
    .from('opportunities')
    .insert(opp)
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to add opportunity')
  return data as OpportunityRecord
}

export async function updateOpportunity(id: string, opp: Partial<OpportunityRecord>): Promise<void> {
  const { error } = await supabase
    .from('opportunities')
    .update({ ...opp, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteOpportunity(id: string): Promise<void> {
  const { error } = await supabase.from('opportunities').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Opportunity Applications ───────────────────────────────────────────────

export async function getMyApplications(userId: string): Promise<Record<string, 'applied' | 'completed'>> {
  const { data, error } = await supabase
    .from('opportunity_applications')
    .select('opportunity_id, status')
    .eq('user_id', userId)
  if (error || !data) return {}
  const map: Record<string, 'applied' | 'completed'> = {}
  data.forEach((row: any) => { map[row.opportunity_id] = row.status })
  return map
}

export async function upsertApplication(userId: string, opportunityId: string, status: 'applied' | 'completed' | null): Promise<void> {
  if (status === null) {
    await supabase.from('opportunity_applications').delete().eq('user_id', userId).eq('opportunity_id', opportunityId)
    return
  }
  const { error } = await supabase
    .from('opportunity_applications')
    .upsert({
      user_id: userId,
      opportunity_id: opportunityId,
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    }, { onConflict: 'user_id,opportunity_id' })
  if (error) throw new Error(error.message)
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export interface SessionRecord {
  id: string
  title: string
  date: string
  time: string
  type: string
  instructor: string
  required_grades: string[]
  created_at: string
}

export interface SessionRegistration {
  id: string
  session_id: string
  user_id: string
  student_name: string
  registered_at: string
}

export async function getSessions(): Promise<SessionRecord[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('date', { ascending: true })
  if (error || !data) return []
  return data as SessionRecord[]
}

export async function createSession(session: Omit<SessionRecord, 'id' | 'created_at'>): Promise<SessionRecord> {
  const { data, error } = await supabase
    .from('sessions')
    .insert(session)
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to create session')
  return data as SessionRecord
}

export async function updateSession(id: string, session: Partial<SessionRecord>): Promise<void> {
  const { error } = await supabase.from('sessions').update(session).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getSessionRegistrations(sessionId: string): Promise<SessionRegistration[]> {
  const { data, error } = await supabase
    .from('session_registrations')
    .select('*')
    .eq('session_id', sessionId)
  if (error || !data) return []
  return data as SessionRegistration[]
}

export async function registerForSession(userId: string, sessionId: string, studentName: string): Promise<void> {
  const { error } = await supabase
    .from('session_registrations')
    .upsert({ user_id: userId, session_id: sessionId, student_name: studentName }, { onConflict: 'session_id,user_id' })
  if (error) throw new Error(error.message)
}

export async function unregisterFromSession(userId: string, sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('session_registrations')
    .delete()
    .eq('user_id', userId)
    .eq('session_id', sessionId)
  if (error) throw new Error(error.message)
}

export async function getMySessionRegistrations(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('session_registrations')
    .select('session_id')
    .eq('user_id', userId)
  if (error || !data) return []
  return data.map((r: any) => r.session_id)
}

export async function getSessionNoShows(sessionId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('session_no_shows')
    .select('user_id')
    .eq('session_id', sessionId)
  if (error || !data) return []
  return data.map((r: any) => r.user_id)
}

export async function toggleSessionNoShow(sessionId: string, userId: string, markedBy: string, isNoShow: boolean): Promise<void> {
  if (isNoShow) {
    await supabase.from('session_no_shows').delete().eq('session_id', sessionId).eq('user_id', userId)
  } else {
    const { error } = await supabase
      .from('session_no_shows')
      .upsert({ session_id: sessionId, user_id: userId, marked_by: markedBy }, { onConflict: 'session_id,user_id' })
    if (error) throw new Error(error.message)
  }
}

// ── Course Registrations ──────────────────────────────────────────────────────

export async function getMyCourseRegistrations(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('course_registrations')
    .select('course_id')
    .eq('user_id', userId)
  if (error || !data) return []
  return data.map((r: any) => r.course_id)
}

export async function setCourseRegistration(userId: string, courseId: string, enrolled: boolean): Promise<void> {
  if (enrolled) {
    const { error } = await supabase
      .from('course_registrations')
      .upsert({ user_id: userId, course_id: courseId }, { onConflict: 'user_id,course_id' })
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('course_registrations')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId)
    if (error) throw new Error(error.message)
  }
}

// ── Students ──────────────────────────────────────────────────────────────────

export interface StudentRecord {
  id: string
  name: string
  email: string
  phone: string
  university: string
  major: string
  expected_graduation: number
  cohort: string
  enrollment_date: string
  status: string
  attendance_rate: number
  engagement_score: number
  sessions_attended: number
  total_sessions: number
  gpa: number
  picture: string
}

export interface SemesterStat {
  student_id: string
  student_name: string
  engagement_score: number
  attendance_rate: number
  participation_points: number
  total_points: number
  semester: string
  previous_semester_score: number | null
}

export async function getStudents(): Promise<StudentRecord[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('name', { ascending: true })
  if (error || !data) return []
  return data as StudentRecord[]
}

export async function addStudentRecord(student: Omit<StudentRecord, never>): Promise<StudentRecord> {
  const { data, error } = await supabase
    .from('students')
    .upsert(student, { onConflict: 'id' })
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to add student')
  return data as StudentRecord
}

export async function getStudentSemesterStats(semesterId: string): Promise<SemesterStat[]> {
  const { data, error } = await supabase
    .from('student_semester_stats')
    .select('*')
    .eq('semester', semesterId)
    .order('total_points', { ascending: false })
  if (error || !data) return []
  return data as SemesterStat[]
}
