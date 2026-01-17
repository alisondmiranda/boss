import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

export interface Sector {
    id: string
    label: string
    color: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink' | 'slate' | 'indigo' | 'teal' | 'cyan' | 'amber' | 'yellow' | 'lime' | 'sky' | 'violet' | 'fuchsia' | 'rose' | 'stone' | 'zinc' | 'gray' | 'brown' | 'black' | 'white'
    icon: string
    createdAt?: string
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
    sortBy: 'manual' | 'alpha' | 'created'
    isSyncing: boolean

    setGeminiApiKey: (key: string) => void
    clearGeminiApiKey: () => void

    addSector: (sector: Sector) => void
    updateSector: (id: string, updates: Partial<Sector>) => void
    removeSector: (id: string) => void
    reorderSectors: (newSectors: Sector[]) => void
    setSortBy: (sort: 'manual' | 'alpha' | 'created') => void

    updateUserProfile: (updates: Partial<UserProfile>) => void

    _saveToSupabase: (forceState?: Partial<SettingsState>) => Promise<any>
    fetchSettings: () => Promise<void>
    isConfigured: () => boolean
    subscribeToSettings: () => () => void
}

const DEFAULT_SECTORS: Sector[] = [
    { id: 'work', label: 'Work', color: 'purple', icon: 'briefcase', createdAt: new Date().toISOString() },
    { id: 'health', label: 'Health', color: 'green', icon: 'heart', createdAt: new Date().toISOString() },
    { id: 'personal', label: 'Personal', color: 'orange', icon: 'user', createdAt: new Date().toISOString() }
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
            sortBy: 'manual',
            isSyncing: false,

            setGeminiApiKey: (key) => set({ geminiApiKey: key }),
            clearGeminiApiKey: () => set({ geminiApiKey: null }),

            _saveToSupabase: async (forceState?: Partial<SettingsState>) => {
                const user = (await supabase.auth.getUser()).data.user
                if (!user) return { error: 'No user' }

                const state = { ...get(), ...forceState }
                console.log('[DEBUG] _saveToSupabase - saving sectors:', state.sectors?.map((s: any) => s.label))
                console.log('[DEBUG] _saveToSupabase - saving sortBy:', state.sortBy)
                const { error } = await supabase.from('profiles').upsert({
                    id: user.id,
                    display_name: state.userProfile.displayName,
                    avatar_type: state.userProfile.avatarType,
                    selected_icon: state.userProfile.selectedIcon,
                    custom_avatar_url: state.userProfile.customAvatarUrl,
                    sectors: state.sectors,
                    sort_by: state.sortBy,
                    updated_at: new Date().toISOString()
                })
                if (error) {
                    console.error('[DEBUG] _saveToSupabase error:', error)
                }
                return { error }
            },

            addSector: async (sector) => {
                const newSectors = [...get().sectors, { ...sector, createdAt: sector.createdAt || new Date().toISOString() }]
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

            reorderSectors: async (newSectors) => {
                console.log('[DEBUG] reorderSectors called with:', newSectors.map(s => s.label))
                set({ sectors: newSectors, sortBy: 'manual', isSyncing: true })
                const result = await get()._saveToSupabase({ sectors: newSectors, sortBy: 'manual' })
                console.log('[DEBUG] _saveToSupabase result:', result)

                // Allow syncing again after a buffer
                setTimeout(() => set({ isSyncing: false }), 1000)
            },

            setSortBy: async (sort) => {
                set({ sortBy: sort })
                await get()._saveToSupabase({ sortBy: sort })
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
                    console.log('[DEBUG] fetchSettings - sectors from DB:', data.sectors?.map((s: any) => s.label))
                    console.log('[DEBUG] fetchSettings - sortBy from DB:', data.sort_by)
                    const updates: any = {}
                    if (data.sectors) updates.sectors = data.sectors
                    if (data.sort_by) updates.sortBy = data.sort_by

                    const profileUpdates: any = {}
                    if (data.display_name !== undefined && data.display_name !== null) profileUpdates.displayName = data.display_name
                    if (data.avatar_type) profileUpdates.avatarType = data.avatar_type
                    if (data.selected_icon) profileUpdates.selectedIcon = data.selected_icon
                    if (data.custom_avatar_url !== undefined) profileUpdates.customAvatarUrl = data.custom_avatar_url

                    // Ensure we merge with existing or default
                    const currentProfile = get().userProfile || DEFAULT_PROFILE
                    if (Object.keys(profileUpdates).length > 0) {
                        updates.userProfile = { ...currentProfile, ...profileUpdates }
                    }

                    if (Object.keys(updates).length > 0) {
                        set(updates)
                    }
                } else if (error && error.code !== 'PGRST116') { // Ignore "Row not found" error
                    console.error("Error fetching settings:", error)
                }
            },

            isConfigured: () => !!get().geminiApiKey,

            subscribeToSettings: () => {
                let debounceTimer: NodeJS.Timeout

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
                            if (get().isSyncing) return

                            // Only update if it's our own profile
                            supabase.auth.getUser().then(({ data }) => {
                                if (data.user?.id === payload.new.id) {
                                    clearTimeout(debounceTimer)
                                    debounceTimer = setTimeout(() => {
                                        get().fetchSettings()
                                    }, 500)
                                }
                            })
                        }
                    )
                    .subscribe()

                return () => {
                    clearTimeout(debounceTimer)
                    supabase.removeChannel(channel)
                }
            }
        }),
        {
            name: 'boss-settings',
            partialize: (state) => ({
                geminiApiKey: state.geminiApiKey,
                sectors: state.sectors,
                userProfile: state.userProfile,
                sortBy: state.sortBy
            }) // Don't persist isSyncing
        }
    )
)

