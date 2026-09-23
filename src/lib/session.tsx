import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import { getMyProfile, type Profile } from './data'
import { supabase } from './supabase'

type SessionState = {
  session: Session | null
  profile: Profile | null
  loading: boolean
  reloadProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionState | null>(null)

/**
 * Who is signed in, and have they finished onboarding. Those two questions
 * decide every route in the app, so they are answered once here rather than in
 * each screen.
 *
 * Realtime needs the access token separately: the socket keeps whatever token
 * it opened with, so setAuth on every change is what stops chat going quiet an
 * hour in — the single most common Supabase bug in this shape of app.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(current: Session | null) {
    setProfile(current ? await getMyProfile() : null)
  }

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      supabase.realtime.setAuth(data.session?.access_token)
      await loadProfile(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next)
      supabase.realtime.setAuth(next?.access_token)
      await loadProfile(next)
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  return (
    <SessionContext.Provider
      value={{
        session,
        profile,
        loading,
        reloadProfile: () => loadProfile(session),
        signOut: async () => {
          await supabase.auth.signOut()
        },
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession must be used inside SessionProvider')
  return value
}
