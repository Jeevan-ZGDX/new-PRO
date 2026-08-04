import React from 'react'
import { View, Text } from 'react-native'
import { Button } from '@design-system/components/Button'
import { useTranslation } from 'react-i18next'

export default function App() {
  const { t } = useTranslation()
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 16 }}>{t('welcome')}</Text>
      <Button>{t('getStarted')}</Button>
    </View>
  )
}
