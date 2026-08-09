'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { authenticateUser } from '@/lib/auth'
import { apiClient } from '@comp-dash/api'
import { ThemeToggle } from '@/components/common/ThemeToggle'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const cleanEmail = email.trim()
    if (!cleanEmail || !password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    const success = authenticateUser(cleanEmail, password)
    if (!success) {
      setError('Invalid email or password')
      setLoading(false)
      return
    }

    const token = 'mock-jwt-' + cleanEmail + '-' + Date.now()
    apiClient.setToken(token)
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }

    router.push('/dashboard')
  }

  const fillCredentials = (em: string, pass: string) => {
    setEmail(em)
    setPassword(pass)
    setError('')
  }

  const testUsers = [
    { email: 'admin@citchennai.net', pass: 'admin123', label: 'Super Admin' },
    { email: 'hod@citchennai.net', pass: 'hod123', label: 'HOD' },
    { email: 'advisor@citchennai.net', pass: 'advisor123', label: 'Advisor' },
    { email: 'student@citchennai.net', pass: 'student123', label: 'Student' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-obsidian-canvas relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-accent">C</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-ink-primary mb-2">Welcome Back</h1>
          <p className="text-gray-500 dark:text-obsidian-faint">Sign in to your Comp-Dash account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-obsidian-surface rounded-2xl shadow-sm border border-gray-100 dark:border-obsidian-border p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-ink-muted mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cit.in"
              className="w-full h-11 px-4 rounded-xl border border-gray-300 dark:border-obsidian-border bg-white dark:bg-obsidian-hover text-gray-900 dark:text-ink-primary placeholder-gray-400 dark:placeholder-obsidian-faint font-medium text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-ink-muted mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full h-11 px-4 pr-11 rounded-xl border border-gray-300 dark:border-obsidian-border bg-white dark:bg-obsidian-hover text-gray-900 dark:text-ink-primary placeholder-gray-400 dark:placeholder-obsidian-faint font-medium text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-obsidian-faint hover:text-gray-600 dark:hover:text-ink-muted"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-accent dark:bg-striver text-white rounded-xl font-medium text-sm hover:bg-accent/90 dark:hover:bg-striver-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-obsidian-faint">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="text-accent dark:text-uv font-medium hover:underline">
              Create one
            </Link>
          </p>
        </form>

        <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700 space-y-2">
          <p className="font-medium text-sm">Test Credentials (click to fill):</p>
          <div className="space-y-1">
            {testUsers.map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => fillCredentials(u.email, u.pass)}
                className="w-full text-left p-1.5 hover:bg-blue-100/60 rounded flex justify-between items-center transition-colors text-blue-800"
              >
                <span><strong className="font-semibold">{u.email}</strong> / {u.pass}</span>
                <span className="font-medium text-[11px] bg-blue-200/70 text-blue-900 px-2 py-0.5 rounded-full">{u.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
