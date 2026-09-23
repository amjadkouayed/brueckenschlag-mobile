import { useRouter } from 'expo-router'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { LindeMark } from '@/components/linde-mark'
import { Body, Button } from '@/components/ui'
import { colors, font, space, text } from '@/lib/theme'

/**
 * One way in, for new and returning people alike. Nobody has to work out
 * whether they already have an account — the code decides that, not the user.
 */
export default function WelcomeScreen() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <LindeMark size={104} />
          <Text style={styles.wordmark}>Linde</Text>
          <Body>Sprache, Zeit und Geschichten teilen — mit Menschen aus der Nachbarschaft.</Body>
        </View>

        <View style={styles.footer}>
          <Button title="Los geht’s" onPress={() => router.push('/login')} />
          <Text style={styles.note}>
            Für neue und bekannte Gesichter.{'\n'}Ein Passwort brauchen Sie nicht.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { flexGrow: 1, padding: space.lg, justifyContent: 'space-between', gap: space.xl },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  wordmark: { fontFamily: font.serif, fontSize: 42, color: colors.ink },
  footer: { gap: space.md },
  note: {
    fontFamily: font.sans,
    fontSize: text.small,
    lineHeight: text.small * 1.4,
    color: colors.muted,
    textAlign: 'center',
  },
})
