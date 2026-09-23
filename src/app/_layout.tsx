import { Bitter_600SemiBold, Bitter_700Bold } from '@expo-google-fonts/bitter'
import { Karla_400Regular, Karla_600SemiBold, Karla_700Bold, useFonts } from '@expo-google-fonts/karla'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'

import { Loading } from '@/components/ui'
import { SessionProvider, useSession } from '@/lib/session'
import { colors } from '@/lib/theme'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Bitter_600SemiBold,
    Bitter_700Bold,
    Karla_400Regular,
    Karla_600SemiBold,
    Karla_700Bold,
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <Gate />
    </SessionProvider>
  )
}

/**
 * Three states, one rule each:
 *   no session            -> welcome and sign-in
 *   session, no profile   -> onboarding, with no way out of it
 *   session and profile   -> the app
 *
 * Doing this once here is what keeps every screen free of "am I allowed to be
 * here" checks. The database enforces the same thing regardless; this is about
 * not showing someone a screen that cannot work.
 */
function Gate() {
  const { session, profile, loading } = useSession()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    const group = segments[0]
    const inApp = group === '(tabs)' || group === 'chat' || group === 'anfrage'

    if (!session && inApp) router.replace('/')
    else if (session && !profile && group !== 'onboarding') router.replace('/onboarding')
    else if (session && profile && (group === undefined || group === 'login' || group === 'onboarding')) {
      router.replace('/(tabs)/entdecken')
    }
  }, [loading, session, profile, segments, router])

  if (loading) return <Loading />

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface },
        animation: 'fade',
      }}
    />
  )
}
