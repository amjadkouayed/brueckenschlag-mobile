import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Avatar, Body, Button, ErrorNote, Loading } from '@/components/ui'
import {
  getConnections,
  getMessages,
  markRead,
  sendMessage,
  type ConnectionOverview,
  type Message,
} from '@/lib/data'
import { useSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { colors, font, radius, space, text, touch } from '@/lib/theme'

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { session } = useSession()
  const myId = session?.user.id

  const [connection, setConnection] = useState<ConnectionOverview | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const listRef = useRef<FlatList<Message>>(null)

  const append = useCallback((incoming: Message) => {
    setMessages((current) =>
      current.some((message) => message.id === incoming.id) ? current : [...current, incoming],
    )
  }, [])

  useEffect(() => {
    void (async () => {
      const [all, initial] = await Promise.all([getConnections(), getMessages(id)])
      setConnection(all.find((entry) => entry.connection_id === id) ?? null)
      setMessages(initial)
      await markRead(id)
    })()
  }, [id])

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `connection_id=eq.${id}` },
        (payload) => {
          const incoming = payload.new as Message
          append(incoming)
          if (incoming.sender_id !== myId) void markRead(id)
        },
      )
      .subscribe(async (status) => {
        // Anything sent between the first fetch and the subscription being live
        // would otherwise be missing until a restart.
        if (status === 'SUBSCRIBED') {
          const fresh = await getMessages(id)
          fresh.forEach(append)
        }
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [id, myId, append])

  async function send() {
    const body = draft.trim()
    if (!body) return
    setBusy(true)
    setError(null)
    const result = await sendMessage(id, body)
    setBusy(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setDraft('')
    // Show it at once rather than waiting for Realtime to echo it back, which
    // on a weak connection may take seconds or never arrive.
    if (result.message) append(result.message)
  }

  if (!connection) return <Loading />

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Button title="‹ Kontakte" variant="secondary" onPress={() => router.back()} style={styles.back} />
        <Avatar name={connection.other_name} path={connection.other_avatar_path} size={44} />
        <Text style={styles.name} numberOfLines={1}>
          {connection.other_name}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(message) => String(message.id)}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            <View style={styles.tip}>
              <View style={styles.tipDot} />
              <Body>
                Machen Sie hier Zeit und Ort aus. Treffen Sie sich beim ersten Mal an einem
                öffentlichen Ort. Eine seriöse Anfrage fragt nie nach Geld oder Bankdaten.
              </Body>
            </View>
          }
          renderItem={({ item }) => {
            const mine = item.sender_id === myId
            return (
              <View style={[styles.bubbleRow, mine ? styles.mineRow : styles.theirsRow]}>
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.body}</Text>
                </View>
                <Text style={styles.time}>
                  {new Date(item.created_at).toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )
          }}
        />

        {error && (
          <View style={{ paddingHorizontal: space.md }}>
            <ErrorNote>{error}</ErrorNote>
          </View>
        )}

        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Nachricht schreiben …"
            placeholderTextColor={colors.muted}
            style={styles.input}
            multiline
            accessibilityLabel="Nachricht schreiben"
          />
          <Button title="Senden" onPress={send} loading={busy} disabled={!draft.trim()} style={styles.sendButton} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  back: { minHeight: touch.min, paddingHorizontal: space.sm },
  name: { fontFamily: font.serif, fontSize: text.heading, color: colors.ink, flexShrink: 1 },
  list: { padding: space.md, gap: space.sm },
  tip: {
    flexDirection: 'row',
    gap: space.sm,
    backgroundColor: colors.tag,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    padding: space.sm,
    marginBottom: space.sm,
  },
  tipDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent, marginTop: 6 },
  bubbleRow: { maxWidth: '82%', gap: 2 },
  mineRow: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  theirsRow: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.card },
  mine: { backgroundColor: colors.brand, borderBottomRightRadius: 6 },
  theirs: {
    backgroundColor: colors.raised,
    borderWidth: 1,
    borderColor: colors.line,
    borderBottomLeftRadius: 6,
  },
  bubbleText: { fontFamily: font.sans, fontSize: text.body, lineHeight: text.body * 1.4, color: colors.ink },
  bubbleTextMine: { color: colors.surface },
  time: { fontFamily: font.sans, fontSize: text.meta, color: colors.muted },
  composer: {
    flexDirection: 'row',
    gap: space.sm,
    alignItems: 'flex-end',
    padding: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.tag,
  },
  input: {
    flex: 1,
    minHeight: touch.min,
    maxHeight: 120,
    borderWidth: 2,
    borderColor: colors.control,
    borderRadius: radius.button,
    backgroundColor: colors.raised,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    fontFamily: font.sans,
    fontSize: text.body,
    color: colors.ink,
  },
  sendButton: { paddingHorizontal: space.lg },
})
