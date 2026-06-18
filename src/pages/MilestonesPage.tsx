import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, Circle, Clock, ChevronDown, ChevronUp, Plus, Trash2,
  Star, BookOpen, Briefcase, Users, Award, X, Loader2
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import {
  getMilestones,
  getStudentMilestoneProgress,
  upsertMilestoneStatus,
  createMilestone,
  deleteMilestone,
} from '../services/supabaseService'

// ── Types ─────────────────────────────────────────────────────────────────

interface Milestone {
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

interface StudentMilestone {
  id: string
  user_id: string
  milestone_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  completed_at: string | null
  notes: string
}

type MilestoneStatus = 'not_started' | 'in_progress' | 'completed'

interface MilestoneWithProgress extends Milestone {
  status: MilestoneStatus
  completed_at: string | null
}

// ── Constants ─────────────────────────────────────────────────────────────

const CATEGORIES = ['Career', 'Academic', 'Engagement', 'Networking'] as const

const CATEGORY_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  Career:      { color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200',   icon: Briefcase },
  Academic:    { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', icon: BookOpen  },
  Engagement:  { color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200',  icon: Users     },
  Networking:  { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', icon: Star      },
}

const STATUS_CONFIG: Record<MilestoneStatus, { label: string; color: string; bg: string }> = {
  not_started: { label: 'Not Started', color: 'text-gray-600',  bg: 'bg-gray-100'  },
  in_progress: { label: 'In Progress', color: 'text-blue-600',  bg: 'bg-blue-100'  },
  completed:   { label: 'Completed',   color: 'text-green-600', bg: 'bg-green-100' },
}

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'Career',
  type: 'optional',
  points: 10,
  due_date: '',
}

// ── Component ─────────────────────────────────────────────────────────────

export default function MilestonesPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isStaff = user.type === 'staff' || user.type === 'admin'

  const [milestones, setMilestones] = useState<MilestoneWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ ...EMPTY_FORM })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // ── Data loading ────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [allMilestones, progressList] = await Promise.all([
        getMilestones(),
        isStaff ? Promise.resolve([]) : getStudentMilestoneProgress(user.id),
      ])

      const progressMap = new Map<string, StudentMilestone>()
      for (const p of (progressList as StudentMilestone[])) {
        progressMap.set(p.milestone_id, p)
      }

      const merged: MilestoneWithProgress[] = (allMilestones as Milestone[]).map((m) => {
        const prog = progressMap.get(m.id)
        return {
          ...m,
          status: prog?.status ?? 'not_started',
          completed_at: prog?.completed_at ?? null,
        }
      })

      merged.sort((a, b) => a.order_index - b.order_index)
      setMilestones(merged)
    } catch (e) {
      setError('Failed to load milestones. Please try again.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user.id, isStaff])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Derived stats ────────────────────────────────────────────────────────

  const completed = milestones.filter((m) => m.status === 'completed')
  const totalPoints = milestones.reduce((sum, m) => sum + m.points, 0)
  const earnedPoints = completed.reduce((sum, m) => sum + m.points, 0)
  const pct = milestones.length > 0 ? Math.round((completed.length / milestones.length) * 100) : 0

  const byCategory = CATEGORIES.reduce<Record<string, MilestoneWithProgress[]>>((acc, cat) => {
    acc[cat] = milestones.filter((m) => m.category === cat)
    return acc
  }, {} as Record<string, MilestoneWithProgress[]>)

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleStatusChange = async (milestoneId: string, newStatus: MilestoneStatus) => {
    if (!user.id) return
    setUpdatingId(milestoneId)

    // Optimistic update
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === milestoneId
          ? {
              ...m,
              status: newStatus,
              completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
            }
          : m
      )
    )

    try {
      await upsertMilestoneStatus(user.id, milestoneId, newStatus)
    } catch (e) {
      // Revert on failure
      console.error(e)
      loadData()
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this milestone? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await deleteMilestone(id)
      setMilestones((prev) => prev.filter((m) => m.id !== id))
    } catch (e) {
      console.error(e)
      alert('Failed to delete milestone.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setFormError('Title is required.')
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      await createMilestone({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        type: formData.type,
        points: Number(formData.points),
        due_date: formData.due_date || null,
        order_index: milestones.length,
      })
      setShowModal(false)
      setFormData({ ...EMPTY_FORM })
      await loadData()
    } catch (e) {
      console.error(e)
      setFormError('Failed to create milestone. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  const StatusButton = ({ m }: { m: MilestoneWithProgress }) => {
    const statuses: MilestoneStatus[] = ['not_started', 'in_progress', 'completed']
    const isUpdating = updatingId === m.id

    return (
      <div className="flex items-center gap-1">
        {statuses.map((s) => {
          const cfg = STATUS_CONFIG[s]
          const isActive = m.status === s
          return (
            <button
              key={s}
              disabled={isUpdating || isStaff}
              onClick={() => !isStaff && handleStatusChange(m.id, s)}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? `${cfg.bg} ${cfg.color} ring-2 ring-offset-1 ring-current`
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              } disabled:cursor-default`}
            >
              {isUpdating && isActive ? (
                <Loader2 className="h-3 w-3 animate-spin inline" />
              ) : (
                cfg.label
              )}
            </button>
          )
        })}
      </div>
    )
  }

  // ── Loading / error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading milestones…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">{error}</p>
          <Button onClick={loadData}>Retry</Button>
        </div>
      </div>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────

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
            <h1 className="text-3xl font-bold">
              {isStaff ? 'Milestones' : 'My Milestones'}
            </h1>
            {isStaff && (
              <Button onClick={() => setShowModal(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Milestone
              </Button>
            )}
          </div>
          <p className="text-muted-foreground mb-6">
            {isStaff
              ? `${milestones.length} milestones defined across ${CATEGORIES.length} categories`
              : `${completed.length} of ${milestones.length} completed · ${earnedPoints} of ${totalPoints} points earned`}
          </p>

          {/* Progress bar (student only) */}
          {!isStaff && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall progress</span>
                <span className="font-semibold">{pct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {CATEGORIES.map((cat) => {
              const cfg = CATEGORY_CONFIG[cat]
              const catMilestones = byCategory[cat]
              const catCompleted = catMilestones.filter((m) => m.status === 'completed').length
              return (
                <Card key={cat} className={`${cfg.border} border-2`}>
                  <CardContent className="pt-4 pb-4">
                    <div className={`text-xs font-semibold ${cfg.color} mb-1`}>{cat}</div>
                    <div className="text-2xl font-bold">
                      {isStaff ? catMilestones.length : `${catCompleted}/${catMilestones.length}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isStaff ? 'milestones' : 'completed'}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </motion.div>

        {/* Category sections */}
        <div className="space-y-6">
          {CATEGORIES.map((cat, catIdx) => {
            const cfg = CATEGORY_CONFIG[cat]
            const Icon = cfg.icon
            const items = byCategory[cat]
            const isCollapsed = collapsedCategories.has(cat)
            if (items.length === 0) return null

            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: catIdx * 0.08 }}
              >
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(cat)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl ${cfg.bg} ${cfg.border} border-2 mb-3 transition-colors hover:opacity-90`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${cfg.color}`} />
                    <span className={`font-semibold ${cfg.color}`}>{cat}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                      {items.length} milestone{items.length !== 1 ? 's' : ''}
                    </span>
                    {!isStaff && (
                      <span className="text-xs text-muted-foreground">
                        {items.filter((m) => m.status === 'completed').length} done
                      </span>
                    )}
                  </div>
                  {isCollapsed
                    ? <ChevronDown className={`h-4 w-4 ${cfg.color}`} />
                    : <ChevronUp className={`h-4 w-4 ${cfg.color}`} />}
                </button>

                {/* Milestone cards */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-3 overflow-hidden"
                    >
                      {items.map((m) => (
                        <MilestoneCard
                          key={m.id}
                          milestone={m}
                          isStaff={isStaff}
                          isDeleting={deletingId === m.id}
                          onDelete={handleDelete}
                          StatusButton={<StatusButton m={m} />}
                          categoryConfig={cfg}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Add Milestone Modal */}
      <AnimatePresence>
        {showModal && (
          <AddMilestoneModal
            formData={formData}
            formError={formError}
            submitting={submitting}
            onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
            onSubmit={handleAddMilestone}
            onClose={() => { setShowModal(false); setFormData({ ...EMPTY_FORM }); setFormError(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── MilestoneCard ─────────────────────────────────────────────────────────

interface MilestoneCardProps {
  milestone: MilestoneWithProgress
  isStaff: boolean
  isDeleting: boolean
  onDelete: (id: string) => void
  StatusButton: React.ReactNode
  categoryConfig: { color: string; bg: string; border: string }
}

function MilestoneCard({ milestone: m, isStaff, isDeleting, onDelete, StatusButton, categoryConfig }: MilestoneCardProps) {
  const isCompleted = m.status === 'completed'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className={`transition-all ${isCompleted ? 'border-green-200 bg-green-50/30' : ''}`}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            {/* Status icon */}
            <div className="mt-0.5 flex-shrink-0">
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : m.status === 'in_progress' ? (
                <Clock className="h-5 w-5 text-blue-400" />
              ) : (
                <Circle className="h-5 w-5 text-gray-300" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <h3 className={`font-semibold text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                  {m.title}
                </h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Points badge */}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryConfig.bg} ${categoryConfig.color}`}>
                    <Award className="h-3 w-3 inline mr-0.5" />
                    {m.points} pts
                  </span>
                  {/* Type badge */}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    m.type === 'required'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {m.type === 'required' ? 'Required' : 'Optional'}
                  </span>
                </div>
              </div>

              {m.description && (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.description}</p>
              )}

              <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  {m.due_date && (
                    <span className="text-xs text-muted-foreground">
                      Due: {new Date(m.due_date).toLocaleDateString()}
                    </span>
                  )}
                  {isCompleted && m.completed_at && (
                    <span className="text-xs text-green-600 font-medium">
                      Completed {new Date(m.completed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!isStaff && StatusButton}
                  {isStaff && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isDeleting}
                      onClick={() => onDelete(m.id)}
                      className="h-7 px-2 text-destructive hover:text-destructive hover:bg-red-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ── AddMilestoneModal ─────────────────────────────────────────────────────

interface AddMilestoneModalProps {
  formData: typeof EMPTY_FORM
  formError: string | null
  submitting: boolean
  onChange: (field: string, value: string | number) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

function AddMilestoneModal({ formData, formError, submitting, onChange, onSubmit, onClose }: AddMilestoneModalProps) {
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Add New Milestone</h2>
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

          <div>
            <label className="text-sm font-medium block mb-1.5">Title <span className="text-destructive">*</span></label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => onChange('title', e.target.value)}
              placeholder="e.g. Attend a career fair"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Brief description of what this milestone involves…"
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Category</label>
              <select
                value={formData.category}
                onChange={(e) => onChange('category', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">Type</label>
              <select
                value={formData.type}
                onChange={(e) => onChange('type', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
              >
                <option value="optional">Optional</option>
                <option value="required">Required</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Points</label>
              <input
                type="number"
                min={0}
                value={formData.points}
                onChange={(e) => onChange('points', Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => onChange('due_date', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gap-2" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {submitting ? 'Creating…' : 'Create Milestone'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
