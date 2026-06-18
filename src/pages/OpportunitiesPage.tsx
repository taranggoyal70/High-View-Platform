import { useState, useEffect } from 'react'
import { Search, MapPin, DollarSign, Users, Plus, X, Edit2, CheckCircle2, Clock, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { getOpportunities, addOpportunity, updateOpportunity, deleteOpportunity, getMyApplications, upsertApplication } from '../services/supabaseService'
import type { OpportunityRecord } from '../services/supabaseService'

const filterOptions = ['All', 'Job shadows', 'Micro-internships', 'Networking', 'Mentorship', 'Hackathons', 'Internships', 'Workshops', 'Career Fairs', 'Volunteer'] as const

type FormState = Partial<Omit<OpportunityRecord, 'id' | 'created_at'>>

const emptyForm: FormState = {
  title: '',
  company: '',
  type: 'Job shadows',
  tags: [],
  location: '',
  pay: '',
  duration: '',
  spots: null,
  deadline: '',
  status: '',
  is_paid: false,
  application_link: '',
}

export default function OpportunitiesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<typeof filterOptions[number]>('All')
  const [sortByDeadline, setSortByDeadline] = useState<'asc' | 'desc'>('asc')
  const [userRole, setUserRole] = useState<'staff' | 'student'>('student')
  const [userId, setUserId] = useState<string | null>(null)
  const [appStatus, setAppStatus] = useState<Record<string, 'applied' | 'completed'>>({})
  const [opportunities, setOpportunities] = useState<OpportunityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingOpportunity, setEditingOpportunity] = useState<OpportunityRecord | null>(null)
  const [formData, setFormData] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      const role = (user?.user_metadata?.role === 'staff' || user?.user_metadata?.role === 'admin') ? 'staff' : 'student'
      setUserRole(role)
      if (user) setUserId(user.id)

      const opps = await getOpportunities()
      setOpportunities(opps)

      if (role === 'student' && user) {
        const status = await getMyApplications(user.id)
        setAppStatus(status)
      }

      setLoading(false)
    }
    init()
  }, [])

  const setOppStatus = async (oppId: string, status: 'applied' | 'completed' | null) => {
    if (!userId) return
    setAppStatus(prev => {
      const updated = { ...prev }
      if (status === null) delete updated[oppId]
      else updated[oppId] = status
      return updated
    })
    await upsertApplication(userId, oppId, status)
  }

  const isExpired = (deadline?: string) => {
    if (!deadline) return false
    const currentYear = new Date().getFullYear()
    const deadlineDate = new Date(`${deadline}, ${currentYear}`)
    return deadlineDate < new Date()
  }

  const availableFilters = userRole === 'student'
    ? filterOptions.filter(f => f !== 'Mentorship')
    : filterOptions

  const filteredOpportunities = opportunities
    .filter(opp => {
      const matchesSearch = opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           opp.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           opp.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesFilter = activeFilter === 'All' || opp.type === activeFilter
      const notExpired = !isExpired(opp.deadline)
      return matchesSearch && matchesFilter && notExpired
    })
    .sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      const currentYear = new Date().getFullYear()
      const da = new Date(`${a.deadline}, ${currentYear}`).getTime()
      const db = new Date(`${b.deadline}, ${currentYear}`).getTime()
      return sortByDeadline === 'asc' ? da - db : db - da
    })

  const openCount = filteredOpportunities.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingOpportunity) {
        await updateOpportunity(editingOpportunity.id, formData)
        setOpportunities(opps => opps.map(o => o.id === editingOpportunity.id ? { ...o, ...formData } : o))
      } else {
        const newOpp = await addOpportunity({
          title: formData.title || '',
          company: formData.company || '',
          type: formData.type || 'Job shadows',
          tags: formData.tags || [],
          location: formData.location || '',
          pay: formData.pay || '',
          duration: formData.duration || '',
          spots: formData.spots ?? null,
          deadline: formData.deadline || '',
          status: formData.status || '',
          is_paid: formData.is_paid || false,
          application_link: formData.application_link || '',
        })
        setOpportunities(opps => [newOpp, ...opps])
      }
      setModalOpen(false)
      setEditingOpportunity(null)
      setFormData(emptyForm)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editingOpportunity) return
    setSaving(true)
    try {
      await deleteOpportunity(editingOpportunity.id)
      setOpportunities(opps => opps.filter(o => o.id !== editingOpportunity.id))
      setModalOpen(false)
      setEditingOpportunity(null)
      setFormData(emptyForm)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Experiential Learning Opportunities
            </h1>
          </div>

          {userRole === 'staff' && (
            <div className="mb-4">
              <Button
                onClick={() => {
                  setEditingOpportunity(null)
                  setFormData(emptyForm)
                  setModalOpen(true)
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Opportunity
              </Button>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search opportunities, companies, roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-3">
            {availableFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Open Now <span className="text-gray-500 font-normal">{openCount} opportunities</span>
          </h2>
          <button
            onClick={() => setSortByDeadline(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Sort: Deadline {sortByDeadline === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {/* Opportunities List */}
        <div className="space-y-4">
          {filteredOpportunities.map((opportunity) => (
            <div
              key={opportunity.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer relative"
            >
              {userRole === 'staff' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingOpportunity(opportunity)
                    setFormData({
                      title: opportunity.title,
                      company: opportunity.company,
                      type: opportunity.type,
                      tags: opportunity.tags,
                      location: opportunity.location,
                      pay: opportunity.pay,
                      duration: opportunity.duration,
                      spots: opportunity.spots,
                      deadline: opportunity.deadline,
                      status: opportunity.status,
                      is_paid: opportunity.is_paid,
                      application_link: opportunity.application_link,
                    })
                    setModalOpen(true)
                  }}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              )}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {opportunity.title}
                  </h3>
                  <p className="text-gray-600">{opportunity.company}</p>
                </div>
                {opportunity.status && (
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      opportunity.status === 'New'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {opportunity.status === 'Closes Soon' && opportunity.deadline
                      ? `Closes ${opportunity.deadline}`
                      : opportunity.status}
                  </span>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {opportunity.is_paid && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-sm font-medium">
                    Paid role
                  </span>
                )}
                <span
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    opportunity.type === 'Networking'
                      ? 'bg-amber-100 text-amber-800'
                      : opportunity.type === 'Job shadows'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-teal-100 text-teal-800'
                  }`}
                >
                  {opportunity.type === 'Job shadows' ? 'Observation' : opportunity.type}
                </span>
                {opportunity.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Details */}
              <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{opportunity.location}</span>
                </div>
                {opportunity.pay && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>{opportunity.pay}</span>
                  </div>
                )}
                {opportunity.spots != null && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{opportunity.spots} spots</span>
                  </div>
                )}
              </div>

              {/* Application Link + Tracking */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {opportunity.application_link && (
                  <a
                    href={opportunity.application_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Apply Now
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                {userRole === 'student' && (
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {appStatus[opportunity.id] === 'completed' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Completed
                        <button onClick={() => setOppStatus(opportunity.id, null)} className="ml-1 text-green-500 hover:text-green-700 text-xs underline">undo</button>
                      </span>
                    ) : appStatus[opportunity.id] === 'applied' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">
                        <Clock className="w-4 h-4" /> Applied
                        <button onClick={() => setOppStatus(opportunity.id, 'completed')} className="ml-1 text-amber-600 hover:text-amber-800 text-xs underline">mark completed</button>
                        <button onClick={() => setOppStatus(opportunity.id, null)} className="ml-1 text-amber-500 hover:text-amber-700 text-xs underline">undo</button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setOppStatus(opportunity.id, 'applied')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                      >
                        <Clock className="w-4 h-4" /> Mark as Applied
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredOpportunities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No opportunities found matching your search.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Opportunity Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-2xl w-full p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => {
                setModalOpen(false)
                setEditingOpportunity(null)
                setFormData(emptyForm)
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-2xl font-bold mb-6">
              {editingOpportunity ? 'Edit Opportunity' : 'Add New Opportunity'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Brand Strategy Micro-Internship"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Crocs Inc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Job shadows">Job shadows</option>
                  <option value="Micro-internships">Micro-internships</option>
                  <option value="Networking">Networking</option>
                  <option value="Mentorship">Mentorship</option>
                  <option value="Hackathons">Hackathons</option>
                  <option value="Internships">Internships</option>
                  <option value="Workshops">Workshops</option>
                  <option value="Career Fairs">Career Fairs</option>
                  <option value="Volunteer">Volunteer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application Link</label>
                <input
                  type="url"
                  value={formData.application_link}
                  onChange={(e) => setFormData({ ...formData, application_link: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/apply"
                />
                <p className="text-xs text-gray-500 mt-1">Optional: Link where students can apply for this opportunity</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Remote, Denver CO, Hybrid"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pay</label>
                  <input
                    type="text"
                    value={formData.pay}
                    onChange={(e) => setFormData({ ...formData, pay: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., $18/hr or Free"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 6 weeks"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Spots Available</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.spots ?? ''}
                    onChange={(e) => setFormData({ ...formData, spots: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <input
                    type="text"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Apr 15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  <option value="New">New</option>
                  <option value="Closes Soon">Closes Soon</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags?.join(', ')}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Marketing, Tech, 6 weeks"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_paid"
                  checked={formData.is_paid}
                  onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_paid" className="text-sm font-medium text-gray-700">
                  This is a paid opportunity
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingOpportunity ? 'Update Opportunity' : 'Add Opportunity'}
                </Button>
                {editingOpportunity && (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={handleDelete}
                    disabled={saving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setModalOpen(false)
                    setEditingOpportunity(null)
                    setFormData(emptyForm)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
