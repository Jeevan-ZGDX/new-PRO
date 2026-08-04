import { useState } from 'react'
import { View, FlatList } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRegistrations } from '@comp-dash/api'
import { SegmentedControl, Card, StatusBadge, EmptyState, Skeleton, CompetitionCardSkeleton } from '@comp-dash/design-system'
import { colors } from '@comp-dash/design-system'
import type { RegistrationStatus } from '@comp-dash/types'

const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending_verification' },
  { label: 'Verified', value: 'verified' },
  { label: 'Completed', value: 'completed' },
  { label: 'Rejected', value: 'rejected' },
]

export default function HistoryScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const [selectedTab, setSelectedTab] = useState('all')

  const { data, isLoading, refetch } = useRegistrations({
    status: selectedTab === 'all' ? undefined : (selectedTab as RegistrationStatus),
    limit: 20,
  })

  const getStatusColor = (status: RegistrationStatus) => {
    switch (status) {
      case 'pending_verification': return 'pending'
      case 'verified': return 'verified'
      case 'completed': return 'completed'
      case 'rejected': return 'rejected'
      default: return 'pending'
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['top']}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <View style={{ fontSize: 28, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 }}>
            {t('history.title')}
          </View>
          <SegmentedControl
            options={tabs}
            selected={selectedTab}
            onSelect={setSelectedTab}
          />
        </View>

        {/* Registration List */}
        {isLoading ? (
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} padding="md">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Skeleton variant="avatar" width="lg" height={48} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Skeleton variant="heading" width="threequarters" />
                    <Skeleton variant="text" width="half" />
                  </View>
                  <Skeleton variant="button" width="lg" height={32} />
                </View>
              </Card>
            ))}
          </View>
        ) : data?.data && data.data.length > 0 ? (
          <FlatList
            data={data.data}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 12 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Card
                variant="interactive"
                padding="md"
                onPress={() => router.push(`/competition/${item.competitionId}`)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: colors.primary100,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View style={{ fontSize: 20 }}>🏆</View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>
                      {item.competition.title}
                    </View>
                    <View style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                      {item.status === 'verified' || item.status === 'completed'
                        ? t('history.verifiedOn', { date: new Date(item.verifiedAt || '').toLocaleDateString() })
                        : t('history.registrationRequested')}
                    </View>
                  </View>
                  <StatusBadge status={getStatusColor(item.status)} size="sm" />
                </View>
              </Card>
            )}
          />
        ) : (
          <EmptyState
            title={t('history.noRegistrations')}
            description={t('history.noRegistrationsDescription')}
          />
        )}
      </View>
    </SafeAreaView>
  )
}
