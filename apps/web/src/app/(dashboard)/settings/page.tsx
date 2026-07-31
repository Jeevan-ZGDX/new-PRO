'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, SettingsRow } from '@comp-dash/design-system'
import { useProfile, useUpdateNotificationPreferences } from '@comp-dash/api'
import { Building2, Calendar, Bell, BellOff, Moon, Sun, Palette, Loader2 } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { useTheme } from '@/components/providers/ThemeProvider'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { data: profile, isLoading } = useProfile()
  const { toast } = useToast()
  const { mutate: updateNotificationPrefs, isPending: isSaving } = useUpdateNotificationPreferences()
  const { theme, setTheme } = useTheme()

  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [deadlineReminders, setDeadlineReminders] = useState(true)

  useEffect(() => {
    if (profile?.notificationPreferences) {
      setEmailNotifications(profile.notificationPreferences.emailNotifications)
      setPushNotifications(profile.notificationPreferences.pushNotifications)
      setDeadlineReminders(profile.notificationPreferences.deadlineReminders)
    }
  }, [profile])

  const handleToggle = (key: 'emailNotifications' | 'pushNotifications' | 'deadlineReminders', value: boolean) => {
    const update = { emailNotifications, pushNotifications, deadlineReminders, [key]: value }
    if (key === 'emailNotifications') setEmailNotifications(value)
    if (key === 'pushNotifications') setPushNotifications(value)
    if (key === 'deadlineReminders') setDeadlineReminders(value)
    updateNotificationPrefs({
      emailNotifications: update.emailNotifications,
      pushNotifications: update.pushNotifications,
      deadlineReminders: update.deadlineReminders,
      verificationUpdates: profile?.notificationPreferences?.verificationUpdates ?? true,
      newCompetitions: profile?.notificationPreferences?.newCompetitions ?? true,
    }, {
      onSuccess: () => toast('success', 'Preferences saved'),
      onError: () => toast('error', 'Failed to save preferences'),
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#F0F6FC]">{t('sidebar.settings')}</h1>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <div className="p-6 space-y-4">
              <div className="h-5 bg-gray-100 dark:bg-[#161B22] rounded w-1/4 animate-pulse" />
              <div className="h-12 bg-gray-100 dark:bg-[#161B22] rounded animate-pulse" />
              <div className="h-12 bg-gray-100 dark:bg-[#161B22] rounded animate-pulse" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[#F0F6FC]">{t('sidebar.settings')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <div className="mt-2 divide-y divide-gray-100 dark:divide-[#30363D]">
          <SettingsRow
            icon={<Building2 className="w-5 h-5" />}
            label="Institution Name"
            value="Chennai Institute of Technology"
          />
          <SettingsRow
            icon={<Calendar className="w-5 h-5" />}
            label="Academic Year"
            value="2024 - 2025"
          />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Notification Preferences</CardTitle>
            {isSaving && <Loader2 className="w-4 h-4 text-accent animate-spin" />}
          </div>
        </CardHeader>
        <div className="mt-2 divide-y divide-gray-100 dark:divide-[#30363D]">
          <SettingsRow
            icon={<Bell className="w-5 h-5" />}
            label="Email Notifications"
            rightElement={
              <button
                onClick={() => handleToggle('emailNotifications', !emailNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  emailNotifications ? 'bg-accent' : 'bg-gray-200 dark:bg-[#30363D]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            }
          />
          <SettingsRow
            icon={<BellOff className="w-5 h-5" />}
            label="Push Notifications"
            rightElement={
              <button
                onClick={() => handleToggle('pushNotifications', !pushNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  pushNotifications ? 'bg-accent' : 'bg-gray-200 dark:bg-[#30363D]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    pushNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            }
          />
          <SettingsRow
            icon={<Bell className="w-5 h-5" />}
            label="Deadline Reminders"
            rightElement={
              <button
                onClick={() => handleToggle('deadlineReminders', !deadlineReminders)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  deadlineReminders ? 'bg-accent' : 'bg-gray-200 dark:bg-[#30363D]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    deadlineReminders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            }
          />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <div className="mt-2 divide-y divide-gray-100 dark:divide-[#30363D]">
          <SettingsRow
            icon={<Palette className="w-5 h-5" />}
            label="Theme"
            rightElement={
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-accent text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-[#0D1117] border dark:border-[#30363D] text-gray-600 dark:text-[#8B949E] hover:bg-gray-200 dark:hover:bg-[#21262D]'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-accent text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-[#0D1117] border dark:border-[#30363D] text-gray-600 dark:text-[#8B949E] hover:bg-gray-200 dark:hover:bg-[#21262D]'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  Dark
                </button>
              </div>
            }
          />
        </div>
      </Card>
    </div>
  )
}
