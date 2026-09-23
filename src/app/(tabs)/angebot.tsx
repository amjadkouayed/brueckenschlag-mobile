import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Avatar, Body, Button, Card, Chip, ErrorNote, Field, Heading, Loading, Muted, Title } from '@/components/ui'
import { deleteOffer, getMyOffer, getMyOfferStats, saveOffer, type Offer, type OfferStats } from '@/lib/data'
import { useSession } from '@/lib/session'
import { colors, font, radius, space, text } from '@/lib/theme'

type View3 = 'empty' | 'form' | 'live'

/**
 * Empty, form, live — the same three states as the web app.
 *
 * The location is not a field here: it belongs to the person, comes from the
 * profile, and the form says so rather than asking a second time.
 */
export default function AngebotScreen() {
  const { profile } = useSession()

  const [offer, setOffer] = useState<Offer | null>(null)
  const [stats, setStats] = useState<OfferStats | null>(null)
  const [view, setView] = useState<View3>('empty')
  const [availability, setAvailability] = useState('')
  const [description, setDescription] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [mine, numbers] = await Promise.all([getMyOffer(), getMyOfferStats()])
    setOffer(mine)
    setStats(numbers)
    setAvailability(mine?.availability ?? '')
    setDescription(mine?.description ?? '')
    setView(mine ? 'live' : 'empty')
    setLoading(false)
  }, [])

  // Reload when the tab regains focus: the view count changes while you are
  // elsewhere in the app.
  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load]),
  )

  async function publish() {
    setError(null)
    if (!availability.trim() || !description.trim()) {
      setError('Bitte füllen Sie beide Felder aus.')
      return
    }
    setBusy(true)
    const result = await saveOffer(availability, description)
    setBusy(false)
    if (result.error) setError(result.error)
    else await load()
  }

  async function remove() {
    setBusy(true)
    const result = await deleteOffer()
    setBusy(false)
    setConfirmDelete(false)
    if (result.error) setError(result.error)
    else await load()
  }

  if (loading) return <Loading />

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Title>Mein Angebot</Title>

          {view === 'empty' && (
            <View style={{ gap: space.md }}>
              <Body>
                Sie haben noch kein Angebot. Ein Angebot ist wie ein kleiner Aushang: Andere sehen,
                wann Sie Zeit haben und was Sie gern gemeinsam machen möchten.
              </Body>

              <Card style={styles.example}>
                <View style={styles.exampleTag}>
                  <Text style={styles.exampleTagText}>Beispiel</Text>
                </View>
                <View style={styles.row}>
                  <Avatar name={profile?.name} size={48} />
                  <Text style={styles.name}>{profile?.name}</Text>
                </View>
                <Body>
                  „Ich möchte mein Deutsch im Alltag verbessern. Gern helfe ich beim Einkaufen oder
                  mit dem Handy.“
                </Body>
                <View style={styles.chips}>
                  <Chip label="Dienstag nachmittags" kind="fact" />
                </View>
              </Card>

              <Button title="Angebot erstellen" onPress={() => setView('form')} />
              <Muted>
                Dauert etwa zwei Minuten. Auch ohne Angebot können Sie andere finden und Anfragen
                senden.
              </Muted>
            </View>
          )}

          {view === 'form' && (
            <View style={{ gap: space.md }}>
              <Muted>Zwei Angaben — dann sind Sie sichtbar.</Muted>

              <Field
                label="Wann haben Sie Zeit?"
                value={availability}
                onChangeText={setAvailability}
                placeholder="z. B. Dienstag und Donnerstag nachmittags"
                hint="Genaue Zeiten machen Sie später im Chat aus."
              />

              <Field
                label="Was suchen Sie, was bieten Sie?"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                style={styles.textarea}
                placeholder="Zum Beispiel: Ich möchte Deutsch üben und helfe gern beim Einkaufen."
              />

              <Card style={{ gap: 4 }}>
                <Text style={styles.small}>Ihr Ort</Text>
                <Body>
                  {profile?.postal_code} {profile?.city}
                </Body>
                <Muted>Kommt aus Ihrem Profil. Dort können Sie ihn ändern.</Muted>
              </Card>

              {error && <ErrorNote>{error}</ErrorNote>}

              <Button title="Veröffentlichen" onPress={publish} loading={busy} />
              <Button
                title="Abbrechen"
                variant="secondary"
                onPress={() => setView(offer ? 'live' : 'empty')}
              />
            </View>
          )}

          {view === 'live' && offer && (
            <View style={{ gap: space.md }}>
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Ihr Angebot ist sichtbar</Text>
              </View>

              <Card>
                <Text style={styles.small}>So sehen andere Ihr Angebot</Text>
                <View style={styles.row}>
                  <Avatar name={profile?.name} path={profile?.avatar_path} size={64} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.name}>{profile?.name}</Text>
                    {profile?.birth_year && (
                      <Text style={styles.age}>{new Date().getFullYear() - profile.birth_year} Jahre</Text>
                    )}
                  </View>
                </View>
                <Body>{offer.description}</Body>
                <View style={styles.chips}>
                  <Chip label={`${profile?.postal_code} ${profile?.city}`} kind="fact" />
                  <Chip label={offer.availability} kind="fact" />
                </View>
              </Card>

              <Card style={styles.statsCard}>
                <Text style={styles.statNumber}>{stats?.views_this_week ?? 0}</Text>
                <Body>Personen haben Ihr Angebot diese Woche angesehen.</Body>
              </Card>

              {error && <ErrorNote>{error}</ErrorNote>}

              {confirmDelete ? (
                <Card style={{ backgroundColor: colors.tag, gap: space.sm }}>
                  <Heading>Angebot wirklich löschen?</Heading>
                  <Body>Andere finden Sie dann nicht mehr.</Body>
                  <Button title="Behalten" variant="secondary" onPress={() => setConfirmDelete(false)} />
                  <Button title="Ja, löschen" onPress={remove} loading={busy} style={styles.destructive} />
                </Card>
              ) : (
                <>
                  <Button title="Bearbeiten" onPress={() => setView('form')} />
                  <Button title="Angebot löschen" variant="text" onPress={() => setConfirmDelete(true)} />
                </>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.md, gap: space.md },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  name: { fontFamily: font.serifSemi, fontSize: text.name, color: colors.ink },
  age: { fontFamily: font.sans, fontSize: text.meta, color: colors.muted },
  small: { fontFamily: font.sansBold, fontSize: text.small, color: colors.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  textarea: { minHeight: 140, textAlignVertical: 'top' },
  example: { borderStyle: 'dashed', borderWidth: 2, borderColor: colors.control, marginTop: space.sm },
  exampleTag: {
    position: 'absolute',
    top: -14,
    left: 14,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  exampleTagText: { fontFamily: font.sansBold, fontSize: text.meta, color: colors.ink },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    backgroundColor: colors.tag,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 10,
  },
  statusDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.brand },
  statusText: { fontFamily: font.sansBold, fontSize: text.label, color: colors.ink },
  statsCard: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  statNumber: { fontFamily: font.serif, fontSize: 40, color: colors.brandPressed },
  destructive: { backgroundColor: colors.ink },
})
