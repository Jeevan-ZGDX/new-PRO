import { View, ScrollView, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useProfile, useLogout, useRegistrationStats } from '@comp-dash/api'
import { Card, Avatar, SettingsRow, Button, Skeleton } from '@comp-dash/design-system'
import { colors } from '@comp-dash/design-system'
import { useAuth } from '@comp-dash/hooks'
import { Settings, Bookmark, Bell, Globe, HelpCircle, Info, Shield, FileText, LogOut } from 'lucide-react'

export default function ProfileScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, isLoading } = useProfile()
  const { data: stats } = useRegistrationStats()
  const logout = useLogout()
  const { logout: authLogout } = useAuth()

  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      t('auth.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout.mutateAsync()
            authLogout()
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <View style={{ fontSize: 28, fontWeight: '700', color: colors.textPrimary }}>
            {t('profile.title')}
          </View>
          <View
            onTouchEnd={() => {}}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' }}
          >
            <Settings size={18} color={colors.gray600} />
          </View>
        </View>

        {/* Profile Info */}
        <Card padding="lg" style={{ alignItems: 'center', marginHorizontal: 20, marginBottom: 20 }}>
          {isLoading ? (
            <View style={{ alignItems: 'center', width: '100%' }}>
              <Skeleton variant="avatar" width="3xl" height={96} />
              <View style={{ height: 12 }} />
              <Skeleton variant="heading" width="half" />
              <View style={{ height: 4 }} />
              <Skeleton variant="text" width="third" />
            </View>
          ) : (
            <>
              <Avatar name={user?.name || ''} src={user?.avatarUrl || undefined} size="3xl" />
              <View style={{ height: 12 }} />
              <View style={{ fontSize: 20, fontWeight: '600', color: colors.textPrimary }}>
                {user?.name}
              </View>
              <View style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2 }}>
                {user?.email}
              </View>
              <View style={{ height: 8 }} />
              <Card variant="outlined" padding="sm" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ fontSize: 14, color: colors.accent }}>🎓</View>
                <View style={{ fontSize: 14, color: colors.textPrimary, fontWeight: '500' }}>
                  {user?.department} - {user?.academicYear}
                </View>
                <View style={{ fontSize: 14, color: colors.textSecondary }}>
                  {t('profile.section', { section: user?.section })}
                </View>
              </Card>
            </>
          )}
        </Card>

        {/* Stats */}
        <Card padding="lg" style={{ marginHorizontal: 20, marginBottom: 20 }}>
          {isLoading ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                  <Skeleton variant="heading" width="xs" />
                  <View style={{ height: 4 }} />
                  <Skeleton variant="text" width="xs" />
                </View>
              ))}
            </View>
          ) : (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <View style={{ fontSize: 24, fontWeight: '700', color: colors.textPrimary }}>
                  {stats?.totalRegistered || 0}
                </View>
                <View style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                  {t('home.registered')}
                </View>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <View style={{ fontSize: 24, fontWeight: '700', color: colors.success }}>
                  {stats?.totalVerified || 0}
                </View>
                <View style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                  {t('home.verified')}
                </View>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <View style={{ fontSize: 24, fontWeight: '700', color: colors.info }}>
                  {stats?.totalCompleted || 0}
                </View>
                <View style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                  {t('home.completed')}
                </View>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <View style={{ fontSize: 24, fontWeight: '700', color: colors.accent }}>
                  {user?.totalWins || 0}
                </View>
                <View style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                  {t('home.wins')}
                </View>
              </View>
            </View>
          )}
        </Card>

        {/* Settings */}
        <Card padding="none" style={{ marginHorizontal: 20 }}>
          <SettingsRow
            icon={<Bookmark size={18} color={colors.gray600} />}
            label={t('profile.settings.bookmarks')}
            onPress={() => {}}
          />
          <SettingsRow
            icon={<Bell size={18} color={colors.gray600} />}
            label={t('profile.settings.notifications')}
            onPress={() => {}}
          />
          <SettingsRow
            icon={<Globe size={18} color={colors.gray600} />}
            label={t('profile.settings.language')}
            value="English"
            onPress={() => {}}
          />
          <SettingsRow
            icon={<HelpCircle size={18} color={colors.gray600} />}
            label={t('profile.settings.helpSupport')}
            onPress={() => {}}
          />
          <SettingsRow
            icon={<Info size={18} color={colors.gray600} />}
            label={t('profile.settings.about')}
            onPress={() => {}}
          />
          <SettingsRow
            icon={<Shield size={18} color={colors.gray600} />}
            label={t('profile.settings.privacy')}
            onPress={() => {}}
          />
          <SettingsRow
            icon={<FileText size={18} color={colors.gray600} />}
            label={t('profile.settings.terms')}
            onPress={() => {}}
          />
        </Card>

        {/* Logout */}
        <View style={{ marginHorizontal: 20, marginTop: 20 }}>
          <Button variant="outline" size="lg" fullWidth onPress={handleLogout}>
            <LogOut size={18} color={colors.error} />
            <View style={{ color: colors.error }}>{t('auth.logout')}</View>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
