import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Session, User } from '@supabase/supabase-js'

interface AuthState {
    user: User | null
    session: Session | null
    loading: boolean
    signInWithGoogle: () => Promise<void>
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
                    redirectTo: window.location.origin
                }
            })
            if (error) throw error
        } catch (error) {
            console.error('Error signing in:', error)
            alert('Erro ao conectar com Google. Verifique as configurações do Supabase.')
        }
    },

    signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, session: null })
    },

    initializeAuth: async () => {
        set({ loading: true })

        // Check active session
        const { data: { session } } = await supabase.auth.getSession()
        set({ session, user: session?.user ?? null, loading: false })

        // Listen for changes
        supabase.auth.onAuthStateChange((_event, session) => {
            set({ session, user: session?.user ?? null, loading: false })
        })
    }
}))
