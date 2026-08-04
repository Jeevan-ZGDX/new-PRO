import { View, FlatList } from 'react-native'
import { useRouter, Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useNotifications, useMarkAllNotificationsRead } from '@comp-dash/api'
import { NotificationItem, EmptyState, Skeleton } from '@comp-dash/design-system'
import { colors } from '@comp-dash/design-system'
import { formatTimeAgo, groupBy } from '@comp-dash/utils'
import type { Notification, NotificationGroup } from '@comp-dash/types'
import { ArrowLeft, CheckCheck } from 'lucide-react'

export default function NotificationsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { data, isLoading, refetch } = useNotifications({ limit: 50 })
  const markAllRead = useMarkAllNotificationsRead()

  const handleMarkAllRead = () => {
    markAllRead.mutate()
  }

  const getNotificationGroups = (notifications: Notification[]): NotificationGroup[] => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const grouped = groupBy(notifications, (n) => {
      const date = new Date(n.createdAt)
      if (date >= today) return 'today'
      if (date >= yesterday) return 'yesterday'
      return 'earlier'
    })

    const groups: { label: string; key: string }[] = [
      { label: t('notifications.today'), key: 'today' },
      { label: t('notifications.yesterday'), key: 'yesterday' },
      { label: t('notifications.earlier'), key: 'earlier' },
    ]

    return groups
      .filter((g) => grouped[g.key]?.length > 0)
      .map((g) => ({
        label: g.label,
        notifications: grouped[g.key],
      }))
  }

  const notificationGroups = data?.data ? getNotificationGroups(data.data) : []

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t('notifications.title'),
          headerLeft: () => (
            <View
              onTouchEnd={() => router.back()}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowLeft size={18} color={colors.gray700} />
            </View>
          ),
          headerRight: () => (
            <View
              onTouchEnd={handleMarkAllRead}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <CheckCheck size={16} color={colors.accent} />
              <View style={{ fontSize: 14, color: colors.accent, fontWeight: '500' }}>
                {t('notifications.markAllRead')}
              </View>
            </View>
          ),
          headerStyle: { backgroundColor: colors.white },
          headerShadowVisible: false,
        }}
      />
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        {isLoading ? (
          <View style={{ padding: 20, gap: 12 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 12, padding: 16, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
                <Skeleton variant="avatar" width="md" height={40} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Skeleton variant="heading" width="threequarters" />
                  <Skeleton variant="text" width="half" />
                </View>
              </View>
            ))}
          </View>
        ) : notificationGroups.length > 0 ? (
          <FlatList
            data={notificationGroups}
            keyExtractor={(group) => group.label}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            renderItem={({ item: group }) => (
              <View style={{ marginBottom: 24 }}>
                <View style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, paddingHorizontal: 4 }}>
                  {group.label}
                </View>
                <View style={{ gap: 2 }}>
                  {group.notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      type={notification.type}
                      title={notification.title}
                      message={notification.message}
                      time={formatTimeAgo(notification.createdAt)}
                      isRead={notification.isRead}
                    />
                  ))}
                </View>
              </View>
            )}
          />
        ) : (
          <EmptyState
            title={t('notifications.noNotifications')}
            description={t('notifications.noNotificationsDescription')}
          />
        )}
      </View>
    </>
  )
}
