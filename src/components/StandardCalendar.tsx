import { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'

interface StandardCalendarProps {
    className?: string
    selectedDate?: Date | null
    onDateSelect: (date: Date) => void
    highlightToday?: boolean
    showControls?: boolean
    enableTime?: boolean
}

export function StandardCalendar({
    className = "",
    selectedDate,
    onDateSelect,
    highlightToday = true,
    showControls = true,
    enableTime = false
}: StandardCalendarProps) {
    const today = new Date()
    const [currentMonth, setCurrentMonth] = useState(selectedDate || today)

    // Ensure we start with a valid date for calculations
    const displayMonth = currentMonth || today

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(displayMonth)),
        end: endOfWeek(endOfMonth(displayMonth))
    })

    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

    const nextMonth = () => setCurrentMonth(addMonths(displayMonth, 1))
    const prevMonth = () => setCurrentMonth(subMonths(displayMonth, 1))
    const goToToday = () => {
        const now = new Date()
        setCurrentMonth(now)
        onDateSelect(now)
    }

    const [timeValue, setTimeValue] = useState(selectedDate ? format(selectedDate, 'HH:mm') : '09:00')

    const handleDateClick = (day: Date) => {
        let newDate = day
        if (enableTime) {
            const [hours, minutes] = timeValue.split(':').map(Number)
            newDate.setHours(hours, minutes)
        }
        onDateSelect(newDate)
    }

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = e.target.value
        setTimeValue(newTime)
        if (selectedDate) {
            const [hours, minutes] = newTime.split(':').map(Number)
            const newDate = new Date(selectedDate)
            newDate.setHours(hours, minutes)
            onDateSelect(newDate)
        }
    }

    return (
        <div className={`p-4 bg-surface rounded-xl border border-outline-variant/30 shadow-sm ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-on-surface capitalize">
                    {format(displayMonth, 'MMMM yyyy', { locale: ptBR })}
                </h3>
                {showControls && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={goToToday}
                            className="px-2 py-1 text-[10px] font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors capitalize"
                            title="Ir para hoje"
                        >
                            Hoje
                        </button>
                        <button
                            onClick={prevMonth}
                            className="p-1.5 hover:bg-surface-variant rounded-lg text-on-surface-variant transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={nextMonth}
                            className="p-1.5 hover:bg-surface-variant rounded-lg text-on-surface-variant transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
                {weekDays.map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-bold text-on-surface-variant/60 py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-0.5">
                {days.map((day) => {
                    const isCurrentMonth = isSameMonth(day, displayMonth)
                    const isCurrentDay = isToday(day)
                    const isSelected = selectedDate && isSameDay(day, selectedDate)

                    return (
                        <button
                            key={day.toString()}
                            onClick={() => handleDateClick(day)}
                            className={`
                                h-8 w-8 mx-auto flex items-center justify-center text-xs font-medium rounded-lg transition-all
                                ${!isCurrentMonth ? 'text-on-surface-variant/30' : 'text-on-surface'}
                                ${isCurrentDay && highlightToday && !isSelected ? 'bg-primary/20 text-primary font-bold' : ''}
                                ${isSelected ? 'bg-primary text-white font-bold shadow-md scale-110' : 'hover:bg-surface-variant'}
                            `}
                        >
                            {format(day, 'd')}
                        </button>
                    )
                })}
            </div>

            {/* Time Picker */}
            {enableTime && (
                <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">Horário</span>
                    </div>
                    <input
                        type="time"
                        value={timeValue}
                        onChange={handleTimeChange}
                        className="bg-surface-variant/30 text-on-surface text-sm font-bold rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-transparent hover:border-outline-variant/50"
                    />
                </div>
            )}
        </div>
    )
}
