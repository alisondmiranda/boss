import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Session, User } from '@supabase/supabase-js'

interface AuthState {
    user: User | null
    session: Session | null
    loading: boolean
    signInWithGoogle: () => Promise<void>
    signInWithProvider: (provider: 'github' | 'twitter' | 'facebook' | 'linkedin_oidc' | 'discord') => Promise<void>
    linkIdentity: (provider: 'google' | 'github' | 'twitter' | 'facebook' | 'linkedin_oidc' | 'discord') => Promise<void>
    unlinkIdentity: (identity: any) => Promise<void>
    signInWithEmail: (email: string, password: string) => Promise<void>
    signUpWithEmail: (email: string, password: string) => Promise<void>
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
                options: {
                    redirectTo: window.location.origin,
                    queryParams: { access_type: 'offline', prompt: 'consent' }
                }
            })
            if (error) throw error
        } catch (error) {
            console.error('Error signing in with Google:', error)
            throw error
        }
    },

    signInWithProvider: async (provider: 'github' | 'twitter' | 'facebook' | 'linkedin_oidc' | 'discord') => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: { redirectTo: window.location.origin }
            })
            if (error) throw error
        } catch (error) {
            console.error(`Error signing in with ${provider}:`, error)
            throw error
        }
    },

    linkIdentity: async (provider: 'google' | 'github' | 'twitter' | 'facebook' | 'linkedin_oidc' | 'discord') => {
        try {
            const { error } = await supabase.auth.linkIdentity({
                provider,
                options: { redirectTo: window.location.origin }
            })
            if (error) throw error
        } catch (error) {
            console.error(`Error linking ${provider}:`, error)
            throw error
        }
    },

    unlinkIdentity: async (identity: any) => {
        try {
            const { error } = await supabase.auth.unlinkIdentity(identity)
            if (error) throw error

            // Refresh session to update user identities
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()
            if (sessionError) throw sessionError
            set({ session, user: session?.user ?? null })

        } catch (error) {
            console.error('Error unlinking identity:', error)
            throw error
        }
    },

    signInWithEmail: async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error
        } catch (error) {
            console.error('Error signing in with email:', error)
            throw error
        }
    },

    signUpWithEmail: async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: email.split('@')[0],
                    }
                }
            })
            if (error) throw error
        } catch (error) {
            console.error('Error signing up with email:', error)
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
