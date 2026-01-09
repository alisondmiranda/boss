import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Sector {
    id: string
    label: string
    color: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink' | 'slate' | 'indigo' | 'teal' | 'cyan' | 'amber' | 'yellow' | 'lime' | 'sky' | 'violet' | 'fuchsia'
    icon: string
}

interface SettingsState {
    geminiApiKey: string | null
    sectors: Sector[]
    setGeminiApiKey: (key: string) => void
    clearGeminiApiKey: () => void
    addSector: (sector: Sector) => void
    updateSector: (id: string, updates: Partial<Sector>) => void
    removeSector: (id: string) => void
    isConfigured: () => boolean
}

const DEFAULT_SECTORS: Sector[] = [
    { id: 'work', label: 'Work', color: 'purple', icon: 'briefcase' },
    { id: 'health', label: 'Health', color: 'green', icon: 'heart' },
    { id: 'personal', label: 'Personal', color: 'orange', icon: 'user' }
]

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            geminiApiKey: null,
            sectors: DEFAULT_SECTORS,

            setGeminiApiKey: (key) => set({ geminiApiKey: key }),
            clearGeminiApiKey: () => set({ geminiApiKey: null }),

            addSector: (sector) => set((state) => ({ sectors: [...state.sectors, sector] })),
            updateSector: (id, updates) => set((state) => ({
                sectors: state.sectors.map(s => s.id === id ? { ...s, ...updates } : s)
            })),
            removeSector: (id) => set((state) => ({ sectors: state.sectors.filter(s => s.id !== id) })),

            isConfigured: () => !!get().geminiApiKey
        }),
        {
            name: 'boss-settings'
        }
    )
)
