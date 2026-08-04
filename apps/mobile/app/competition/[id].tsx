import { View, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useCompetition, useRegisterForCompetition } from '@comp-dash/api'
import { Card, Button, Badge, StatusBadge, Skeleton } from '@comp-dash/design-system'
import { colors } from '@comp-dash/design-system'
import { formatDate } from '@comp-dash/utils'
import { Share2, Bookmark, ArrowLeft, ExternalLink, Users, Trophy, Calendar, MapPin, Mail } from 'lucide-react'

export default function CompetitionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t } = useTranslation()
  const router = useRouter()
  const { data: competition, isLoading } = useCompetition(id || '')
  const register = useRegisterForCompetition()

  const handleRegister = async () => {
    if (!competition) return
    // Redirect to external competition platform
    // Then return to Comp-Dash for verification
  }

  const handleShare = async () => {
    // Share competition details
  }

  const handleBookmark = () => {
    // Toggle bookmark
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerLeft: () => (
            <View
              onTouchEnd={() => router.back()}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowLeft size={18} color={colors.gray700} />
            </View>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View
                onTouchEnd={handleShare}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' }}
              >
                <Share2 size={18} color={colors.gray700} />
              </View>
              <View
                onTouchEnd={handleBookmark}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' }}
              >
                <Bookmark size={18} color={colors.gray700} />
              </View>
            </View>
          ),
          headerStyle: { backgroundColor: colors.white },
          headerShadowVisible: false,
        }}
      />
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Hero Banner */}
          <View style={{ height: 240, backgroundColor: colors.gray100, marginHorizontal: 20, borderRadius: 20, overflow: 'hidden' }}>
            {isLoading ? (
              <Skeleton variant="thumbnail" width="full" height={240} className="!rounded-none" />
            ) : competition?.bannerUrl ? (
              <View style={{ width: '100%', height: '100%' }} />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary50 }}>
                <Trophy size={48} color={colors.primary300} />
              </View>
            )}
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            {/* Category Badge */}
            {competition && (
              <Badge variant="primary" size="md" style={{ alignSelf: 'flex-start', marginBottom: 8 }}>
                {competition.scope}
              </Badge>
            )}

            {/* Title & Organizer */}
            {isLoading ? (
              <View style={{ gap: 8 }}>
                <Skeleton variant="title" width="full" />
                <Skeleton variant="text" width="half" />
              </View>
            ) : (
              <>
                <View style={{ fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 }}>
                  {competition?.title}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 }}>
                  <View style={{ fontSize: 15, color: colors.textSecondary }}>
                    {competition?.organizer}
                  </View>
                </View>
              </>
            )}

            {/* Quick Stats */}
            {isLoading ? (
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                {[1, 2, 3].map((i) => (
                  <Card key={i} variant="outlined" padding="md" style={{ flex: 1 }}>
                    <Skeleton variant="text" width="full" />
                    <Skeleton variant="heading" width="half" />
                  </Card>
                ))}
              </View>
            ) : competition && (
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                <Card variant="outlined" padding="md" style={{ flex: 1, alignItems: 'center' }}>
                  <Users size={18} color={colors.gray500} />
                  <View style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                    {t('discover.teamSize')}
                  </View>
                  <View style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginTop: 2 }}>
                    {competition.teamSizeMin} - {competition.teamSizeMax}
                  </View>
                </Card>
                <Card variant="outlined" padding="md" style={{ flex: 1, alignItems: 'center' }}>
                  <Trophy size={18} color={colors.gray500} />
                  <View style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                    {t('discover.prizePool')}
                  </View>
                  <View style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginTop: 2 }}>
                    {competition.prizePool}
                  </View>
                </Card>
                <Card variant="outlined" padding="md" style={{ flex: 1, alignItems: 'center' }}>
                  <Calendar size={18} color={colors.gray500} />
                  <View style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                    {t('discover.deadline')}
                  </View>
                  <View style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginTop: 2 }}>
                    {formatDate(competition.registrationDeadline)}
                  </View>
                </Card>
              </View>
            )}

            {/* About Section */}
            {isLoading ? (
              <View style={{ gap: 8, marginBottom: 24 }}>
                <Skeleton variant="heading" width="third" />
                <Skeleton variant="text" width="full" />
                <Skeleton variant="text" width="full" />
                <Skeleton variant="text" width="threequarters" />
              </View>
            ) : competition && (
              <View style={{ marginBottom: 24 }}>
                <View style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 }}>
                  {t('competition.about')}
                </View>
                <View style={{ fontSize: 15, color: colors.textSecondary, lineHeight: 24 }}>
                  {competition.description}
                </View>
              </View>
            )}

            {/* Eligibility Section */}
            {isLoading ? (
              <View style={{ gap: 8, marginBottom: 24 }}>
                <Skeleton variant="heading" width="third" />
                <Skeleton variant="text" width="full" />
                <Skeleton variant="text" width="full" />
              </View>
            ) : competition && (
              <View style={{ marginBottom: 24 }}>
                <View style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 }}>
                  {t('competition.eligibility')}
                </View>
                <Card variant="outlined" padding="md">
                  <View style={{ fontSize: 15, color: colors.textSecondary, lineHeight: 24 }}>
                    {competition.eligibility.description}
                  </View>
                  {competition.eligibility.departments.length > 0 && (
                    <View style={{ marginTop: 12 }}>
                      <View style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary, marginBottom: 8 }}>
                        Departments:
                      </View>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {competition.eligibility.departments.map((dept, i) => (
                          <Badge key={i} variant="outline" size="sm">{dept}</Badge>
                        ))}
                      </View>
                    </View>
                  )}
                </Card>
              </View>
            )}

            {/* Tags */}
            {competition && competition.tags.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <View style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 }}>
                  {t('competition.tags')}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {competition.tags.map((tag, i) => (
                    <Badge key={i} variant="primary" size="md">{tag}</Badge>
                  ))}
                </View>
              </View>
            )}

            {/* Organizer Info */}
            {competition && (
              <View style={{ marginBottom: 24 }}>
                <View style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 }}>
                  {t('competition.organizer')}
                </View>
                <Card variant="outlined" padding="md">
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.primary100, alignItems: 'center', justifyContent: 'center' }}>
                      <View style={{ fontSize: 20 }}>🏫</View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>
                        {competition.organizer}
                      </View>
                      {competition.contactEmail && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                          <Mail size={14} color={colors.textSecondary} />
                          <View style={{ fontSize: 13, color: colors.textSecondary }}>
                            {competition.contactEmail}
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </Card>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Fixed Bottom Action */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, padding: 20, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View
              onTouchEnd={handleShare}
              style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' }}
            >
              <Share2 size={20} color={colors.gray600} />
            </View>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleRegister}
              isLoading={register.isPending}
              style={{ flex: 1 }}
            >
              {t('discover.registerNow')}
              <ExternalLink size={18} color={colors.white} />
            </Button>
          </View>
        </View>
      </View>
    </>
  )
}
