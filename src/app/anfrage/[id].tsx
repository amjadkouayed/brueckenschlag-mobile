import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Avatar, Body, Button, Card, Chip, ErrorNote, Field, Loading, Muted, Title } from '@/components/ui'
import { searchNearby, sendConnectionRequest, type NearbyCard } from '@/lib/data'
import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { colors, font, space, text } from '@/lib/theme'

/**
 * The message is written for them and editable. A blank box asking an older
 * person to introduce themselves to a stranger is where people give up.
 */
export default function AnfrageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { profile, session } = useSession()

  const [card, setCard] = useState<NearbyCard | null>(null)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!profile?.postal_code) return
    // Widest radius: the person came from a list, so they are findable — the
    // point here is reading the card, not searching again.
    searchNearby(profile.postal_code, 100)
      .then((cards) => {
        const match = cards.find((entry) => entry.profile_id === id) ?? null
        setCard(match)
        const firstName = (match?.name ?? '').split(' ')[0]
        setMessage(
          `Guten Tag${firstName ? `, ${firstName}` : ''}! Ich würde Sie gern kennenlernen. Wann hätten Sie Zeit für einen Kaffee?`,
        )
      })
      .catch(() => setError('Das Angebot konnte nicht geladen werden.'))
  }, [id, profile?.postal_code])

  async function send() {
    setBusy(true)
    setError(null)
    const result = await sendConnectionRequest(id, message)
    setBusy(false)
    if (result.error) setError(result.error)
    else setSent(true)
  }

  // Counting the view is a side effect of reading the card. The primary key is
  // (offer_id, viewer_id, viewed_on), so a second look on the same day
  // conflicts and is ignored rather than inflating the number — and the policy
  // refuses a view of your own offer, which is why the error is not surfaced.
  useEffect(() => {
    const viewerId = session?.user.id
    if (!card?.offer_id || !viewerId) return
    void supabase.from('offer_views').insert({ offer_id: card.offer_id, viewer_id: viewerId })
  }, [card?.offer_id, session?.user.id])

  if (!card && !error) return <Loading />

  const firstName = (card?.name ?? '').split(' ')[0] || 'diese Person'

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Button title="‹ Zurück" variant="secondary" onPress={() => router.back()} style={styles.back} />

          {sent ? (
            <View style={styles.done}>
              <View style={styles.check}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
              <Title>Anfrage gesendet</Title>
              <Body>
                Sobald {firstName} annimmt, finden Sie das Gespräch unter Kontakte.
              </Body>
              <Button title="Zurück zur Suche" onPress={() => router.replace('/(tabs)/entdecken')} />
            </View>
          ) : (
            <>
              <View style={styles.row}>
                <Avatar name={card?.name} path={card?.avatar_path} size={64} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.name}>{card?.name}</Text>
                  {card?.age != null && <Text style={styles.age}>{card.age} Jahre</Text>}
                </View>
              </View>

              {card?.description && (
                <Card>
                  <Body>{card.description}</Body>
                  <View style={styles.chips}>
                    {card.availability && <Chip label={card.availability} kind="fact" />}
                    {(card.interests ?? []).map((interest) => (
                      <Chip key={interest} label={interest} kind="fact" />
                    ))}
                  </View>
                </Card>
              )}

              <Field
                label="Ihre Nachricht"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={5}
                style={styles.textarea}
                hint="Wir haben einen Vorschlag geschrieben. Sie können ihn ändern."
              />

              {error && <ErrorNote>{error}</ErrorNote>}

              <Button title="Anfrage senden" onPress={send} loading={busy} disabled={!message.trim()} />
              <Muted>Ihre Anfrage ist nur für {firstName} sichtbar.</Muted>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.md, gap: space.md },
  back: { alignSelf: 'flex-start', minHeight: 48, paddingHorizontal: space.md },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  name: { fontFamily: font.serifSemi, fontSize: text.name, color: colors.ink },
  age: { fontFamily: font.sans, fontSize: text.meta, color: colors.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  textarea: { minHeight: 130, textAlignVertical: 'top' },
  done: { gap: space.md, alignItems: 'center', paddingTop: space.xl },
  check: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: colors.surface, fontSize: 40, fontFamily: font.sansBold },
})
