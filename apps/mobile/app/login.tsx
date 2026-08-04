import { View, Text, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '@comp-dash/design-system'
import { colors } from '@comp-dash/design-system'
import { useAuth } from '@comp-dash/hooks'

export default function LoginScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { login } = useAuth()

  const handleGoogleLogin = async () => {
    // Implement Google OAuth
    // After successful auth, navigate to main tabs
    router.replace('/(tabs)')
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        {/* Logo */}
        <View style={{ width: 120, height: 120, borderRadius: 30, backgroundColor: colors.primary50, alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
          <View style={{ fontSize: 48, fontWeight: '800', color: colors.accent }}>
            C
          </View>
        </View>

        {/* Title */}
        <View style={{ fontSize: 32, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>
          Comp-Dash
        </View>

        {/* Tagline */}
        <View style={{ fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 48 }}>
          {t('app.tagline')}
        </View>

        {/* Auth Section */}
        <View style={{ width: '100%', maxWidth: 320 }}>
          <View style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 16 }}>
            {t('auth.loginDescription')}
          </View>

          <Button
            variant="outline"
            size="lg"
            fullWidth
            onPress={handleGoogleLogin}
          >
            <View style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>G</View>
            </View>
            <View>{t('auth.loginWithGoogle')}</View>
          </Button>
        </View>

        {/* Illustration placeholder */}
        <View style={{ marginTop: 64, width: 200, height: 150, borderRadius: 20, backgroundColor: colors.primary50, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ fontSize: 48 }}>🏆</View>
        </View>
      </View>
    </SafeAreaView>
  )
}
