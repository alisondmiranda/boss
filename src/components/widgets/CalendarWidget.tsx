import { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

export function CalendarWidget() {
    const today = new Date()
    const [currentMonth, setCurrentMonth] = useState(today)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth)),
        end: endOfWeek(endOfMonth(currentMonth))
    })

    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const goToToday = () => {
        setCurrentMonth(today)
        setSelectedDate(today)
    }

    const handleDateClick = (day: Date) => {
        setSelectedDate(day)
    }

    return (
        <div className="p-4 bg-surface rounded-xl border border-outline-variant/30 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-on-surface capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </h3>
                <div className="flex items-center gap-1">
                    <button
                        onClick={goToToday}
                        className="px-2 py-1 text-[10px] font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors"
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
                    const isCurrentMonth = isSameMonth(day, currentMonth)
                    const isCurrentDay = isToday(day)
                    const isSelected = selectedDate && isSameDay(day, selectedDate)

                    return (
                        <button
                            key={day.toString()}
                            onClick={() => handleDateClick(day)}
                            className={`
                                h-8 w-8 mx-auto flex items-center justify-center text-xs font-medium rounded-lg transition-all
                                ${!isCurrentMonth ? 'text-on-surface-variant/30' : 'text-on-surface'}
                                ${isCurrentDay && !isSelected ? 'bg-primary/20 text-primary font-bold' : ''}
                                ${isSelected ? 'bg-primary text-white font-bold shadow-md scale-110' : 'hover:bg-surface-variant'}
                            `}
                        >
                            {format(day, 'd')}
                        </button>
                    )
                })}
            </div>

            {/* Selected Date Display */}
            {selectedDate && (
                <div className="mt-3 pt-3 border-t border-outline-variant/30 flex items-center gap-2 text-xs text-on-surface-variant">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="font-medium text-on-surface">
                        {format(selectedDate, "d 'de' MMMM, yyyy", { locale: ptBR })}
                    </span>
                </div>
            )}
        </div>
    )
}
