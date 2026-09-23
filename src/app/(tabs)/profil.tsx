import { useState } from 'react'
import { KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Avatar, Body, Button, Card, Chip, ErrorNote, Field, Heading, Loading, Muted, Title } from '@/components/ui'
import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { colors, font, space, text } from '@/lib/theme'

const INTERESTS: Record<string, string[]> = {
  student: ['Deutsch üben', 'Kochen', 'Musik', 'Geschichte', 'Spazieren', 'Schach', 'Technikhilfe'],
  senior: ['Deutsch beibringen', 'Backen', 'Erzählen', 'Karten spielen', 'Kino', 'Spazieren', 'Musik'],
}

const WEB = 'https://linde-web-wine.vercel.app'

export default function ProfilScreen() {
  const { profile, reloadProfile, signOut } = useSession()

  const [name, setName] = useState(profile?.name ?? '')
  const [age, setAge] = useState(
    profile?.birth_year ? String(new Date().getFullYear() - profile.birth_year) : '',
  )
  const [postalCode, setPostalCode] = useState(profile?.postal_code ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? [])
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!profile) return <Loading />

  async function save() {
    setError(null)
    setSaved(false)

    const years = Number(age)
    if (!name.trim()) return setError('Bitte geben Sie Ihren Namen an.')
    if (!Number.isInteger(years) || years < 16 || years > 120) {
      return setError('Bitte geben Sie ein Alter zwischen 16 und 120 an.')
    }
    if (!/^\d{5}$/.test(postalCode)) {
      return setError('Bitte geben Sie eine fünfstellige Postleitzahl an.')
    }
    if (!city.trim()) return setError('Bitte geben Sie Ihren Ort an.')

    setBusy(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        birth_year: new Date().getFullYear() - years,
        postal_code: postalCode,
        city: city.trim(),
        bio: bio.trim() || null,
        interests,
      })
      .eq('id', profile!.id)
    setBusy(false)

    if (error) setError(error.message)
    else {
      setSaved(true)
      await reloadProfile()
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Title>Ihr Profil</Title>

          <Card style={styles.summary}>
            <Avatar name={profile.name} path={profile.avatar_path} size={72} />
            <View style={{ flex: 1, gap: 2 }}>
              <Heading>{profile.name}</Heading>
              <Muted>
                {profile.role === 'student' ? 'Studierende:r' : 'Seniorin oder Senior'}
                {profile.study_field ? ` · ${profile.study_field}` : ''}
              </Muted>
            </View>
          </Card>

          <Field label="Ihr Name" value={name} onChangeText={setName} />
          <Field
            label="Ihr Alter"
            value={age}
            onChangeText={(value) => setAge(value.replace(/\D/g, '').slice(0, 3))}
            keyboardType="number-pad"
            hint="Steht klein bei Ihrem Angebot, nicht neben Ihrem Namen."
          />
          <Field
            label="Ihre Postleitzahl"
            value={postalCode}
            onChangeText={(value) => setPostalCode(value.replace(/\D/g, '').slice(0, 5))}
            keyboardType="number-pad"
          />
          <Field label="Ihr Ort" value={city} onChangeText={setCity} />
          <Field
            label="Über Sie"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            style={styles.textarea}
          />

          <View style={{ gap: space.sm }}>
            <Text style={styles.label}>Was machen Sie gern?</Text>
            <View style={styles.chips}>
              {(INTERESTS[profile.role] ?? []).map((interest) => (
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

          {error && <ErrorNote>{error}</ErrorNote>}
          {saved && <Muted>Gespeichert.</Muted>}

          <Button title="Speichern" onPress={save} loading={busy} />

          <Card style={{ gap: space.sm }}>
            <Heading>Ihr Konto</Heading>
            <Body>
              Ein Foto hinzufügen, das Konto löschen oder alles in Ruhe ansehen können Sie im
              Browser.
            </Body>
            <Button title="Linde im Browser öffnen" variant="secondary" onPress={() => Linking.openURL(WEB)} />
            <Button title="Abmelden" variant="secondary" onPress={signOut} />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.md, gap: space.md },
  summary: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  label: { fontFamily: font.sansBold, fontSize: text.label, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  textarea: { minHeight: 110, textAlignVertical: 'top' },
})
