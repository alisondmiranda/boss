import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Trash2, Tag, Check, Pencil, Repeat, Calendar, ListChecks, ChevronDown, ChevronUp, Plus, CornerDownLeft, X } from 'lucide-react'
import { Sector } from '../store/settingsStore'
import { ICONS } from '../constants/icons.tsx'
import { Task } from '../store/taskStore'
import { getSectorColorClass } from '../lib/utils'

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
}

import { format, isPast, isToday, isTomorrow, isThisYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function TaskItem({
    task, taskSectors, sectors, toggleTask, toggleTaskSector,
    setTaskMenuOpen, taskMenuOpen, handleMoveToTrash, updateTask, onEditClick, onDateClick, onRecurrenceClick,
    updateSubtask, addSubtask, toggleSubtask, deleteSubtask
}: TaskItemProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(task.title)

    // Subtask Editing State
    const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)
    const [editSubtaskTitle, setEditSubtaskTitle] = useState('')

    const [animationState, setAnimationState] = useState<'idle' | 'celebrating' | 'exiting'>('idle')

    const handleSubtaskEditStart = (id: string, title: string) => {
        setEditingSubtaskId(id)
        setEditSubtaskTitle(title)
    }

    const handleToggleCompletion = async () => {
        if (task.status !== 'done') {
            setAnimationState('celebrating')
            // 1. Celebração!
            setTimeout(() => {
                setAnimationState('exiting')
                // 2. Saída
                setTimeout(() => {
                    toggleTask(task.id, task.status)
                    // O componente vai desmontar aqui, mas se falhar, reseta
                    setTimeout(() => setAnimationState('idle'), 100)
                }, 300)
            }, 500) // Tempo maior de apreciação da vitória
        } else {
            toggleTask(task.id, task.status)
        }
    }

    const handleSubtaskEditSave = () => {
        if (editingSubtaskId && editSubtaskTitle.trim()) {
            updateSubtask(editingSubtaskId, editSubtaskTitle.trim())
        }
        setEditingSubtaskId(null)
    }

    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const getDueDateDisplay = () => {
        if (!task.due_at) return null
        const date = new Date(task.due_at)
        const isOverdue = isPast(date) && !isToday(date) && task.status !== 'done'

        let text = ''
        if (isToday(date)) text = 'Hoje'
        else if (isTomorrow(date)) text = 'Amanhã'
        else if (isThisYear(date)) text = format(date, 'd MMM', { locale: ptBR })
        else text = format(date, 'd MMM yyyy', { locale: ptBR })

        return { text, isOverdue }
    }

    const dateDisplay = getDueDateDisplay()

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus()
        }
    }, [isEditing])

    const handleSave = (e?: React.FocusEvent) => {
        // Se o foco mudou para algo dentro do mesmo componente (ex: input de subtarefa), não recolhe
        if (e?.relatedTarget && containerRef.current?.contains(e.relatedTarget as Node)) {
            if (editTitle.trim() && editTitle !== task.title) {
                updateTask(task.id, { title: editTitle.trim() })
            }
            setIsEditing(false)
            return
        }

        if (editTitle.trim() && editTitle !== task.title) {
            updateTask(task.id, { title: editTitle.trim() })
        }
        setIsEditing(false)
        // Collapse if no subtasks and we clicked outside
        if (!task.subtasks || task.subtasks.length === 0) {
            setIsExpanded(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave()
        if (e.key === 'Escape') {
            setEditTitle(task.title)
            setIsEditing(false)
            // Collapse if no subtasks
            if (!task.subtasks || task.subtasks.length === 0) {
                setIsExpanded(false)
            }
        }
    }

    const getSectorDetails = (sectorId: string) => {
        return sectors.find(s => s.id === sectorId) || { id: sectorId, label: 'Geral', color: 'slate' as const, icon: 'tag' }
    }

    const handleAddSubtask = () => {
        if (!newSubtaskTitle.trim()) return
        addSubtask(task.id, newSubtaskTitle.trim())
        setNewSubtaskTitle('')
    }

    const handleToggleSubtask = (subtaskId: string) => {
        toggleSubtask(subtaskId)
    }

    const handleDeleteSubtask = (subtaskId: string) => {
        deleteSubtask(subtaskId)
    }

    return (
        <motion.div
            ref={containerRef}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{
                opacity: animationState === 'exiting' ? 0 : 1,
                x: animationState === 'exiting' ? 50 : 0,
                scale: animationState === 'celebrating' ? 1.03 : (animationState === 'exiting' ? 0.9 : 1),
                borderColor: animationState === 'celebrating' ? 'rgba(var(--primary), 0.5)' : 'transparent',
                backgroundColor: animationState === 'celebrating' ? 'rgba(var(--primary), 0.05)' : '',
                boxShadow: animationState === 'celebrating' ? '0 10px 40px -10px rgba(var(--primary), 0.3)' : '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
            }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`card-filled !bg-surface !p-0 flex flex-col group hover:shadow-1 transition-all border border-transparent hover:border-outline-variant/30 relative ${animationState !== 'idle' ? 'pointer-events-none z-10' : ''}`}
        >
            {/* Main Task Row */}
            <div className="flex items-center gap-4 p-4 w-full">
                <button
                    onClick={handleToggleCompletion}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 relative overflow-hidden ${task.status === 'done' || animationState !== 'idle'
                        ? 'bg-primary border-primary text-on-primary scale-110 shadow-[0_0_15px_rgba(var(--primary),0.6)]'
                        : 'border-outline hover:border-primary text-transparent hover:bg-primary/5 hover:scale-105'
                        }`}
                >
                    <AnimatePresence>
                        {(task.status === 'done' || animationState !== 'idle') && (
                            <motion.div
                                initial={{ scale: 0, rotate: -90 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                                <CheckCircle2 className="w-4 h-4" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>

                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent border-b border-primary outline-none py-1 text-base text-on-surface"
                    />
                ) : (
                    <div className="flex-1 flex flex-col justify-center overflow-hidden">
                        <span
                            onClick={() => {
                                setIsExpanded(true)
                                setIsEditing(true)
                            }}
                            className={`text-base transition-all truncate select-none cursor-pointer hover:text-primary ${task.status === 'done' ? 'text-on-surface-variant line-through opacity-60' : 'text-on-surface'}`}
                            title="Clique para editar"
                        >
                            {task.title}
                        </span>

                        {/* Description */}
                        {task.details && !isEditing && (
                            <p
                                className={`text-xs text-on-surface-variant line-clamp-2 mt-0.5 ${task.status === 'done' ? 'line-through opacity-60' : ''}`}
                                onClick={() => {
                                    setIsExpanded(true)
                                    setIsEditing(true)
                                }}
                            >
                                {task.details}
                            </p>
                        )}

                        {/* Date & Recurrence Info */}
                        {(dateDisplay || task.recurrence_id || (task.subtasks && task.subtasks.length > 0)) && (
                            <div className={`flex items-center gap-3 text-[11px] font-medium mt-0.5 ${dateDisplay?.isOverdue ? 'text-error' : 'text-on-surface-variant/70'}`}>
                                {dateDisplay && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDateClick?.(task)
                                        }}
                                        className="flex items-center gap-1 hover:text-primary hover:bg-primary/10 px-1.5 py-0.5 rounded-md transition-all cursor-pointer"
                                        title="Clique para editar data"
                                    >
                                        <Calendar className="w-3 h-3" />
                                        {dateDisplay.text}
                                    </button>
                                )}
                                {task.recurrence_id && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onRecurrenceClick?.(task)
                                        }}
                                        className="flex items-center gap-1 hover:text-primary hover:bg-primary/10 px-1.5 py-0.5 rounded-md transition-all cursor-pointer"
                                        title="Clique para editar recorrência"
                                    >
                                        <Repeat className="w-3 h-3" />
                                        <span className="hidden sm:inline">Recorrente</span>
                                    </button>
                                )}
                                {task.subtasks && task.subtasks.length > 0 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setIsExpanded(!isExpanded)
                                        }}
                                        className="flex items-center gap-1 hover:text-primary hover:bg-primary/10 px-1.5 py-0.5 rounded-md transition-all cursor-pointer"
                                        title={isExpanded ? "Recolher subtarefas" : "Expandir subtarefas"}
                                    >
                                        <ListChecks className="w-3 h-3" />
                                        {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Sector Badges */}
                <div className="relative flex gap-1 flex-wrap justify-end">
                    {task.sector && (
                        Array.isArray(task.sector) ? task.sector : [task.sector]
                    )
                        .map(sectorId => ({ sectorId, sector: getSectorDetails(sectorId) }))
                        .sort((a, b) => a.sector.label.localeCompare(b.sector.label, 'pt-BR'))
                        .map(({ sectorId, sector }) => {
                            const SectorIcon = ICONS.find(i => i.value === sector.icon)?.icon || Tag
                            return (
                                <button
                                    key={`${task.id}-${sectorId}`}
                                    onClick={() => setTaskMenuOpen(taskMenuOpen === task.id ? null : task.id)}
                                    className={`px-3 py-1 rounded-[8px] text-[11px] font-medium uppercase tracking-wide flex items-center gap-1.5 flex-shrink-0 cursor-pointer hover:brightness-95 transition-all ${getSectorColorClass(sector.color)}`}
                                    title="Mudar Setor"
                                >
                                    <SectorIcon className="w-3 h-3 opacity-70" />
                                    {sector.label}
                                </button>
                            )
                        })}

                    {/* Sector Popup Menu */}
                    <AnimatePresence>
                        {taskMenuOpen === task.id && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setTaskMenuOpen(null)} />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-xl shadow-4 border border-outline-variant z-50 overflow-hidden flex flex-col py-1"
                                >
                                    <span className="px-3 py-2 text-[10px] uppercase font-bold text-on-surface-variant/50 tracking-wider">Setores</span>
                                    {sectors.map(s => {
                                        const isActive = taskSectors.includes(s.id)
                                        const SectorIcon = ICONS.find(i => i.value === s.icon)?.icon || Tag
                                        return (
                                            <button
                                                key={s.id}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    toggleTaskSector(task.id, s.id, sectors)
                                                }}
                                                className={`px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-surface-variant transition-colors ${isActive ? 'text-primary font-medium bg-primary-container/20' : 'text-on-surface'}`}
                                            >
                                                <SectorIcon className={`w-4 h-4 ${getSectorColorClass(s.color).split(' ')[1]}`} />
                                                {s.label}
                                                {isActive && <Check className="w-3 h-3 ml-auto" />}
                                            </button>
                                        )
                                    })}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {/* Actions & Chevron */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEditClick?.(task)}
                        className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-full transition-all"
                        title="Editar"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleMoveToTrash(task.id)}
                        className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-full transition-all"
                        title="Excluir"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`p-1.5 text-on-surface-variant hover:bg-surface-variant rounded-full transition-all ${isExpanded ? 'bg-surface-variant' : ''}`}
                        title={isExpanded ? "Recolher" : "Expandir"}
                    >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Subtasks Section */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-12 pb-4 overflow-hidden"
                    >
                        <div className="space-y-2">
                            {task.subtasks?.map(subtask => (
                                <div key={subtask.id} className="group/subtask flex items-center gap-3 text-sm py-1">
                                    <button
                                        onClick={() => handleToggleSubtask(subtask.id)}
                                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${subtask.completed ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant hover:border-primary'}`}
                                    >
                                        {subtask.completed && <Check className="w-3 h-3" />}
                                    </button>

                                    {editingSubtaskId === subtask.id ? (
                                        <input
                                            autoFocus
                                            value={editSubtaskTitle}
                                            onChange={(e) => setEditSubtaskTitle(e.target.value)}
                                            onBlur={handleSubtaskEditSave}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSubtaskEditSave()}
                                            className="flex-1 bg-transparent border-none text-sm text-on-surface focus:outline-none"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleSubtaskEditStart(subtask.id, subtask.title)
                                            }}
                                            className={`flex-1 cursor-text ${subtask.completed ? 'text-on-surface-variant/70 line-through' : 'text-on-surface hover:text-primary transition-colors'}`}
                                            title="Clique para editar"
                                        >
                                            {subtask.title}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => handleDeleteSubtask(subtask.id)}
                                        className="opacity-0 group-hover/subtask:opacity-100 p-1 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-md transition-all"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}

                            {/* Add Subtask Input */}
                            <div className="flex items-center gap-3 mt-2">
                                <Plus className="w-4 h-4 text-on-surface-variant/50" />
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        placeholder="Adicionar subtarefa..."
                                        value={newSubtaskTitle}
                                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                                        className="w-full bg-transparent border-none text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
                                    />
                                    {newSubtaskTitle && (
                                        <button
                                            onClick={handleAddSubtask}
                                            className="absolute right-0 top-1/2 -translate-y-1/2 p-1 bg-surface-variant/50 hover:bg-primary hover:text-on-primary rounded text-[10px] transition-colors"
                                        >
                                            <CornerDownLeft className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
