import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, setHours, setMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Clock, X } from 'lucide-react'

interface DatePickerProps {
    date: Date | null
    onSelect: (date: Date | null) => void
    isOpen: boolean
    onClose: () => void
    triggerRef: React.RefObject<HTMLElement>
}

export function DatePicker({ date, onSelect, isOpen, onClose, triggerRef }: DatePickerProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(date)
    const [showTime, setShowTime] = useState(false)
    const [timeValue, setTimeValue] = useState(date ? format(date, 'HH:mm') : '09:00')

    const pickerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (date) {
            setSelectedDate(date)
            setCurrentMonth(date)
            setTimeValue(format(date, 'HH:mm'))
        } else {
            setSelectedDate(null)
        }
    }, [date])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, onClose])

    const generateDays = () => {
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(monthStart)
        const startDate = startOfWeek(monthStart, { locale: ptBR })
        const endDate = endOfWeek(monthEnd, { locale: ptBR })

        return eachDayOfInterval({ start: startDate, end: endDate })
    }

    const handleDateClick = (day: Date) => {
        let newDate = day
        if (timeValue) {
            const [hours, minutes] = timeValue.split(':').map(Number)
            newDate = setMinutes(setHours(day, hours), minutes)
        }
        setSelectedDate(newDate)
        // If not showing time, confirm selection immediately (or keep open if you prefer)
        if (!showTime) {
            onSelect(newDate)
            onClose()
        }
    }

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = e.target.value
        setTimeValue(time)
        if (selectedDate) {
            const [hours, minutes] = time.split(':').map(Number)
            const newDate = setMinutes(setHours(selectedDate, hours), minutes)
            setSelectedDate(newDate)
            onSelect(newDate)
        }
    }

    const handleClear = () => {
        onSelect(null)
        onClose()
    }

    const confirmSelection = () => {
        onSelect(selectedDate)
        onClose()
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={onClose}>
                    {/* Backdrop for mobile, transparent click-through for desktop if desired, but we handle click outside manually. 
                         Actually, let's use a fixed overlay for simplicity or absolute positioning. 
                         The instructions asked for a popover. We will position it relative to trigger via CSS or just fixed center for now?
                         Let's try absolute positioning if possible, but fixed centered is safer without Popper.js.
                         Let's go with Fixed Centered for simplicity and guaranteed visibility.
                      */}
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        onClick={(e) => e.stopPropagation()}
                        ref={pickerRef}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-outline-variant shadow-5 rounded-2xl p-4 w-[320px] max-w-[90vw] z-[100]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-on-surface font-semibold capitalize text-lg">
                                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                            </span>
                            <div className="flex gap-1">
                                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-surface-variant rounded-full text-on-surface-variant">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-surface-variant rounded-full text-on-surface-variant">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Week Days */}
                        <div className="grid grid-cols-7 mb-2 text-center">
                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                                <span key={i} className="text-xs font-medium text-on-surface-variant/70">
                                    {d}
                                </span>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-y-1 gap-x-1 mb-4">
                            {generateDays().map((day) => {
                                const isSelected = selectedDate && isSameDay(day, selectedDate)
                                const isCurrentMonth = isSameMonth(day, currentMonth)
                                const isTodayDate = isToday(day)

                                return (
                                    <button
                                        key={day.toString()}
                                        onClick={() => handleDateClick(day)}
                                        className={`
                                            h-9 w-9 text-sm rounded-full flex items-center justify-center transition-all relative
                                            ${!isCurrentMonth ? 'text-on-surface-variant/30' : 'text-on-surface'}
                                            ${isSelected ? 'bg-primary text-on-primary font-bold shadow-md' : 'hover:bg-surface-variant'}
                                            ${isTodayDate && !isSelected ? 'border border-primary text-primary font-bold' : ''}
                                        `}
                                    >
                                        {format(day, 'd')}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Time Selector Toggle */}
                        {selectedDate && (
                            <div className="flex items-center gap-2 mb-4 px-2 py-2 bg-surface-variant/30 rounded-xl">
                                <Clock className="w-4 h-4 text-primary" />
                                <span className="text-sm text-on-surface font-medium">Horário</span>
                                <input
                                    type="time"
                                    value={timeValue}
                                    onChange={handleTimeChange}
                                    className="ml-auto bg-transparent text-sm text-on-surface font-bold focus:outline-none cursor-pointer"
                                />
                            </div>
                        )}

                        {/* Footer */}
                        <div className="flex justify-between items-center pt-2 border-t border-outline-variant/50">
                            <button
                                onClick={handleClear}
                                className="px-3 py-1.5 text-sm text-error font-medium hover:bg-error/10 rounded-lg transition-colors"
                            >
                                Limpar
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={onClose}
                                    className="px-3 py-1.5 text-sm text-on-surface-variant font-medium hover:bg-surface-variant rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmSelection}
                                    className="px-4 py-1.5 text-sm bg-primary text-on-primary font-bold rounded-lg shadow-sm hover:shadow-md transition-all"
                                >
                                    Concluir
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
