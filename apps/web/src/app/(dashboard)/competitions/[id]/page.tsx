'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { Card, Badge, Button } from '@comp-dash/design-system'
import { useCompetition } from '@comp-dash/api'
import { getCurrentUser } from '@/lib/auth'
import { 
  Calendar, MapPin, Users, Clock, Trophy, ArrowLeft, ExternalLink, 
  Globe, Building2, Target, Pencil, Mail, CheckCircle, AlertCircle, 
  Loader2, MailCheck, Shield, Sparkles, ChevronDown, ChevronUp, Info
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
      <div className="space-y-6">
        <div className="h-6 w-24 bg-gray-200 dark:bg-[#161B22] rounded animate-pulse" />
        <div className="h-64 bg-gray-100 dark:bg-[#161B22] rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!comp || error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-[#8B949E]">
        <Info className="w-12 h-12 mb-3" />
        <p className="text-sm font-medium">Competition not found</p>
        <button onClick={() => router.back()} className="text-sm text-accent dark:text-[#38BDF8] mt-2 hover:underline">Go back</button>
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
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-[#8B949E] hover:text-gray-700 dark:hover:text-[#F0F6FC] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Competitions
      </button>

      <div className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D] rounded-2xl overflow-hidden">
        <div className={`h-2 bg-gradient-to-r ${categoryGradients[comp.category?.toLowerCase()] || 'from-gray-400 to-gray-500'}`} />
        
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="primary" size="sm">{comp.category || 'Competition'}</Badge>
                {daysLeft !== null && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    isOpen ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 border dark:border-green-800/50' : 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border dark:border-red-800/50'
                  }`}>
                    {isOpen ? (daysLeft > 0 ? `${daysLeft} days left` : 'Closing soon') : 'Registration closed'}
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-[#F0F6FC]">{comp.title}</h1>
              <p className="text-sm text-gray-500 dark:text-[#8B949E] mt-1">by {comp.organizer}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {hasRegistrationLink && (
                <Button 
                  onClick={handleRegisterNow}
                  className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent/90 transition-colors"
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
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D] rounded-xl text-sm font-medium text-gray-600 dark:text-[#8B949E] hover:bg-gray-50 dark:hover:bg-[#21262D] transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gray-50 dark:bg-[#0D1117] border border-transparent dark:border-[#30363D] rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-[#8B949E] mb-1">
                <Calendar className="w-3.5 h-3.5" />
                Dates
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-[#F0F6FC]">
                {formatDate(comp.startDate)}{comp.endDate ? ` - ${formatDate(comp.endDate)}` : ''}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-[#0D1117] border border-transparent dark:border-[#30363D] rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-[#8B949E] mb-1">
                <Clock className="w-3.5 h-3.5" />
                Deadline
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-[#F0F6FC]">
                {formatDate(comp.registrationDeadline)}
                {deadline && !isOpen && <span className="text-red-500 dark:text-red-400 ml-1">(Closed)</span>}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-[#0D1117] border border-transparent dark:border-[#30363D] rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-[#8B949E] mb-1">
                <Trophy className="w-3.5 h-3.5" />
                Prize Pool
              </div>
              <p className="text-sm font-bold text-accent dark:text-[#38BDF8]">{comp.prizePool || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 dark:bg-[#0D1117] border border-transparent dark:border-[#30363D] rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-[#8B949E] mb-1">
                <Building2 className="w-3.5 h-3.5" />
                Organizer
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-[#F0F6FC]">{comp.organizer}</p>
              {comp.organizerEmail && (
                <p className="text-xs text-gray-400 dark:text-[#8B949E] mt-0.5">{comp.organizerEmail}</p>
              )}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-[#0D1117] border border-transparent dark:border-[#30363D] rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-[#8B949E] mb-1">
                <Globe className="w-3.5 h-3.5" />
                Category
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-[#F0F6FC] capitalize">{comp.category || 'Competition'}</p>
            </div>
          </div>

          {comp.description && (
            <div className="p-4 bg-gray-50 dark:bg-[#0D1117] border border-gray-200 dark:border-[#30363D] rounded-xl mb-6">
              <p className="text-xs text-gray-400 dark:text-[#8B949E] uppercase tracking-wider mb-2">Description</p>
              <p className="text-sm text-gray-700 dark:text-[#F0F6FC] whitespace-pre-line">{comp.description}</p>
            </div>
          )}

          {comp.eligibility?.yearOfStudy?.filter(Boolean).length > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/40 rounded-xl mb-6">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Eligibility</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {comp.eligibility.yearOfStudy.filter(Boolean).map((y: string) => (
                      <span key={y} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium">{y}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-[#30363D]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-[#F0F6FC] mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent dark:text-[#38BDF8]" />
              Registration Verification
            </h2>
            
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-[#161B22] dark:to-[#0D1117] border border-purple-100 dark:border-[#30363D] rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-[#F0F6FC]">Verify Your Registration</h3>
                      <p className="text-sm text-gray-600 dark:text-[#8B949E] mt-1">
                        Connect your Gmail to automatically verify your registration by finding 
                        confirmation emails from <strong>{comp.organizerEmail || 'the organizer'}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <Button
                    onClick={handleVerifyEmail}
                    disabled={isVerifying || verificationStatus === 'loading'}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
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
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-[#161B22] border border-purple-200 dark:border-[#30363D] text-purple-700 dark:text-purple-300 text-sm font-medium rounded-xl hover:bg-purple-50 dark:hover:bg-[#21262D] transition-colors"
                    size="md"
                  >
                    <MailCheck className="w-4 h-4" />
                    Manual Verify
                  </Button>
                </div>
              </div>

              {(verificationStatus === 'success' || verificationStatus === 'error') && (
                <div className={`mt-4 p-4 rounded-xl flex items-start gap-3 ${
                  verificationStatus === 'success' 
                    ? 'bg-green-50 dark:bg-green-950/50 border border-green-100 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-800'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    verificationStatus === 'success' ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                  }`}>
                    {verificationStatus === 'success' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                  </div>
                  <p className={`text-sm ${verificationStatus === 'success' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                    {verificationMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CompetitionDetailPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-500">Loading...</div>}>
      <CompetitionDetailContent />
    </Suspense>
  )
}
