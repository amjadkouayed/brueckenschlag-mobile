import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Avatar, Body, Button, Card, ErrorNote, Loading, Muted, Title } from '@/components/ui'
import { answerRequest, getConnections, type ConnectionOverview } from '@/lib/data'
import { colors, font, radius, space, text } from '@/lib/theme'

/**
 * One screen, three sections, in the order they need attention: requests
 * waiting on a decision, then the conversations, then what you sent and are
 * still waiting for.
 */
export default function KontakteScreen() {
  const router = useRouter()
  const [connections, setConnections] = useState<ConnectionOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setConnections(await getConnections())
    } catch {
      setError('Die Kontakte konnten nicht geladen werden.')
    }
    setLoading(false)
  }, [])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load]),
  )

  async function answer(id: string, accept: boolean) {
    setBusyId(id)
    const result = await answerRequest(id, accept)
    setBusyId(null)
    if (result.error) setError(result.error)
    else await load()
  }

  if (loading) return <Loading />

  const incoming = connections.filter((c) => c.status === 'pending' && !c.i_am_requester)
  const accepted = connections.filter((c) => c.status === 'accepted')
  const outgoing = connections.filter((c) => c.status === 'pending' && c.i_am_requester)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true)
              await load()
              setRefreshing(false)
            }}
            tintColor={colors.brand}
          />
        }
      >
        <Title>Kontakte</Title>

        {error && <ErrorNote>{error}</ErrorNote>}

        {incoming.length > 0 && (
          <View style={{ gap: space.sm }}>
            <View style={styles.sectionRow}>
              <Text style={styles.section}>Neue Anfragen</Text>
              <View style={styles.badgeAccent}>
                <Text style={styles.badgeAccentText}>{incoming.length}</Text>
              </View>
            </View>

            {incoming.map((request) => (
              <Card key={request.connection_id} style={{ gap: space.sm }}>
                <View style={styles.row}>
                  <Avatar name={request.other_name} path={request.other_avatar_path} size={54} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.name}>{request.other_name}</Text>
                    {request.other_age != null && (
                      <Text style={styles.age}>{request.other_age} Jahre</Text>
                    )}
                  </View>
                </View>

                {request.intro_message && <Body>{request.intro_message}</Body>}

                <View style={styles.actions}>
                  <Button
                    title="Annehmen"
                    onPress={() => answer(request.connection_id!, true)}
                    loading={busyId === request.connection_id}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Ablehnen"
                    variant="secondary"
                    onPress={() => answer(request.connection_id!, false)}
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>
            ))}
          </View>
        )}

        <View style={{ gap: space.sm }}>
          <Text style={styles.section}>Ihre Gespräche</Text>

          {accepted.length === 0 ? (
            <Card>
              <Body>
                Noch keine Gespräche. Wenn jemand Ihre Anfrage annimmt, finden Sie das Gespräch
                hier.
              </Body>
            </Card>
          ) : (
            accepted.map((chat) => (
              <Pressable
                key={chat.connection_id}
                accessibilityRole="button"
                onPress={() => router.push(`/chat/${chat.connection_id}`)}
                style={({ pressed }) => [styles.chatRow, pressed && styles.pressed]}
              >
                <Avatar name={chat.other_name} path={chat.other_avatar_path} size={52} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.name}>{chat.other_name}</Text>
                  <Text style={styles.preview} numberOfLines={1}>
                    {chat.last_message_body ?? 'Schreiben Sie die erste Nachricht.'}
                  </Text>
                </View>
                {(chat.unread_count ?? 0) > 0 && (
                  <View
                    style={styles.badgeBrand}
                    accessibilityLabel={`${chat.unread_count} ungelesene Nachrichten`}
                  >
                    <Text style={styles.badgeBrandText}>{chat.unread_count}</Text>
                  </View>
                )}
              </Pressable>
            ))
          )}
        </View>

        {outgoing.length > 0 && (
          <View style={{ gap: space.sm }}>
            <Text style={styles.section}>Von Ihnen gesendet</Text>
            {outgoing.map((sent) => (
              <Card key={sent.connection_id} style={styles.row}>
                <Avatar name={sent.other_name} path={sent.other_avatar_path} size={48} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{sent.other_name}</Text>
                  <Muted>Wartet auf Antwort</Muted>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.md, gap: space.lg },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  section: { fontFamily: font.sansBold, fontSize: text.label, color: colors.ink },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  actions: { flexDirection: 'row', gap: space.sm },
  name: { fontFamily: font.serifSemi, fontSize: text.name, color: colors.ink },
  age: { fontFamily: font.sans, fontSize: text.meta, color: colors.muted },
  preview: { fontFamily: font.sans, fontSize: text.small, color: colors.muted },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.raised,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    padding: space.sm,
    minHeight: 78,
  },
  pressed: { transform: [{ scale: 0.99 }] },
  badgeAccent: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeAccentText: { fontFamily: font.sansBold, fontSize: text.meta, color: colors.ink },
  badgeBrand: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 8,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeBrandText: { fontFamily: font.sansBold, fontSize: text.meta, color: colors.surface },
})
