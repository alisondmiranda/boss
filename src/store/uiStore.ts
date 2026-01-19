import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

interface UIState {
    // Sidebar States
    isRightSidebarOpen: boolean
    isLeftSidebarExpanded: boolean

    // Actions
    toggleRightSidebar: () => void
    closeRightSidebar: () => void
    openRightSidebar: () => void
    setLeftSidebarExpanded: (expanded: boolean) => void
    toggleLeftSidebar: () => void

    // Sync
    _saveToSupabase: () => Promise<void>
    fetchUIPreferences: () => Promise<void>
    subscribeToUIPreferences: () => () => void
}

export const useUIStore = create<UIState>()(
    persist(
        (set, get) => ({
            isRightSidebarOpen: false,
            isLeftSidebarExpanded: true,

            toggleRightSidebar: () => {
                set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen }))
                get()._saveToSupabase()
            },
            closeRightSidebar: () => {
                set({ isRightSidebarOpen: false })
                get()._saveToSupabase()
            },
            openRightSidebar: () => {
                set({ isRightSidebarOpen: true })
                get()._saveToSupabase()
            },
            setLeftSidebarExpanded: (expanded) => {
                set({ isLeftSidebarExpanded: expanded })
                get()._saveToSupabase()
            },
            toggleLeftSidebar: () => {
                set((state) => ({ isLeftSidebarExpanded: !state.isLeftSidebarExpanded }))
                get()._saveToSupabase()
            },

            _saveToSupabase: async () => {
                const user = (await supabase.auth.getUser()).data.user
                if (!user) return

                const state = get()
                await supabase.from('profiles').update({
                    ui_preferences: {
                        isRightSidebarOpen: state.isRightSidebarOpen,
                        isLeftSidebarExpanded: state.isLeftSidebarExpanded
                    },
                    updated_at: new Date().toISOString()
                }).eq('id', user.id)
            },

            fetchUIPreferences: async () => {
                const user = (await supabase.auth.getUser()).data.user
                if (!user) return

                const { data, error } = await supabase
                    .from('profiles')
                    .select('ui_preferences')
                    .eq('id', user.id)
                    .single()

                if (data?.ui_preferences && !error) {
                    const prefs = data.ui_preferences as { isRightSidebarOpen?: boolean; isLeftSidebarExpanded?: boolean }
                    set({
                        isRightSidebarOpen: prefs.isRightSidebarOpen ?? false,
                        isLeftSidebarExpanded: prefs.isLeftSidebarExpanded ?? true
                    })
                }
            },

            subscribeToUIPreferences: () => {
                const channel = supabase
                    .channel('ui-preferences-realtime')
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'profiles'
                        },
                        (payload) => {
                            supabase.auth.getUser().then(({ data }) => {
                                if (data.user?.id === payload.new.id && payload.new.ui_preferences) {
                                    const prefs = payload.new.ui_preferences as { isRightSidebarOpen?: boolean; isLeftSidebarExpanded?: boolean }
                                    set({
                                        isRightSidebarOpen: prefs.isRightSidebarOpen ?? get().isRightSidebarOpen,
                                        isLeftSidebarExpanded: prefs.isLeftSidebarExpanded ?? get().isLeftSidebarExpanded
                                    })
                                }
                            })
                        }
                    )
                    .subscribe()

                return () => {
                    supabase.removeChannel(channel)
                }
            }
        }),
        {
            name: 'boss-ui-preferences',
            partialize: (state) => ({
                isRightSidebarOpen: state.isRightSidebarOpen,
                isLeftSidebarExpanded: state.isLeftSidebarExpanded
            })
        }
    )
)
