'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, Button } from '@comp-dash/design-system'
import { useCreateCompetition } from '@comp-dash/api'
import { Plus, X } from 'lucide-react'
import type { CompetitionCategory, CompetitionScope, CompetitionMode } from '@comp-dash/types'

const categoryOptions: { value: CompetitionCategory; label: string }[] = [
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'internship', label: 'Internship' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'paper_presentation', label: 'Paper Presentation' },
  { value: 'project', label: 'Project' },
  { value: 'sports', label: 'Sports' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'other', label: 'Other' },
]

const scopeOptions: { value: CompetitionScope; label: string }[] = [
  { value: 'national', label: 'National' },
  { value: 'international', label: 'International' },
  { value: 'state', label: 'State' },
  { value: 'college', label: 'College' },
]

const modeOptions: { value: CompetitionMode; label: string }[] = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'hybrid', label: 'Hybrid' },
]

const departmentOptions = [
  'CSE',
]

const inputClass = 'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'
const selectClass = inputClass

export default function CreateCompetitionPage() {
  const router = useRouter()
  const createMutation = useCreateCompetition()
  const [tagsInput, setTagsInput] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    shortDescription: '',
    category: '' as CompetitionCategory | '',
    scope: '' as CompetitionScope | '',
    mode: '' as CompetitionMode | '',
    organizer: '',
    websiteUrl: '',
    registrationUrl: '',
    teamSizeMin: 1,
    teamSizeMax: 1,
    prizePool: '',
    registrationDeadline: '',
    startDate: '',
    endDate: '',
    eligibilityDepartments: [] as string[],
    tags: [] as string[],
  })

  const update = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }))

  const toggleDepartment = (dept: string) => {
    setForm((prev) => ({
      ...prev,
      eligibilityDepartments: prev.eligibilityDepartments.includes(dept)
        ? prev.eligibilityDepartments.filter((d) => d !== dept)
        : [...prev.eligibilityDepartments, dept],
    }))
  }

  const addTag = () => {
    const trimmed = tagsInput.trim()
    if (trimmed && !form.tags.includes(trimmed)) {
      update('tags', [...form.tags, trimmed])
      setTagsInput('')
    }
  }

  const removeTag = (tag: string) => {
    update('tags', form.tags.filter((t) => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.category || !form.scope || !form.mode || !form.organizer) return

    const payload = {
      ...form,
      category: form.category as CompetitionCategory,
      scope: form.scope as CompetitionScope,
      mode: form.mode as CompetitionMode,
      eligibility: {
        departments: form.eligibilityDepartments,
        yearOfStudy: [],
        description: '',
      },
    }

    try {
      await createMutation.mutateAsync(payload)
      router.push('/competitions')
    } catch { /* ignore */ }
  }

  const isValid = form.title && form.category && form.scope && form.mode && form.organizer

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create Competition</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <div className="mt-4 space-y-5">
            <div>
              <label className={labelClass}>Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                className={inputClass}
                placeholder="Enter competition title"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Short Description</label>
              <input
                type="text"
                value={form.shortDescription}
                onChange={(e) => update('shortDescription', e.target.value)}
                className={inputClass}
                placeholder="Brief description"
              />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                className={`${inputClass} min-h-[100px] resize-y`}
                placeholder="Full description of the competition"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => update('category', e.target.value)}
                  className={selectClass}
                  required
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Scope *</label>
                <select
                  value={form.scope}
                  onChange={(e) => update('scope', e.target.value)}
                  className={selectClass}
                  required
                >
                  <option value="">Select scope</option>
                  {scopeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Mode *</label>
                <select
                  value={form.mode}
                  onChange={(e) => update('mode', e.target.value)}
                  className={selectClass}
                  required
                >
                  <option value="">Select mode</option>
                  {modeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Organizer & Links</CardTitle>
          </CardHeader>
          <div className="mt-4 space-y-5">
            <div>
              <label className={labelClass}>Organizer *</label>
              <input
                type="text"
                value={form.organizer}
                onChange={(e) => update('organizer', e.target.value)}
                className={inputClass}
                placeholder="Organizing body"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Website URL</label>
                <input
                  type="url"
                  value={form.websiteUrl}
                  onChange={(e) => update('websiteUrl', e.target.value)}
                  className={inputClass}
                  placeholder="https://"
                />
              </div>
              <div>
                <label className={labelClass}>Registration URL</label>
                <input
                  type="url"
                  value={form.registrationUrl}
                  onChange={(e) => update('registrationUrl', e.target.value)}
                  className={inputClass}
                  placeholder="https://"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Team & Prize</CardTitle>
          </CardHeader>
          <div className="mt-4 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Min Team Size</label>
                <input
                  type="number"
                  min={1}
                  value={form.teamSizeMin}
                  onChange={(e) => update('teamSizeMin', parseInt(e.target.value) || 1)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Max Team Size</label>
                <input
                  type="number"
                  min={1}
                  value={form.teamSizeMax}
                  onChange={(e) => update('teamSizeMax', parseInt(e.target.value) || 1)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Prize Pool</label>
                <input
                  type="text"
                  value={form.prizePool}
                  onChange={(e) => update('prizePool', e.target.value)}
                  className={inputClass}
                  placeholder="e.g. ₹50,000"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Dates</CardTitle>
          </CardHeader>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Registration Deadline</label>
              <input
                type="date"
                value={form.registrationDeadline}
                onChange={(e) => update('registrationDeadline', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => update('startDate', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => update('endDate', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Eligibility & Tags</CardTitle>
          </CardHeader>
          <div className="mt-4 space-y-5">
            <div>
              <label className={labelClass}>Eligible Departments</label>
              <div className="flex flex-wrap gap-2">
                {departmentOptions.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => toggleDepartment(dept)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      form.eligibilityDepartments.includes(dept)
                        ? 'bg-accent text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Tags</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  className={inputClass}
                  placeholder="Type a tag and press Enter"
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full"
                    >
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-accentDark">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={!isValid || createMutation.isPending} isLoading={createMutation.isPending}>
            <Plus className="w-4 h-4" />
            Create Competition
          </Button>
        </div>
      </form>
    </div>
  )
}
