'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { Card, Badge, Button } from '@comp-dash/design-system'
import { useCompetition, useAdvisorCompetitionStats } from '@comp-dash/api'
import { getCurrentUser } from '@/lib/auth'
import { 
  Calendar, MapPin, Users, Clock, Trophy, ArrowLeft, ExternalLink, 
  Globe, Building2, Target, Pencil, Mail, CheckCircle, AlertCircle, 
  Loader2, MailCheck, Shield, Sparkles, ChevronDown, ChevronUp, Info,
  Download, UserX
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
        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!comp || error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Info className="w-12 h-12 mb-3" />
        <p className="text-sm font-medium">Competition not found</p>
        <button onClick={() => router.back()} className="text-sm text-accent mt-2 hover:underline">Go back</button>
      </div>
    )
  }

  const deadline = comp.registrationDeadline ? new Date(comp.registrationDeadline) : null
  const isOpen = deadline ? deadline > new Date() : true
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
  const hasRegistrationLink = comp.registrationLink || comp.registrationUrl
  const { data: advisorStats, isLoading: statsLoading } = useAdvisorCompetitionStats(comp?.id)

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
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Competitions
      </button>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className={`h-2 bg-gradient-to-r ${categoryGradients[comp.category?.toLowerCase()] || 'from-gray-400 to-gray-500'}`} />
        
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="primary" size="sm">{comp.category || 'Competition'}</Badge>
                {daysLeft !== null && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    isOpen ? 'bg-green-50 text-green-700 border' : 'bg-red-50 text-red-600 border'
                  }`}>
                    {isOpen ? (daysLeft > 0 ? `${daysLeft} days left` : 'Closing soon') : 'Registration closed'}
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{comp.title}</h1>
              <p className="text-sm text-gray-500 mt-1">by {comp.organizer}</p>
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
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gray-50 border border-transparent rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <Calendar className="w-3.5 h-3.5" />
                Dates
              </div>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(comp.startDate)}{comp.endDate ? ` - ${formatDate(comp.endDate)}` : ''}
              </p>
            </div>
            <div className="p-4 bg-gray-50 border border-transparent rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <Clock className="w-3.5 h-3.5" />
                Deadline
              </div>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(comp.registrationDeadline)}
                {deadline && !isOpen && <span className="text-red-500 ml-1">(Closed)</span>}
              </p>
            </div>
            <div className="p-4 bg-gray-50 border border-transparent rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <Trophy className="w-3.5 h-3.5" />
                Prize Pool
              </div>
              <p className="text-sm font-bold text-accent">{comp.prizePool || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 border border-transparent rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <Building2 className="w-3.5 h-3.5" />
                Organizer
              </div>
              <p className="text-sm font-medium text-gray-900">{comp.organizer}</p>
              {comp.organizerEmail && (
                <p className="text-xs text-gray-400 mt-0.5">{comp.organizerEmail}</p>
              )}
            </div>
            <div className="p-4 bg-gray-50 border border-transparent rounded-xl">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <Globe className="w-3.5 h-3.5" />
                Category
              </div>
              <p className="text-sm font-medium text-gray-900 capitalize">{comp.category || 'Competition'}</p>
            </div>
          </div>

          {comp.description && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl mb-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Description</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{comp.description}</p>
            </div>
          )}

          {comp.eligibility?.yearOfStudy?.filter(Boolean).length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mb-6">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Eligibility</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {comp.eligibility.yearOfStudy.filter(Boolean).map((y: string) => (
                      <span key={y} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">{y}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              Registration Verification
            </h2>
            
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Verify Your Registration</h3>
                      <p className="text-sm text-gray-600 mt-1">
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
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-purple-200 text-purple-700 text-sm font-medium rounded-xl hover:bg-purple-50 transition-colors"
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
                    ? 'bg-green-50 border border-green-100' 
                    : 'bg-red-50 border border-red-100'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    verificationStatus === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {verificationStatus === 'success' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                  </div>
                  <p className={`text-sm ${verificationStatus === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                    {verificationMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {user?.role === 'advisor' && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                Student Applications Report
              </h2>
              <Button
                onClick={() => router.push(`/competitions/${comp.id}/report`)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Report
              </Button>
            </div>
            {statsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-2" />
                        <div className="h-6 w-12 bg-gray-100 rounded animate-pulse" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : advisorStats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Students</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {advisorStats.totalStudents || 0}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Applied Students</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {advisorStats.appliedStudents || 0}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                      <UserX className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Not Applied</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {advisorStats.unregisteredStudents || 0}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            ) : null}
          </div>
        )}
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
