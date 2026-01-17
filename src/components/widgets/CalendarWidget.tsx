import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar } from 'lucide-react'
import { StandardCalendar } from '../StandardCalendar'

export function CalendarWidget() {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    const handleDateClick = (day: Date) => {
        setSelectedDate(day)
    }

    return (
        <div className="bg-surface rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
            <StandardCalendar
                className='border-none shadow-none rounded-none'
                selectedDate={selectedDate}
                onDateSelect={handleDateClick}
            />

            {/* Selected Date Display */}
            {selectedDate && (
                <div className="px-4 pb-4 bg-surface flex items-center gap-2 text-xs text-on-surface-variant">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="font-medium text-on-surface">
                        {format(selectedDate, "d 'de' MMMM, yyyy", { locale: ptBR })}
                    </span>
                </div>
            )}
        </div>
    )
}
