'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { Card, Badge, Button } from '@comp-dash/design-system'
import { useCompetition } from '@comp-dash/api'
import { getCurrentUser } from '@/lib/auth'
import { AdvisorRosterPanel } from '@/components/dashboard/AdvisorRosterPanel'
import { HodSectionsPanel } from '@/components/dashboard/HodSectionsPanel'
import { 
  Calendar, MapPin, Users, Clock, Trophy, ArrowLeft, ExternalLink, 
  Globe, Building2, Target, Pencil, Mail, CheckCircle, AlertCircle, 
  Loader2, MailCheck, Shield, Sparkles, ChevronDown, ChevronUp, Info,
} from 'lucide-react'

const categoryGradients: Record<string, string> = {
  competition: 'from-violet-500 to-purple-600',
  'c + p': 'from-emerald-500 to-teal-600',
  'c + i': 'from-blue-500 to-cyan-600',
  'start-up': 'from-amber-500 to-orange-600',
  hackathon: 'from-pink-500 to-rose-600',
  internship: 'from-indigo-500 to-blue-600',
  workshop: 'from-orange-500 to-red-600',
  paper_presentation: 'from-teal-500 to-green-600',
  project: 'from-cyan-500 to-blue-600',
  sports: 'from-green-500 to-emerald-600',
  cultural: 'from-purple-500 to-pink-600',
  other: 'from-gray-500 to-gray-600',
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return 'TBA'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'TBA'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function CompetitionDetailContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [user, setUser] = useState<any>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle')
  const [verificationMessage, setVerificationMessage] = useState('')
  const [showVerificationDetails, setShowVerificationDetails] = useState(false)

  useEffect(() => { setUser(getCurrentUser()) }, [])

  const { data: comp, isLoading, error } = useCompetition(params.id as string)

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setVerificationStatus('success')
      setVerificationMessage('Email verified successfully! Your registration has been confirmed.')
      setTimeout(() => setVerificationStatus('idle'), 5000)
    }
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="h-6 w-32 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 dark:bg-zinc-800/60 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!comp || error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-zinc-500">
        <Info className="w-12 h-12 mb-3 text-gray-300 dark:text-zinc-600" />
        <p className="text-sm font-medium">Competition not found</p>
        <button onClick={() => router.back()} className="text-sm text-accent mt-2 hover:underline transition-all">Go back</button>
      </div>
    )
  }

  const deadline = comp.registrationDeadline ? new Date(comp.registrationDeadline) : null
  const isOpen = deadline ? deadline > new Date() : true
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
  const hasRegistrationLink = comp.registrationLink || comp.registrationUrl

  const handleRegisterNow = () => {
    const url = comp.registrationLink || comp.registrationUrl
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleVerifyEmail = async () => {
    if (!user) {
      router.push('/auth/login?redirect=' + encodeURIComponent(window.location.href))
      return
    }

    setIsVerifying(true)
    setVerificationStatus('loading')
    setVerificationMessage('Connecting to Gmail...')

    try {
      const oauthUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/auth?competitionId=${comp.id}&userEmail=${encodeURIComponent(user.email)}`
      window.location.href = oauthUrl
    } catch (err) {
      setVerificationStatus('error')
      setVerificationMessage(err instanceof Error ? err.message : 'Failed to start verification')
      setIsVerifying(false)
    }
  }

  const handleManualVerify = () => {
    router.push(`/email-verification?organizerEmail=${encodeURIComponent(comp.organizerEmail)}&competitionId=${comp.id}`)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 hover:scale-105 origin-left"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Competitions
      </button>

      <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm transition-all duration-200">
        <div className={`h-2 bg-gradient-to-r ${categoryGradients[comp.category?.toLowerCase()] || 'from-gray-400 to-gray-500'}`} />
        
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="primary" size="sm">{comp.category || 'Competition'}</Badge>
                {daysLeft !== null && (
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                    isOpen 
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60' 
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                  }`}>
                    {isOpen ? (daysLeft > 0 ? `${daysLeft} days left` : 'Closing soon') : 'Registration closed'}
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{comp.title}</h1>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">by <span className="font-medium text-gray-700 dark:text-zinc-300">{comp.organizer}</span></p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              {hasRegistrationLink && (
                <Button 
                  onClick={handleRegisterNow}
                  className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent/90 transition-transform duration-200 hover:scale-105 active:scale-95 shadow-sm"
                  size="md"
                >
                  <ExternalLink className="w-4 h-4" />
                  Register Now
                </Button>
              )}
              {user?.role === 'super_admin' && (
                <Button 
                  onClick={() => router.push(`/create-competition?edit=${comp.id}`)}
                  variant="outline"
                  className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-transform duration-200 hover:scale-105 active:scale-95"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gray-50 dark:bg-zinc-900/70 border border-gray-200/60 dark:border-zinc-800 rounded-xl transition-transform duration-200 hover:scale-[1.02]">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 mb-1">
                <Calendar className="w-3.5 h-3.5 text-accent" />
                Dates
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatDate(comp.startDate)}{comp.endDate ? ` - ${formatDate(comp.endDate)}` : ''}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-zinc-900/70 border border-gray-200/60 dark:border-zinc-800 rounded-xl transition-transform duration-200 hover:scale-[1.02]">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Deadline
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatDate(comp.registrationDeadline)}
                {deadline && !isOpen && <span className="text-rose-500 dark:text-rose-400 ml-1.5">(Closed)</span>}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-zinc-900/70 border border-gray-200/60 dark:border-zinc-800 rounded-xl transition-transform duration-200 hover:scale-[1.02]">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 mb-1">
                <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                Prize Pool
              </div>
              <p className="text-sm font-bold text-accent">{comp.prizePool || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 dark:bg-zinc-900/70 border border-gray-200/60 dark:border-zinc-800 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 mb-1">
                <Building2 className="w-3.5 h-3.5 text-accent" />
                Organizer
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{comp.organizer}</p>
              {comp.organizerEmail && (
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{comp.organizerEmail}</p>
              )}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-zinc-900/70 border border-gray-200/60 dark:border-zinc-800 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400 mb-1">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                Category
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{comp.category || 'Competition'}</p>
            </div>
          </div>

          {comp.description && (
            <div className="p-5 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl mb-6">
              <p className="text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-wider font-medium mb-2">Description</p>
              <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">{comp.description}</p>
            </div>
          )}

          {comp.eligibility?.yearOfStudy?.filter(Boolean).length > 0 && (
            <div className="p-4 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl mb-6">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Eligibility</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {comp.eligibility.yearOfStudy.filter(Boolean).map((y: string) => (
                      <span key={y} className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium">{y}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              Registration Verification
            </h2>
            
            <div className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-100 dark:border-purple-900/40 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 border border-purple-200/50 dark:border-purple-800/50 flex items-center justify-center shrink-0">
                      <Mail className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">Verify Your Registration</h3>
                      <p className="text-sm text-gray-600 dark:text-zinc-300 mt-1">
                        Connect your Gmail to automatically verify your registration by finding 
                        confirmation emails from <strong className="text-purple-700 dark:text-purple-300">{comp.organizerEmail || 'the organizer'}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                  <Button
                    onClick={handleVerifyEmail}
                    disabled={isVerifying || verificationStatus === 'loading'}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    size="md"
                  >
                    {isVerifying || verificationStatus === 'loading' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting to Gmail...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Verify Email Access
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleManualVerify}
                    variant="outline"
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    size="md"
                  >
                    <MailCheck className="w-4 h-4" />
                    Manual Verify
                  </Button>
                </div>
              </div>

              {(verificationStatus === 'success' || verificationStatus === 'error') && (
                <div className={`mt-4 p-4 rounded-xl flex items-start gap-3 border ${
                  verificationStatus === 'success' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' 
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    verificationStatus === 'success' ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400'
                  }`}>
                    {verificationStatus === 'success' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                  </div>
                  <p className={`text-sm font-medium ${verificationStatus === 'success' ? 'text-emerald-800 dark:text-emerald-200' : 'text-rose-800 dark:text-rose-200'}`}>
                    {verificationMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/*
          Advisors get their own sections, resolved from their `advisors` row.
          HODs and admins have no advisors row, so they get the department-wide
          section breakdown instead — showing them the advisor panel produced
          "no advisor record is mapped to this account".
        */}
        {(user?.role === 'hod' || user?.role === 'super_admin') && (
          <div className="mt-8 pt-6 p-6 md:p-8 border-t border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30">
            <HodSectionsPanel competitionId={comp.id} competitionTitle={comp.title} />
          </div>
        )}

        {user?.role === 'advisor' && (
          <div className="mt-8 pt-6 p-6 md:p-8 border-t border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30">
            <AdvisorRosterPanel competitionId={comp.id} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function CompetitionDetailPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-500 dark:text-zinc-400">Loading...</div>}>
      <CompetitionDetailContent />
    </Suspense>
  )
}