import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, X, Users, Monitor, AlertCircle, CalendarPlus, ChevronDown, UserCheck, Edit, Trash2, BarChart3, Activity, ShieldAlert, GraduationCap, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { addToCalendar } from '../utils/calendarUtils'
import { SemesterSelector } from '../components/SemesterSelector'
import { useSemester } from '../contexts/SemesterContext'
import { getStatsBySemester } from '../data/semesterData'
import { supabase } from '../lib/supabase'
import {
  getSessions, createSession, updateSession, deleteSession,
  getSessionRegistrations, registerForSession, unregisterFromSession,
  getMySessionRegistrations, getSessionNoShows, toggleSessionNoShow,
} from '../services/supabaseService'
import type { SessionRecord, SessionRegistration } from '../services/supabaseService'

export default function SessionsPage() {
  const [userRole, setUserRole] = useState<'staff' | 'student'>('student')
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null)
  const [calendarDropdownOpen, setCalendarDropdownOpen] = useState<string | null>(null)
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<SessionRecord | null>(null)
  const [sessionFormData, setSessionFormData] = useState({
    title: '',
    date: '',
    time: '',
    type: 'Virtual' as string,
    instructor: '',
    required_grades: [] as string[],
  })
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [myRegistrations, setMyRegistrations] = useState<string[]>([]) // session IDs
  const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({})
  const [registeredStudentsModalOpen, setRegisteredStudentsModalOpen] = useState(false)
  const [selectedSessionForView, setSelectedSessionForView] = useState<SessionRecord | null>(null)
  const [selectedSessionRegistrations, setSelectedSessionRegistrations] = useState<SessionRegistration[]>([])
  const [noShowsForSelected, setNoShowsForSelected] = useState<string[]>([])
  const [sessionFormError, setSessionFormError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const { selectedSemester } = useSemester()
  const stats = useMemo(() => getStatsBySemester(selectedSemester.id), [selectedSemester.id])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const role = (user.user_metadata?.role === 'staff' || user.user_metadata?.role === 'admin') ? 'staff' : 'student'
        setUserRole(role)
        const name = user.user_metadata?.full_name || user.email || ''
        setCurrentUser({ id: user.id, name })

        const [sessionList, myRegs] = await Promise.all([
          getSessions(),
          getMySessionRegistrations(user.id),
        ])
        setSessions(sessionList)
        setMyRegistrations(myRegs)

        // Load registration counts for all sessions
        const counts: Record<string, number> = {}
        await Promise.all(sessionList.map(async s => {
          const regs = await getSessionRegistrations(s.id)
          counts[s.id] = regs.length
        }))
        setRegistrationCounts(counts)
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleRegister = async (sessionId: string) => {
    if (!currentUser) return
    const isReg = myRegistrations.includes(sessionId)
    if (isReg) {
      await unregisterFromSession(currentUser.id, sessionId)
      setMyRegistrations(prev => prev.filter(id => id !== sessionId))
      setRegistrationCounts(prev => ({ ...prev, [sessionId]: (prev[sessionId] || 1) - 1 }))
    } else {
      await registerForSession(currentUser.id, sessionId, currentUser.name)
      setMyRegistrations(prev => [...prev, sessionId])
      setRegistrationCounts(prev => ({ ...prev, [sessionId]: (prev[sessionId] || 0) + 1 }))
    }
  }

  const openRegisteredModal = async (session: SessionRecord) => {
    setSelectedSessionForView(session)
    const [regs, noShows] = await Promise.all([
      getSessionRegistrations(session.id),
      getSessionNoShows(session.id),
    ])
    setSelectedSessionRegistrations(regs)
    setNoShowsForSelected(noShows)
    setRegisteredStudentsModalOpen(true)
  }

  const handleToggleNoShow = async (userId: string) => {
    if (!selectedSessionForView || !currentUser) return
    const isNS = noShowsForSelected.includes(userId)
    await toggleSessionNoShow(selectedSessionForView.id, userId, currentUser.id, isNS)
    setNoShowsForSelected(prev =>
      isNS ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const handleAddSession = async () => {
    if (!sessionFormData.title || !sessionFormData.date || !sessionFormData.time || !sessionFormData.instructor) {
      setSessionFormError('Please fill in all required fields: Title, Date, Time, and Instructor.')
      return
    }
    setSessionFormError(null)
    setSaving(true)
    try {
      if (editingSession) {
        await updateSession(editingSession.id, sessionFormData)
        setSessions(prev => prev.map(s => s.id === editingSession.id ? { ...s, ...sessionFormData } : s))
      } else {
        const newSession = await createSession(sessionFormData)
        setSessions(prev => [...prev, newSession])
        setRegistrationCounts(prev => ({ ...prev, [newSession.id]: 0 }))
      }
      setSessionFormData({ title: '', date: '', time: '', type: 'Virtual', instructor: '', required_grades: [] })
      setEditingSession(null)
      setSessionModalOpen(false)
    } catch (err) {
      setSessionFormError('Failed to save session. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId)
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    setConfirmDeleteId(null)
  }

  const recentActivities = useMemo(() =>
    sessions.slice(-5).reverse().map(s => ({
      event: 'Session Scheduled',
      detail: `${s.title}`,
      time: s.date,
    })), [sessions])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Sessions</h1>
          {userRole === 'staff' && (
            <Button
              onClick={() => {
                setEditingSession(null)
                setSessionFormData({ title: '', date: '', time: '', type: 'Virtual', instructor: '', required_grades: [] })
                setSessionModalOpen(true)
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              + Add Session
            </Button>
          )}
        </div>

        {/* Semester Selector */}
        <div className="mb-6">
          <SemesterSelector />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg"><GraduationCap className="h-5 w-5 text-blue-600" /></div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalStudents}</p>
                  <p className="text-sm text-gray-500">Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg"><Activity className="h-5 w-5 text-green-600" /></div>
                <div>
                  <p className="text-2xl font-bold">{stats.avgAttendance}%</p>
                  <p className="text-sm text-gray-500">Avg Attendance</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg"><BarChart3 className="h-5 w-5 text-purple-600" /></div>
                <div>
                  <p className="text-2xl font-bold">{sessions.length}</p>
                  <p className="text-sm text-gray-500">Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg"><ShieldAlert className="h-5 w-5 text-amber-600" /></div>
                <div>
                  <p className="text-2xl font-bold">{stats.topPerformers}</p>
                  <p className="text-sm text-gray-500">Top Performers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">Upcoming Sessions</h2>
            {sessions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  No sessions scheduled yet. {userRole === 'staff' ? 'Add your first session above.' : 'Check back soon.'}
                </CardContent>
              </Card>
            ) : sessions.map(session => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{session.title}</h3>
                        <p className="text-gray-500 text-sm">{session.instructor}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          session.type === 'Virtual' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {session.type === 'Virtual' ? <Monitor className="w-3 h-3 inline mr-1" /> : null}
                          {session.type}
                        </span>
                        {userRole === 'staff' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditingSession(session)
                                setSessionFormData({
                                  title: session.title,
                                  date: session.date,
                                  time: session.time,
                                  type: session.type,
                                  instructor: session.instructor,
                                  required_grades: session.required_grades || [],
                                })
                                setSessionModalOpen(true)
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(session.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{session.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{session.time}</span>
                      <span className="flex items-center gap-1"><Users className="w-4 h-4" />{registrationCounts[session.id] || 0} registered</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {userRole === 'student' && (
                        <Button
                          size="sm"
                          variant={myRegistrations.includes(session.id) ? 'outline' : 'default'}
                          onClick={() => handleRegister(session.id)}
                          className={myRegistrations.includes(session.id) ? 'border-green-300 text-green-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300' : ''}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          {myRegistrations.includes(session.id) ? 'Registered ✓' : 'Register'}
                        </Button>
                      )}
                      {userRole === 'staff' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openRegisteredModal(session)}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          View Registered ({registrationCounts[session.id] || 0})
                        </Button>
                      )}
                      <div className="relative">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCalendarDropdownOpen(calendarDropdownOpen === session.id ? null : session.id)}
                        >
                          <CalendarPlus className="h-4 w-4 mr-1" />
                          Add to Calendar
                          <ChevronDown className="h-3 w-3 ml-1" />
                        </Button>
                        {calendarDropdownOpen === session.id && (
                          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <button
                              onClick={() => {
                                const [startTime, endTime] = session.time.split(' - ')
                                addToCalendar({ title: session.title, description: '', location: session.type, startDate: session.date, startTime: startTime || session.time, endTime: endTime || startTime || session.time, instructor: session.instructor }, 'google')
                                setCalendarDropdownOpen(null)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                            >
                              Google Calendar
                            </button>
                            <button
                              onClick={() => {
                                const [startTime, endTime] = session.time.split(' - ')
                                addToCalendar({ title: session.title, description: '', location: session.type, startDate: session.date, startTime: startTime || session.time, endTime: endTime || startTime || session.time, instructor: session.instructor }, 'ics')
                                setCalendarDropdownOpen(null)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                            >
                              Download .ics
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Right Panel: Recent Activity */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Latest session updates</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivities.length === 0 ? (
                  <p className="text-sm text-gray-500">No recent activity.</p>
                ) : (
                  <div className="space-y-3">
                    {recentActivities.map((activity, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{activity.event}</p>
                          <p className="text-xs text-gray-500">{activity.detail}</p>
                          <p className="text-xs text-gray-400">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {userRole === 'staff' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Semester Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Avg Engagement</span>
                    <span className="font-semibold">{stats.avgEngagement}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Active Sessions</span>
                    <span className="font-semibold">{sessions.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Top Performers</span>
                    <span className="font-semibold">{stats.topPerformers}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Add/Edit Session Modal */}
        {sessionModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl max-w-lg w-full p-6 relative shadow-2xl"
            >
              <button
                onClick={() => { setSessionModalOpen(false); setEditingSession(null); setSessionFormError(null) }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold mb-4">
                {editingSession ? 'Edit Session' : 'Add New Session'}
              </h2>
              {sessionFormError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {sessionFormError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={sessionFormData.title}
                    onChange={e => setSessionFormData({ ...sessionFormData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Career Planning Workshop"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="text"
                      value={sessionFormData.date}
                      onChange={e => setSessionFormData({ ...sessionFormData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Oct 28, 2025"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                    <input
                      type="text"
                      value={sessionFormData.time}
                      onChange={e => setSessionFormData({ ...sessionFormData, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 2:00 PM - 4:00 PM"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={sessionFormData.type}
                      onChange={e => setSessionFormData({ ...sessionFormData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Virtual">Virtual</option>
                      <option value="In-Person">In-Person</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructor *</label>
                    <input
                      type="text"
                      value={sessionFormData.instructor}
                      onChange={e => setSessionFormData({ ...sessionFormData, instructor: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Dr. Smith"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button onClick={handleAddSession} className="flex-1" disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {editingSession ? 'Update Session' : 'Add Session'}
                  </Button>
                  <Button variant="outline" onClick={() => { setSessionModalOpen(false); setEditingSession(null); setSessionFormError(null) }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Confirm Delete */}
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl">
              <h3 className="text-lg font-bold mb-2">Delete Session?</h3>
              <p className="text-gray-600 mb-4 text-sm">This will also remove all registrations and no-show records for this session.</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={() => handleDeleteSession(confirmDeleteId)}>Delete</Button>
              </div>
            </div>
          </div>
        )}

        {/* Registered Students Modal (Staff) */}
        {registeredStudentsModalOpen && selectedSessionForView && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">{selectedSessionForView.title}</h3>
                <button onClick={() => setRegisteredStudentsModalOpen(false)}><X className="h-5 w-5 text-gray-400 hover:text-gray-600" /></button>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                {selectedSessionRegistrations.length} registered student{selectedSessionRegistrations.length !== 1 ? 's' : ''}
                {noShowsForSelected.length > 0 && ` · ${noShowsForSelected.length} no-show${noShowsForSelected.length !== 1 ? 's' : ''}`}
              </p>
              {selectedSessionRegistrations.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">No students registered yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedSessionRegistrations.map(reg => {
                    const isNS = noShowsForSelected.includes(reg.user_id)
                    return (
                      <div
                        key={reg.user_id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${isNS ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <div>
                          <p className={`text-sm font-medium ${isNS ? 'text-red-700 line-through' : ''}`}>{reg.student_name || 'Unknown'}</p>
                          {isNS && <p className="text-xs text-red-500">No-show</p>}
                        </div>
                        <button
                          onClick={() => handleToggleNoShow(reg.user_id)}
                          className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                            isNS
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'bg-gray-200 text-gray-600 hover:bg-red-100 hover:text-red-600'
                          }`}
                        >
                          {isNS ? 'Undo' : 'No-show'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
