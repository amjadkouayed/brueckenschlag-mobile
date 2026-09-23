import { supabase } from './supabase'
import type { Database, Tables } from './database.types'

export type Profile = Tables<'profiles'>
export type Offer = Tables<'offers'>
export type ConnectionOverview = Tables<'connection_overview'>
export type Message = Tables<'messages'>
export type OfferStats = Tables<'my_offer_stats'>
export type NearbyCard = Database['public']['Functions']['discover']['Returns'][number]

export const RADIUS_OPTIONS = [5, 10, 25, 50, 100] as const
export const DEFAULT_RADIUS = 25

/**
 * Every screen is one query. The views and the discover() function already do
 * the joining, the filtering and the counting, so there is nothing to assemble
 * here and no way to ask for someone else's rows — RLS decides, not this file.
 */

export async function getMyProfile(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  return data
}

export async function searchNearby(plz: string, radiusKm: number): Promise<NearbyCard[]> {
  const { data, error } = await supabase.rpc('discover', {
    search_plz: plz,
    radius_km: radiusKm,
  })
  if (error) throw error
  return data ?? []
}

export async function lookupPostalCode(plz: string) {
  const { data } = await supabase
    .from('postal_codes')
    .select('plz, city')
    .eq('plz', plz)
    .maybeSingle()
  return data
}

export async function getMyOffer(): Promise<Offer | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase.from('offers').select('*').eq('user_id', user.id).maybeSingle()
  return data
}

export async function getMyOfferStats(): Promise<OfferStats | null> {
  const { data } = await supabase.from('my_offer_stats').select('*').maybeSingle()
  return data
}

export async function getConnections(): Promise<ConnectionOverview[]> {
  const { data, error } = await supabase
    .from('connection_overview')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getMessages(connectionId: string, limit = 50): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('connection_id', connectionId)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

// --- writes ------------------------------------------------------------------

export async function sendConnectionRequest(recipientId: string, introMessage: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const { error } = await supabase.from('connections').insert({
    requester_id: user.id,
    recipient_id: recipientId,
    status: 'pending',
    intro_message: introMessage.trim() || null,
  })

  // The unique index on the pair is what makes a duplicate impossible in either
  // direction, so this is the expected error rather than a broken state.
  if (error?.code === '23505') return { error: 'Sie haben dieser Person bereits geschrieben.' }
  return { error: error?.message ?? null }
}

export async function answerRequest(connectionId: string, accept: boolean) {
  const { error } = await supabase
    .from('connections')
    .update({ status: accept ? 'accepted' : 'declined' })
    .eq('id', connectionId)
  return { error: error?.message ?? null }
}

export async function sendMessage(connectionId: string, body: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht angemeldet.', message: null }

  const { data, error } = await supabase
    .from('messages')
    .insert({ connection_id: connectionId, sender_id: user.id, body: body.trim() })
    .select()
    .single()

  // Return the stored row so the sender sees their message at once, instead of
  // waiting for Realtime to echo it back — which may never happen on a poor
  // connection.
  return { error: error?.message ?? null, message: data }
}

/**
 * One UPDATE over the other person's unread messages. The policy refuses to
 * touch your own, and read_at is the only column it lets you change — so this
 * cannot mark anything else, however it is called.
 */
export async function markRead(connectionId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('connection_id', connectionId)
    .neq('sender_id', user.id)
    .is('read_at', null)
}

export async function saveOffer(availability: string, description: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const { error } = await supabase.from('offers').upsert(
    {
      user_id: user.id,
      availability: availability.trim(),
      description: description.trim(),
      is_published: true,
    },
    { onConflict: 'user_id' },
  )
  return { error: error?.message ?? null }
}

export async function deleteOffer() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const { error } = await supabase.from('offers').delete().eq('user_id', user.id)
  return { error: error?.message ?? null }
}
