import { StateCreator } from 'zustand'
import { TaskState } from '../types'

export interface UiSlice {
    loading: boolean
    isSyncing: boolean
    syncingIds: Set<string>
    filter: string | null
    pendingSectorUpdates: Record<string, any>
    setFilter: (sectorId: string | null) => void
}

export const createUiSlice: StateCreator<TaskState, [], [], UiSlice> = (set) => ({
    loading: false,
    isSyncing: false,
    syncingIds: new Set<string>(),
    filter: null,
    pendingSectorUpdates: {},

    setFilter: (sectorId) => set({ filter: sectorId }),
})
