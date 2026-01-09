import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

export interface Sector {
    id: string
    label: string
    color: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink' | 'slate' | 'indigo' | 'teal' | 'cyan' | 'amber' | 'yellow' | 'lime' | 'sky' | 'violet' | 'fuchsia'
    icon: string
}


export interface UserProfile {
    displayName: string
    avatarType: 'icon' | 'url' | 'upload'
    selectedIcon: string | null
    customAvatarUrl: string | null
}

interface SettingsState {
    geminiApiKey: string | null
    sectors: Sector[]
    userProfile: UserProfile

    setGeminiApiKey: (key: string) => void
    clearGeminiApiKey: () => void

    addSector: (sector: Sector) => void
    updateSector: (id: string, updates: Partial<Sector>) => void
    removeSector: (id: string) => void

    updateUserProfile: (updates: Partial<UserProfile>) => void

    _saveToSupabase: (forceState?: Partial<SettingsState>) => Promise<void>
    fetchSettings: () => Promise<void>
    isConfigured: () => boolean
    subscribeToSettings: () => () => void
}

const DEFAULT_SECTORS: Sector[] = [
    { id: 'work', label: 'Work', color: 'purple', icon: 'briefcase' },
    { id: 'health', label: 'Health', color: 'green', icon: 'heart' },
    { id: 'personal', label: 'Personal', color: 'orange', icon: 'user' }
]

const DEFAULT_PROFILE: UserProfile = {
    displayName: '',
    avatarType: 'icon',
    selectedIcon: 'crown',
    customAvatarUrl: null
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            geminiApiKey: null,
            sectors: DEFAULT_SECTORS,
            userProfile: DEFAULT_PROFILE,

            setGeminiApiKey: (key) => set({ geminiApiKey: key }),
            clearGeminiApiKey: () => set({ geminiApiKey: null }),

            _saveToSupabase: async (forceState?: Partial<SettingsState>) => {
                const user = (await supabase.auth.getUser()).data.user
                if (!user) return

                const state = { ...get(), ...forceState }
                await supabase.from('profiles').upsert({
                    id: user.id,
                    display_name: state.userProfile.displayName,
                    avatar_type: state.userProfile.avatarType,
                    selected_icon: state.userProfile.selectedIcon,
                    custom_avatar_url: state.userProfile.customAvatarUrl,
                    sectors: state.sectors,
                    updated_at: new Date().toISOString()
                })
            },

            addSector: async (sector) => {
                const newSectors = [...get().sectors, sector]
                set({ sectors: newSectors })
                await get()._saveToSupabase({ sectors: newSectors })
            },
            updateSector: async (id, updates) => {
                const newSectors = get().sectors.map(s => s.id === id ? { ...s, ...updates } : s)
                set({ sectors: newSectors })
                await get()._saveToSupabase({ sectors: newSectors })
            },
            removeSector: async (id) => {
                const newSectors = get().sectors.filter(s => s.id !== id)
                set({ sectors: newSectors })
                await get()._saveToSupabase({ sectors: newSectors })
            },

            updateUserProfile: async (updates) => {
                const newUserProfile = { ...get().userProfile, ...updates }
                set({ userProfile: newUserProfile })
                await get()._saveToSupabase({ userProfile: newUserProfile })
            },

            fetchSettings: async () => {
                const user = (await supabase.auth.getUser()).data.user
                if (!user) return

                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (data && !error) {
                    const updates: any = {}
                    if (data.sectors) updates.sectors = data.sectors

                    const profileUpdates: any = {}
                    if (data.display_name !== undefined && data.display_name !== null) profileUpdates.displayName = data.display_name
                    if (data.avatar_type) profileUpdates.avatarType = data.avatar_type
                    if (data.selected_icon) profileUpdates.selectedIcon = data.selected_icon
                    if (data.custom_avatar_url !== undefined) profileUpdates.customAvatarUrl = data.custom_avatar_url

                    if (Object.keys(profileUpdates).length > 0) {
                        updates.userProfile = { ...get().userProfile, ...profileUpdates }
                    }

                    if (Object.keys(updates).length > 0) {
                        set(updates)
                    }
                }
            },

            isConfigured: () => !!get().geminiApiKey,

            subscribeToSettings: () => {
                const channel = supabase
                    .channel('settings-realtime')
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'profiles'
                        },
                        (payload) => {
                            // Only update if it's our own profile
                            supabase.auth.getUser().then(({ data }) => {
                                if (data.user?.id === payload.new.id) {
                                    get().fetchSettings()
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
            name: 'boss-settings',
            partialize: (state) => ({
                geminiApiKey: state.geminiApiKey,
                sectors: state.sectors,
                userProfile: state.userProfile
            })
        }
    )
)

