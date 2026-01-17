import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { Check, Pencil, Trash2, Repeat, Calendar, ChevronDown, Plus, CornerDownLeft, X, GripVertical, Tag, ListChecks } from 'lucide-react'
import { Sector } from '../store/settingsStore'
import { ICONS } from '../constants/icons.tsx'
import { Task } from '../store/taskStore'
import { getSectorColorClass } from '../lib/utils'
import { format, isPast, isToday, isTomorrow, isThisYear, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { StandardCalendar } from './StandardCalendar'

interface TaskItemProps {
    task: Task
    taskSectors: string[]
    sectors: Sector[]
    toggleTask: (id: string, status: Task['status']) => void
    toggleTaskSector: (taskId: string, sectorId: string, allSectors: { id: string; label: string }[]) => Promise<void>
    setTaskMenuOpen: (id: string | null) => void
    taskMenuOpen: string | null
    handleMoveToTrash: (id: string) => void
    updateTask: (id: string, updates: Partial<Task>) => void
    onEditClick?: (task: Task) => void
    onDateClick?: (task: Task) => void
    onRecurrenceClick?: (task: Task) => void
    updateSubtask: (subtaskId: string, title: string) => Promise<void>
    addSubtask: (taskId: string, title: string) => Promise<void>
    toggleSubtask: (subtaskId: string) => Promise<void>
    deleteSubtask: (subtaskId: string) => Promise<void>
    reorderSubtasks: (taskId: string, newSubtasks: any[]) => Promise<void>
    sortBy?: 'dueDate' | 'createdAt' | 'name' | 'manual'
}

export function TaskItem({
    task, taskSectors, sectors, toggleTask, toggleTaskSector,
    setTaskMenuOpen, taskMenuOpen, handleMoveToTrash, updateTask, onEditClick, onRecurrenceClick,
    updateSubtask, addSubtask, toggleSubtask, deleteSubtask, reorderSubtasks
}: TaskItemProps) {
    const dragControls = useDragControls()
    const cardRef = useRef<HTMLDivElement>(null)
    const [isExpanded, setIsExpanded] = useState(false)
    const [expandedBy, setExpandedBy] = useState<'button' | 'card' | null>(null)

    const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
    const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)
    const [editSubtaskTitle, setEditSubtaskTitle] = useState('')
    const [animationState, setAnimationState] = useState<'idle' | 'celebrating' | 'exiting'>('idle')
    const [showCalendar, setShowCalendar] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(task.title)
    const [showDescription, setShowDescription] = useState(!!task.details)
    const [showSubtasks, setShowSubtasks] = useState(true)
    const [description, setDescription] = useState(task.details || '')

    // Update local description if task updates
    useEffect(() => {
        if (task.details !== description) {
            setDescription(task.details || '')
        }
    }, [task.details])

    // Click outside handler for card expansion
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (expandedBy === 'card' && cardRef.current && !cardRef.current.contains(event.target as Node)) {
                // Check if calendar is open, if so don't close yet? 
                // Or maybe calendar is inside cardRef? Yes it is (in portal or absolute relative to card).
                // If portal, it might be outside. But let's assume standard behavior first.
                // If editing title, don't collapse?

                setIsExpanded(false)
                setExpandedBy(null)
            }
        }

        if (expandedBy === 'card') {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [expandedBy, isEditing])


    const handleButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (isExpanded) {
            setIsExpanded(false)
            setExpandedBy(null)
        } else {
            setIsExpanded(true)
            setExpandedBy('button')
        }
    }

    const handleSaveTitle = () => {
        if (editTitle.trim() && editTitle !== task.title) {
            updateTask(task.id, { title: editTitle.trim() })
        }
        setIsEditing(false)
    }

    const handleSaveDescription = () => {
        if (description !== task.details) {
            updateTask(task.id, { details: description })
        }
    }

    const handleSubtaskEditStart = (id: string, title: string) => {
        setEditingSubtaskId(id)
        setEditSubtaskTitle(title)
    }

    const handleToggleCompletion = async () => {
        if (task.status !== 'done') {
            setAnimationState('celebrating')
            setTimeout(() => {
                setAnimationState('exiting')
                setTimeout(() => {
                    toggleTask(task.id, task.status)
                    setTimeout(() => setAnimationState('idle'), 100)
                }, 200)
            }, 200)
        } else {
            toggleTask(task.id, task.status)
        }
    }

    const handleToggleSubtask = (subtaskId: string) => toggleSubtask(subtaskId)
    const handleDeleteSubtask = (subtaskId: string) => deleteSubtask(subtaskId)
    const handleAddSubtask = () => {
        if (!newSubtaskTitle.trim()) return
        addSubtask(task.id, newSubtaskTitle.trim())
        setNewSubtaskTitle('')
    }
    const handleSubtaskEditSave = () => {
        if (editingSubtaskId && editSubtaskTitle.trim()) {
            updateSubtask(editingSubtaskId, editSubtaskTitle.trim())
        }
        setEditingSubtaskId(null)
    }

    const getSectorDetails = (sectorId: string) => {
        return sectors.find(s => s.id === sectorId) || { id: sectorId, label: 'Geral', color: 'slate' as const, icon: 'tag' }
    }

    const getDueDateDisplay = () => {
        if (!task.due_at) return null
        const date = new Date(task.due_at)
        const isOverdue = isPast(date) && !isToday(date) && task.status !== 'done'
        let text = ''
        if (isToday(date)) text = 'Hoje'
        else if (isTomorrow(date)) text = 'Amanhã'
        else if (isOverdue) text = formatDistanceToNow(date, { locale: ptBR, addSuffix: true })
        else if (isThisYear(date)) text = format(date, 'd MMM', { locale: ptBR })
        else text = format(date, 'd MMM yyyy', { locale: ptBR })

        return { text, isOverdue, date }
    }

    const dateDisplay = getDueDateDisplay()


    return (
        <Reorder.Item
            value={task}
            id={task.id}
            dragListener={false}
            dragControls={dragControls}
            whileDrag={{
                scale: 1.02,
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                zIndex: 50,
            }}
            layout
            transition={{
                layout: { duration: 0.15, ease: "easeOut" }
            }}
            className={`bg-surface border border-outline-variant/30 rounded-[18px] flex flex-col group relative shadow-sm select-none hover:border-primary/30 hover:shadow-md ${task.status === 'done' ? 'opacity-60' : ''} ${animationState !== 'idle' ? 'pointer-events-none' : ''}`}
            ref={cardRef}
            onClick={() => {
                if (isEditing) return
                if (expandedBy === 'button') return
                if (!isExpanded) {
                    setIsExpanded(true)
                    setExpandedBy('card')
                } else if (expandedBy === 'card') {
                    setIsExpanded(false)
                    setExpandedBy(null)
                }
            }}
        >
            {/* Main Task Row */}
            <div className="flex items-center gap-2.5 p-2.5 w-full">
                <div
                    onPointerDown={(e) => dragControls.start(e)}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 cursor-grab active:cursor-grabbing hover:bg-surface-variant/50 rounded-md transition-colors shrink-0"
                >
                    <GripVertical className="w-3.5 h-3.5 text-on-surface-variant/30 group-hover:text-on-surface-variant/70 transition-colors" />
                </div>

                {/* Minimalist Checkbox */}
                <button
                    onClick={handleToggleCompletion}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 relative overflow-hidden ${task.status === 'done' || animationState !== 'idle'
                        ? 'bg-primary border-primary text-on-primary shadow-sm'
                        : 'border-outline/40 hover:border-primary text-transparent hover:bg-primary/5'
                        }`}
                >
                    <AnimatePresence>
                        {(task.status === 'done' || animationState !== 'idle') && (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                            >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>

                {/* Content Section */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex flex-col">
                        {isEditing ? (
                            <input
                                autoFocus
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onBlur={handleSaveTitle}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveTitle()
                                    if (e.key === 'Escape') {
                                        setEditTitle(task.title)
                                        setIsEditing(false)
                                    }
                                }}
                                className="w-full bg-transparent border-none text-[15px] text-on-surface font-medium focus:outline-none p-0"
                            />
                        ) : (
                            <span
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setIsEditing(true)
                                    setIsExpanded(true)
                                    setExpandedBy('card')
                                }}
                                className={`text-sm font-medium leading-tight truncate cursor-pointer transition-colors ${task.status === 'done' ? 'text-on-surface-variant/60 line-through' : 'text-on-surface hover:text-primary'}`}
                            >
                                {task.title}
                            </span>
                        )}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {dateDisplay && (
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setShowCalendar(true)
                                    }}
                                    className={`group/date flex items-center pl-1.5 pr-0.5 py-0.5 rounded text-[10px] font-bold border w-fit transition-colors cursor-pointer select-none ${dateDisplay.text === 'Hoje'
                                        ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                                        : dateDisplay.isOverdue
                                            ? 'bg-error/10 text-error border-error/20 hover:bg-error/20'
                                            : 'bg-surface-variant/30 text-on-surface-variant border-transparent hover:bg-surface-variant/50'
                                        }`}
                                >
                                    <Calendar className="w-3 h-3 mr-1" />
                                    <span>{dateDisplay.text}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            updateTask(task.id, { due_at: null })
                                        }}
                                        className="w-0 group-hover/date:w-4 h-4 flex items-center justify-center rounded-sm hover:bg-black/10 transition-all overflow-hidden duration-200 opacity-0 group-hover/date:opacity-100"
                                        title="Remover data"
                                    >
                                        <X className="w-2.5 h-2.5" />
                                    </button>
                                </div>
                            )}

                            {task.recurrence_id && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onRecurrenceClick?.(task)
                                    }}
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border w-fit transition-colors bg-surface-variant/30 text-primary border-transparent hover:bg-surface-variant/50"
                                    title="Recorrência"
                                >
                                    <Repeat className="w-3 h-3" />
                                </button>
                            )}

                            {task.details && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (!isExpanded) {
                                            setIsExpanded(true)
                                            setExpandedBy('card')
                                        }
                                        setShowDescription(!showDescription)
                                    }}
                                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border w-fit transition-colors ${showDescription && isExpanded ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface-variant/30 text-on-surface-variant border-transparent hover:bg-surface-variant/50'}`}
                                    title="Descrição"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><line x1="21" x2="3" y1="6" y2="6"></line><line x1="15" x2="3" y1="12" y2="12"></line><line x1="17" x2="3" y1="18" y2="18"></line></svg>
                                </button>
                            )}

                            {task.subtasks && task.subtasks.length > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (!isExpanded) {
                                            setIsExpanded(true)
                                            setExpandedBy('card')
                                        }
                                        setShowSubtasks(!showSubtasks)
                                    }}
                                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border w-fit transition-colors ${showSubtasks && isExpanded ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface-variant/30 text-on-surface-variant border-transparent hover:bg-surface-variant/50'}`}
                                    title="Subtarefas"
                                >
                                    <ListChecks className="w-3 h-3" />
                                    <span>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sector & Actions Section */}
                <div className="flex items-center gap-2 shrink-0 h-full">
                    {/* Sector Badges */}
                    <div className="hidden sm:flex gap-1.5 mr-1">
                        {(() => {
                            const distinctSectors = (Array.isArray(task.sector) ? task.sector : (task.sector ? [task.sector] : []))
                                .filter((value, index, self) => self.indexOf(value) === index) // Unique

                            const allSectors = distinctSectors
                                .map((sectorId: string) => ({ sectorId, sector: getSectorDetails(sectorId) }))
                                .sort((a: any, b: any) => a.sector.label.localeCompare(b.sector.label, 'pt-BR'))

                            const MAX_VISIBLE = 3
                            const showAll = allSectors.length <= MAX_VISIBLE
                            const visibleSectors = showAll ? allSectors : allSectors.slice(0, 2)
                            const remainingCount = allSectors.length - 2

                            return (
                                <>
                                    {visibleSectors.map(({ sectorId, sector }: { sectorId: string; sector: any }) => {
                                        const SectorIcon = ICONS.find(i => i.value === sector.icon)?.icon || Tag
                                        return (
                                            <div key={`${task.id}-${sectorId}`} className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setTaskMenuOpen(taskMenuOpen === task.id ? null : task.id)
                                                    }}
                                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 transition-all hover:brightness-95 ${getSectorColorClass(sector.color)}`}
                                                    title="Mudar Setor"
                                                >
                                                    <SectorIcon className="w-3 h-3 opacity-60" />
                                                    <span className="max-w-[60px] truncate">{sector.label}</span>
                                                </button>
                                            </div>
                                        )
                                    })}
                                    {!showAll && (
                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setTaskMenuOpen(taskMenuOpen === task.id ? null : task.id)
                                                }}
                                                className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 transition-all hover:brightness-95 bg-surface-variant text-on-surface-variant"
                                                title="Mais listas..."
                                            >
                                                <Plus className="w-3 h-3 opacity-60" />
                                                <span>{remainingCount}</span>
                                            </button>
                                        </div>
                                    )}
                                </>
                            )
                        })()}

                        {/* Sector Popup Menu */}
                        <AnimatePresence>
                            {taskMenuOpen === task.id && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setTaskMenuOpen(null)} />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-[20px] shadow-lg border border-outline-variant/50 z-50 overflow-hidden flex flex-col py-2"
                                    >
                                        <span className="px-4 py-2 text-[10px] uppercase font-bold text-on-surface-variant/50 tracking-wider">Mover para...</span>
                                        {sectors.map(s => {
                                            const isActive = taskSectors.includes(s.id)
                                            const IconComp = ICONS.find(i => i.value === s.icon)?.icon || Tag
                                            return (
                                                <button
                                                    key={s.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toggleTaskSector(task.id, s.id, sectors)
                                                    }}
                                                    className={`px-4 py-2.5 text-sm text-left flex items-center gap-3 hover:bg-surface-variant/50 transition-colors ${isActive ? 'text-primary font-bold bg-primary/5' : 'text-on-surface'}`}
                                                >
                                                    <IconComp className={`w-4 h-4 ${getSectorColorClass(s.color).split(' ')[1]}`} />
                                                    {s.label}
                                                    {isActive && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                                                </button>
                                            )
                                        })}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onEditClick?.(task)
                            }}
                            className="p-1 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-md transition-all"
                            title="Editar"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                handleMoveToTrash(task.id)
                            }}
                            className="p-1 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-md transition-all"
                            title="Excluir"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={handleButtonClick}
                            className={`p-1 text-on-surface-variant hover:bg-surface-variant/50 rounded-md transition-all ${isExpanded ? 'bg-surface-variant text-primary rotate-180' : ''}`}
                        >
                            <ChevronDown className="w-3.5 h-3.5 transition-transform duration-300" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Subtasks Section */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-3 overflow-hidden border-t border-outline-variant/20"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Quick Actions Panel */}
                        <div className="flex gap-2 py-2 overflow-x-auto no-scrollbar mask-gradient-right">
                            <button
                                onClick={() => updateTask(task.id, { due_at: new Date().toISOString() })}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-variant/30 hover:bg-surface-variant/50 text-[11px] font-medium text-on-surface transition-colors whitespace-nowrap"
                            >
                                Hoje
                            </button>
                            <button
                                onClick={() => {
                                    const tomorrow = new Date()
                                    tomorrow.setDate(tomorrow.getDate() + 1)
                                    updateTask(task.id, { due_at: tomorrow.toISOString() })
                                }}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-variant/30 hover:bg-surface-variant/50 text-[11px] font-medium text-on-surface transition-colors whitespace-nowrap"
                            >
                                Amanhã
                            </button>

                            <div className="relative">
                                <button
                                    onClick={() => setShowCalendar(!showCalendar)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${showCalendar ? 'bg-primary/10 text-primary' : 'bg-surface-variant/30 hover:bg-surface-variant/50 text-on-surface'}`}
                                    title="Calendário"
                                >
                                    <Calendar className="w-3.5 h-3.5" />
                                </button>
                                <AnimatePresence>
                                    {showCalendar && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowCalendar(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                className="absolute left-0 top-full mt-2 z-50 min-w-[280px]"
                                            >
                                                <StandardCalendar
                                                    selectedDate={dateDisplay?.date || new Date()}
                                                    onDateSelect={(date) => {
                                                        updateTask(task.id, { due_at: date.toISOString() })
                                                        setShowCalendar(false)
                                                    }}
                                                />
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setShowDescription(!showDescription)
                                }}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${showDescription ? 'bg-primary/10 text-primary' : 'bg-surface-variant/30 hover:bg-surface-variant/50 text-on-surface'}`}
                                title="Descrição"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><line x1="21" x2="3" y1="6" y2="6"></line><line x1="15" x2="3" y1="12" y2="12"></line><line x1="17" x2="3" y1="18" y2="18"></line></svg>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setShowSubtasks(!showSubtasks)
                                }}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${showSubtasks ? 'bg-primary/10 text-primary' : 'bg-surface-variant/30 hover:bg-surface-variant/50 text-on-surface'}`}
                                title="Checklist"
                            >
                                <ListChecks className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onRecurrenceClick?.(task)
                                }}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-variant/30 hover:bg-surface-variant/50 text-[11px] font-medium text-on-surface transition-colors whitespace-nowrap"
                                title="Recorrência"
                            >
                                <Repeat className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {showDescription && (
                            <div className="mb-3">
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    onBlur={handleSaveDescription}
                                    placeholder="Adicionar descrição..."
                                    className="w-full bg-surface-variant/20 rounded-lg p-2 text-xs text-on-surface placeholder:text-on-surface-variant/50 resize-none border border-transparent focus:border-primary/20 focus:outline-none focus:bg-surface-variant/30 transition-all min-h-[80px]"
                                />
                            </div>
                        )}

                        <div className="space-y-1">
                            {task.subtasks && task.subtasks.length > 0 && showSubtasks ? (
                                <Reorder.Group
                                    axis="y"
                                    values={task.subtasks}
                                    onReorder={(newOrder) => reorderSubtasks(task.id, newOrder)}
                                    className="space-y-1"
                                >
                                    {task.subtasks.map(subtask => (
                                        <Reorder.Item
                                            key={subtask.id}
                                            value={subtask}
                                            className="group/subtask flex items-center gap-2 text-[13px] py-0.5 bg-surface rounded-md relative"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <GripVertical className="w-3.5 h-3.5 text-on-surface-variant/20 cursor-grab active:cursor-grabbing opacity-0 group-hover/subtask:opacity-100 transition-opacity" />

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleToggleSubtask(subtask.id)
                                                }}
                                                className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${subtask.completed ? 'bg-primary border-primary text-on-primary' : 'border-outline/40 hover:border-primary'}`}
                                            >
                                                {subtask.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                            </button>

                                            {editingSubtaskId === subtask.id ? (
                                                <input
                                                    autoFocus
                                                    value={editSubtaskTitle}
                                                    onChange={(e) => setEditSubtaskTitle(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onBlur={handleSubtaskEditSave}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSubtaskEditSave()}
                                                    className="flex-1 bg-transparent border-none text-sm text-on-surface focus:outline-none py-1"
                                                />
                                            ) : (
                                                <span
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleSubtaskEditStart(subtask.id, subtask.title)
                                                    }}
                                                    className={`flex-1 cursor-text ${subtask.completed ? 'text-on-surface-variant/50 line-through' : 'text-on-surface hover:text-primary transition-colors'}`}
                                                >
                                                    {subtask.title}
                                                </span>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteSubtask(subtask.id)
                                                }}
                                                className="opacity-0 group-hover/subtask:opacity-100 p-1 text-on-surface-variant hover:text-error transition-all"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </Reorder.Item>
                                    ))}
                                </Reorder.Group>
                            ) : null}

                            {(showSubtasks || !(task.subtasks && task.subtasks.length > 0)) && (
                                <div className="flex items-center gap-2 mt-1 luxury-input-container">
                                    <Plus className="w-3.5 h-3.5 text-on-surface-variant/30" />
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            placeholder="Adicionar subtarefa..."
                                            value={newSubtaskTitle}
                                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                                            className="w-full bg-transparent border-none text-[13px] text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none py-0.5"
                                        />
                                        {newSubtaskTitle && (
                                            <button
                                                onClick={handleAddSubtask}
                                                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-primary hover:bg-primary/10 rounded transition-colors"
                                            >
                                                <CornerDownLeft className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Reorder.Item >
    )
}
