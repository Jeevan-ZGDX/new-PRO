import { useState } from 'react'
import { View, ScrollView, FlatList } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useCompetitions } from '@comp-dash/api'
import { SearchBar, FilterChipGroup, CompetitionCard, CompetitionCardSkeleton, EmptyState } from '@comp-dash/design-system'
import { colors } from '@comp-dash/design-system'
import { useDebounce } from '@comp-dash/hooks'
import type { CompetitionCategory } from '@comp-dash/types'

const categories = [
  { label: 'All', value: 'all' },
  { label: 'Hackathon', value: 'hackathon' },
  { label: 'Internship', value: 'internship' },
  { label: 'Workshop', value: 'workshop' },
  { label: 'Paper Presentation', value: 'paper_presentation' },
  { label: 'Project', value: 'project' },
]

export default function DiscoverScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, refetch } = useCompetitions({
    category: selectedCategory === 'all' ? undefined : (selectedCategory as CompetitionCategory),
    search: debouncedSearch || undefined,
    limit: 20,
  })

  const handleBookmark = (competitionId: string) => {
    // Toggle bookmark
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={['top']}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <View style={{ fontSize: 28, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 }}>
            {t('discover.title')}
          </View>
          <SearchBar
            placeholder={t('discover.searchPlaceholder')}
            value={search}
            onChangeText={setSearch}
            onClear={() => setSearch('')}
          />
        </View>

        {/* Category Filter */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <FilterChipGroup
            options={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </View>

        {/* Competition List */}
        {isLoading ? (
          <FlatList
            data={[1, 2, 3]}
            keyExtractor={(item) => String(item)}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
            renderItem={() => <CompetitionCardSkeleton />}
          />
        ) : data?.data && data.data.length > 0 ? (
          <FlatList
            data={data.data}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 16 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <CompetitionCard
                imageUrl={item.bannerUrl}
                category={item.category}
                title={item.title}
                organizer={item.organizer}
                teamSize={`${item.teamSizeMin} - ${item.teamSizeMax}`}
                prizePool={item.prizePool}
                deadline={new Date(item.registrationDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                bookmarked={false}
                onBookmark={() => handleBookmark(item.id)}
                onPress={() => router.push(`/competition/${item.id}`)}
              />
            )}
          />
        ) : (
          <EmptyState
            title={t('discover.noResults')}
            description={t('discover.noResultsDescription')}
          />
        )}
      </View>
    </SafeAreaView>
  )
}
