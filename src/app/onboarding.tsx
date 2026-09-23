import { useRouter } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Body, Button, Chip, ErrorNote, Field, Heading, Muted, Title } from '@/components/ui'
import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { colors, font, radius, space, text, touch } from '@/lib/theme'

type Role = 'student' | 'senior'

const INTERESTS: Record<Role, string[]> = {
  student: ['Deutsch üben', 'Kochen', 'Musik', 'Geschichte', 'Spazieren', 'Schach', 'Technikhilfe'],
  senior: ['Deutsch beibringen', 'Backen', 'Erzählen', 'Karten spielen', 'Kino', 'Spazieren', 'Musik'],
}

const STATUSES = [
  { value: 'rentnerin', label: 'Rentnerin' },
  { value: 'rentner', label: 'Rentner' },
  { value: 'berufstaetig', label: 'Noch berufstätig' },
]

const MIN_AGE = 16
const MAX_AGE = 120

/**
 * Three short steps rather than one long form: less on each screen, and no way
 * to wander off half-finished. The role picked in step 1 decides what step 2
 * asks and which interests step 3 offers.
 */
export default function OnboardingScreen() {
  const router = useRouter()
  const { session, reloadProfile } = useSession()

  const [step, setStep] = useState(1)
  const [role, setRole] = useState<Role | null>(null)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [studyField, setStudyField] = useState('')
  const [status, setStatus] = useState('')
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function next() {
    setError(null)
    if (step === 1 && !role) return setError('Bitte wählen Sie aus, wer Sie sind.')
    if (step === 2) {
      if (!name.trim()) return setError('Bitte geben Sie Ihren Namen an.')
      const value = Number(age)
      if (!Number.isInteger(value) || value < MIN_AGE || value > MAX_AGE) {
        return setError(`Bitte geben Sie ein Alter zwischen ${MIN_AGE} und ${MAX_AGE} an.`)
      }
      if (!/^\d{5}$/.test(postalCode)) {
        return setError('Bitte geben Sie eine fünfstellige Postleitzahl an.')
      }
      if (!city.trim()) return setError('Bitte geben Sie Ihren Ort an.')
    }
    setStep(step + 1)
  }

  async function finish() {
    if (!session?.user) return
    setBusy(true)
    setError(null)

    // Stored as a birth year, not an age: an age column is silently wrong from
    // the person's next birthday onwards.
    const birthYear = new Date().getFullYear() - Number(age)

    const { error } = await supabase.from('profiles').insert({
      id: session.user.id,
      role: role!,
      name: name.trim(),
      birth_year: birthYear,
      status: role === 'senior' && status ? status : null,
      postal_code: postalCode,
      city: city.trim(),
      bio: bio.trim() || null,
      interests,
      study_field: role === 'student' ? studyField.trim() || null : null,
    })

    setBusy(false)

    // Already onboarded on another device — they belong in the app, not here.
    if (error && error.code !== '23505') {
      setError(error.message)
      return
    }

    await reloadProfile()
    router.replace('/(tabs)/entdecken')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.progress} accessibilityElementsHidden>
            {[1, 2, 3].map((n) => (
              <View key={n} style={[styles.bar, n <= step && styles.barDone]} />
            ))}
          </View>
          <Muted>Schritt {step} von 3</Muted>

          {step === 1 && (
            <View style={styles.block}>
              <Title>Wer sind Sie?</Title>
              <RoleCard
                checked={role === 'senior'}
                onPress={() => setRole('senior')}
                title="Ich bin Seniorin oder Senior"
                body="Ich teile gern Zeit, erzähle und lerne neue Menschen kennen."
              />
              <RoleCard
                checked={role === 'student'}
                onPress={() => setRole('student')}
                title="Ich studiere"
                body="Ich möchte Deutsch üben, helfen und Gesellschaft leisten."
              />
              <Muted>Das legt fest, wen Sie in der App finden. Sie können es später nicht ändern.</Muted>
            </View>
          )}

          {step === 2 && (
            <View style={styles.block}>
              <Title>Ihr Profil</Title>

              <Field
                label="Ihr Name"
                value={name}
                onChangeText={setName}
                hint="Zum Beispiel „Helga B.“ — Ihr Nachname muss nicht sichtbar sein."
                autoComplete="given-name"
              />
              <Field
                label="Ihr Alter"
                value={age}
                onChangeText={(value) => setAge(value.replace(/\D/g, '').slice(0, 3))}
                keyboardType="number-pad"
                hint="Steht später klein bei Ihrem Angebot, nicht neben Ihrem Namen."
              />
              <Field
                label="Ihre Postleitzahl"
                value={postalCode}
                onChangeText={(value) => setPostalCode(value.replace(/\D/g, '').slice(0, 5))}
                keyboardType="number-pad"
                hint="Nur die Postleitzahl. Ihre Adresse fragen wir nie — andere sehen später nur die Entfernung."
              />
              <Field label="Ihr Ort" value={city} onChangeText={setCity} />

              {role === 'student' && (
                <Field
                  label="Was studieren Sie?"
                  value={studyField}
                  onChangeText={setStudyField}
                  placeholder="z. B. Informatik"
                />
              )}

              {role === 'senior' && (
                <View style={{ gap: space.sm }}>
                  <Text style={styles.label}>Ihr Status</Text>
                  <View style={styles.chips}>
                    {STATUSES.map((option) => (
                      <Chip
                        key={option.value}
                        label={option.label}
                        active={status === option.value}
                        onPress={() => setStatus(status === option.value ? '' : option.value)}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {step === 3 && (
            <View style={styles.block}>
              <Title>Über Sie</Title>

              <Field
                label="Ein paar Sätze über Sie"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                style={styles.textarea}
                hint="Wenn Sie möchten, können Sie hier auch Ihr Alter nennen."
              />

              <View style={{ gap: space.sm }}>
                <Text style={styles.label}>Was machen Sie gern?</Text>
                <Muted>Mehrere möglich.</Muted>
                <View style={styles.chips}>
                  {INTERESTS[role ?? 'student'].map((interest) => (
                    <Chip
                      key={interest}
                      label={interest}
                      active={interests.includes(interest)}
                      onPress={() =>
                        setInterests((current) =>
                          current.includes(interest)
                            ? current.filter((entry) => entry !== interest)
                            : [...current, interest],
                        )
                      }
                    />
                  ))}
                </View>
              </View>
            </View>
          )}

          {error && <ErrorNote>{error}</ErrorNote>}

          <View style={styles.actions}>
            {step > 1 && (
              <Button title="Zurück" variant="secondary" onPress={() => setStep(step - 1)} style={{ flex: 1 }} />
            )}
            <Button
              title={step === 3 ? 'Fertig' : 'Weiter'}
              onPress={step === 3 ? finish : next}
              loading={busy}
              style={{ flex: 2 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function RoleCard({
  checked,
  onPress,
  title,
  body,
}: {
  checked: boolean
  onPress: () => void
  title: string
  body: string
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={({ pressed }) => [styles.roleCard, checked && styles.roleCardActive, pressed && styles.pressed]}
    >
      <View style={[styles.radio, checked && styles.radioActive]}>
        {checked && <View style={styles.radioDot} />}
      </View>
      <View style={{ flex: 1, gap: space.xs }}>
        <Heading>{title}</Heading>
        <Body>{body}</Body>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.lg, gap: space.md, flexGrow: 1 },
  block: { gap: space.md },
  progress: { flexDirection: 'row', gap: space.xs },
  bar: { flex: 1, height: 8, borderRadius: radius.pill, backgroundColor: colors.line },
  barDone: { backgroundColor: colors.brand },
  label: { fontFamily: font.sansBold, fontSize: text.label, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  textarea: { minHeight: 110, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: 'auto', paddingTop: space.md },
  roleCard: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.control,
    backgroundColor: colors.raised,
    minHeight: touch.primary,
  },
  roleCardActive: { borderColor: colors.brand, backgroundColor: colors.tag },
  radio: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: colors.control,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioActive: { borderColor: colors.brand },
  radioDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.brand },
  pressed: { transform: [{ scale: 0.98 }] },
})
