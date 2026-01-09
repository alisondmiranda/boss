import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Session, User } from '@supabase/supabase-js'

interface AuthState {
    user: User | null
    session: Session | null
    loading: boolean
    signInWithGoogle: () => Promise<void>
    signInWithApple: () => Promise<void>
    linkWithApple: () => Promise<void>
    signOut: () => Promise<void>
    initializeAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    session: null,
    loading: true,

    signInWithGoogle: async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin }
            })
            if (error) throw error
        } catch (error) {
            console.error('Error signing in with Google:', error)
        }
    },

    signInWithApple: async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'apple',
                options: { redirectTo: window.location.origin }
            })
            if (error) throw error
        } catch (error) {
            console.error('Error signing in with Apple:', error)
        }
    },

    linkWithApple: async () => {
        try {
            const { error } = await supabase.auth.linkIdentity({
                provider: 'apple',
                options: { redirectTo: window.location.origin }
            })
            if (error) throw error
        } catch (error) {
            console.error('Error linking Apple account:', error)
            throw error
        }
    },

    signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, session: null })
    },

    initializeAuth: async () => {
        set({ loading: true })

        try {
            // Check active session
            const { data: { session }, error } = await supabase.auth.getSession()

            if (error) {
                console.error('Session error:', error)
                // If token is invalid, clear session to allow new login
                if (error.message.includes('Refresh Token')) {
                    await supabase.auth.signOut()
                    set({ session: null, user: null, loading: false })
                    return
                }
            }

            set({ session, user: session?.user ?? null, loading: false })

            // Initialize settings if user exists
            if (session?.user) {
                import('./settingsStore').then(mod => {
                    mod.useSettingsStore.getState().fetchSettings()
                }).catch(e => console.error('Failed to load settings:', e))
            }
        } catch (error) {
            console.error('Initialization error:', error)
            set({ loading: false })
        }

        // Listen for changes
        supabase.auth.onAuthStateChange((_event, session) => {
            set({ session, user: session?.user ?? null, loading: false })
            if (session?.user) {
                import('./settingsStore').then(mod => {
                    mod.useSettingsStore.getState().fetchSettings()
                }).catch(e => console.error('Failed to load settings on auth change:', e))
            }
        })
    }
}))
