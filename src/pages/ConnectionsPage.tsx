import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, Pencil, Trash2, AlertTriangle, CheckCircle2,
  Linkedin, Building2, Briefcase, MapPin, Calendar, X, Loader2,
  Phone, MessageSquare
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import {
  getConnections,
  addConnection,
  updateConnection,
  deleteConnection,
} from '../services/supabaseService'

// ── Types ─────────────────────────────────────────────────────────────────

interface Connection {
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

type ConnectionFormData = Omit<Connection, 'id' | 'user_id' | 'created_at' | 'updated_at'>

// ── Helpers ───────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0]

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = (new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  return Math.floor(diff)
}

function needsFollowUp(conn: Connection): boolean {
  if (!conn.last_contact) return true
  const days = daysSince(conn.last_contact)
  return days !== null && days > 30
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const EMPTY_FORM: ConnectionFormData = {
  name: '',
  company: '',
  role: '',
  met_at: '',
  met_date: null,
  last_contact: null,
  linkedin_url: '',
  notes: '',
}

// ── Component ─────────────────────────────────────────────────────────────

export default function ConnectionsPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal / form state
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ConnectionFormData>({ ...EMPTY_FORM })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Per-card action state
  const [updatingContactId, setUpdatingContactId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Data loading ───────────────────────────────────────────────────────

  const loadConnections = useCallback(async () => {
    if (!user.id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getConnections(user.id)
      // Sort newest first by created_at
      const sorted = [...(data as Connection[])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setConnections(sorted)
    } catch (e) {
      console.error(e)
      setError('Failed to load connections. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    loadConnections()
  }, [loadConnections])

  // ── Summary stats ──────────────────────────────────────────────────────

  const followUpCount = connections.filter(needsFollowUp).length

  // ── Modal helpers ──────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditingId(null)
    setFormData({ ...EMPTY_FORM })
    setFormError(null)
    setShowModal(true)
  }

  const openEditModal = (conn: Connection) => {
    setEditingId(conn.id)
    setFormData({
      name: conn.name,
      company: conn.company,
      role: conn.role,
      met_at: conn.met_at,
      met_date: conn.met_date,
      last_contact: conn.last_contact,
      linkedin_url: conn.linkedin_url,
      notes: conn.notes,
    })
    setFormError(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({ ...EMPTY_FORM })
    setFormError(null)
  }

  const handleFormChange = (field: keyof ConnectionFormData, value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // ── Save (add or update) ───────────────────────────────────────────────

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setFormError('Name is required.')
      return
    }
    setSubmitting(true)
    setFormError(null)

    try {
      if (editingId) {
        // Update existing
        await updateConnection(editingId, {
          name: formData.name.trim(),
          company: formData.company.trim(),
          role: formData.role.trim(),
          met_at: formData.met_at.trim(),
          met_date: formData.met_date || null,
          last_contact: formData.last_contact || null,
          linkedin_url: formData.linkedin_url.trim(),
          notes: formData.notes.trim(),
        })
        setConnections((prev) =>
          prev.map((c) =>
            c.id === editingId
              ? {
                  ...c,
                  name: formData.name.trim(),
                  company: formData.company.trim(),
                  role: formData.role.trim(),
                  met_at: formData.met_at.trim(),
                  met_date: formData.met_date || null,
                  last_contact: formData.last_contact || null,
                  linkedin_url: formData.linkedin_url.trim(),
                  notes: formData.notes.trim(),
                  updated_at: new Date().toISOString(),
                }
              : c
          )
        )
      } else {
        // Add new
        const newConn = await addConnection(user.id, {
          name: formData.name.trim(),
          company: formData.company.trim(),
          role: formData.role.trim(),
          met_at: formData.met_at.trim(),
          met_date: formData.met_date || null,
          last_contact: formData.last_contact || null,
          linkedin_url: formData.linkedin_url.trim(),
          notes: formData.notes.trim(),
        })
        setConnections((prev) => [newConn as Connection, ...prev])
      }
      closeModal()
    } catch (err) {
      console.error(err)
      setFormError(editingId ? 'Failed to update connection.' : 'Failed to add connection.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Update last contact ────────────────────────────────────────────────

  const handleUpdateLastContact = async (id: string) => {
    setUpdatingContactId(id)
    try {
      await updateConnection(id, { last_contact: TODAY })
      setConnections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, last_contact: TODAY, updated_at: new Date().toISOString() } : c))
      )
    } catch (e) {
      console.error(e)
      alert('Failed to update last contact date.')
    } finally {
      setUpdatingContactId(null)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from your connections? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await deleteConnection(id)
      setConnections((prev) => prev.filter((c) => c.id !== id))
    } catch (e) {
      console.error(e)
      alert('Failed to delete connection.')
    } finally {
      setDeletingId(null)
    }
  }

  // ── Loading / error states ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your connections…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">{error}</p>
          <Button onClick={loadConnections}>Retry</Button>
        </div>
      </div>
    )
  }

  // ── Main render ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">My Connections</h1>
              <span className="bg-primary text-primary-foreground text-sm font-semibold px-3 py-1 rounded-full">
                {connections.length}
              </span>
            </div>
            <Button onClick={openAddModal} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Connection
            </Button>
          </div>
          <p className="text-muted-foreground">Track your professional network and follow-ups</p>

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{connections.length}</div>
                    <div className="text-xs text-muted-foreground">Total Connections</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={followUpCount > 0 ? 'border-yellow-200' : ''}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${followUpCount > 0 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                    {followUpCount > 0
                      ? <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      : <CheckCircle2 className="h-5 w-5 text-green-600" />}
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{followUpCount}</div>
                    <div className="text-xs text-muted-foreground">Need Follow-up</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{connections.length - followUpCount}</div>
                    <div className="text-xs text-muted-foreground">Up to Date</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Connections list */}
        {connections.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <Users className="h-10 w-10 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No connections logged yet.</h2>
            <p className="text-muted-foreground mb-6">Start building your network!</p>
            <Button onClick={openAddModal} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Connection
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {connections.map((conn, idx) => (
                <ConnectionCard
                  key={conn.id}
                  conn={conn}
                  idx={idx}
                  isUpdatingContact={updatingContactId === conn.id}
                  isDeleting={deletingId === conn.id}
                  onUpdateLastContact={handleUpdateLastContact}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <ConnectionModal
            isEditing={!!editingId}
            formData={formData}
            formError={formError}
            submitting={submitting}
            onChange={handleFormChange}
            onSubmit={handleSave}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── ConnectionCard ────────────────────────────────────────────────────────

interface ConnectionCardProps {
  conn: Connection
  idx: number
  isUpdatingContact: boolean
  isDeleting: boolean
  onUpdateLastContact: (id: string) => void
  onEdit: (conn: Connection) => void
  onDelete: (id: string, name: string) => void
}

function ConnectionCard({
  conn, idx, isUpdatingContact, isDeleting, onUpdateLastContact, onEdit, onDelete
}: ConnectionCardProps) {
  const followUp = needsFollowUp(conn)
  const days = daysSince(conn.last_contact)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.3, delay: idx * 0.04 }}
    >
      <Card className={`transition-all ${followUp ? 'border-yellow-200' : ''}`}>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {conn.name.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-base">{conn.name}</h3>
                    {followUp && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium border border-yellow-200">
                        <AlertTriangle className="h-3 w-3" />
                        Follow up needed
                      </span>
                    )}
                    {!followUp && conn.last_contact && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        In touch
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1 flex-wrap text-sm text-muted-foreground">
                    {conn.role && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        {conn.role}
                      </span>
                    )}
                    {conn.company && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {conn.company}
                      </span>
                    )}
                  </div>
                </div>

                {conn.linkedin_url && (
                  <a
                    href={conn.linkedin_url.startsWith('http') ? conn.linkedin_url : `https://${conn.linkedin_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                    title="View LinkedIn profile"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-muted-foreground">
                {conn.met_at && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Met at: {conn.met_at}
                  </span>
                )}
                {conn.met_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(conn.met_date)}
                  </span>
                )}
                {conn.last_contact ? (
                  <span className={`flex items-center gap-1 ${followUp ? 'text-yellow-600' : ''}`}>
                    <Phone className="h-3 w-3" />
                    Last contact: {formatDate(conn.last_contact)}
                    {days !== null && ` (${days}d ago)`}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <Phone className="h-3 w-3" />
                    No contact logged
                  </span>
                )}
              </div>

              {conn.notes && (
                <p className="mt-2 text-xs text-muted-foreground bg-gray-50 rounded-lg px-3 py-2 flex items-start gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  {conn.notes}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUpdatingContact}
                  onClick={() => onUpdateLastContact(conn.id)}
                  className="h-7 text-xs gap-1.5"
                >
                  {isUpdatingContact ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  Update Last Contact
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(conn)}
                  className="h-7 text-xs gap-1.5"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => onDelete(conn.id, conn.name)}
                  className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-red-50"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── ConnectionModal ────────────────────────────────────────────────────────

interface ConnectionModalProps {
  isEditing: boolean
  formData: ConnectionFormData
  formError: string | null
  submitting: boolean
  onChange: (field: keyof ConnectionFormData, value: string | null) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

function ConnectionModal({
  isEditing, formData, formError, submitting, onChange, onSubmit, onClose
}: ConnectionModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Edit Connection' : 'Add New Connection'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
          {formError && (
            <p className="text-sm text-destructive bg-red-50 px-3 py-2 rounded-lg">{formError}</p>
          )}

          {/* Name */}
          <div>
            <label className="text-sm font-medium block mb-1.5">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="Full name"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Company + Role */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => onChange('company', e.target.value)}
                placeholder="e.g. Google"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Role / Title</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => onChange('role', e.target.value)}
                placeholder="e.g. Software Engineer"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Where met + Date met */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Where We Met</label>
              <input
                type="text"
                value={formData.met_at}
                onChange={(e) => onChange('met_at', e.target.value)}
                placeholder="e.g. Career fair, LinkedIn"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Date Met</label>
              <input
                type="date"
                value={formData.met_date ?? ''}
                onChange={(e) => onChange('met_date', e.target.value || null)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Last contact */}
          <div>
            <label className="text-sm font-medium block mb-1.5">Last Contact Date</label>
            <input
              type="date"
              value={formData.last_contact ?? ''}
              onChange={(e) => onChange('last_contact', e.target.value || null)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* LinkedIn */}
          <div>
            <label className="text-sm font-medium block mb-1.5">LinkedIn URL</label>
            <input
              type="url"
              value={formData.linkedin_url}
              onChange={(e) => onChange('linkedin_url', e.target.value)}
              placeholder="https://linkedin.com/in/…"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium block mb-1.5">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => onChange('notes', e.target.value)}
              placeholder="Any relevant context, talking points, or reminders…"
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gap-2" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {submitting
                ? isEditing ? 'Saving…' : 'Adding…'
                : isEditing ? 'Save Changes' : 'Add Connection'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
