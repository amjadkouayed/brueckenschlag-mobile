import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Avatar, Body, Button, Card, Chip, ErrorNote, Field, Loading, Muted, Title } from '@/components/ui'
import { DEFAULT_RADIUS, RADIUS_OPTIONS, lookupPostalCode, searchNearby, type NearbyCard } from '@/lib/data'
import { useSession } from '@/lib/session'
import { colors, font, space, text } from '@/lib/theme'

const STATUS_LABEL: Record<string, string> = {
  rentner: 'Rentner',
  rentnerin: 'Rentnerin',
  berufstaetig: 'Noch berufstätig',
}

/** Never "0 km": someone in the same postal code is not zero metres away. */
function distanceLabel(km: number | null) {
  if (km === null || km === undefined) return null
  return km < 1 ? 'ganz in der Nähe' : `ca. ${Math.round(km)} km`
}

export default function EntdeckenScreen() {
  const { profile } = useSession()
  const router = useRouter()

  const [postalCode, setPostalCode] = useState(profile?.postal_code ?? '')
  const [radius, setRadius] = useState<number>(DEFAULT_RADIUS)
  const [cards, setCards] = useState<NearbyCard[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (plz: string, km: number) => {
      setError(null)
      if (!/^\d{5}$/.test(plz)) {
        setError('Bitte geben Sie eine fünfstellige Postleitzahl ein.')
        setLoading(false)
        return
      }
      // Tells "we do not know that postal code" apart from "nobody there yet".
      const area = await lookupPostalCode(plz)
      if (!area) {
        setCards([])
        setError('Diese Postleitzahl kennen wir nicht. Bitte prüfen Sie die fünf Ziffern.')
        setLoading(false)
        return
      }
      try {
        setCards(await searchNearby(plz, km))
      } catch {
        setError('Die Suche hat gerade nicht geklappt. Bitte versuchen Sie es noch einmal.')
      }
      setLoading(false)
    },
    [],
  )

  useEffect(() => {
    if (profile?.postal_code) {
      setPostalCode(profile.postal_code)
      void load(profile.postal_code, DEFAULT_RADIUS)
    }
  }, [profile?.postal_code, load])

  const isStudent = profile?.role === 'student'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Title>In Ihrer Nähe</Title>
        <Muted>
          {isStudent ? 'Seniorinnen und Senioren, die Zeit haben' : 'Studierende, die Sie kennenlernen möchten'}
        </Muted>

        <Field
          label="Wo?"
          value={postalCode}
          onChangeText={(value) => setPostalCode(value.replace(/\D/g, '').slice(0, 5))}
          keyboardType="number-pad"
          onBlur={() => load(postalCode, radius)}
        />

        <Text style={styles.label}>Umkreis</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radii}>
          {RADIUS_OPTIONS.map((km) => (
            <Chip
              key={km}
              label={`${km} km`}
              active={km === radius}
              onPress={() => {
                setRadius(km)
                setLoading(true)
                void load(postalCode, km)
              }}
            />
          ))}
        </ScrollView>

        {!loading && !error && (
          <Muted>
            {cards.length} {cards.length === 1 ? 'Person' : 'Personen'} im Umkreis von {radius} km
          </Muted>
        )}
      </View>

      {loading ? (
        <Loading label="Wir suchen …" />
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(card) => card.offer_id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true)
                await load(postalCode, radius)
                setRefreshing(false)
              }}
              tintColor={colors.brand}
            />
          }
          ListHeaderComponent={error ? <ErrorNote>{error}</ErrorNote> : null}
          ListEmptyComponent={
            error ? null : (
              <Card>
                <Body>
                  Im Umkreis von {radius} km ist gerade niemand. Versuchen Sie einen größeren
                  Umkreis, oder schauen Sie später noch einmal vorbei.
                </Body>
              </Card>
            )
          }
          renderItem={({ item }) => (
            <PersonCard card={item} onPress={() => router.push(`/anfrage/${item.profile_id}`)} />
          )}
        />
      )}
    </SafeAreaView>
  )
}

function PersonCard({ card, onPress }: { card: NearbyCard; onPress: () => void }) {
  const detail = card.role === 'student' ? card.study_field : STATUS_LABEL[card.status ?? '']
  const distance = distanceLabel(card.km)
  const firstName = (card.name ?? '').split(' ')[0]

  return (
    <Card style={{ gap: space.sm }}>
      <View style={styles.cardTop}>
        <Avatar name={card.name} path={card.avatar_path} size={64} />
        <View style={{ flex: 1, gap: 2 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{card.name}</Text>
            {distance && <Text style={styles.distance}>{distance}</Text>}
          </View>
          {/* Age sits under the name, small and muted — never beside it. */}
          {card.age != null && <Text style={styles.age}>{card.age} Jahre</Text>}
          {detail && <Text style={styles.age}>{detail}</Text>}
        </View>
      </View>

      {card.description ? <Body>{card.description}</Body> : card.bio ? <Body>{card.bio}</Body> : null}

      <View style={styles.chips}>
        {card.availability && <Chip label={card.availability} kind="fact" />}
        {(card.interests ?? []).map((interest) => (
          <Chip key={interest} label={interest} kind="fact" />
        ))}
      </View>

      <Button title={`Anfrage an ${firstName}`} variant="secondary" onPress={onPress} />
    </Card>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    padding: space.md,
    gap: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  label: { fontFamily: font.sansBold, fontSize: text.small, color: colors.ink },
  radii: { gap: space.xs, paddingRight: space.md },
  list: { padding: space.md, gap: space.md },
  cardTop: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.xs },
  name: { fontFamily: font.serifSemi, fontSize: text.name, color: colors.ink, flexShrink: 1 },
  distance: { fontFamily: font.sansBold, fontSize: text.meta, color: colors.muted },
  age: { fontFamily: font.sans, fontSize: text.meta, color: colors.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
})
