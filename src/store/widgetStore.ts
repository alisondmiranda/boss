import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

// Types - Using timestamps for accurate timing even when tab is inactive
export interface PomodoroState {
    mode: 'focus' | 'shortBreak' | 'longBreak'
    totalTime: number // seconds
    isRunning: boolean
    startedAt: number | null // timestamp when started
    pausedTimeLeft: number // seconds remaining when paused
    completedPomodoros: number
    lastUpdated: number
}

export interface TimerItem {
    id: string
    label: string
    duration: number // seconds
    isRunning: boolean
    startedAt: number | null // timestamp when started
    pausedTimeLeft: number // seconds remaining when paused
    createdAt: number
}

export interface StopwatchState {
    isRunning: boolean
    startedAt: number | null // timestamp when started
    pausedTime: number // milliseconds accumulated when paused
    laps: number[]
    lastUpdated: number
}

export interface PomodoroSettings {
    focusTime: number
    shortBreakTime: number
    longBreakTime: number
    autoStartBreaks: boolean
    autoStartPomodoros: boolean
    longBreakInterval: number
    soundEnabled: boolean
    soundType: 'beep' | 'bell' | 'chime' | 'digital' | 'loudBell' | 'doorbell'
    volume: number
    soundRepeat: number
    incrementStep: number
}

export interface TimerSettings {
    soundEnabled: boolean
    soundType: 'beep' | 'bell' | 'chime' | 'digital' | 'loudBell' | 'doorbell'
    volume: number
    soundRepeat: number
    incrementStep: number
}

interface WidgetStore {
    pomodoroState: PomodoroState
    pomodoroSettings: PomodoroSettings
    timerSettings: TimerSettings
    timers: TimerItem[]
    stopwatch: StopwatchState
    userId: string | null
    realtimeChannel: RealtimeChannel | null

    setPomodoroState: (state: Partial<PomodoroState>) => void
    setPomodoroSettings: (settings: Partial<PomodoroSettings>) => void
    setTimerSettings: (settings: Partial<TimerSettings>) => void
    startPomodoro: () => void
    pausePomodoro: () => void
    resetPomodoro: () => void
    switchPomodoroMode: (mode: 'focus' | 'shortBreak' | 'longBreak') => void

    setTimers: (timers: TimerItem[]) => void
    addTimer: (timer: TimerItem) => void
    updateTimer: (id: string, updates: Partial<TimerItem>) => void
    startTimer: (id: string) => void
    pauseTimer: (id: string) => void
    resetTimer: (id: string) => void
    removeTimer: (id: string) => void
    toggleTimer: (id: string) => void

    setStopwatch: (state: Partial<StopwatchState>) => void
    startStopwatch: () => void
    pauseStopwatch: () => void
    resetStopwatch: () => void
    addLap: () => void
    clearLaps: () => void

    initSync: (userId: string) => Promise<void>
    syncToSupabase: (immediate?: boolean) => Promise<void>
    cleanup: () => void

    // Computed
    getPomodoroTimeLeft: () => number
    getTimerTimeLeft: (id: string) => number
    getStopwatchTime: () => number
}

const DEFAULT_POMODORO_STATE: PomodoroState = {
    mode: 'focus',
    totalTime: 25 * 60,
    isRunning: false,
    startedAt: null,
    pausedTimeLeft: 25 * 60,
    completedPomodoros: 0,
    lastUpdated: Date.now()
}

const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
    focusTime: 25 * 60,
    shortBreakTime: 5 * 60,
    longBreakTime: 15 * 60,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    longBreakInterval: 4,
    soundEnabled: true,
    soundType: 'beep',
    volume: 50,
    soundRepeat: 1,
    incrementStep: 1
}

const DEFAULT_TIMER_SETTINGS: TimerSettings = {
    soundEnabled: true,
    soundType: 'digital',
    volume: 50,
    soundRepeat: 1,
    incrementStep: 1
}

