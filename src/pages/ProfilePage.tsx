import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Calendar, Award, TrendingUp, BookOpen, Briefcase, Bell, Shield, Moon, Globe } from 'lucide-react'
import { Button } from '../components/ui/button'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [jobTitle, setJobTitle] = useState('')
  const [editingJobTitle, setEditingJobTitle] = useState(false)
  const [jobTitleInput, setJobTitleInput] = useState('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    const savedJobTitle = localStorage.getItem('staffJobTitle')
    if (savedJobTitle) {
      setJobTitle(savedJobTitle)
      setJobTitleInput(savedJobTitle)
    }
  }, [])

  const saveJobTitle = () => {
    setJobTitle(jobTitleInput)
    localStorage.setItem('staffJobTitle', jobTitleInput)
    setEditingJobTitle(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  const isStaff = user.type === 'staff' || user.type === 'admin'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Profile Picture */}
              <div className="relative">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center border-4 border-white shadow-lg">
                    <span className="text-4xl font-bold text-white">{user.name?.[0]}</span>
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white"></div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">{user.name}</h1>

                {/* Job Title (staff only) */}
                {isStaff && (
                  <div className="mb-3">
                    {editingJobTitle ? (
                      <div className="flex items-center gap-2 justify-center md:justify-start">
                        <input
                          type="text"
                          value={jobTitleInput}
                          onChange={(e) => setJobTitleInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveJobTitle()}
                          placeholder="e.g., Program Coordinator"
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
                          autoFocus
                        />
                        <Button size="sm" onClick={saveJobTitle}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditingJobTitle(false); setJobTitleInput(jobTitle) }}>Cancel</Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingJobTitle(true)}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 justify-center md:justify-start group"
                      >
                        <Briefcase className="h-4 w-4" />
                        <span className="text-sm">{jobTitle || 'Add job title…'}</span>
                        <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-4 text-gray-600 mb-4">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Joined {new Date().toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 justify-center md:justify-start">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                    isStaff ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {isStaff ? 'Staff Member' : 'Student'}
                  </span>
                </div>
              </div>

              {/* Edit Button */}
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Staff: Settings Panel */}
          {isStaff ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
              <div className="divide-y divide-gray-100">
                {[
                  { icon: Bell, label: 'Notifications', description: 'Manage email and in-app alerts', color: 'bg-blue-100 text-blue-600' },
                  { icon: Shield, label: 'Privacy & Security', description: 'Password, two-factor authentication', color: 'bg-green-100 text-green-600' },
                  { icon: Moon, label: 'Appearance', description: 'Theme and display preferences', color: 'bg-purple-100 text-purple-600' },
                  { icon: Globe, label: 'Language & Region', description: 'Timezone, date format, and locale', color: 'bg-orange-100 text-orange-600' },
                ].map((setting) => (
                  <button
                    key={setting.label}
                    className="w-full flex items-center gap-4 py-4 hover:bg-gray-50 transition-colors rounded-lg px-2 text-left"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${setting.color}`}>
                      <setting.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{setting.label}</p>
                      <p className="text-sm text-gray-500">{setting.description}</p>
                    </div>
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              {/* Student: Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {[
                  { icon: BookOpen, value: '5', label: 'Courses Enrolled', bg: 'bg-blue-100', color: 'text-blue-600', delay: 0.1 },
                  { icon: TrendingUp, value: '92%', label: 'Attendance Rate', bg: 'bg-green-100', color: 'text-green-600', delay: 0.2 },
                  { icon: Award, value: '850', label: 'Engagement Score', bg: 'bg-purple-100', color: 'text-purple-600', delay: 0.3 },
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: stat.delay }}
                    className="bg-white rounded-xl shadow-lg p-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Student: Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white rounded-2xl shadow-xl p-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
                <div className="space-y-4">
                  {[
                    { action: 'Attended', item: 'Introduction to React', time: '2 hours ago', color: 'blue' },
                    { action: 'Completed', item: 'JavaScript Fundamentals Quiz', time: '1 day ago', color: 'green' },
                    { action: 'Joined', item: 'Advanced TypeScript Session', time: '3 days ago', color: 'purple' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`w-2 h-2 rounded-full bg-${activity.color}-500`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.action} <span className="text-gray-600">{activity.item}</span>
                        </p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
