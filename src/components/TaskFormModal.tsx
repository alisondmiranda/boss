import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Tag, Check, ListTodo, Repeat, Clock, AlignLeft, ChevronDown, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useFloating, autoUpdate, offset, flip, shift, useDismiss, useInteractions, FloatingPortal } from '@floating-ui/react'
import { DatePicker } from './DatePicker'
import { RecurrencePicker, RecurrenceRule } from './RecurrencePicker'
import { Sector } from '../store/settingsStore'
import { Subtask } from '../store/taskStore'
import { ICONS } from '../constants/icons.tsx'
import { getSectorColorClass } from '../lib/utils'

interface TaskFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (title: string, sectors: string[], dueAt: Date | null, recurrence: RecurrenceRule | null, details: string | null, subtasks: Omit<Subtask, 'id' | 'task_id' | 'created_at'>[]) => void
    sectors: Sector[]
    initialTitle?: string
    initialSectors?: string[]
    initialDueAt?: Date | null
    initialRecurrence?: RecurrenceRule | null
    initialDetails?: string | null
    initialSubtasks?: Subtask[]
    initialOpenPicker?: 'date' | 'recurrence' | null
    mode: 'create' | 'edit'
}

export function TaskFormModal({
    isOpen,
    onClose,
    onSave,
    sectors,
    initialTitle = '',
    initialSectors = [],
    initialDueAt = null,
    initialRecurrence = null,
    initialDetails = null,
    initialSubtasks = [],
    initialOpenPicker = null,
}: TaskFormModalProps) {
    const [title, setTitle] = useState(initialTitle)
    const [selectedSectors, setSelectedSectors] = useState<string[]>(initialSectors)
    const [dueAt, setDueAt] = useState<Date | null>(initialDueAt)
    const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(initialRecurrence)
    const [details, setDetails] = useState(initialDetails || '')
    const [subtasks, setSubtasks] = useState<Omit<Subtask, 'id' | 'task_id' | 'created_at'>[]>(
        initialSubtasks.map(st => ({ title: st.title, completed: st.completed, order: st.order }))
    )
    const [newSubtaskInput, setNewSubtaskInput] = useState('')

    // Subtask Inline Editing
    const [editingSubtaskIndex, setEditingSubtaskIndex] = useState<number | null>(null)
    const [editingSubtaskText, setEditingSubtaskText] = useState('')

    const handleStartEditSubtask = (index: number, title: string) => {
        setEditingSubtaskIndex(index)
        setEditingSubtaskText(title)
    }

    const handleSaveEditSubtask = () => {
        if (editingSubtaskIndex !== null && editingSubtaskText.trim()) {
            setSubtasks(prev => prev.map((st, i) => i === editingSubtaskIndex ? { ...st, title: editingSubtaskText } : st))
        }
        setEditingSubtaskIndex(null)
    }

    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
    const [isRecurrencePickerOpen, setIsRecurrencePickerOpen] = useState(false)
    const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false)

    const datePickerTriggerRef = useRef<HTMLButtonElement>(null)
    const recurrenceTriggerRef = useRef<HTMLButtonElement>(null)
    const titleInputRef = useRef<HTMLInputElement>(null)
    const subtaskInputRef = useRef<HTMLInputElement>(null)
    const hasInitializedRef = useRef(false)

    const { refs: sectorRefs, floatingStyles: sectorStyles, context: sectorContext } = useFloating({
        open: isSectorDropdownOpen,
        onOpenChange: setIsSectorDropdownOpen,
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(4),
            flip(),
            shift()
        ],
        placement: 'bottom-start'
    })

    const sectorDismiss = useDismiss(sectorContext)
    const { getFloatingProps: getSectorFloatingProps, getReferenceProps: getSectorReferenceProps } = useInteractions([sectorDismiss])

    // Reset initialization flag when modal closes
    useEffect(() => {
        if (!isOpen) {
            hasInitializedRef.current = false
        }
    }, [isOpen])

    useEffect(() => {
        if (isOpen && !hasInitializedRef.current) {
            hasInitializedRef.current = true

            setTitle(initialTitle)
            setSelectedSectors(initialSectors)
            setDueAt(initialDueAt)
            setRecurrence(initialRecurrence)
            setDetails(initialDetails || '')
            setSubtasks(initialSubtasks.map(st => ({ title: st.title, completed: st.completed, order: st.order })))
            setNewSubtaskInput('')

            // Auto-open picker based on how modal was opened
            if (initialOpenPicker === 'date') {
                setTimeout(() => setIsDatePickerOpen(true), 150)
            } else if (initialOpenPicker === 'recurrence') {
                setTimeout(() => setIsRecurrencePickerOpen(true), 150)
            } else {
                setTimeout(() => titleInputRef.current?.focus(), 100)
            }
        }
    }, [isOpen, initialTitle, initialSectors, initialDueAt, initialRecurrence, initialDetails, initialSubtasks, initialOpenPicker])

    const handleSave = () => {
        if (!title.trim()) return
        onSave(
            title,
            selectedSectors.length > 0 ? selectedSectors : [],
            dueAt,
            recurrence,
            details.trim() || null,
            subtasks
        )
        handleClose()
    }

    const handleClose = () => {
        setTitle('')
        setSelectedSectors([])
        setDueAt(null)
        setRecurrence(null)
        setDetails('')
        setSubtasks([])
        setNewSubtaskInput('')
        setIsDatePickerOpen(false)
        setIsRecurrencePickerOpen(false)
        onClose()
    }


    const addSubtask = () => {
        if (!newSubtaskInput.trim()) return
        setSubtasks(prev => [...prev, { title: newSubtaskInput, completed: false, order: prev.length }])
        setNewSubtaskInput('')
        subtaskInputRef.current?.focus()
    }

    const toggleSubtask = (index: number) => {
        setSubtasks(prev => prev.map((st, i) => i === index ? { ...st, completed: !st.completed } : st))
    }

    const deleteSubtask = (index: number) => {
        setSubtasks(prev => prev.filter((_, i) => i !== index).map((st, i) => ({ ...st, order: i })))
    }

    const getRecurrenceText = () => {
        if (!recurrence) return null
        const freq = {
            daily: 'Diário',
            weekly: 'Semanal',
            monthly: 'Mensal',
            yearly: 'Anual'
        }[recurrence.frequency]

        if (recurrence.interval > 1) {
            const unit = {
                daily: 'dias',
                weekly: 'semanas',
                monthly: 'meses',
                yearly: 'anos'
            }[recurrence.frequency]
            return `A cada ${recurrence.interval} ${unit}`
        }
        return freq
    }



    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative bg-surface border border-outline-variant shadow-5 rounded-3xl w-full max-w-xl overflow-hidden max-h-[85vh] flex flex-col z-50"
                >
                    {/* Header: Minimalist GCal Style */}
                    <div className="flex items-center justify-end px-4 py-2 bg-surface-variant/10 rounded-t-3xl border-b border-transparent">
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-surface-variant rounded-full transition-colors text-on-surface-variant"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="p-6 space-y-6 overflow-y-auto flex-1">

                        {/* Title Row */}
                        <div className="pl-9 relative z-10">
                            <input
                                ref={titleInputRef}
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && title.trim() && !e.shiftKey) handleSave()
                                    if (e.key === 'Escape') handleClose()
                                }}
                                placeholder="Adicionar título"
                                className="w-full bg-transparent border-b border-outline-variant/50 focus:border-primary px-0 py-2 text-2xl font-normal text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Tabs (Visual Only for now) */}
                        <div className="pl-9 flex gap-2">
                            <button className="px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm font-medium">
                                Tarefa
                            </button>
                        </div>

                        {/* Date & Time Row */}
                        <div className="flex gap-4 items-start">
                            <div className="mt-1.5 w-5 flex justify-center text-on-surface-variant">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div className="flex-1 flex flex-wrap gap-2 items-center">
                                {/* Date Pill */}
                                <button
                                    type="button"
                                    ref={datePickerTriggerRef}
                                    onClick={() => setIsDatePickerOpen(true)}
                                    className="px-3 py-1.5 rounded bg-surface-variant/30 hover:bg-surface-variant text-sm font-medium text-on-surface transition-colors flex items-center gap-2"
                                >
                                    {dueAt ? format(dueAt, "EEEE, d 'de' MMMM", { locale: ptBR }) : 'Adicionar data'}
                                </button>

                                {/* Time Selection */}
                                {dueAt ? (
                                    <div className="flex items-center gap-1 bg-surface-variant/30 hover:bg-surface-variant rounded px-2 py-1.5 transition-colors">
                                        <input
                                            type="time"
                                            value={format(dueAt, 'HH:mm')}
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    const [h, m] = e.target.value.split(':').map(Number)
                                                    const newDate = new Date(dueAt)
                                                    newDate.setHours(h)
                                                    newDate.setMinutes(m)
                                                    setDueAt(newDate)
                                                }
                                            }}
                                            className="bg-transparent text-sm font-medium text-on-surface focus:outline-none cursor-pointer w-[70px]"
                                        />
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const now = new Date()
                                            now.setHours(9, 0, 0, 0) // Default to 9am
                                            setDueAt(now)
                                        }}
                                        className="px-3 py-1.5 rounded bg-surface-variant/30 hover:bg-surface-variant text-sm font-medium text-on-surface transition-colors"
                                    >
                                        Adicionar horário
                                    </button>
                                )}

                                {/* Recurrence Pill */}
                                <button
                                    ref={recurrenceTriggerRef}
                                    type="button"
                                    onClick={() => setIsRecurrencePickerOpen(true)}
                                    className="px-3 py-1.5 rounded bg-surface-variant/30 hover:bg-surface-variant text-sm font-medium text-on-surface transition-colors flex items-center gap-2"
                                >
                                    <Repeat className="w-4 h-4 opacity-70" />
                                    {getRecurrenceText() || 'Não se repete'}
                                </button>
                            </div>
                        </div>

                        {/* Details Row */}
                        <div className="flex gap-4 items-start">
                            <div className="mt-1.5 w-5 flex justify-center text-on-surface-variant">
                                <AlignLeft className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <textarea
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    placeholder="Adicionar descrição"
                                    rows={3}
                                    className="w-full bg-surface-variant/20 hover:bg-surface-variant/30 focus:bg-surface-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none transition-colors resize-none"
                                />
                            </div>
                        </div>

                        {/* Subtasks Row */}
                        <div className="flex gap-4 items-start">
                            <div className="mt-1.5 w-5 flex justify-center text-on-surface-variant">
                                <ListTodo className="w-5 h-5" />
                            </div>
                            <div className="flex-1 space-y-2">
                                {/* Subtasks List */}
                                <div className="space-y-1">
                                    {subtasks.map((subtask, index) => (
                                        <div key={index} className="flex items-center gap-2 py-1 group">
                                            <button
                                                type="button"
                                                onClick={() => toggleSubtask(index)}
                                                className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${subtask.completed
                                                    ? 'bg-primary border-primary text-on-primary'
                                                    : 'border-outline-variant hover:border-primary'
                                                    }`}
                                            >
                                                {subtask.completed && <Check className="w-3 h-3" />}
                                            </button>
                                            {editingSubtaskIndex === index ? (
                                                <input
                                                    autoFocus
                                                    value={editingSubtaskText}
                                                    onChange={(e) => setEditingSubtaskText(e.target.value)}
                                                    onBlur={handleSaveEditSubtask}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveEditSubtask()
                                                    }}
                                                    className="flex-1 bg-transparent border-none text-sm text-on-surface focus:outline-none py-0"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <span
                                                    onClick={() => handleStartEditSubtask(index, subtask.title)}
                                                    className={`flex-1 text-sm cursor-text hover:text-primary transition-colors ${subtask.completed ? 'line-through text-on-surface-variant/60' : 'text-on-surface'}`}
                                                >
                                                    {subtask.title}
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => deleteSubtask(index)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant hover:text-error transition-all"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Subtask Input */}
                                <div className="flex items-center gap-2">
                                    <input
                                        ref={subtaskInputRef}
                                        type="text"
                                        value={newSubtaskInput}
                                        onChange={(e) => setNewSubtaskInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                addSubtask()
                                            }
                                        }}
                                        placeholder="Adicionar subtarefa"
                                        className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none font-medium hover:placeholder:text-on-surface-variant/80"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sector Row (Bottom) */}
                        <div className="flex gap-4 items-center">
                            <div className="w-5 flex justify-center text-on-surface-variant">
                                <Tag className="w-5 h-5" />
                            </div>
                            <div>
                                <button
                                    ref={sectorRefs.setReference}
                                    {...getSectorReferenceProps()}
                                    type="button"
                                    onClick={() => setIsSectorDropdownOpen(!isSectorDropdownOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-variant/30 hover:bg-surface-variant/50 text-sm font-medium text-on-surface transition-all border border-transparent hover:border-outline-variant/30"
                                >
                                    {(() => {
                                        const s = selectedSectors.length === 1 ? sectors.find(sec => sec.id === selectedSectors[0]) : null
                                        const isMultiple = selectedSectors.length > 1

                                        let IconComp = Tag
                                        let textColor = 'text-slate-500' // Default grey for 'Geral' / Empty
                                        let label = 'Geral'

                                        if (isMultiple) {
                                            IconComp = ListTodo
                                            textColor = 'text-on-surface'
                                            label = `${selectedSectors.length} listas`
                                        } else if (s) {
                                            IconComp = ICONS.find(i => i.value === s.icon)?.icon || Tag
                                            textColor = getSectorColorClass(s.color).split(' ')[1]
                                            label = s.label
                                        }

                                        return (
                                            <>
                                                <IconComp className={`w-4 h-4 ${textColor}`} />
                                                <span className="text-on-surface">
                                                    {label}
                                                </span>
                                            </>
                                        )
                                    })()}
                                    <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                                </button>

                                <AnimatePresence>
                                    {isSectorDropdownOpen && (
                                        <FloatingPortal>
                                            <div
                                                ref={sectorRefs.setFloating}
                                                style={sectorStyles}
                                                {...getSectorFloatingProps()}
                                                className="z-[90]"
                                            >
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    className="w-56 bg-surface rounded-lg shadow-5 border border-outline-variant flex flex-col py-1 z-[60] overflow-hidden"
                                                >
                                                    {sectors
                                                        .filter(s => {
                                                            // Hide 'Geral' if any other sector is selected
                                                            const isGeral = s.label.toLowerCase() === 'geral' || s.label.toLowerCase() === 'general'
                                                            const hasOtherSelected = selectedSectors.some(id => {
                                                                const sec = sectors.find(sec => sec.id === id)
                                                                return sec && sec.label.toLowerCase() !== 'geral' && sec.label.toLowerCase() !== 'general'
                                                            })
                                                            if (isGeral && hasOtherSelected) return false
                                                            return true
                                                        })
                                                        .map(s => {
                                                            const isSelected = selectedSectors.includes(s.id)
                                                            const colorClass = getSectorColorClass(s.color)
                                                            return (
                                                                <button
                                                                    key={s.id}
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        const isGeral = s.label.toLowerCase() === 'geral' || s.label.toLowerCase() === 'general'
                                                                        if (isGeral) {
                                                                            // Selecting Geral clears everything else
                                                                            setSelectedSectors([s.id])
                                                                        } else {
                                                                            // Selecting other sector removes Geral if present
                                                                            setSelectedSectors(prev => {
                                                                                const withoutGeral = prev.filter(id => {
                                                                                    const sec = sectors.find(sec => sec.id === id)
                                                                                    return sec && sec.label.toLowerCase() !== 'geral' && sec.label.toLowerCase() !== 'general'
                                                                                })

                                                                                let next: string[]
                                                                                if (withoutGeral.includes(s.id)) {
                                                                                    // Deselecting
                                                                                    next = withoutGeral.filter(id => id !== s.id)
                                                                                } else {
                                                                                    // Selecting
                                                                                    next = [...withoutGeral, s.id]
                                                                                }

                                                                                // If empty after toggle, add Geral back
                                                                                if (next.length === 0) {
                                                                                    const geral = sectors.find(s => s.label.toLowerCase() === 'geral' || s.label.toLowerCase() === 'general')
                                                                                    return geral ? [geral.id] : ['geral']
                                                                                }
                                                                                return next
                                                                            })
                                                                        }
                                                                        // Kept open for multi-selection
                                                                    }}
                                                                    className="px-4 py-2.5 text-sm text-left flex items-center gap-3 hover:bg-surface-variant/50 transition-colors w-full text-on-surface"
                                                                >
                                                                    {(() => {
                                                                        const IconComp = ICONS.find(i => i.value === s.icon)?.icon || Tag
                                                                        const textColor = colorClass.split(' ')[1]
                                                                        return <IconComp className={`w-4 h-4 ${textColor}`} />
                                                                    })()}
                                                                    <span className={`flex-1 ${isSelected ? 'font-medium' : ''}`}>
                                                                        {s.label}
                                                                    </span>
                                                                    {isSelected && <Check className="w-3 h-3 text-primary" />}
                                                                </button>
                                                            )
                                                        })}
                                                    <div className="pt-2 mt-1 border-t border-outline-variant/30 px-2 pb-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setIsSectorDropdownOpen(false)
                                                                window.dispatchEvent(new CustomEvent('open-sectors-settings'))
                                                            }}
                                                            className="w-full px-2 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg flex items-center justify-center gap-2 transition-colors uppercase tracking-wide"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                            Nova Etiqueta
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            </div>
                                        </FloatingPortal>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end px-6 py-4 pt-2">
                        <button
                            onClick={handleSave}
                            disabled={!title.trim()}
                            className="px-6 py-2 bg-primary text-on-primary font-medium rounded-full shadow-sm hover:shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Salvar
                        </button>
                    </div>

                    {/* Pickers */}
                    <DatePicker
                        date={dueAt}
                        onSelect={setDueAt}
                        isOpen={isDatePickerOpen}
                        onClose={() => setIsDatePickerOpen(false)}
                        triggerRef={datePickerTriggerRef}
                    />

                    <RecurrencePicker
                        value={recurrence}
                        onChange={setRecurrence}
                        isOpen={isRecurrencePickerOpen}
                        onClose={() => setIsRecurrencePickerOpen(false)}
                        triggerRef={recurrenceTriggerRef}
                    />
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
