import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Timer, Watch, Settings, Volume2, VolumeX, Plus, Flag, Trash2, SkipForward, Minus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWidgetStore, TimerItem } from '../../store/widgetStore'
import { useAuthStore } from '../../store/authStore'

type Tab = 'stopwatch' | 'timer' | 'pomodoro'

// Custom Tomato Icon
function TomatoIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M16.686,5.1c.952-.99,2.3-3.786.314-4.1a1,1,0,0,0-1,1c0,1.235-1.127,2.546-3,2.9V1a1,1,0,0,0-2,0V4.9C9.127,4.546,8,3.235,8,2A1,1,0,0,0,7,1c-1.983.312-.642,3.106.31,4.1A8.854,8.854,0,0,0,0,14c0,4.721,4.276,10,10,10h4C25.992,24.128,27.457,6.975,16.686,5.1ZM14,22H10a8.322,8.322,0,0,1-8-8c-.052-4.611,4.3-8.172,8.5-6.648A4.471,4.471,0,0,1,7.757,9.03a1,1,0,0,0-.727,1.212c.741,2.132,4.745-.975,4.968-1.565.209.579,4.237,3.7,4.972,1.565a1,1,0,0,0-.728-1.212A4.472,4.472,0,0,1,13.5,7.352C23.917,4.589,25.406,21.99,14,22Z" />
        </svg>
    )
}

// Sound generators
const SOUNDS = {
    beep: (volume: number) => {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, ctx.currentTime)
        gain.gain.setValueAtTime(volume / 100, ctx.currentTime)
        osc.start()
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5)
        osc.stop(ctx.currentTime + 0.5)
    },
    bell: (volume: number) => {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(523.25, ctx.currentTime)
        gain.gain.setValueAtTime(volume / 100, ctx.currentTime)
        osc.start()
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15)
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3)
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.8)
        osc.stop(ctx.currentTime + 0.8)
    },
    chime: (volume: number) => {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        for (let i = 0; i < 3; i++) {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = 'sine'
            osc.frequency.setValueAtTime(1200 - i * 200, ctx.currentTime + i * 0.2)
            gain.gain.setValueAtTime(volume / 100, ctx.currentTime + i * 0.2)
            osc.start(ctx.currentTime + i * 0.2)
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + i * 0.2 + 0.3)
            osc.stop(ctx.currentTime + i * 0.2 + 0.3)
        }
    },
    digital: (volume: number) => {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        for (let i = 0; i < 4; i++) {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = 'square'
            osc.frequency.setValueAtTime(1000, ctx.currentTime + i * 0.15)
            gain.gain.setValueAtTime((volume / 100) * 0.3, ctx.currentTime + i * 0.15)
            osc.start(ctx.currentTime + i * 0.15)
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + i * 0.15 + 0.1)
            osc.stop(ctx.currentTime + i * 0.15 + 0.1)
        }
    },
    loudBell: (volume: number) => {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(1200, ctx.currentTime)
        gain.gain.setValueAtTime(volume / 100, ctx.currentTime)
        osc.start(ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 1.5)
        osc.stop(ctx.currentTime + 1.5)
    },
    doorbell: (volume: number) => {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        // Ding-Dong effect
        const playNote = (freq: number, start: number, duration: number) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = 'sine'
            osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
            gain.gain.setValueAtTime(volume / 100, ctx.currentTime + start)
            osc.start(ctx.currentTime + start)
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + start + duration)
            osc.stop(ctx.currentTime + start + duration)
        }
        playNote(659.25, 0, 0.8) // Mi
        playNote(523.25, 0.4, 1.2) // Do
    }
}

export function TimeHubWidget() {
    const [activeTab, setActiveTab] = useState<Tab>('pomodoro')
    const { user } = useAuthStore()
    const { initSync, cleanup } = useWidgetStore()

    useEffect(() => {
        if (user?.id) {
            initSync(user.id)
        }
        return () => {
            cleanup()
        }
    }, [user?.id])

    return (
        <div className="bg-surface rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
            <div className="flex border-b border-outline-variant/30">
                <button
                    onClick={() => setActiveTab('pomodoro')}
                    className={`flex-1 py-2.5 flex items-center justify-center text-xs font-medium transition-colors ${activeTab === 'pomodoro' ? 'bg-primary/5 text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-surface-variant/30'}`}
                >
                    <TomatoIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setActiveTab('timer')}
                    className={`flex-1 py-2.5 flex items-center justify-center text-xs font-medium transition-colors ${activeTab === 'timer' ? 'bg-primary/5 text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-surface-variant/30'}`}
                >
                    <Timer className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setActiveTab('stopwatch')}
                    className={`flex-1 py-2.5 flex items-center justify-center text-xs font-medium transition-colors ${activeTab === 'stopwatch' ? 'bg-primary/5 text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:bg-surface-variant/30'}`}
                >
                    <Watch className="w-4 h-4" />
                </button>
            </div>
            <div className="p-3">
                {activeTab === 'pomodoro' && <PomodoroView />}
                {activeTab === 'timer' && <TimerView />}
                {activeTab === 'stopwatch' && <StopwatchView />}
            </div>
        </div >
    )
}

