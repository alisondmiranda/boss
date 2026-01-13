import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Repeat, ChevronDown } from 'lucide-react'

export interface RecurrenceRule {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number
    week_days?: number[] // 0-6
    ends_on?: Date | null
}

interface RecurrencePickerProps {
    value: RecurrenceRule | null
    onChange: (rule: RecurrenceRule | null) => void
    isOpen: boolean
    onClose: () => void
}

export function RecurrencePicker({ value, onChange, isOpen, onClose }: RecurrencePickerProps) {
    const [showCustom, setShowCustom] = useState(false)
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>(value?.frequency || 'daily')
    const [interval, setInterval] = useState(value?.interval || 1)
    const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>(value?.week_days || [])

    const weekDays = [
        { label: 'D', value: 0 },
        { label: 'S', value: 1 },
        { label: 'T', value: 2 },
        { label: 'Q', value: 3 },
        { label: 'Q', value: 4 },
        { label: 'S', value: 5 },
        { label: 'S', value: 6 }
    ]

    const applyPreset = (freq: 'daily' | 'weekly' | 'monthly' | 'yearly', int: number = 1) => {
        onChange({ frequency: freq, interval: int })
        onClose()
    }

    const handleCustomSave = () => {
        onChange({
            frequency,
            interval,
            week_days: frequency === 'weekly' ? selectedWeekDays : undefined
        })
        onClose()
    }

    const toggleWeekDay = (day: number) => {
        setSelectedWeekDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        )
    }

    const handleClear = () => {
        onChange(null)
        onClose()
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[90]" onClick={onClose}>
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    onClick={(e) => e.stopPropagation()}
                    className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-outline-variant shadow-5 rounded-2xl p-2 w-[320px] z-[100] flex flex-col gap-1"
                >
                    <div className="px-3 py-2 text-sm font-bold text-on-surface/50 uppercase tracking-wider mb-1">
                        Repetição
                    </div>

                    {!showCustom ? (
                        <>
                            <button
                                onClick={() => applyPreset('daily')}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium hover:bg-surface-variant flex items-center justify-between transition-colors ${value?.frequency === 'daily' && value?.interval === 1 ? 'bg-primary/10 text-primary' : 'text-on-surface'}`}
                            >
                                Todos os dias
                            </button>
                            <button
                                onClick={() => applyPreset('weekly')}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium hover:bg-surface-variant flex items-center justify-between transition-colors ${value?.frequency === 'weekly' && value?.interval === 1 ? 'bg-primary/10 text-primary' : 'text-on-surface'}`}
                            >
                                Toda semana
                            </button>
                            <button
                                onClick={() => applyPreset('monthly')}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium hover:bg-surface-variant flex items-center justify-between transition-colors ${value?.frequency === 'monthly' && value?.interval === 1 ? 'bg-primary/10 text-primary' : 'text-on-surface'}`}
                            >
                                Todo mês
                            </button>
                            <button
                                onClick={() => applyPreset('yearly')}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium hover:bg-surface-variant flex items-center justify-between transition-colors ${value?.frequency === 'yearly' && value?.interval === 1 ? 'bg-primary/10 text-primary' : 'text-on-surface'}`}
                            >
                                Todo ano
                            </button>

                            <button
                                onClick={() => applyPreset('weekly', 2)}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium hover:bg-surface-variant flex items-center justify-between transition-colors ${value?.frequency === 'weekly' && value?.interval === 2 ? 'bg-primary/10 text-primary' : 'text-on-surface'}`}
                            >
                                A cada 2 semanas
                            </button>

                            <button
                                onClick={() => setShowCustom(true)}
                                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
                            >
                                <Repeat className="w-4 h-4" />
                                Personalizar...
                            </button>

                            <div className="h-px bg-outline-variant/50 my-1 mx-2" />

                            <button
                                onClick={handleClear}
                                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-error hover:bg-error/10 hover:text-error transition-colors"
                            >
                                Não repetir
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col gap-3 p-3">
                            {/* Frequency Selector */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-on-surface-variant">Repetir a cada</span>
                                <input
                                    type="number"
                                    min="1"
                                    value={interval}
                                    onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                                    className="w-16 px-2 py-1 bg-surface-variant rounded-lg text-sm text-on-surface text-center focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                <select
                                    value={frequency}
                                    onChange={(e) => setFrequency(e.target.value as any)}
                                    className="flex-1 px-3 py-1.5 bg-surface-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="daily">dia(s)</option>
                                    <option value="weekly">semana(s)</option>
                                    <option value="monthly">mês(es)</option>
                                    <option value="yearly">ano(s)</option>
                                </select>
                            </div>

                            {/* Week Days Selector (only for weekly) */}
                            {frequency === 'weekly' && (
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs text-on-surface-variant font-medium">Repetir em:</span>
                                    <div className="grid grid-cols-7 gap-1">
                                        {weekDays.map((day) => (
                                            <button
                                                key={day.value}
                                                onClick={() => toggleWeekDay(day.value)}
                                                className={`h-9 rounded-full text-xs font-bold flex items-center justify-center transition-all ${selectedWeekDays.includes(day.value)
                                                    ? 'bg-primary text-on-primary'
                                                    : 'bg-surface-variant text-on-surface-variant hover:bg-surface-variant/70'
                                                    }`}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-2 border-t border-outline-variant/50">
                                <button
                                    onClick={() => setShowCustom(false)}
                                    className="flex-1 px-3 py-2 text-sm text-on-surface-variant font-medium hover:bg-surface-variant rounded-lg transition-colors"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={handleCustomSave}
                                    className="flex-1 px-4 py-2 text-sm bg-primary text-on-primary font-bold rounded-lg shadow-sm hover:shadow-md transition-all"
                                >
                                    Aplicar
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
