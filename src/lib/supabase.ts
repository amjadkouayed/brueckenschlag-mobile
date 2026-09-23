import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

import type { Database } from './database.types'

/**
 * One client for the whole app. Same project, same tables and the same
 * row-level security as the web app — the rules live in the database, so this
 * client gets no special powers and needs none.
 *
 * AsyncStorage keeps the session across restarts; without it people would sign
 * in again every time they open the app, which for this audience means they
 * would stop opening it.
 *
 * detectSessionInUrl is false because there is no URL bar here: sign-in is the
 * six-digit code, verified in the app.
 */
// `expo start --web` prerenders on the server, where there is no window and
// AsyncStorage throws on import-time access. Nothing is persisted during that
// render anyway — the session is a per-device thing — so it runs without
// storage there and with it everywhere that matters.
const onDevice = typeof window !== 'undefined'

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: onDevice ? AsyncStorage : undefined,
      autoRefreshToken: onDevice,
      persistSession: onDevice,
      detectSessionInUrl: false,
    },
  },
)

/** Photos live in a public bucket; the path is what the profile row stores. */
export function avatarUrl(path: string) {
  return `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`
}