// ============ STOPWATCH ============
function StopwatchView() {
    const { stopwatch, startStopwatch, pauseStopwatch, resetStopwatch, addLap, clearLaps, getStopwatchTime } = useWidgetStore()
    const [displayTime, setDisplayTime] = useState(0)

    useEffect(() => {
        if (stopwatch.isRunning) {
            const interval = setInterval(() => {
                setDisplayTime(getStopwatchTime())
            }, 10)
            return () => clearInterval(interval)
        } else {
            setDisplayTime(getStopwatchTime())
        }
    }, [stopwatch.isRunning, stopwatch.startedAt, stopwatch.pausedTime])

    const formatTime = (ms: number) => {
        const minutes = Math.floor(ms / 60000)
        const seconds = Math.floor((ms % 60000) / 1000)
        const milliseconds = Math.floor((ms % 1000) / 10)
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
    }

    const handleToggle = () => {
        if (stopwatch.isRunning) {
            pauseStopwatch()
        } else {
            startStopwatch()
        }
    }

    return (
        <motion.div
            className="py-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
        >
            <div className="bg-surface-variant/20 rounded-xl p-3 relative group">
                {/* Display do Tempo */}
                <div className="flex flex-col items-center mb-2">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Cronômetro</span>
                    <div className="text-4xl font-mono font-bold text-on-surface tabular-nums tracking-tight">
                        {formatTime(displayTime)}
                    </div>
                </div>

                {/* Controles Principais */}
                <div className="flex items-center justify-center gap-2 mb-3">
                    <button
                        onClick={resetStopwatch}
                        className="w-10 h-10 rounded-xl bg-surface-variant hover:bg-surface-variant/80 flex items-center justify-center text-on-surface shadow-sm transition-all"
                        title="Zerar"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleToggle}
                        className={`h-10 px-6 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 ${stopwatch.isRunning ? 'bg-surface-variant text-on-surface hover:text-error' : 'bg-primary text-on-primary shadow-primary/20'}`}
                    >
                        {stopwatch.isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                    </button>
                    <button
                        onClick={addLap}
                        disabled={!stopwatch.isRunning}
                        className="w-10 h-10 rounded-xl bg-surface-variant hover:bg-surface-variant/80 flex items-center justify-center text-on-surface shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Volta"
                    >
                        <Flag className="w-4 h-4" />
                    </button>
                </div>

                {/* Lista de Voltas (Laps) */}
                {stopwatch.laps.length > 0 && (
                    <div className="border-t border-outline-variant/10 pt-2">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase">Voltas</span>
                            <button
                                onClick={clearLaps}
                                className="text-[10px] text-on-surface-variant hover:text-error hover:underline flex items-center gap-1 rounded transition-colors"
                            >
                                <Trash2 className="w-3 h-3" /> Limpar
                            </button>
                        </div>
                        <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                            {[...stopwatch.laps].reverse().map((lap, i) => (
                                <div key={i} className="flex justify-between text-xs text-on-surface-variant bg-surface-variant/30 px-2 py-1.5 rounded-lg">
                                    <span className="font-medium">Volta {stopwatch.laps.length - i}</span>
                                    <span className="font-mono">{formatTime(lap)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    )
}

// ============ TIMER ============
function TimerView() {
    const { timers, addTimer, removeTimer, toggleTimer, resetTimer, updateTimer, getTimerTimeLeft, timerSettings, setTimerSettings, startTimer, pauseTimer } = useWidgetStore()
    const timerStep = timerSettings.incrementStep || 1
    const [showConfig, setShowConfig] = useState(false)
    const [, forceUpdate] = useState(0)
    const completedTimersRef = useRef<Set<string>>(new Set())
    const [editingTimer, setEditingTimer] = useState<{ id: string, value: string } | null>(null)
    // Force re-render every second for running timers + check completion
    useEffect(() => {
        const hasRunning = timers.some(t => t.isRunning)
        if (hasRunning) {
            const interval = setInterval(() => {
                forceUpdate(n => n + 1)

                // Check for completed timers
                timers.forEach(timer => {
                    if (timer.isRunning) {
                        const timeLeft = getTimerTimeLeft(timer.id)
                        if (timeLeft <= 0 && !completedTimersRef.current.has(timer.id)) {
                            completedTimersRef.current.add(timer.id)
                            playTimerAlarm()
                            toggleTimer(timer.id) // Pause instead of full stop to keep UI state
                        }
                    }
                })
            }, 100)
            return () => clearInterval(interval)
        }
    }, [timers])

    // Clear completed ref when timer is reset
    useEffect(() => {
        timers.forEach(timer => {
            if (!timer.isRunning && timer.pausedTimeLeft === timer.duration) {
                completedTimersRef.current.delete(timer.id)
            }
        })
    }, [timers])

    const playTimerAlarm = () => {
        if (!timerSettings.soundEnabled) return
        const repeatCount = timerSettings.soundRepeat || 1
        const soundFn = SOUNDS[timerSettings.soundType]

        let playTimes = 0
        const interval = setInterval(() => {
            try {
                if (soundFn) soundFn(timerSettings.volume)
            } catch (e) {
                console.error("Audio error", e)
            }
            playTimes++
            if (playTimes >= repeatCount) clearInterval(interval)
        }, 1500)
    }

    const saveStep = (step: number) => {
        setTimerSettings({ incrementStep: step })
    }

    const createTimer = () => {
        const newTimer: TimerItem = {
            id: crypto.randomUUID(),
            label: `Timer ${timers.length + 1}`,
            duration: 5 * 60,
            isRunning: false,
            startedAt: null,
            pausedTimeLeft: 5 * 60,
            createdAt: Date.now()
        }
        addTimer(newTimer)
    }

    const adjustTime = (id: string, deltaMinutes: number) => {
        const timer = timers.find(t => t.id === id)
        if (!timer || timer.isRunning) return
        const newDuration = Math.max(1, timer.pausedTimeLeft + deltaMinutes * 60) // minimum 1 second
        updateTimer(id, { duration: newDuration, pausedTimeLeft: newDuration })
    }

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const handleTimeCommit = (id: string, value: string) => {
        const parts = value.split(':')
        let h = 0, m = 0, s = 0

        if (parts.length >= 3) {
            h = parseInt(parts[parts.length - 3]) || 0
            m = parseInt(parts[parts.length - 2]) || 0
            s = Math.min(59, parseInt(parts[parts.length - 1]) || 0)
        } else if (parts.length === 2) {
            m = parseInt(parts[0]) || 0
            s = Math.min(59, parseInt(parts[1]) || 0)
        } else {
            m = parseInt(value.replace(/\D/g, '')) || 0
        }

        const totalSeconds = Math.max(1, Math.min(359999, h * 3600 + m * 60 + s))
        updateTimer(id, { duration: totalSeconds, pausedTimeLeft: totalSeconds })
        setEditingTimer(null)
    }

    const handleToggle = (timer: TimerItem) => {
        if (timer.isRunning) {
            pauseTimer(timer.id)
        } else {
            startTimer(timer.id)
        }
    }

    return (
        <div className="relative">
            <AnimatePresence mode='wait'>
                {showConfig ? (
                    <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                                <Settings className="w-4 h-4" /> Configurações
                            </h3>
                            <button onClick={() => setShowConfig(false)} className="text-xs font-bold text-primary hover:underline">Voltar</button>
                        </div>

                        <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                            {/* Incremento */}
                            <div>
                                <span className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 block">Incremento (±)</span>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-surface-variant/30 rounded-lg p-0.5 border border-outline-variant/20">
                                        <button
                                            onClick={() => saveStep(Math.max(1, timerStep - 1))}
                                            className="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-90"
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={timerStep}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value.replace(/\D/g, '')) || 1
                                                saveStep(Math.min(99, val))
                                            }}
                                            className="w-10 bg-transparent text-center text-xs font-bold text-on-surface outline-none"
                                        />
                                        <button
                                            onClick={() => saveStep(Math.min(99, timerStep + 1))}
                                            className="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-90"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <span className="text-[10px] text-on-surface-variant">minutos</span>
                                </div>
                            </div>

                            {/* Som */}
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer mb-2">
                                    <input type="checkbox" checked={timerSettings.soundEnabled} onChange={(e) => setTimerSettings({ soundEnabled: e.target.checked })} className="accent-primary" />
                                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">Som de Alarme</span>
                                </label>
                                {timerSettings.soundEnabled && (
                                    <>
                                        <div className="flex items-center gap-2 mb-2">
                                            <select
                                                value={timerSettings.soundType}
                                                onChange={(e) => setTimerSettings({ soundType: e.target.value as any })}
                                                className="flex-1 text-xs bg-surface border border-outline-variant/30 rounded-lg px-2 py-1.5 text-on-surface"
                                            >
                                                <option value="beep">Beep</option>
                                                <option value="bell">Sino</option>
                                                <option value="loudBell">Sino Alto</option>
                                                <option value="doorbell">Campainha</option>
                                                <option value="chime">Chime</option>
                                                <option value="digital">Digital</option>
                                            </select>
                                            <button
                                                onClick={() => {
                                                    const soundFn = SOUNDS[timerSettings.soundType]
                                                    if (soundFn) soundFn(timerSettings.volume)
                                                }}
                                                className="text-[10px] text-primary hover:underline font-bold"
                                            >
                                                Ouvir
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] text-on-surface-variant">Repetições</span>
                                            <div className="flex items-center bg-surface-variant/30 rounded-lg p-0.5 border border-outline-variant/20">
                                                <button
                                                    onClick={() => setTimerSettings({ soundRepeat: Math.max(1, (timerSettings.soundRepeat || 1) - 1) })}
                                                    className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="w-6 text-center text-xs font-bold text-on-surface">{timerSettings.soundRepeat}</span>
                                                <button
                                                    onClick={() => setTimerSettings({ soundRepeat: Math.min(10, (timerSettings.soundRepeat || 1) + 1) })}
                                                    className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <VolumeX className="w-3 h-3 text-on-surface-variant" />
                                            <input type="range" min="0" max="100" value={timerSettings.volume} onChange={(e) => setTimerSettings({ volume: Number(e.target.value) })} className="flex-1 accent-primary h-1" />
                                            <span className="text-[10px] text-on-surface-variant w-5">{timerSettings.volume}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="main" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="py-2">
                        {/* Header com settings */}
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase">Timers</span>
                            <button onClick={() => setShowConfig(true)} className="p-1.5 text-on-surface-variant/50 hover:text-primary rounded-lg transition-colors">
                                <Settings className="w-4 h-4" />
                            </button>
                        </div>

                        {timers.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-xs text-on-surface-variant mb-2">Nenhum timer</p>
                                <button
                                    onClick={createTimer}
                                    className="px-3 py-1.5 bg-primary text-on-primary text-xs rounded-lg flex items-center gap-1 mx-auto"
                                >
                                    <Plus className="w-3 h-3" /> Criar Timer
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {timers.map(timer => {
                                    const timeLeft = getTimerTimeLeft(timer.id)
                                    const displayTime = timer.isRunning ? timeLeft : timer.pausedTimeLeft
                                    const progress = timer.duration > 0 ? (displayTime / timer.duration) * 100 : 100

                                    return (
                                        <div key={timer.id} className="bg-surface-variant/20 rounded-xl p-2 relative group">
                                            {/* Progress bar compacta */}
                                            <div className="h-0.5 bg-surface-variant/30 rounded-full mb-2 mt-1 overflow-hidden mx-1">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-300 ${timer.isRunning ? 'bg-primary' : 'bg-primary/50'}`}
                                                    style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                                                />
                                            </div>

                                            {/* Timer Display & Ajustes */}
                                            <div className="flex items-center justify-center gap-2 mb-2">
                                                <button
                                                    onClick={() => adjustTime(timer.id, -timerStep)}
                                                    disabled={timer.isRunning}
                                                    className="w-6 h-6 rounded-lg bg-surface-variant/50 hover:bg-surface-variant flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>

                                                {timer.isRunning ? (
                                                    <div className="text-2xl font-mono font-bold text-on-surface tabular-nums tracking-tight">
                                                        {formatTime(displayTime)}
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        placeholder="00:00"
                                                        value={editingTimer?.id === timer.id ? editingTimer.value : formatTime(timer.pausedTimeLeft)}
                                                        onFocus={() => setEditingTimer({ id: timer.id, value: formatTime(timer.pausedTimeLeft) })}
                                                        onChange={(e) => setEditingTimer({ id: timer.id, value: e.target.value })}
                                                        onBlur={(e) => handleTimeCommit(timer.id, e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleTimeCommit(timer.id, (e.target as HTMLInputElement).value)}
                                                        className="text-2xl font-mono font-bold text-on-surface bg-transparent text-center outline-none focus:bg-surface-variant/30 rounded-lg w-24 tabular-nums tracking-tight transition-colors cursor-text"
                                                        title="Clique para editar"
                                                    />
                                                )}

                                                <button
                                                    onClick={() => adjustTime(timer.id, timerStep)}
                                                    disabled={timer.isRunning}
                                                    className="w-6 h-6 rounded-lg bg-surface-variant/50 hover:bg-surface-variant flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>

                                            {/* Controls */}
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => resetTimer(timer.id)}
                                                    className="w-8 h-8 rounded-lg bg-surface-variant hover:bg-surface-variant/80 flex items-center justify-center text-on-surface shadow-sm transition-all"
                                                    title="Reiniciar"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggle(timer)}
                                                    disabled={timeLeft === 0 && !timer.isRunning}
                                                    className={`h-8 px-4 rounded-lg flex items-center justify-center transition-all shadow-sm ${timer.isRunning ? 'bg-surface-variant text-on-surface hover:text-error' : 'bg-primary text-on-primary'}`}
                                                >
                                                    {timer.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                                                </button>
                                                <button
                                                    onClick={() => removeTimer(timer.id)}
                                                    className="w-8 h-8 rounded-lg bg-surface-variant hover:bg-surface-variant/80 flex items-center justify-center text-on-surface-variant hover:text-error transition-all"
                                                    title="Excluir Timer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                                <button
                                    onClick={createTimer}
                                    className="w-full py-2 border border-dashed border-outline-variant/50 rounded-lg text-xs text-on-surface-variant hover:bg-surface-variant/30 flex items-center justify-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> Adicionar Timer
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ============ POMODORO ============
function PomodoroView() {
    type Mode = 'focus' | 'shortBreak' | 'longBreak'
    const modes = {
        focus: { id: 'focus' as Mode, label: 'Foco' },
        shortBreak: { id: 'shortBreak' as Mode, label: 'Curta' },
        longBreak: { id: 'longBreak' as Mode, label: 'Longa' }
    }

    const store = useWidgetStore()
    const { pomodoroState, pomodoroSettings, setPomodoroSettings, startPomodoro, pausePomodoro, resetPomodoro, switchPomodoroMode, getPomodoroTimeLeft, setPomodoroState } = store
    const [showSettings, setShowSettings] = useState(false)
    const [displayTimeLeft, setDisplayTimeLeft] = useState(getPomodoroTimeLeft())
    const completedRef = useRef(false)
    const [editValue, setEditValue] = useState<string | null>(null)
    const [editingSetting, setEditingSetting] = useState<{ key: string, value: string } | null>(null)

    const pomodoroStep = pomodoroSettings.incrementStep || 1

    const adjustTime = (deltaMinutes: number) => {
        if (pomodoroState.isRunning) return
        const newTime = Math.max(1, pomodoroState.pausedTimeLeft + deltaMinutes * 60)

        // 1. Atualiza o estado atual
        setPomodoroState({
            pausedTimeLeft: newTime,
            totalTime: newTime
        })

        // 2. Sincroniza com as configurações permanentemente
        const settingKey = pomodoroState.mode === 'focus' ? 'focusTime' :
            pomodoroState.mode === 'shortBreak' ? 'shortBreakTime' : 'longBreakTime'
        setPomodoroSettings({ [settingKey]: newTime })
    }

    const handleTimeCommit = (value: string, isSetting: Mode | null = null) => {
        const parts = value.split(':')
        let h = 0, m = 0, s = 0

        if (parts.length >= 3) {
            h = parseInt(parts[parts.length - 3]) || 0
            m = parseInt(parts[parts.length - 2]) || 0
            s = Math.min(59, parseInt(parts[parts.length - 1]) || 0)
        } else if (parts.length === 2) {
            m = parseInt(parts[0]) || 0
            s = Math.min(59, parseInt(parts[1]) || 0)
        } else {
            m = parseInt(value.replace(/\D/g, '')) || 0
        }

        const totalSeconds = Math.min(359999, h * 3600 + m * 60 + s)

        if (isSetting) {
            setPomodoroSettings({ [isSetting + 'Time']: totalSeconds })
            if (pomodoroState.mode === isSetting && !pomodoroState.isRunning) {
                setPomodoroState({ pausedTimeLeft: totalSeconds, totalTime: totalSeconds })
            }
            setEditingSetting(null)
        } else {
            setPomodoroState({
                pausedTimeLeft: totalSeconds,
                totalTime: totalSeconds
            })
            const settingKey = pomodoroState.mode === 'focus' ? 'focusTime' :
                pomodoroState.mode === 'shortBreak' ? 'shortBreakTime' : 'longBreakTime'
            setPomodoroSettings({ [settingKey]: totalSeconds })
            setEditValue(null)
        }
    }

    // Sync display with settings changes
    useEffect(() => {
        if (!pomodoroState.isRunning && editValue === null) {
            const currentSettingTime = pomodoroState.mode === 'focus'
                ? pomodoroSettings.focusTime
                : pomodoroState.mode === 'shortBreak'
                    ? pomodoroSettings.shortBreakTime
                    : pomodoroSettings.longBreakTime

            setPomodoroState({
                pausedTimeLeft: currentSettingTime,
                totalTime: currentSettingTime
            })
            setDisplayTimeLeft(currentSettingTime)
        }
    }, [pomodoroSettings.focusTime, pomodoroSettings.shortBreakTime, pomodoroSettings.longBreakTime])

    // Sync display with state changes
    useEffect(() => {
        if (editValue === null) {
            setDisplayTimeLeft(getPomodoroTimeLeft())
        }
    }, [pomodoroState.pausedTimeLeft, pomodoroState.isRunning])

    // Update display every second when running
    useEffect(() => {
        if (pomodoroState.isRunning) {
            const interval = setInterval(() => {
                const timeLeft = getPomodoroTimeLeft()
                setDisplayTimeLeft(timeLeft)

                // Check if timer completed
                if (timeLeft <= 0 && !completedRef.current) {
                    completedRef.current = true
                    handleTimerComplete()
                }
            }, 100)
            return () => clearInterval(interval)
        } else {
            setDisplayTimeLeft(getPomodoroTimeLeft())
            completedRef.current = false
        }
    }, [pomodoroState.isRunning, pomodoroState.startedAt, pomodoroState.pausedTimeLeft])

    const handleTimerComplete = () => {
        pausePomodoro()
        playAlarm()

        if (pomodoroState.mode === 'focus') {
            const newCompleted = pomodoroState.completedPomodoros + 1
            setPomodoroState({ completedPomodoros: newCompleted })

            if (newCompleted % pomodoroSettings.longBreakInterval === 0) {
                switchPomodoroMode('longBreak')
                if (pomodoroSettings.autoStartBreaks) {
                    setTimeout(() => startPomodoro(), 100)
                }
            } else {
                switchPomodoroMode('shortBreak')
                if (pomodoroSettings.autoStartBreaks) {
                    setTimeout(() => startPomodoro(), 100)
                }
            }
        } else {
            switchPomodoroMode('focus')
            if (pomodoroSettings.autoStartPomodoros) {
                setTimeout(() => startPomodoro(), 100)
            }
        }
    }

    const skip = () => {
        // Pula para o próximo modo
        if (pomodoroState.mode === 'focus') {
            // Pular foco = ir para pausa
            const newCompleted = pomodoroState.completedPomodoros + 1
            setPomodoroState({ completedPomodoros: newCompleted })
            if (newCompleted % pomodoroSettings.longBreakInterval === 0) {
                switchPomodoroMode('longBreak')
            } else {
                switchPomodoroMode('shortBreak')
            }
            if (pomodoroSettings.autoStartBreaks) {
                setTimeout(() => startPomodoro(), 100)
            }
        } else {
            // Pular pausa = ir para foco
            switchPomodoroMode('focus')
            if (pomodoroSettings.autoStartPomodoros) {
                setTimeout(() => startPomodoro(), 100)
            }
        }
    }

    // Muda modo SEM resetar o tempo restante (para quando está pausado)
    const handleModeChange = (newMode: Mode) => {
        const modeTime = newMode === 'focus'
            ? pomodoroSettings.focusTime
            : newMode === 'shortBreak'
                ? pomodoroSettings.shortBreakTime
                : pomodoroSettings.longBreakTime

        setPomodoroState({
            mode: newMode,
            totalTime: modeTime,
            pausedTimeLeft: modeTime,
            isRunning: false,
            startedAt: null
        })
    }

    // Controles de ciclo
    const adjustCycle = (delta: number) => {
        const newValue = Math.max(0, pomodoroState.completedPomodoros + delta)
        setPomodoroState({ completedPomodoros: newValue })
    }

    const clearCycle = () => {
        setPomodoroState({ completedPomodoros: 0 })
    }

    const handleToggle = () => {
        if (pomodoroState.isRunning) {
            pausePomodoro()
        } else {
            startPomodoro()
        }
    }

    const playAlarm = () => {
        if (!pomodoroSettings.soundEnabled) return
        const repeatCount = pomodoroSettings.soundRepeat || 1
        const soundFn = SOUNDS[pomodoroSettings.soundType]

        let playTimes = 0
        const interval = setInterval(() => {
            try {
                soundFn(pomodoroSettings.volume)
            } catch (e) {
                console.error("Audio error", e)
            }
            playTimes++
            if (playTimes >= repeatCount) clearInterval(interval)
        }, 1500) // 1.5s delay between repeats
    }

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    // Progress calculation
    const progress = pomodoroState.totalTime > 0 ? displayTimeLeft / pomodoroState.totalTime : 1


    return (
        <div className="relative">
            <AnimatePresence mode='wait'>
                {showSettings ? (
                    <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                                <Settings className="w-4 h-4" /> Configurações
                            </h3>
                            <button onClick={() => setShowSettings(false)} className="text-xs font-bold text-primary hover:underline">Voltar</button>
                        </div>

                        <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                            <div>
                                <span className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 block">Tempos</span>
                                <div className="grid grid-cols-3 gap-2">
                                    {['focus', 'shortBreak', 'longBreak'].map((m) => (
                                        <div key={m}>
                                            <label className="text-[9px] text-on-surface-variant capitalize">{m === 'focus' ? 'Foco' : m === 'shortBreak' ? 'Curta' : 'Longa'}</label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={editingSetting?.key === m ? editingSetting.value : formatTime(pomodoroSettings[`${m as Mode}Time`])}
                                                onChange={(e) => setEditingSetting({ key: m, value: e.target.value })}
                                                onBlur={(e) => handleTimeCommit(e.target.value, m as Mode)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleTimeCommit((e.target as HTMLInputElement).value, m as Mode)}
                                                className="w-full bg-surface border border-outline-variant/30 rounded-lg px-1 py-1.5 text-xs text-center text-on-surface font-medium focus:border-primary outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Incremento - logo após Tempos */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-on-surface">Incremento (±)</span>
                                <div className="flex items-center bg-surface-variant/30 rounded-lg p-0.5 border border-outline-variant/20">
                                    <button
                                        onClick={() => setPomodoroSettings({ incrementStep: Math.max(1, pomodoroStep - 1) })}
                                        className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-6 text-center text-xs font-bold text-on-surface">{pomodoroStep}</span>
                                    <button
                                        onClick={() => setPomodoroSettings({ incrementStep: Math.min(60, pomodoroStep + 1) })}
                                        className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            {/* Ciclos p/ Longa - mesmo estilo de Incremento */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-on-surface">Ciclos p/ Longa</span>
                                <div className="flex items-center bg-surface-variant/30 rounded-lg p-0.5 border border-outline-variant/20">
                                    <button
                                        onClick={() => setPomodoroSettings({ longBreakInterval: Math.max(1, pomodoroSettings.longBreakInterval - 1) })}
                                        className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-6 text-center text-xs font-bold text-on-surface">{pomodoroSettings.longBreakInterval}</span>
                                    <button
                                        onClick={() => setPomodoroSettings({ longBreakInterval: Math.min(10, pomodoroSettings.longBreakInterval + 1) })}
                                        className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-on-surface">Auto-iniciar Pausas</span>
                                    <button onClick={() => setPomodoroSettings({ autoStartBreaks: !pomodoroSettings.autoStartBreaks })} className={`w-10 h-5 rounded-full transition-colors relative ${pomodoroSettings.autoStartBreaks ? 'bg-primary' : 'bg-surface-variant'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-surface shadow-sm transition-all ${pomodoroSettings.autoStartBreaks ? 'left-5' : 'left-0.5'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-on-surface">Auto-iniciar Pomodoros</span>
                                    <button onClick={() => setPomodoroSettings({ autoStartPomodoros: !pomodoroSettings.autoStartPomodoros })} className={`w-10 h-5 rounded-full transition-colors relative ${pomodoroSettings.autoStartPomodoros ? 'bg-primary' : 'bg-surface-variant'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-surface shadow-sm transition-all ${pomodoroSettings.autoStartPomodoros ? 'left-5' : 'left-0.5'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-outline-variant/30">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-on-surface flex items-center gap-1"><Volume2 className="w-3 h-3" /> Som</span>
                                    <button onClick={() => setPomodoroSettings({ soundEnabled: !pomodoroSettings.soundEnabled })} className={`w-10 h-5 rounded-full transition-colors relative ${pomodoroSettings.soundEnabled ? 'bg-primary' : 'bg-surface-variant'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-surface shadow-sm transition-all ${pomodoroSettings.soundEnabled ? 'left-5' : 'left-0.5'}`} />
                                    </button>
                                </div>
                                {pomodoroSettings.soundEnabled && (
                                    <>
                                        <div className="flex items-center gap-2 mb-2">
                                            <select
                                                value={pomodoroSettings.soundType}
                                                onChange={(e) => setPomodoroSettings({ soundType: e.target.value as any })}
                                                className="flex-1 text-xs bg-surface border border-outline-variant/30 rounded-lg px-2 py-1 text-on-surface"
                                            >
                                                <option value="beep">Beep</option>
                                                <option value="bell">Sino</option>
                                                <option value="loudBell">Sino Alto</option>
                                                <option value="doorbell">Campainha</option>
                                                <option value="chime">Chime</option>
                                                <option value="digital">Digital</option>
                                            </select>
                                            <button
                                                onClick={() => {
                                                    const soundFn = SOUNDS[pomodoroSettings.soundType]
                                                    if (soundFn) soundFn(pomodoroSettings.volume)
                                                }}
                                                className="text-[10px] text-primary hover:underline font-bold"
                                            >
                                                Ouvir
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between mb-3 bg-surface-variant/10 p-2.5 rounded-xl border border-outline-variant/10">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">Repetições</span>
                                                <span className="text-[9px] text-on-surface-variant">Vezes que o som toca</span>
                                            </div>
                                            <div className="flex items-center bg-surface-variant/20 rounded-lg p-0.5 border border-outline-variant/20">
                                                <button
                                                    onClick={() => setPomodoroSettings({ soundRepeat: Math.max(1, (pomodoroSettings.soundRepeat || 1) - 1) })}
                                                    className="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-90"
                                                >
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={pomodoroSettings.soundRepeat}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value.replace(/\D/g, '')) || 1
                                                        setPomodoroSettings({ soundRepeat: Math.min(99, val) })
                                                    }}
                                                    className="w-10 bg-transparent text-center text-xs font-bold text-on-surface outline-none"
                                                />
                                                <button
                                                    onClick={() => setPomodoroSettings({ soundRepeat: Math.min(99, (pomodoroSettings.soundRepeat || 1) + 1) })}
                                                    className="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-90"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <VolumeX className="w-3 h-3 text-on-surface-variant" />
                                            <input type="range" min="0" max="100" value={pomodoroSettings.volume} onChange={(e) => setPomodoroSettings({ volume: Number(e.target.value) })} className="flex-1 accent-primary h-1" />
                                            <span className="text-[10px] text-on-surface-variant w-5">{pomodoroSettings.volume}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="main" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="py-2">
                        {/* Header com modos e settings */}
                        <div className="w-full flex items-center justify-between mb-2">
                            <div className="flex bg-surface-variant/30 p-0.5 rounded-xl">
                                {Object.values(modes).map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => {
                                            if (!pomodoroState.isRunning && pomodoroState.mode !== m.id) {
                                                handleModeChange(m.id)
                                            }
                                        }}
                                        className={`text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all ${pomodoroState.mode === m.id ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant hover:text-on-surface'}`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setShowSettings(true)} className="p-1.5 text-on-surface-variant/50 hover:text-primary rounded-lg transition-colors">
                                <Settings className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Pomodoro card compact */}
                        <div className="bg-surface-variant/20 rounded-xl p-2">
                            {/* Progress bar */}
                            <div className="h-0.5 bg-surface-variant/30 rounded-full mb-3 mt-1 overflow-hidden mx-1">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ${pomodoroState.isRunning ? 'bg-primary' : 'bg-primary/50'}`}
                                    style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
                                />
                            </div>

                            {/* Timer Display Editável */}
                            <div className="flex items-center justify-center gap-3 mb-3">
                                <button
                                    onClick={() => adjustTime(-pomodoroStep)}
                                    disabled={pomodoroState.isRunning}
                                    className="w-7 h-7 rounded-lg bg-surface-variant/50 hover:bg-surface-variant flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Minus className="w-3.5 h-3.5" />
                                </button>

                                {pomodoroState.isRunning ? (
                                    <div className="text-4xl font-mono font-bold text-on-surface tabular-nums tracking-tight">
                                        {formatTime(displayTimeLeft)}
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="00:00:00"
                                        value={editValue !== null ? editValue : formatTime(displayTimeLeft)}
                                        onFocus={() => setEditValue(formatTime(displayTimeLeft))}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={(e) => handleTimeCommit(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleTimeCommit((e.target as HTMLInputElement).value)}
                                        className="text-4xl font-mono font-bold text-on-surface bg-transparent text-center outline-none focus:bg-surface-variant/30 rounded-xl w-40 tabular-nums tracking-tight transition-colors cursor-edit"
                                        title="Clique para editar"
                                    />
                                )}

                                <button
                                    onClick={() => adjustTime(pomodoroStep)}
                                    disabled={pomodoroState.isRunning}
                                    className="w-7 h-7 rounded-lg bg-surface-variant/50 hover:bg-surface-variant flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Main controls */}
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <button
                                    onClick={resetPomodoro}
                                    className="w-10 h-10 rounded-xl bg-surface-variant hover:bg-surface-variant/80 flex items-center justify-center text-on-surface shadow-sm transition-all"
                                    title="Reiniciar"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleToggle}
                                    className={`h-10 px-6 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 ${pomodoroState.isRunning ? 'bg-surface-variant text-on-surface hover:text-error' : 'bg-primary text-on-primary shadow-primary/20'}`}
                                >
                                    {pomodoroState.isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                                </button>
                                <button
                                    onClick={skip}
                                    className="w-10 h-10 rounded-xl bg-surface-variant hover:bg-surface-variant/80 flex items-center justify-center text-on-surface shadow-sm transition-all"
                                    title="Pular"
                                >
                                    <SkipForward className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Cycle controls */}
                            <div className="flex items-center justify-between px-2 pt-2 border-t border-outline-variant/10">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">Ciclo</span>
                                    <div className="flex items-center gap-1 bg-surface-variant/50 rounded-lg p-0.5">
                                        <button
                                            onClick={() => adjustCycle(-1)}
                                            className="w-4 h-4 rounded hover:bg-surface-variant flex items-center justify-center text-on-surface transition-all"
                                        >
                                            <Minus className="w-2.5 h-2.5" />
                                        </button>
                                        <span className="text-[10px] font-mono font-bold text-on-surface w-6 text-center">
                                            {pomodoroState.completedPomodoros % pomodoroSettings.longBreakInterval}/{pomodoroSettings.longBreakInterval}
                                        </span>
                                        <button
                                            onClick={() => adjustCycle(1)}
                                            className="w-4 h-4 rounded hover:bg-surface-variant flex items-center justify-center text-on-surface transition-all"
                                        >
                                            <Plus className="w-2.5 h-2.5" />
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={clearCycle}
                                    className="text-[10px] text-on-surface-variant hover:text-error hover:underline flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-surface-variant/30 transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" /> Zerar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
