import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { Check, Pencil, Trash2, Repeat, Calendar, ChevronDown, Plus, CornerDownLeft, X, GripVertical, Tag } from 'lucide-react'
import { Sector } from '../store/settingsStore'
import { ICONS } from '../constants/icons.tsx'
import { Task } from '../store/taskStore'
import { getSectorColorClass } from '../lib/utils'
import { format, isPast, isToday, isTomorrow, isThisYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
    sortBy?: 'dueDate' | 'createdAt' | 'name' | 'manual'
}

export function TaskItem({
    task, taskSectors, sectors, toggleTask, toggleTaskSector,
    setTaskMenuOpen, taskMenuOpen, handleMoveToTrash, updateTask, onEditClick, onRecurrenceClick,
    updateSubtask, addSubtask, toggleSubtask, deleteSubtask
}: TaskItemProps) {
    const dragControls = useDragControls()
    const [isExpanded, setIsExpanded] = useState(false)
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(task.title)
    const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)
    const [editSubtaskTitle, setEditSubtaskTitle] = useState('')
    const [animationState, setAnimationState] = useState<'idle' | 'celebrating' | 'exiting'>('idle')

    const inputRef = useRef<HTMLInputElement>(null)

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

    const handleSave = () => {
        if (editTitle.trim() && editTitle !== task.title) {
            updateTask(task.id, { title: editTitle.trim() })
        }
        setIsEditing(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave()
        if (e.key === 'Escape') {
            setEditTitle(task.title)
            setIsEditing(false)
        }
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
        else if (isThisYear(date)) text = format(date, 'd MMM', { locale: ptBR })
        else text = format(date, 'd MMM yyyy', { locale: ptBR })
        return { text, isOverdue }
    }

    const dateDisplay = getDueDateDisplay()

    useEffect(() => {
        if (isEditing) inputRef.current?.focus()
    }, [isEditing])

    return (
        <Reorder.Item
            value={task}
            dragListener={false}
            dragControls={dragControls}
            whileDrag={{
                scale: 1.02,
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
            }}
            transition={{ type: "spring", stiffness: 600, damping: 40 }}
            className={`bg-surface border border-outline-variant/30 rounded-[18px] flex flex-col group relative shadow-sm select-none hover:border-primary/30 hover:shadow-md mb-2 last:mb-0 ${task.status === 'done' ? 'opacity-60' : ''} ${animationState !== 'idle' ? 'pointer-events-none' : ''}`}
        >
            {/* Main Task Row */}
            <div className="flex items-center gap-3 p-3.5 w-full">
                {/* Compact Drag Handle */}
                <div
                    onPointerDown={(e) => dragControls.start(e)}
                    className="p-1.5 cursor-grab active:cursor-grabbing hover:bg-surface-variant/50 rounded-lg transition-colors shrink-0"
                >
                    <GripVertical className="w-4 h-4 text-on-surface-variant/30 group-hover:text-on-surface-variant/70 transition-colors" />
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
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => handleSave()}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-transparent border-none text-[15px] text-on-surface font-medium focus:outline-none p-0"
                        />
                    ) : (
                        <div className="flex flex-col">
                            <span
                                onClick={() => setIsEditing(true)}
                                className={`text-[15px] font-medium leading-tight truncate cursor-text transition-colors ${task.status === 'done' ? 'text-on-surface-variant/60 line-through' : 'text-on-surface hover:text-primary/80'}`}
                            >
                                {task.title}
                            </span>
                            {dateDisplay && (
                                <div className={`flex items-center gap-1 mt-1 text-[11px] font-bold uppercase tracking-wider ${dateDisplay.isOverdue ? 'text-error' : 'text-on-surface-variant/60'}`}>
                                    <Calendar className="w-3 h-3" />
                                    {dateDisplay.text}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sector & Actions Section */}
                <div className="flex items-center gap-2 shrink-0 h-full">
                    {/* Sector Badges */}
                    <div className="hidden sm:flex gap-1.5 mr-1">
                        {(Array.isArray(task.sector) ? task.sector : (task.sector ? [task.sector] : []))
                            .map((sectorId: string) => ({ sectorId, sector: getSectorDetails(sectorId) }))
                            .sort((a: any, b: any) => a.sector.label.localeCompare(b.sector.label, 'pt-BR'))
                            .map(({ sectorId, sector }: { sectorId: string; sector: any }) => {
                                const SectorIcon = ICONS.find(i => i.value === sector.icon)?.icon || Tag
                                return (
                                    <div key={`${task.id}-${sectorId}`} className="relative">
                                        <button
                                            onClick={() => setTaskMenuOpen(taskMenuOpen === task.id ? null : task.id)}
                                            className={`px-2.5 py-1 rounded-[10px] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all hover:brightness-95 ${getSectorColorClass(sector.color)}`}
                                            title="Mudar Setor"
                                        >
                                            <SectorIcon className="w-3 h-3 opacity-60" />
                                            <span className="max-w-[80px] truncate">{sector.label}</span>
                                        </button>
                                    </div>
                                )
                            })}

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
                        {task.recurrence_id && (
                            <button
                                onClick={() => onRecurrenceClick?.(task)}
                                className="p-1.5 text-primary hover:bg-primary/10 rounded-full transition-all"
                                title="Recorrente"
                            >
                                <Repeat className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => onEditClick?.(task)}
                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-full transition-all"
                            title="Editar"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleMoveToTrash(task.id)}
                            className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-full transition-all"
                            title="Excluir"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`p-1.5 text-on-surface-variant hover:bg-surface-variant/50 rounded-full transition-all ${isExpanded ? 'bg-surface-variant text-primary rotate-180' : ''}`}
                        >
                            <ChevronDown className="w-4 h-4 transition-transform duration-300" />
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
                        className="px-14 pb-5 overflow-hidden border-t border-outline-variant/20"
                    >
                        <div className="space-y-3 pt-4">
                            {task.subtasks?.map(subtask => (
                                <div key={subtask.id} className="group/subtask flex items-center gap-3 text-sm">
                                    <button
                                        onClick={() => handleToggleSubtask(subtask.id)}
                                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${subtask.completed ? 'bg-primary border-primary text-on-primary' : 'border-outline/40 hover:border-primary'}`}
                                    >
                                        {subtask.completed && <Check className="w-3 h-3 stroke-[3]" />}
                                    </button>

                                    {editingSubtaskId === subtask.id ? (
                                        <input
                                            autoFocus
                                            value={editSubtaskTitle}
                                            onChange={(e) => setEditSubtaskTitle(e.target.value)}
                                            onBlur={handleSubtaskEditSave}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSubtaskEditSave()}
                                            className="flex-1 bg-transparent border-none text-sm text-on-surface focus:outline-none py-1"
                                        />
                                    ) : (
                                        <span
                                            onClick={() => handleSubtaskEditStart(subtask.id, subtask.title)}
                                            className={`flex-1 cursor-text ${subtask.completed ? 'text-on-surface-variant/50 line-through' : 'text-on-surface hover:text-primary transition-colors'}`}
                                        >
                                            {subtask.title}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => handleDeleteSubtask(subtask.id)}
                                        className="opacity-0 group-hover/subtask:opacity-100 p-1 text-on-surface-variant hover:text-error transition-all"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}

                            <div className="flex items-center gap-3 mt-1 luxury-input-container">
                                <Plus className="w-4 h-4 text-on-surface-variant/30" />
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        placeholder="Adicionar subtarefa..."
                                        value={newSubtaskTitle}
                                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                                        className="w-full bg-transparent border-none text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none py-1"
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
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Reorder.Item>
    )
}
