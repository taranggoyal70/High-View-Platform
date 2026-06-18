import { useState, useEffect } from 'react'
import { Star, Trash2, Plus, X, ExternalLink, BookOpen } from 'lucide-react'
import { Button } from '../components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { getResources, addResource, deleteResource } from '../services/supabaseService'

interface Resource {
  id: string
  title: string
  description: string
  category: string
  url: string
  organization: string
  is_featured: boolean
  created_at: string
}

type Category = 'All' | 'campus' | 'local' | 'national' | 'library' | 'professional'

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'All', label: 'All' },
  { key: 'campus', label: 'Campus' },
  { key: 'local', label: 'Local' },
  { key: 'national', label: 'National' },
  { key: 'library', label: 'Library' },
  { key: 'professional', label: 'Professional' },
]

const CATEGORY_COLORS: Record<string, string> = {
  campus: 'bg-blue-100 text-blue-800',
  local: 'bg-green-100 text-green-800',
  national: 'bg-purple-100 text-purple-800',
  library: 'bg-orange-100 text-orange-800',
  professional: 'bg-indigo-100 text-indigo-800',
}

interface AddResourceForm {
  title: string
  description: string
  organization: string
  category: string
  url: string
  is_featured: boolean
}

const EMPTY_FORM: AddResourceForm = {
  title: '',
  description: '',
  organization: '',
  category: 'campus',
  url: '',
  is_featured: false,
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
      <div className="h-3 bg-gray-100 rounded w-full mb-2" />
      <div className="h-3 bg-gray-100 rounded w-5/6 mb-4" />
      <div className="h-6 bg-gray-200 rounded w-20" />
    </div>
  )
}

export default function ResourceCenterPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [activeCategory, setActiveCategory] = useState<Category>('All')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState<AddResourceForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isStaff = user.type === 'staff' || user.type === 'admin'

  useEffect(() => {
    fetchResources()
  }, [])

  async function fetchResources() {
    setLoading(true)
    try {
      const data = await getResources()
      setResources(data)
    } catch (err) {
      console.error('Failed to load resources:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = activeCategory === 'All'
    ? resources
    : resources.filter(r => r.category === activeCategory)

  const sorted = [...filtered].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1
    if (!a.is_featured && b.is_featured) return 1
    return 0
  })

  async function handleAddResource(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const newResource = await addResource(formData)
      setResources(prev => [newResource, ...prev])
      setModalOpen(false)
      setFormData(EMPTY_FORM)
    } catch (err) {
      console.error('Failed to add resource:', err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteResource(id)
      setResources(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      console.error('Failed to delete resource:', err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Resource Center</h1>
              </div>
              <p className="text-gray-500 ml-12">Campus & career resources to support your journey</p>
            </div>
            {isStaff && (
              <Button
                onClick={() => {
                  setFormData(EMPTY_FORM)
                  setModalOpen(true)
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg font-medium">No resources in this category yet.</p>
            {isStaff && (
              <p className="text-gray-400 text-sm mt-1">
                Click "Add Resource" to add the first one.
              </p>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {sorted.map((resource, index) => (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.04 }}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow relative flex flex-col"
                >
                  {/* Featured star */}
                  {resource.is_featured && (
                    <div className="absolute top-4 right-4 flex items-center gap-1">
                      {isStaff && (
                        <button
                          onClick={() => handleDelete(resource.id)}
                          disabled={deletingId === resource.id}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mr-1"
                          title="Delete resource"
                        >
                          {deletingId === resource.id ? (
                            <span className="inline-block w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    </div>
                  )}

                  {/* Staff delete button (non-featured) */}
                  {isStaff && !resource.is_featured && (
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={() => handleDelete(resource.id)}
                        disabled={deletingId === resource.id}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete resource"
                      >
                        {deletingId === resource.id ? (
                          <span className="inline-block w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  )}

                  <div className="flex-1 pr-6">
                    <h3 className="font-bold text-gray-900 mb-0.5 leading-snug">{resource.title}</h3>
                    {resource.organization && (
                      <p className="text-sm text-gray-400 mb-3">{resource.organization}</p>
                    )}
                    {resource.description && (
                      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{resource.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        CATEGORY_COLORS[resource.category] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {resource.category.charAt(0).toUpperCase() + resource.category.slice(1)}
                    </span>

                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                      >
                        Visit Resource
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Resource Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.93 }}
              className="bg-white rounded-xl max-w-lg w-full p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => {
                  setModalOpen(false)
                  setFormData(EMPTY_FORM)
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-xl font-bold mb-6 text-gray-900">Add New Resource</h2>

              <form onSubmit={handleAddResource} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g., Career Services Office"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                    placeholder="Brief description of what this resource offers..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={e => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g., Denver University"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="campus">Campus</option>
                    <option value="local">Local</option>
                    <option value="national">National</option>
                    <option value="library">Library</option>
                    <option value="professional">Professional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={e => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_featured" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                    Mark as Featured
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Adding...
                      </span>
                    ) : (
                      'Add Resource'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setModalOpen(false)
                      setFormData(EMPTY_FORM)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
