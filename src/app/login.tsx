import { useRouter } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Body, Button, ErrorNote, Field, Muted, Title } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { colors, space } from '@/lib/theme'

/**
 * Passwordless: an address, then the code from the e-mail. No password to
 * invent, forget or reset — the biggest single drop-off for older users.
 *
 * The code field accepts 6 to 10 digits rather than a fixed length: the length
 * is a server setting (auth.email.otp_length), and hard-coding it once already
 * broke sign-in on the web app for a day.
 */
export default function LoginScreen() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function requestCode() {
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    })
    setBusy(false)
    if (error) setError(error.message)
    else setStep('code')
  }

  async function verify() {
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: 'email',
    })
    setBusy(false)
    if (error) {
      setError('Der Code stimmt nicht. Bitte prüfen Sie ihn noch einmal.')
      return
    }
    // The session provider notices and the gate decides where to go: onboarding
    // for a new account, the app for a returning one.
    router.replace('/')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {step === 'email' ? (
            <View style={styles.block}>
              <Title>Anmelden</Title>
              <Body>Wir schicken Ihnen einen Code per E-Mail. Ein Passwort brauchen Sie nicht.</Body>

              <Field
                label="Ihre E-Mail-Adresse"
                value={email}
                onChangeText={setEmail}
                placeholder="name@beispiel.de"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                inputMode="email"
              />

              {error && <ErrorNote>{error}</ErrorNote>}

              <Button
                title="Code per E-Mail schicken"
                onPress={requestCode}
                loading={busy}
                disabled={!email.includes('@')}
              />
            </View>
          ) : (
            <View style={styles.block}>
              <Title>Code eingeben</Title>
              <Body>Wir haben einen Code an {email.trim()} geschickt.</Body>

              <Field
                label="Code aus der E-Mail"
                value={code}
                onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 10))}
                keyboardType="number-pad"
                // Lets the phone offer the code straight from the e-mail, so
                // most people never type it at all.
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={10}
                style={styles.codeInput}
              />

              <Muted>
                Schauen Sie in Ihr E-Mail-Postfach. Keine E-Mail da? Sehen Sie auch im Ordner
                „Spam“ nach.
              </Muted>

              {error && <ErrorNote>{error}</ErrorNote>}

              <Button title="Weiter" onPress={verify} loading={busy} disabled={code.length < 6} />
              <Button
                title="Andere E-Mail-Adresse verwenden"
                variant="text"
                onPress={() => {
                  setStep('email')
                  setCode('')
                  setError(null)
                }}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.lg, gap: space.lg, flexGrow: 1 },
  block: { gap: space.md },
  codeInput: { fontSize: 30, letterSpacing: 8, textAlign: 'center' },
})