const DEFAULT_STOPWATCH: StopwatchState = {
    isRunning: false,
    startedAt: null,
    pausedTime: 0,
    laps: [],
    lastUpdated: Date.now()
}

let syncTimeout: NodeJS.Timeout | null = null
let isInitialized = false

export const useWidgetStore = create<WidgetStore>((set, get) => ({
    pomodoroState: DEFAULT_POMODORO_STATE,
    pomodoroSettings: DEFAULT_POMODORO_SETTINGS,
    timerSettings: DEFAULT_TIMER_SETTINGS,
    timers: [],
    stopwatch: DEFAULT_STOPWATCH,
    userId: null,
    realtimeChannel: null,

    setPomodoroState: (state) => {
        set((prev) => ({
            pomodoroState: { ...prev.pomodoroState, ...state, lastUpdated: Date.now() }
        }))
        get().syncToSupabase(true) // Immediate sync for state changes
    },

    setPomodoroSettings: (settings) => {
        set((prev) => ({
            pomodoroSettings: { ...prev.pomodoroSettings, ...settings }
        }))
        localStorage.setItem('boss-pomodoro-settings', JSON.stringify(get().pomodoroSettings))
    },

    setTimerSettings: (settings) => {
        set((prev) => ({
            timerSettings: { ...prev.timerSettings, ...settings }
        }))
        localStorage.setItem('boss-timer-settings', JSON.stringify(get().timerSettings))
    },

    startPomodoro: () => {
        const state = get().pomodoroState
        set({
            pomodoroState: {
                ...state,
                isRunning: true,
                startedAt: Date.now(),
                lastUpdated: Date.now()
            }
        })
        get().syncToSupabase()
    },

    pausePomodoro: () => {
        const state = get().pomodoroState
        const timeLeft = get().getPomodoroTimeLeft()
        set({
            pomodoroState: {
                ...state,
                isRunning: false,
                startedAt: null,
                pausedTimeLeft: timeLeft,
                lastUpdated: Date.now()
            }
        })
        get().syncToSupabase(true) // Immediate sync
    },

    resetPomodoro: () => {
        const state = get().pomodoroState
        const settings = get().pomodoroSettings
        const newTime = state.mode === 'focus'
            ? settings.focusTime
            : state.mode === 'shortBreak'
                ? settings.shortBreakTime
                : settings.longBreakTime

        set({
            pomodoroState: {
                ...state,
                totalTime: newTime,
                pausedTimeLeft: newTime,
                isRunning: false,
                startedAt: null,
                lastUpdated: Date.now()
            }
        })
        get().syncToSupabase(true) // Immediate sync
    },

    switchPomodoroMode: (mode: 'focus' | 'shortBreak' | 'longBreak') => {
        const settings = get().pomodoroSettings
        const newTime = mode === 'focus'
            ? settings.focusTime
            : mode === 'shortBreak'
                ? settings.shortBreakTime
                : settings.longBreakTime

        set({
            pomodoroState: {
                ...get().pomodoroState,
                mode,
                totalTime: newTime,
                pausedTimeLeft: newTime,
                isRunning: false,
                startedAt: null,
                lastUpdated: Date.now()
            }
        })
        get().syncToSupabase(true) // Immediate sync
    },

    getPomodoroTimeLeft: () => {
        const state = get().pomodoroState
        if (!state.isRunning || !state.startedAt) {
            return state.pausedTimeLeft
        }
        const elapsed = Math.floor((Date.now() - state.startedAt) / 1000)
        return Math.max(0, state.pausedTimeLeft - elapsed)
    },

    setTimers: (timers) => {
        set({ timers })
        get().syncToSupabase()
    },

    addTimer: (timer) => {
        set((prev) => ({ timers: [...prev.timers, timer] }))
        get().syncToSupabase(true)
    },

    updateTimer: (id, updates) => {
        set((prev) => ({
            timers: prev.timers.map(t => t.id === id ? { ...t, ...updates } : t)
        }))
        get().syncToSupabase() // Debounced sync, not immediate
    },

    startTimer: (id) => {
        set((prev) => ({
            timers: prev.timers.map(t => t.id === id ? {
                ...t,
                isRunning: true,
                startedAt: Date.now()
            } : t)
        }))
        get().syncToSupabase(true)
    },

    pauseTimer: (id) => {
        const timer = get().timers.find(t => t.id === id)
        if (!timer) return
        const timeLeft = get().getTimerTimeLeft(id)
        set((prev) => ({
            timers: prev.timers.map(t => t.id === id ? {
                ...t,
                isRunning: false,
                startedAt: null,
                pausedTimeLeft: timeLeft
            } : t)
        }))
        get().syncToSupabase(true)
    },

    resetTimer: (id) => {
        set((prev) => ({
            timers: prev.timers.map(t => t.id === id ? {
                ...t,
                isRunning: false,
                startedAt: null,
                pausedTimeLeft: t.duration
            } : t)
        }))
        get().syncToSupabase(true)
    },

    removeTimer: (id) => {
        set((prev) => ({ timers: prev.timers.filter(t => t.id !== id) }))
        get().syncToSupabase(true)
    },

    toggleTimer: (id) => {
        const timer = get().timers.find(t => t.id === id)
        if (!timer) return

        if (timer.isRunning) {
            get().pauseTimer(id)
        } else {
            get().startTimer(id)
        }
    },

    getTimerTimeLeft: (id) => {
        const timer = get().timers.find(t => t.id === id)
        if (!timer) return 0
        if (!timer.isRunning || !timer.startedAt) {
            return timer.pausedTimeLeft
        }
        const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000)
        return Math.max(0, timer.pausedTimeLeft - elapsed)
    },

    setStopwatch: (state) => {
        set((prev) => ({
            stopwatch: { ...prev.stopwatch, ...state, lastUpdated: Date.now() }
        }))
        get().syncToSupabase()
    },

    startStopwatch: () => {
        set((prev) => ({
            stopwatch: {
                ...prev.stopwatch,
                isRunning: true,
                startedAt: Date.now(),
                lastUpdated: Date.now()
            }
        }))
        get().syncToSupabase()
    },

    pauseStopwatch: () => {
        const currentTime = get().getStopwatchTime()
        set((prev) => ({
            stopwatch: {
                ...prev.stopwatch,
                isRunning: false,
                startedAt: null,
                pausedTime: currentTime,
                lastUpdated: Date.now()
            }
        }))
        get().syncToSupabase()
    },

    resetStopwatch: () => {
        set({
            stopwatch: {
                isRunning: false,
                startedAt: null,
                pausedTime: 0,
                laps: [],
                lastUpdated: Date.now()
            }
        })
        get().syncToSupabase()
    },

    addLap: () => {
        const currentTime = get().getStopwatchTime()
        set((prev) => ({
            stopwatch: {
                ...prev.stopwatch,
                laps: [...prev.stopwatch.laps, currentTime],
                lastUpdated: Date.now()
            }
        }))
        get().syncToSupabase()
    },

    clearLaps: () => {
        set((prev) => ({
            stopwatch: { ...prev.stopwatch, laps: [], lastUpdated: Date.now() }
        }))
        get().syncToSupabase()
    },

    getStopwatchTime: () => {
        const state = get().stopwatch
        if (!state.isRunning || !state.startedAt) {
            return state.pausedTime
        }
        return state.pausedTime + (Date.now() - state.startedAt)
    },

    initSync: async (userId) => {
        set({ userId })

        // Load settings from localStorage
        const savedSettings = localStorage.getItem('boss-pomodoro-settings')
        if (savedSettings) {
            try {
                set({ pomodoroSettings: JSON.parse(savedSettings) })
            } catch { }
        }

        // Fetch initial state from Supabase
        try {
            const { data } = await supabase
                .from('widget_states')
                .select('*')
                .eq('user_id', userId)
                .single()

            if (data) {
                const remote = data
                console.log('initSync: Loaded data from Supabase:', {
                    hasPomodoro: !!remote.pomodoro_state?.mode,
                    timersCount: Array.isArray(remote.timers_state) ? remote.timers_state.length : 0,
                    hasStopwatch: !!remote.stopwatch_state?.lastUpdated
                })
                if (remote.pomodoro_state?.mode) {
                    set({ pomodoroState: remote.pomodoro_state })
                }
                if (Array.isArray(remote.timers_state)) {
                    set({ timers: remote.timers_state })
                }
                if (remote.stopwatch_state?.lastUpdated) {
                    set({ stopwatch: remote.stopwatch_state })
                }
                isInitialized = true
                console.log('initSync: Initialization complete')
            } else {
                // Create initial row
                await supabase.from('widget_states').insert({
                    user_id: userId,
                    pomodoro_state: DEFAULT_POMODORO_STATE,
                    timers_state: [],
                    stopwatch_state: DEFAULT_STOPWATCH
                })
                isInitialized = true
                console.log('initSync: Created new row, initialization complete')
            }
        } catch (e) {
            console.warn('Widget state sync failed:', e)
            isInitialized = true // Still allow sync even if load failed
        }

        // Subscribe to realtime changes
        const channel = supabase
            .channel(`widget_states:${userId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'widget_states',
                filter: `user_id=eq.${userId}`
            }, (payload) => {
                const remote = payload.new as any
                const local = get()

                // Only update if not running locally
                if (remote.pomodoro_state && !local.pomodoroState.isRunning) {
                    if (remote.pomodoro_state.lastUpdated > local.pomodoroState.lastUpdated) {
                        set({ pomodoroState: remote.pomodoro_state })
                    }
                }

                if (remote.timers_state) {
                    const runningLocalIds = local.timers.filter(t => t.isRunning).map(t => t.id)
                    if (runningLocalIds.length === 0) {
                        set({ timers: remote.timers_state })
                    }
                }

                if (remote.stopwatch_state && !local.stopwatch.isRunning) {
                    if (remote.stopwatch_state.lastUpdated > local.stopwatch.lastUpdated) {
                        set({ stopwatch: remote.stopwatch_state })
                    }
                }
            })
            .subscribe()

        set({ realtimeChannel: channel })

        // Save state before page unload (synchronously)
        window.addEventListener('beforeunload', () => {
            const { userId } = get()
            if (!userId) return

            // Use synchronous sendBeacon as async won't complete before unload

            // Fallback to immediate sync
            get().syncToSupabase(true)
        })
    },

    syncToSupabase: async (immediate = false) => {
        if (syncTimeout) clearTimeout(syncTimeout)

        const doSync = async () => {
            const { userId, pomodoroState, timers, stopwatch } = get()
            if (!userId) {
                console.warn('syncToSupabase: No userId, skipping sync')
                return
            }
            if (!isInitialized) {
                console.warn('syncToSupabase: Not initialized yet, skipping sync')
                return
            }

            console.log('syncToSupabase: Syncing...', { userId, timersCount: timers.length })

            try {
                const { error } = await supabase
                    .from('widget_states')
                    .upsert({
                        user_id: userId,
                        pomodoro_state: pomodoroState,
                        timers_state: timers,
                        stopwatch_state: stopwatch,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id' })

                if (error) {
                    console.error('syncToSupabase: Error from Supabase:', error)
                } else {
                    console.log('syncToSupabase: Success!')
                }
            } catch (e) {
                console.warn('Sync failed:', e)
            }
        }

        if (immediate) {
            doSync()
        } else {
            syncTimeout = setTimeout(doSync, 300)
        }
    },


    cleanup: () => {
        const { realtimeChannel } = get()
        if (realtimeChannel) {
            supabase.removeChannel(realtimeChannel)
        }
        if (syncTimeout) clearTimeout(syncTimeout)
        isInitialized = false
        set({ realtimeChannel: null, userId: null })
    }
}))
