import { View, ScrollView, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Bell } from 'lucide-react-react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useProfile } from '@comp-dash/api'
import { useUpcomingDeadlines } from '@comp-dash/api'
import { useRegistrationStats, useRegistrations } from '@comp-dash/api'
import { Card, Avatar, StatCard, CompetitionCard, Skeleton } from '@comp-dash/design-system'
import { colors } from '@comp-dash/design-system'
import { formatCountdown } from '@comp-dash/utils'
import { useUnreadNotificationCount } from '@comp-dash/api'
import { useRefresh } from '../../src/hooks/useRefresh'

export default function HomeScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { data: user, isLoading: userLoading } = useProfile()
  const { data: stats, isLoading: statsLoading } = useRegistrationStats()
  const { data: deadlines, isLoading: deadlinesLoading } = useUpcomingDeadlines()
  const { data: registrations, isLoading: registrationsLoading } = useRegistrations({ status: 'verified', limit: 3 })
  const { data: unreadData } = useUnreadNotificationCount()
  const { refreshing, onRefresh } = useRefresh()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 }}>
          <View style={{ flex: 1 }}>
            {userLoading ? (
              <Skeleton variant="heading" width="half" />
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Skeleton variant="text" width="half" />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Skeleton variant="heading" width="threequarters" />
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>
          <View style={{ position: 'relative' }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.gray100,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onTouchEnd={() => router.push('/notifications')}
            >
              <Bell size={20} color={colors.gray600} />
            </View>
            {unreadData && unreadData.count > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: colors.error,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View style={{ fontSize: 10, color: colors.white, fontWeight: '600' }}>
                  {unreadData.count > 9 ? '9+' : unreadData.count}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Greeting */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          {userLoading ? (
            <Skeleton variant="heading" width="threequarters" />
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Skeleton variant="text" width="half" />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Skeleton variant="heading" width="threequarters" />
                  </View>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Verification Status */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          {statsLoading ? (
            <Card padding="lg">
              <Skeleton variant="heading" width="half" />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                <Skeleton variant="card" width="third" height={60} />
                <Skeleton variant="card" width="third" height={60} />
                <Skeleton variant="card" width="third" height={60} />
              </View>
            </Card>
          ) : (
            <Card padding="lg">
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>
                  {t('home.verificationStatus')}
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{ fontSize: 32, fontWeight: '700', color: colors.warning }}>
                    {stats?.totalPending || 0}
                  </View>
                  <View style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                    {t('home.pending')}
                  </View>
                </View>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{ fontSize: 32, fontWeight: '700', color: colors.success }}>
                    {stats?.totalVerified || 0}
                  </View>
                  <View style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                    {t('home.verified')}
                  </View>
                </View>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <View style={{ fontSize: 32, fontWeight: '700', color: colors.info }}>
                    {stats?.totalCompleted || 0}
                  </View>
                  <View style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                    {t('home.completed')}
                  </View>
                </View>
              </View>
            </Card>
          )}
        </View>

        {/* Upcoming Deadlines */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary }}>
              {t('home.upcomingDeadlines')}
            </View>
            <View
              onTouchEnd={() => router.push('/discover')}
              style={{ fontSize: 14, color: colors.accent, fontWeight: '500' }}
            >
              {t('home.viewAll')}
            </View>
          </View>
          {deadlinesLoading ? (
            <View style={{ gap: 12 }}>
              <Skeleton variant="card" height={100} />
              <Skeleton variant="card" height={100} />
            </View>
          ) : deadlines && deadlines.length > 0 ? (
            <View style={{ gap: 12 }}>
              {deadlines.slice(0, 3).map((comp) => (
                <Card
                  key={comp.id}
                  variant="interactive"
                  padding="md"
                  onPress={() => router.push(`/competition/${comp.id}`)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.primary100, alignItems: 'center', justifyContent: 'center' }}>
                      <View style={{ fontSize: 20 }}>🏆</View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>
                        {comp.title}
                      </View>
                      <View style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                        Registration closes in
                      </View>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                        backgroundColor: colors.warningLight,
                      }}
                    >
                      <View style={{ fontSize: 13, fontWeight: '600', color: colors.warning }}>
                        {formatCountdown(comp.registrationDeadline)}
                      </View>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <Card padding="lg" style={{ alignItems: 'center' }}>
              <View style={{ fontSize: 14, color: colors.textSecondary }}>
                {t('home.noUpcoming')}
              </View>
            </Card>
          )}
        </View>

        {/* Recently Verified */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary }}>
              {t('home.recentlyVerified')}
            </View>
            <View
              onTouchEnd={() => router.push('/history')}
              style={{ fontSize: 14, color: colors.accent, fontWeight: '500' }}
            >
              {t('home.viewAll')}
            </View>
          </View>
          {registrationsLoading ? (
            <View style={{ gap: 12 }}>
              <Skeleton variant="card" height={80} />
              <Skeleton variant="card" height={80} />
            </View>
          ) : registrations && registrations.data.length > 0 ? (
            <View style={{ gap: 12 }}>
              {registrations.data.map((reg) => (
                <Card key={reg.id} padding="md">
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Avatar name={reg.competition.title} size="md" />
                    <View style={{ flex: 1 }}>
                      <View style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>
                        {reg.competition.title}
                      </View>
                      <View style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                        Verified on {new Date(reg.verifiedAt || '').toLocaleDateString()}
                      </View>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                        backgroundColor: colors.successLight,
                      }}
                    >
                      <View style={{ fontSize: 13, fontWeight: '600', color: colors.success }}>
                        Verified
                      </View>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <Card padding="lg" style={{ alignItems: 'center' }}>
              <View style={{ fontSize: 14, color: colors.textSecondary }}>
                {t('home.noVerified')}
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
